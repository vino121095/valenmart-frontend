import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Button,
  TextField,
  Snackbar,
  Alert,
  Grid,
  Avatar,
  Card,
  CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import { useNavigate, useLocation } from 'react-router-dom';
import VendorFooter from '../vendorfooter';
import baseurl from '../baseurl/ApiService';

const ItemCard = ({ item, onItemUpdate, onItemDelete }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: item.name || `Product ${item.product_id}`,
    category: item.category || '',
    quantity: item.quantity || 0,
    unit_price: item.unit_price || 0,
    type: item.type || 'vendor',
    cgst: item.cgst || 0,
    sgst: item.sgst || 0,
    notes: item.notes || '',
    imageUrl: item.imageUrl || ''
  });
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'quantity' || name === 'unit_price' || name === 'cgst' || name === 'sgst') 
        ? Number(value) || 0 
        : value
    }));
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 0) {
      setFormData(prev => ({ ...prev, quantity: newQuantity }));
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file,
        imageUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleSave = () => {
    if (!formData.name || formData.unit_price <= 0 || formData.quantity <= 0) {
      alert('Please fill all required fields with valid values.');
      return;
    }

    onItemUpdate(item.product_id, formData);
    setEditMode(false);
  };

  const handleCancel = () => {
    setFormData({
      name: item.name || `Product ${item.product_id}`,
      category: item.category || '',
      quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
      type: item.type || 'vendor',
      cgst: item.cgst || 0,
      sgst: item.sgst || 0,
      notes: item.notes || '',
      imageUrl: item.imageUrl || ''
    });
    setEditMode(false);
  };

  const total = formData.quantity * formData.unit_price;
  const taxAmount = total * (formData.cgst + formData.sgst) / 100;
  const totalWithTax = total + taxAmount;

  if (editMode) {
    return (
      <Card elevation={1} sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Edit Product
          </Typography>

          {/* Image Upload */}
          <Box mb={2}>
            {formData.imageUrl ? (
              <Box textAlign="center">
                <Avatar
                  src={formData.imageUrl}
                  alt="Product"
                  sx={{ width: 120, height: 80, mx: 'auto' }}
                  variant="rounded"
                />
                <Button 
                  size="small" 
                  onClick={() => setFormData(prev => ({ ...prev, image: null, imageUrl: '' }))}
                  sx={{ mt: 1 }}
                >
                  Remove Image
                </Button>
              </Box>
            ) : (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: '2px dashed #E0E0E0',
                  borderRadius: 2,
                  textAlign: 'center',
                  padding: 2,
                  cursor: 'pointer',
                  backgroundColor: '#FAFAFA',
                  '&:hover': { borderColor: '#00A86B' },
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <IconButton>
                  <AddIcon />
                </IconButton>
                <Typography variant="body2">Upload Image</Typography>
              </Box>
            )}
          </Box>

          {/* Product Name */}
          <Box mb={2}>
            <Typography fontWeight="bold" mb={0.5}>Product Name *</Typography>
            <TextField
              fullWidth
              name="name"
              value={formData.name}
              onChange={handleChange}
              size="small"
              required
            />
          </Box>

          {/* Category */}
          <Box mb={2}>
            <Typography fontWeight="bold" mb={0.5}>Category</Typography>
            <TextField
              fullWidth
              name="category"
              value={formData.category}
              onChange={handleChange}
              size="small"
              placeholder="Enter category"
            />
          </Box>

          {/* Quantity Section */}
          <Box mb={2}>
            <Typography fontWeight="bold" mb={0.5}>Quantity (kg) *</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" bgcolor="#F0F4FA" borderRadius={2} px={2} py={0.5} alignItems="center">
                <IconButton 
                  size="small" 
                  onClick={() => handleQuantityChange(formData.quantity - 1)}
                >
                  <RemoveIcon />
                </IconButton>
                <TextField
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value) || 0)}
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  sx={{ 
                    width: '60px', 
                    textAlign: 'center',
                    '& input': { textAlign: 'center', fontWeight: 'bold' }
                  }}
                />
                <IconButton 
                  size="small" 
                  onClick={() => handleQuantityChange(formData.quantity + 1)}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Price per kg */}
          <Box mb={2}>
            <Typography fontWeight="bold" mb={0.5}>Price per kg (₹) *</Typography>
            <TextField
              fullWidth
              name="unit_price"
              value={formData.unit_price}
              onChange={handleChange}
              size="small"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              required
            />
          </Box>

          {/* Type Selection */}
          <Box mb={2}>
            <Typography fontWeight="bold" mb={0.5}>Type *</Typography>
            <TextField
              select
              fullWidth
              name="type"
              value={formData.type}
              onChange={handleChange}
              SelectProps={{ native: true }}
              size="small"
              required
            >
              <option value="">Select Type</option>
              <option value="vendor">Vendor</option>
              <option value="farmer">Farmer</option>
            </TextField>
          </Box>

          {/* CGST and SGST */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography fontWeight="bold" mb={0.5}>CGST (%)</Typography>
              <TextField
                fullWidth
                name="cgst"
                value={formData.cgst}
                onChange={handleChange}
                size="small"
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={6}>
              <Typography fontWeight="bold" mb={0.5}>SGST (%)</Typography>
              <TextField
                fullWidth
                name="sgst"
                value={formData.sgst}
                onChange={handleChange}
                size="small"
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
          </Grid>

          {/* Notes */}
          <Box mb={2}>
            <Typography fontWeight="bold" mb={0.5}>Additional Notes</Typography>
            <TextField
              fullWidth
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              size="small"
              multiline
              rows={2}
              placeholder="Enter any additional notes"
            />
          </Box>

          {/* Total Calculation */}
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
            <Typography variant="body2">
              Base Amount: ₹{total.toFixed(2)}
            </Typography>
            <Typography variant="body2">
              Tax (CGST {formData.cgst}% + SGST {formData.sgst}%): ₹{taxAmount.toFixed(2)}
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              Total: ₹{totalWithTax.toFixed(2)}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box display="flex" gap={1}>
            <Button variant="outlined" onClick={handleCancel} sx={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave} sx={{ flex: 1, bgcolor: '#00A86B' }}>
              Save Changes
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Display Mode
  return (
    <Card elevation={1} sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          {formData.imageUrl && (
            <Grid item>
              <Avatar
                src={formData.imageUrl}
                alt={formData.name}
                sx={{ width: 56, height: 56 }}
                variant="rounded"
              />
            </Grid>
          )}
          <Grid item xs>
            <Typography variant="subtitle1" fontWeight="bold">
              {formData.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Category: {formData.category || 'Not specified'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Type: {formData.type} | Quantity: {formData.quantity} kg
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Price: ₹{formData.unit_price}/kg
            </Typography>
            {(formData.cgst > 0 || formData.sgst > 0) && (
              <Typography variant="body2" color="text.secondary">
                Tax: CGST {formData.cgst}% + SGST {formData.sgst}%
              </Typography>
            )}
            <Typography variant="body1" fontWeight="bold" color="#00A86B">
              Total: ₹{totalWithTax.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" flexDirection="column" gap={1}>
              <IconButton size="small" onClick={() => setEditMode(true)}>
                <EditIcon />
              </IconButton>
              <IconButton size="small" onClick={() => onItemDelete(item.product_id)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const EditOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const orderData = location.state?.orderData || {};
  const procurementId = location.state?.procurementId || orderData.procurement_id;
  
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState(orderData.notes || '');
  const [loading, setLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    try {
      let parsedItems = [];
      if (orderData.items) {
        if (typeof orderData.items === 'string') {
          parsedItems = JSON.parse(orderData.items);
        } else {
          parsedItems = orderData.items;
        }
      }
      
      if (!Array.isArray(parsedItems)) {
        parsedItems = [parsedItems];
      }
      
      setItems(parsedItems);
    } catch (error) {
      console.error('Error parsing items:', error);
      setItems([]);
    }
  }, [orderData]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const authToken = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const vendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
        if (!vendorId) return;
        const response = await fetch(`${baseurl}/api/vendor-notification/all/${vendorId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data && data.notifications) {
          const unreadCount = data.notifications.filter(n => !n.is_read).length;
          setNotificationCount(unreadCount);
        }
      } catch (e) {}
    };
    fetchNotifications();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleItemUpdate = (productId, updatedData) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.product_id === productId
          ? { ...item, ...updatedData }
          : item
      )
    );
  };

  const handleItemDelete = (productId) => {
    setItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  };

  const handleUpdateProcurement = async () => {
    if (!procurementId) {
      setSnackbar({
        open: true,
        message: 'No procurement ID found',
        severity: 'error'
      });
      return;
    }

    if (items.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please add at least one item',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      const totalAmount = items.reduce((sum, item) => {
        const baseAmount = item.quantity * item.unit_price;
        const taxAmount = baseAmount * (item.cgst + item.sgst) / 100;
        return sum + baseAmount + taxAmount;
      }, 0);

      const updatePayload = {
        items: JSON.stringify(items),
        total_amount: totalAmount,
        notes: notes,
        status: 'Updated'
      };

      // console.log('Updating procurement with payload:', updatePayload);

      const response = await fetch(`${baseurl}/api/procurement/update/${procurementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      });

      const result = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Procurement updated successfully!',
          severity: 'success'
        });
        
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        throw new Error(result.message || 'Failed to update procurement');
      }
    } catch (error) {
      console.error('Error updating procurement:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update procurement',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => {
      const baseAmount = item.quantity * item.unit_price;
      const taxAmount = baseAmount * (item.cgst + item.sgst) / 100;
      return sum + baseAmount + taxAmount;
    }, 0);
  };

  const getTotalTax = () => {
    return items.reduce((sum, item) => {
      const baseAmount = item.quantity * item.unit_price;
      const taxAmount = baseAmount * (item.cgst + item.sgst) / 100;
      return sum + taxAmount;
    }, 0);
  };

  const getBaseAmount = () => {
    return items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
  };

  return (
    <Box bgcolor="#F4F4F6" minHeight="100vh" pb={12}>
      {/* Header */}
      <Box
        bgcolor="#00A86B"
        color="white"
        px={2}
        py={2}
        display="flex"
        alignItems="center"
      >
        <IconButton 
          onClick={handleBack} 
          sx={{
            backgroundColor: '#FFFFFF4D',
            color: 'white',
            borderRadius: '50%',
            p: 1,
            mr: 1,
            cursor: 'pointer'
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
          Edit Order #{procurementId}
        </Typography>
        <IconButton
          onClick={() => navigate('/vendor-notifications')}
          sx={{
            backgroundColor: '#FFFFFF4D',
            color: 'white'
          }}
        >
          <Badge badgeContent={notificationCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Box>

      {/* Content */}
      <Box px={2} pt={2}>
        {/* Order Status */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <Typography fontWeight="bold">Order Status</Typography>
          <Typography color="text.secondary" fontSize="14px">
            Order Date: {orderData.order_date || 'N/A'}
          </Typography>
          <Box
            mt={1}
            px={2}
            py={0.5}
            bgcolor="#FFF5E0"
            width="fit-content"
            borderRadius={2}
          >
            <Typography fontSize="14px" color="#D78A00">
              {orderData.status || 'Pending'}
            </Typography>
          </Box>
        </Paper>

        {/* Order Items */}
        <Typography fontWeight="bold" mb={2}>Order Items ({items.length})</Typography>

        {items.length > 0 ? (
          items.map((item, index) => (
            <ItemCard
              key={item.product_id || index}
              item={item}
              onItemUpdate={handleItemUpdate}
              onItemDelete={handleItemDelete}
            />
          ))
        ) : (
          <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            <Typography color="text.secondary">No items found</Typography>
          </Paper>
        )}

        {/* Total Summary */}
        {items.length > 0 && (
          <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            <Typography fontWeight="bold" mb={1}>Order Summary</Typography>
            <Box display="flex" justifyContent="space-between">
              <Typography>Base Amount:</Typography>
              <Typography>₹{getBaseAmount().toFixed(2)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography>Total Tax:</Typography>
              <Typography>₹{getTotalTax().toFixed(2)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" sx={{ borderTop: 1, borderColor: 'divider', pt: 1, mt: 1 }}>
              <Typography fontWeight="bold">Total Amount:</Typography>
              <Typography fontWeight="bold" fontSize="18px" color="#00A86B">
                ₹{getTotalAmount().toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Notes Section */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
          <Typography fontWeight="bold" mb={1}>Order Notes</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Enter any special instructions or notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#F8F9FA'
              }
            }}
          />
        </Paper>

        {/* Footer Buttons */}
        <Box display="flex" gap={2} mt={3}>
          <Button
            variant="contained"
            onClick={() => navigate(-1)}
            disabled={loading}
            sx={{ bgcolor: '#E0E0E0', color: '#424242', flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateProcurement}
            disabled={loading || items.length === 0}
            sx={{ bgcolor: '#00A86B', color: 'white', flex: 1 }}
          >
            {loading ? 'Updating...' : 'Update Order'}
          </Button>
        </Box>
      </Box>

      {/* Bottom Footer */}
      <VendorFooter />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditOrder;