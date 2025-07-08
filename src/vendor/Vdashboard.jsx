import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  BottomNavigation,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  IconButton,
  Badge,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import VendorFooter from '../vendorfooter';
import dayjs from 'dayjs';
import baseurl from '../baseurl/ApiService';
import VendorNotifications from './VendorNotifications';

const VDashboard = () => {
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [ordersTodayCount, setOrdersTodayCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pickupLoading, setPickupLoading] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const [vendorName, setVendorName] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(false);

  const vendor_id = parseInt(localStorage.getItem('vendor_id'), 10) || 1;
  const vendorId = vendor_id;

  // Fetch product data
  useEffect(() => {
    fetch(`${baseurl}/api/product/all`)
      .then((response) => response.json())
      .then((res) => {
        setProducts(Array.isArray(res.data) ? res.data : []);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
        setSnackbar({
          open: true,
          message: 'Failed to fetch products',
          severity: 'error'
        });
      });
  }, []);

  // Fetch procurement data
  const fetchProcurementData = async () => {
    try {
      const response = await fetch(`${baseurl}/api/procurement/all`);
      const data = await response.json();
      
      if (Array.isArray(data.data)) {
        setStocks(data.data);

        // Count orders placed today
        const today = dayjs().format('YYYY-MM-DD');
        const ordersToday = data.data.filter((order) =>
          dayjs(order.order_date).format('YYYY-MM-DD') === today
        );
        setOrdersTodayCount(ordersToday.length);
      }
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setSnackbar({
        open: true,
        message: 'Failed to fetch procurement data',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchProcurementData();
  }, []);

  useEffect(() => {
    // Always fetch vendor name from API
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const vendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
    const token = localStorage.getItem('token');
    if (vendorId && token) {
      fetch(`${baseurl}/api/vendor/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const apiName = data.full_name || data.org_name || data.company || data.name || data.vendor_name || 'Vendor';
          setVendorName(apiName);
        })
        .catch(() => setVendorName('Vendor'));
    } else {
      setVendorName('Vendor');
    }
  }, []);

  const pendingOrders = stocks.filter(
    (order) =>
      order.status === 'Requested' && String(order.vendor_id) === String(vendorId)
  );

  const handleStartPickup = async (pickup) => {
    // Set loading state for this specific order
    setPickupLoading(prev => ({ ...prev, [pickup.procurement_id]: true }));
    
    try {
      // console.log('Starting pickup for order:', pickup.procurement_id);
      // console.log('API URL:', `${baseurl}/api/procurement/update/${pickup.procurement_id}`);
      
      const token = localStorage.getItem('token');
      // console.log('Token exists:', !!token);
      
      const requestBody = { status: 'Picked' };
      // console.log('Request body:', requestBody);
      
      const response = await fetch(`${baseurl}/api/procurement/update/${pickup.procurement_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(requestBody),
      });

      // console.log('Response status:', response.status);
      // console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to update status'}`);
      }

      const result = await response.json();
      // console.log('Success response:', result);

      // Update local state immediately
      setStocks(prev => prev.map(order => 
        order.procurement_id === pickup.procurement_id 
          ? { ...order, status: 'Picked' }
          : order
      ));

      setSnackbar({
        open: true,
        message: 'Pickup started successfully!',
        severity: 'success'
      });

      // Refresh data to ensure consistency
      await fetchProcurementData();

    } catch (err) {
      console.error('Error starting pickup:', err);
      setSnackbar({
        open: true,
        message: `Failed to start pickup: ${err.message}`,
        severity: 'error'
      });
    } finally {
      // Clear loading state for this specific order
      setPickupLoading(prev => ({ ...prev, [pickup.procurement_id]: false }));
    }
  };

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
          setNotifications(data.notifications);
          const unreadCount = data.notifications.filter(n => !n.is_read).length;
          setNotificationCount(unreadCount);
        }
      } catch (e) {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markNotificationAsRead = async (notificationId) => {
    try {
      const authToken = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const vendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
      await fetch(`${baseurl}/api/vendor-notification/mark-read/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.nid === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setNotificationCount(prev => prev > 0 ? prev - 1 : 0);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
    }
  };

  const handlenotification = ()=>{
    markNotificationAsRead();
    navigate('/vendor-notifications');
  }

  const today = dayjs().format('YYYY-MM-DD');
  const todaysPickups = stocks.filter(order =>
    order.status === 'Approved' &&
    dayjs(order.pickup_date || order.order_date).format('YYYY-MM-DD') === today
  );

  return (
    <Box sx={{ bgcolor: '#F8F8FC', minHeight: '100vh', pb: 8 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bgcolor="#00A86B"
        color="#fff"
        p={2}
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: '#ccc' }}>{vendorName?.[0] || 'V'}</Avatar>
          <Typography variant="h6" fontWeight="bold">
            Hello, {vendorName}
          </Typography>
        </Box>

        <IconButton sx={{ backgroundColor: '#FFFFFF4D', color: 'white', p: 1 }} onClick={handlenotification}>
          <Badge color="error" badgeContent={notificationCount}>
            <NotificationsIcon sx={{ fontSize: 28 }} />
          </Badge>
        </IconButton>
      </Box>

      {/* Summary Cards */}
      <Box px={2}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Summary
        </Typography>

        <Box display="flex" gap={2} mt={2}>
          <Card sx={{ flex: 1, borderRadius: 4 }}>
            <CardContent>
              <Typography variant="subtitle2">Orders Today</Typography>
              <Typography variant="h5">{ordersTodayCount}</Typography>
              <Typography color="green">+12.5%</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 4 }}>
            <CardContent>
              <Typography variant="subtitle2">Revenue (₹)</Typography>
              <Typography variant="h5">14,250</Typography>
              <Typography color="green">+5.3%</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Pending Orders */}
      <Box mt={3} px={2}>
        <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Pending Orders ({pendingOrders.length})
            </Typography>

            {pendingOrders.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {pendingOrders.map((order) => {
                  let items = [];
                  try {
                    items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    if (!Array.isArray(items)) items = [];
                  } catch {
                    items = [];
                  }
                  return (
                    <Card 
                      key={order.procurement_id} 
                      sx={{ 
                        mb: 2, 
                        backgroundColor: '#f9f9f9',
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            gap: 2
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="subtitle1" 
                              fontWeight="bold" 
                              sx={{ mb: 1 }}
                            >
                              Admin Order #{order.procurement_id}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.primary"
                              sx={{ mb: 1, wordBreak: 'break-word' }}
                            >
                              {order.unit} Units • {items.length > 0 ? items.map((item, idx) => {
                                const prod = products.find(p => p.pid === item.product_id || p.id === item.product_id);
                                return `${prod ? prod.product_name : 'Product'} (Qty: ${item.quantity}, ₹${item.unit_price}/unit)`;
                              }).join(', ') : 'No items'}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.primary"
                              sx={{ mb: 1 }}
                            >
                              Price: ₹{order.price}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Requested: {new Date(order.order_date).toLocaleDateString()}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  backgroundColor: '#FFF5E0',
                                  color: '#D78A00',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem'
                                }}
                              >
                                Status: {order.status}
                              </Typography>
                            </Box>
                          </Box>
                          <Button
                            variant="contained"
                            color="success"
                            disabled={pickupLoading[order.procurement_id]}
                            onClick={() => handleStartPickup(order)}
                            startIcon={
                              pickupLoading[order.procurement_id] ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : null
                            }
                            sx={{
                              minWidth: '120px',
                              textTransform: 'none'
                            }}
                          >
                            {pickupLoading[order.procurement_id] ? 'Starting...' : 'Start Pickup'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: 'text.secondary'
              }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  No pending orders found
                </Typography>
                <Typography variant="body2">
                  All orders have been processed
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Today's Pickups */}
      <Box mt={3} px={2}>
        <Card sx={{ p: 2, borderRadius: 4 }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Today's Pickups
          </Typography>
          {todaysPickups.length === 0 ? (
            <Typography color="text.secondary">No pickups for today.</Typography>
          ) : (
            <Box sx={{ backgroundColor: '#f9f9f9' }}>
              {todaysPickups.map((pickup) => (
                <CardContent
                  key={pickup.procurement_id}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Box>
                    <Typography fontWeight="bold">Admin Order #{pickup.procurement_id}</Typography>
                    <Typography fontSize={14}>
                      {pickup.items && typeof pickup.items === 'string'
                        ? JSON.parse(pickup.items).map(i => i.product_name).join(', ')
                        : ''}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      Pickup: {pickup.pickup_time || pickup.order_date}
                    </Typography>
                  </Box>
                  <Button
                    onClick={() => navigate('/Pickupdetails', { state: { pickup } })}
                    variant="contained"
                    sx={{ bgcolor: '#00A86B', textTransform: 'none' }}
                  >
                    Mark Ready
                  </Button>
                </CardContent>
              ))}
            </Box>
          )}
        </Card>
      </Box>

      {/* Available Stocks */}
      <Box mt={3} px={2}>
        <Card sx={{ p: 2, borderRadius: 4 }}>
          <Typography variant="h6" fontWeight="bold">
            Available Stocks
          </Typography>
          <List>
            {products.map((item, index) => (
              <ListItem
                key={`${item.product_name}-${index}`}
                secondaryAction={<Typography>{item.unit}</Typography>}
              >
                <ListItemAvatar>
                  <Avatar>{item.icon || item.product_name?.[0] || '?'}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={item.product_name} />
              </ListItem>
            ))}
          </List>
          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              onClick={() => navigate('/AvailableStock')}
              variant="contained"
              sx={{ bgcolor: '#00A86B' }}
            >
              See All
            </Button>
          </Box>
        </Card>
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}
        elevation={3}
      >
        <BottomNavigation showLabels sx={{ backgroundColor: '#f5f5f5' }}>
          <VendorFooter />
        </BottomNavigation>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VDashboard;