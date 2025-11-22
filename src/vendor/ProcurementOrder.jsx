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
  Grid,
  Badge,
  Pagination
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Avatar } from '@mui/material';
import baseurl from '../baseurl/ApiService';
import { useNavigate } from 'react-router-dom';
import VendorFooter from '../vendorfooter';
import velaanLogo from '../assets/velaanLogo.png';

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
        elevation={0}
        sx={{
          borderRadius: 3,
          p: 2.5,
          mb: 2,
          border: '1px solid #e2e8f0',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)'
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight="bold" fontSize="17px" sx={{ color: '#1e293b' }}>
            Order #{order.procurement_id}
          </Typography>
          <Typography color="text.secondary" fontSize="13px">
            {new Date(order.order_date).toLocaleDateString()}
          </Typography>
        </Box>

        <Box mb={2}>
          {productList.map((prod, idx) => (
            <Box key={idx} sx={{ mb: 1.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box flex={1}>
                  <Typography fontWeight="600" fontSize="15px" sx={{ color: '#1e293b', mb: 0.5 }}>
                    {prod.product_name || (productMap && productMap[prod.product_id]) || prod.product_id || ''}
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
                      <Typography fontSize="14px" fontWeight="600" sx={{ color: '#16a34a' }}>
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
              
              <Typography fontSize="12px" fontWeight="600" sx={{ color: '#64748b', mt: 0.5 }}>
                Line Total: ₹{((prod.quantity || 1) * (prod.unit_price || prod.price || 0)).toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box 
          sx={{ 
            mt: 2, 
            pt: 2, 
            borderTop: '2px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography fontWeight="bold" fontSize="17px" sx={{ color: '#1e293b' }}>
            Total Amount
          </Typography>
          <Typography fontWeight="bold" fontSize="18px" sx={{ color: '#16a34a' }}>
            ₹{order.price}
          </Typography>
        </Box>

        <Box display="flex" gap={1.5} mt={2}>
          {showActionButtons && order.status === 'Requested' ? (
            <>
              <Button
                variant="contained"
                sx={{ 
                  background: 'linear-gradient(90deg, #004D26, #00A84F)',
                  color: '#fff', 
                  flex: 1, 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  textTransform: 'none', 
                  py: 1.5,
                  borderRadius: 2,
                  '&:hover': { background: 'linear-gradient(90deg, #003D1F, #008A40)' }
                }}
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
                sx={{ 
                  background: '#dc2626',
                  color: '#fff', 
                  flex: 1, 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  textTransform: 'none', 
                  py: 1.5,
                  borderRadius: 2,
                  '&:hover': { background: '#b91c1c' }
                }}
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
            <Box 
              sx={{ 
                flex: 1, 
                textAlign: 'center', 
                py: 1.5, 
                fontSize: '14px', 
                background: order.status === 'Confirmed' ? '#dcfce7' : order.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                color: order.status === 'Confirmed' ? '#16a34a' : order.status === 'Rejected' ? '#dc2626' : '#92400e',
                borderRadius: 2,
                fontWeight: 600
              }}
            >
              {order.status}
            </Box>
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
  const [notificationCount, setNotificationCount] = useState(0);
  const [vendorName, setVendorName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleNotificationClick = () => {
    navigate('/vendor-notifications');
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Fetch notifications and vendor name
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
    const fetchVendorName = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const vendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
        const token = localStorage.getItem('token');
        if (vendorId && token) {
          const response = await fetch(`${baseurl}/api/vendor/${vendorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          setVendorName(data.full_name || data.org_name || data.company || data.name || 'Vendor');
        }
      } catch (e) { setVendorName('Vendor'); }
    };
    fetchNotifications();
    fetchVendorName();
  }, []);

  const fetchOrders = () => {
    fetch(`${baseurl}/api/procurement/all`)
      .then((res) => res.json())
      .then((data) => {
        // Sort by newest first (by order_date or procurement_id)
        const sortedOrders = (data.data || []).sort((a, b) => {
          const dateA = new Date(a.order_date || a.created_at || 0);
          const dateB = new Date(b.order_date || b.created_at || 0);
          return dateB - dateA; // Newest first
        });
        setOrders(sortedOrders);
      })
      .catch((err) => console.error('Failed to fetch procurement orders:', err));
  };

  // Fetch product names on mount
  useEffect(() => {
    fetch(`${baseurl}/api/product/all`)
      .then(res => res.json())
      .then(data => {
        // console.log('Fetched products:', data);
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

  // Enhanced search filter
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Search by order ID
    if (order.procurement_id?.toString().includes(searchLower)) return true;
    
    // Search by vendor name
    if (order.vendor_name?.toLowerCase().includes(searchLower)) return true;
    
    // Search by date
    if (order.order_date?.toLowerCase().includes(searchLower)) return true;
    
    // Search by product names in items
    try {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      if (Array.isArray(items)) {
        return items.some(item => {
          const productName = productMap[item.product_id] || item.product_name || '';
          return productName.toLowerCase().includes(searchLower);
        });
      }
    } catch (e) {
      // If items is not valid JSON, try searching in the raw string
      if (order.items?.toLowerCase().includes(searchLower)) return true;
    }
    
    return false;
  });

  // Get current orders for pagination
  const getCurrentOrders = () => {
    const adminOrders = filteredOrders.filter(order => order.type === 'admin');
    const yourOrders = filteredOrders.filter(order => order.type === 'vendor' || order.type === 'farmer');
    
    const currentOrders = tabIndex === 0 ? adminOrders : yourOrders;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return currentOrders.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const getTotalPages = () => {
    const adminOrders = filteredOrders.filter(order => order.type === 'admin');
    const yourOrders = filteredOrders.filter(order => order.type === 'vendor' || order.type === 'farmer');
    const currentOrders = tabIndex === 0 ? adminOrders : yourOrders;
    return Math.ceil(currentOrders.length / itemsPerPage);
  };

  // Reset to first page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tabIndex, searchTerm]);

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 10, pt: 14 }}>
      {/* Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'linear-gradient(90deg, #004D26, #00A84F)',
          color: '#fff',
          p: 2.5,
          borderRadius: '0 0 24px 24px',
          boxShadow: '0 4px 12px rgba(0, 77, 38, 0.2)'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box component="img" src={velaanLogo} alt="Velaan Logo" sx={{ height: 50 }} />
          <Box display="flex" alignItems="center" gap={1.5}>
            <IconButton 
              onClick={handleNotificationClick}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 40, height: 40, fontSize: 18, fontWeight: 'bold' }}>
              {vendorName?.[0] || 'V'}
            </Avatar>
          </Box>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ px: 2 }}>
        <Box
          sx={{
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 3,
            px: 2,
            py: 1.5,
            mb: 2,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <SearchIcon sx={{ color: '#94a3b8' }} />
          <TextField
            fullWidth
            placeholder="Search orders..."
            variant="standard"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              disableUnderline: true,
              sx: { pl: 1.5, fontSize: 15 },
            }}
          />
        </Box>

        {/* Tab Filter */}
        <Tabs
          value={tabIndex}
          onChange={(e, newValue) => setTabIndex(newValue)}
          variant="fullWidth"
          sx={{ 
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 14
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#16a34a',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab label="Admin Requests" />
          <Tab label="Your Requests" />
        </Tabs>

        {/* Orders List by Tab */}
        {(() => {
          const currentOrders = getCurrentOrders();
          const totalPages = getTotalPages();
          
          if (currentOrders.length > 0) {
            return (
              <Box sx={{ px: 2 }}>
                {currentOrders.map((order) => (
                  <OrderCard 
                    key={order.procurement_id} 
                    order={order} 
                    onPriceUpdated={fetchOrders} 
                    editable={true} 
                    productMap={productMap} 
                    showActionButtons={tabIndex === 0}
                  />
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                    <Pagination 
                      count={totalPages} 
                      page={currentPage} 
                      onChange={handlePageChange}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          fontWeight: 600
                        },
                        '& .Mui-selected': {
                          backgroundColor: '#16a34a !important',
                          color: 'white'
                        }
                      }}
                      size="large"
                    />
                  </Box>
                )}
              </Box>
            );
          } else {
            return (
              <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
                <Typography sx={{ fontSize: 48, mb: 2 }}>📦</Typography>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5, color: '#1e293b' }}>
                  No Orders Found
                </Typography>
                <Typography color="text.secondary">
                  {tabIndex === 0 ? 'No admin requests at the moment' : 'You haven\'t made any requests yet'}
                </Typography>
              </Box>
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