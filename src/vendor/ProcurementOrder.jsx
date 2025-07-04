import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Paper,
  Button,
  BottomNavigation,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import baseurl from '../baseurl/ApiService';
import { useNavigate } from 'react-router-dom';
import VendorFooter from '../vendorfooter';

const OrderCard = ({ order, onPriceUpdated, editable, productMap, showActionButtons }) => {
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newPrice, setNewPrice] = useState(order.price);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editingIdx, setEditingIdx] = useState(null);
  const [editPrices, setEditPrices] = useState({}); // Store edit prices for each product
  const [multiEditOpen, setMultiEditOpen] = useState(false);

  // Parse items if it's a JSON string
  // const parseItems = (items) => {
  //   try {
  //     if (typeof items === 'string') {
  //       const parsed = JSON.parse(items);
  //       if (Array.isArray(parsed) && parsed.length > 0) {
  //         return parsed;
  //       }
  //     }
  //     return parsed;
  //   } catch (error) {
  //     return items;
  //   }
  // };

  // Add this function inside OrderCard or above it
  function parseOrderItems(items) {
    if (!items) return [];
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return [parsed];
      } catch (e) {
        // Not JSON, try to parse as comma-separated product strings
        // Split by comma, but only at top level (not inside parentheses)
        const parts = items.split(/,(?![^()]*\))/).map(s => s.trim()).filter(Boolean);
        return parts.map(str => {
          // Try to extract product name, quantity, unit price
          // Example: "Beans (29.8kg @ ₹20/kg, Type: vendor)"
          const match = str.match(/^(.+?)\s*\((\d+(?:\.\d+)?)kg @ ₹(\d+)(?:\/kg)?, Type: (.+)\)$/i);
          if (match) {
            return {
              product_name: match[1].trim(),
              quantity: parseFloat(match[2]),
              unit_price: parseFloat(match[3]),
              type: match[4].trim()
            };
          }
          return { product_name: str };
        });
      }
    }
    if (Array.isArray(items)) {
      return items;
    }
    if (typeof items === 'object') {
      return [items];
    }
    return [String(items)];
  }

  const productList = parseOrderItems(order.items);

  // Initialize edit prices when component mounts or order changes
  useEffect(() => {
    const initialPrices = {};
    productList.forEach((prod, idx) => {
      initialPrices[idx] = prod.unit_price || prod.price || '';
    });
    setEditPrices(initialPrices);
  }, [order.items]);

  // Handle Edit button click - navigate to EditOrder with order data
  const handleEdit = () => {
    navigate('/EditOrder', { 
      state: { 
        orderData: order,
        procurementId: order.procurement_id 
      } 
    });
  };

  const handleEditPrice = () => {
    setNewPrice(order.price);
    setEditDialogOpen(true);
  };

  const handleSavePrice = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${baseurl}/api/procurement/update/${order.procurement_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ price: newPrice })
      });
      
      if (!response.ok) throw new Error('Failed to update price');
      
      setSnackbar({ open: true, message: 'Price updated!', severity: 'success' });
      setEditDialogOpen(false);
      if (onPriceUpdated) onPriceUpdated();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Handle inline unit price edit
  const handleEditUnitPrice = (idx, currentPrice) => {
    setEditingIdx(idx);
    setEditPrices(prev => ({
      ...prev,
      [idx]: currentPrice
    }));
  };

  // Handle unit price change
  const handleUnitPriceChange = (idx, value) => {
    setEditPrices(prev => ({
      ...prev,
      [idx]: value
    }));
  };

  // Save individual unit price
  const handleSaveUnitPrice = async (idx) => {
    setSaving(true);
    try {
      const productList = parseOrderItems(order.items);
      const updatedProducts = [...productList];
      const newUnitPrice = parseFloat(editPrices[idx]) || 0;
      
      // Update the specific product's unit price
      updatedProducts[idx] = { 
        ...updatedProducts[idx], 
        unit_price: newUnitPrice,
        price: newUnitPrice 
      };

      // Calculate new total price
      let totalPrice = 0;
      updatedProducts.forEach(prod => {
        const qty = parseFloat(prod.quantity) || 1;
        const price = parseFloat(prod.unit_price) || parseFloat(prod.price) || 0;
        totalPrice += qty * price;
      });

      const response = await fetch(`${baseurl}/api/procurement/update/${order.procurement_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          items: JSON.stringify(updatedProducts),
          price: totalPrice.toFixed(2),
          negotiationtype: 'vendor'
        })
      });
      
      if (!response.ok) throw new Error('Failed to update unit price');
      
      setSnackbar({ open: true, message: 'Unit price updated!', severity: 'success' });
      setEditingIdx(null);
      if (onPriceUpdated) onPriceUpdated();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = (idx) => {
    setEditingIdx(null);
    // Reset to original price
    const originalPrice = productList[idx]?.unit_price || productList[idx]?.price || '';
    setEditPrices(prev => ({
      ...prev,
      [idx]: originalPrice
    }));
  };

  // Handle multi-edit for multiple products
  const handleMultiEdit = () => {
    const initialPrices = {};
    productList.forEach((prod, idx) => {
      initialPrices[idx] = prod.unit_price || prod.price || '';
    });
    setEditPrices(initialPrices);
    setMultiEditOpen(true);
  };

  const handleMultiEditSave = async () => {
    setSaving(true);
    try {
      const productList = parseOrderItems(order.items);
      const updatedProducts = [...productList];
      
      // Update all products with new prices
      updatedProducts.forEach((prod, idx) => {
        const newUnitPrice = parseFloat(editPrices[idx]) || 0;
        updatedProducts[idx] = { 
          ...prod, 
          unit_price: newUnitPrice,
          price: newUnitPrice 
        };
      });

      // Calculate new total price
      let totalPrice = 0;
      updatedProducts.forEach(prod => {
        const qty = parseFloat(prod.quantity) || 1;
        const price = parseFloat(prod.unit_price) || parseFloat(prod.price) || 0;
        totalPrice += qty * price;
      });

      const response = await fetch(`${baseurl}/api/procurement/update/${order.procurement_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          items: JSON.stringify(updatedProducts),
          price: totalPrice.toFixed(2),
          negotiationtype: 'vendor'
        })
      });
      
      if (!response.ok) throw new Error('Failed to update prices');
      
      setSnackbar({ open: true, message: 'All prices updated!', severity: 'success' });
      setMultiEditOpen(false);
      if (onPriceUpdated) onPriceUpdated();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          p: 2,
          mb: 2,
          border: '2px solid #00A86B',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography fontWeight="bold" fontSize="16px">
            Order #{order.procurement_id}
          </Typography>
          <Typography color="text.secondary" fontSize="14px">
            {order.order_date}
          </Typography>
        </Box>

        <Box mt={1.5} mb={2}>
          {productList.map((prod, idx) => (
            <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: '#f9f9f9', borderRadius: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box flex={1}>
                  <Typography fontWeight="bold" fontSize="15px">
                    {prod.product_name || (productMap && productMap[prod.product_id]) || prod.product_id || ''}
                    {prod.quantity ? ` (${prod.quantity}kg @ ₹${prod.unit_price}/kg)` : ''}
                  </Typography>
                  <Typography fontSize="13px" color="text.secondary">
                    Quantity: {prod.quantity || 1}kg
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={1}>
                  {editingIdx === idx ? (
                    <>
                      <TextField
                        size="small"
                        type="number"
                        value={editPrices[idx] || ''}
                        onChange={(e) => handleUnitPriceChange(idx, e.target.value)}
                        sx={{ width: 80 }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                      <IconButton 
                        size="small" 
                        onClick={() => handleSaveUnitPrice(idx)}
                        disabled={saving}
                        sx={{ color: '#00A86B' }}
                      >
                        <SaveIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleCancelEdit(idx)}
                        sx={{ color: '#f44336' }}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <Typography fontSize="14px" fontWeight="bold">
                        ₹{prod.unit_price || prod.price || 0}/kg
                      </Typography>
                      {editable && (
                        <IconButton 
                          size="small" 
                          onClick={() => { if (order.status === 'Requested') { setEditingIdx(idx); setEditPrices(prev => ({ ...prev, [idx]: prod.unit_price || prod.price || '' })); } }}
                          disabled={order.status !== 'Requested'}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </>
                  )}
                </Box>
              </Box>
              
              <Typography fontSize="12px" color="text.secondary">
                Line Total: ₹{((prod.quantity || 1) * (prod.unit_price || prod.price || 0)).toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          {/* <Box>
            {editable && productList.length > 1 && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleMultiEdit}
                sx={{ mr: 1 }}
              >
                Edit All Prices
              </Button>
            )}
          </Box> */}
          <Typography fontWeight="bold" fontSize="16px">
            Total: ₹{order.price}
          </Typography>
        </Box>

        <Box display="flex" gap={1.5} mt={2}>
          {showActionButtons && order.status === 'Requested' ? (
            <>
              <Button
                variant="contained"
                sx={{ backgroundColor: '#00A86B', color: '#fff', flex: 1, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', py: 1 }}
                onClick={async () => {
                  try {
                    const response = await fetch(`${baseurl}/api/procurement/update/${order.procurement_id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({ status: 'Confirmed' })
                    });
                    if (!response.ok) throw new Error('Failed to confirm order');
                    setSnackbar({ open: true, message: 'Order confirmed!', severity: 'success' });
                    if (onPriceUpdated) onPriceUpdated();
                  } catch (err) {
                    setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
                  }
                }}
              >
                Confirm
              </Button>
              <Button
                variant="contained"
                sx={{ backgroundColor: '#FF0000', color: '#fff', flex: 1, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', py: 1 }}
                onClick={async () => {
                  try {
                    const response = await fetch(`${baseurl}/api/procurement/update/${order.procurement_id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({ status: 'Rejected' })
                    });
                    if (!response.ok) throw new Error('Failed to reject order');
                    setSnackbar({ open: true, message: 'Order rejected!', severity: 'success' });
                    if (onPriceUpdated) onPriceUpdated();
                  } catch (err) {
                    setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
                  }
                }}
              >
                Reject
              </Button>
            </>
          ) : (
            <Typography fontWeight="bold" color="text.secondary" sx={{ flex: 1, textAlign: 'center', py: 1, fontSize: '14px', background: '#f5f5f5', borderRadius: 1 }}>
              Status: {order.status}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Multi-Edit Dialog */}
      <Dialog open={multiEditOpen} onClose={() => setMultiEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit All Product Prices</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {productList.map((prod, idx) => (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {prod.product_name || (productMap && productMap[prod.product_id]) || prod.product_id || 'Product'}
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Quantity: {prod.quantity || 1}kg
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Price per kg"
                      size="small"
                      type="number"
                      value={editPrices[idx] || ''}
                      onChange={(e) => handleUnitPriceChange(idx, e.target.value)}
                      fullWidth
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                      }}
                    />
                  </Grid>
                </Grid>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Line Total: ₹{((prod.quantity || 1) * (parseFloat(editPrices[idx]) || 0)).toFixed(2)}
                </Typography>
              </Box>
            ))}
            
            <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ color: '#2e7d32' }}>
                New Total: ₹{Object.keys(editPrices).reduce((total, idx) => {
                  const prod = productList[parseInt(idx)];
                  const qty = prod?.quantity || 1;
                  const price = parseFloat(editPrices[idx]) || 0;
                  return total + (qty * price);
                }, 0).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMultiEditOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleMultiEditSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Total Price Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Total Price</DialogTitle>
        <DialogContent>
          <TextField
            label="Total Price"
            type="number"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSavePrice} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

const ProcurementOrder = () => {
  const [orders, setOrders] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [productMap, setProductMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const fetchOrders = () => {
    fetch(`${baseurl}/api/procurement/all`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.data || []);
      })
      .catch((err) => console.error('Failed to fetch procurement orders:', err));
  };

  // Fetch product names on mount
  useEffect(() => {
    fetch(`${baseurl}/api/product/all`)
      .then(res => res.json())
      .then(data => {
        console.log('Fetched products:', data);
        const map = {};
        (data.data || data).forEach(prod => {
          map[prod.pid || prod.product_id] = prod.product_name || prod.name || prod.product_title || prod.title;
        });
        setProductMap(map);
      })
      .catch(err => console.error('Failed to fetch products:', err));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.procurement_id?.toString().includes(searchLower) ||
      order.vendor_name?.toLowerCase().includes(searchLower) ||
      order.order_date?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box sx={{ bgcolor: '#F4F4F6', minHeight: '100vh', pb: 10 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: '#00A86B',
          color: '#fff',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            onClick={handleBack}
            sx={{
              backgroundColor: '#FFFFFF4D',
              color: 'white',
              borderRadius: '50%',
              p: 1,
              mr: 1,
              cursor: 'pointer',
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">
            Procurement Orders
          </Typography>
        </Box>
        <IconButton sx={{ color: 'white' }}>
          <FilterListIcon />
        </IconButton>
      </Box>

      {/* Search Bar */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 5,
            px: 2,
            py: 1,
            mb: 2,
          }}
        >
          <SearchIcon sx={{ color: '#999' }} />
          <TextField
            fullWidth
            placeholder="Search Orders..."
            variant="standard"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              disableUnderline: true,
              sx: { pl: 1 },
            }}
          />
        </Box>

        {/* Tab Filter */}
        <Tabs
          value={tabIndex}
          onChange={(e, newValue) => setTabIndex(newValue)}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Request from Admin" />
          <Tab label="Your Request" />
        </Tabs>

        {/* Orders List by Tab */}
        {(() => {
          const adminOrders = filteredOrders.filter(order => order.type === 'admin');
          const yourOrders = filteredOrders.filter(order => order.type === 'vendor' || order.type === 'farmer');
          
          if (tabIndex === 0) {
            return adminOrders.length > 0 ? (
              adminOrders.map((order) => (
                <OrderCard 
                  key={order.procurement_id} 
                  order={order} 
                  onPriceUpdated={fetchOrders} 
                  editable={true} 
                  productMap={productMap} 
                  showActionButtons={true}
                />
              ))
            ) : (
              <Typography color="text.secondary" align="center" sx={{ mt: 2 }}>
                No admin orders found.
              </Typography>
            );
          } else if (tabIndex === 1) {
            return yourOrders.length > 0 ? (
              yourOrders.map((order) => (
                <OrderCard 
                  key={order.procurement_id} 
                  order={order} 
                  onPriceUpdated={fetchOrders} 
                  editable={true} 
                  productMap={productMap} 
                  showActionButtons={false}
                />
              ))
            ) : (
              <Typography color="text.secondary" align="center" sx={{ mt: 2 }}>
                No orders found.
              </Typography>
            );
          }
        })()}
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
        elevation={3}
      >
        <BottomNavigation showLabels sx={{ backgroundColor: '#f5f5f5' }}>
          <VendorFooter />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default ProcurementOrder;