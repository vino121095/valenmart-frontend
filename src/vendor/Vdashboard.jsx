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
import velaanLogo from '../assets/velaanLogo.png';

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
  const [ordersTodayRevenue, setOrdersTodayRevenue] = useState(0);

  const [vendorId, setVendorId] = useState(null);

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
    if (!vendorId) return;
    
    try {
      const response = await fetch(`${baseurl}/api/procurement/all`);
      const data = await response.json();
      
      console.log('Procurement data response:', data); // Debug log
      
      const procurementData = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      setStocks(procurementData);

      // Count orders placed today for this vendor
      const today = dayjs().format('YYYY-MM-DD');
      console.log('Today:', today); // Debug log
      console.log('Vendor ID:', vendorId); // Debug log
      
      const ordersToday = procurementData.filter((order) => {
        const orderVendorId = String(order.vendor_id || order.vendorId);
        const currentVendorId = String(vendorId);
        const orderDate = dayjs(order.order_date || order.created_at || order.date).format('YYYY-MM-DD');
        
        console.log('Order vendor ID:', orderVendorId, 'Current vendor ID:', currentVendorId, 'Order date:', orderDate); // Debug log
        
        return orderVendorId === currentVendorId && orderDate === today;
      });
      
      console.log('Orders today:', ordersToday); // Debug log
      setOrdersTodayCount(ordersToday.length);

      // Calculate today's revenue for this vendor
      const todayRevenue = ordersToday.reduce((sum, order) => {
        let orderTotal = 0;
        try {
          const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
          if (Array.isArray(items)) {
            orderTotal = items.reduce((itemSum, item) => {
              return itemSum + (Number(item.quantity || 0) * Number(item.unit_price || 0));
            }, 0);
          }
        } catch {
          orderTotal = Number(order.price || order.total_amount || order.amount || 0);
        }
        console.log('Order total:', orderTotal); // Debug log
        return sum + orderTotal;
      }, 0);
      
      console.log('Today revenue:', todayRevenue); // Debug log
      setOrdersTodayRevenue(todayRevenue);
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
    if (vendorId) {
      fetchProcurementData();
    }
  }, [vendorId]);

  useEffect(() => {
    // Get vendor ID and fetch vendor details
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const currentVendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
    setVendorId(currentVendorId);
    
    const token = localStorage.getItem('token');
    if (currentVendorId && token) {
      fetch(`${baseurl}/api/vendor/${currentVendorId}`, {
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
      order.status === 'Requested' && String(order.vendor_id || order.vendorId) === String(vendorId)
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
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box component="img" src={velaanLogo} alt="Velaan Logo" sx={{ height: 50 }} />

          <Box display="flex" alignItems="center" gap={1.5}>
            <IconButton 
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white', 
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }} 
              onClick={handlenotification}
            >
              <Badge color="error" badgeContent={notificationCount}>
                <NotificationsIcon sx={{ fontSize: 26 }} />
              </Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 40, height: 40, fontSize: 18, fontWeight: 'bold' }}>
              {vendorName?.[0] || 'V'}
            </Avatar>
          </Box>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box px={2}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#1e293b', mb: 2 }}>
          Today's Overview
        </Typography>

        <Box display="flex" gap={2}>
          <Card 
            elevation={0}
            sx={{ 
              flex: 1, 
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)'
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: 13 }}>
                Orders Today
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#16a34a' }}>
                {ordersTodayCount}
              </Typography>
            </CardContent>
          </Card>
          <Card 
            elevation={0}
            sx={{ 
              flex: 1, 
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)'
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: 13 }}>
                Revenue
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#2563eb' }}>
                ₹{ordersTodayRevenue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Pending Orders */}
      <Box mt={3} px={2}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#1e293b' }}>
                Pending Orders
              </Typography>
              <Box 
                sx={{ 
                  bgcolor: '#fef3c7', 
                  color: '#92400e', 
                  px: 2, 
                  py: 0.5, 
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                {pendingOrders.length}
              </Box>
            </Box>

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
                      elevation={0}
                      sx={{ 
                        mb: 2, 
                        backgroundColor: '#fefce8',
                        border: '1px solid #fde047',
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          transform: 'translateY(-2px)'
                        },
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
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
                              {order.type === 'vendor' || order.type === 'farmer' ? 'From Vendor' : 'Admin Order'} #{order.procurement_id}
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
                                  backgroundColor: '#fef3c7',
                                  color: '#92400e',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1.5,
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                {order.status}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                color: 'text.secondary'
              }}>
                <Typography sx={{ fontSize: 48, mb: 2 }}>✅</Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5, color: '#1e293b' }}>
                  All Clear!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No pending orders at the moment
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Today's Pickups */}
      <Box mt={3} px={2}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#1e293b' }}>
              Today's Pickups
            </Typography>
            {todaysPickups.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ fontSize: 40, mb: 1 }}>📦</Typography>
                <Typography color="text.secondary">No pickups scheduled for today</Typography>
              </Box>
            ) : (
              <Box>
                {todaysPickups.map((pickup) => (
                  <Card
                    key={pickup.procurement_id}
                    elevation={0}
                    sx={{ 
                      mb: 2,
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 2,
                      '&:last-child': { mb: 0 }
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography fontWeight="bold" sx={{ mb: 0.5 }}>
                        Admin Order #{pickup.procurement_id}
                      </Typography>
                      <Typography fontSize={14} color="text.secondary" sx={{ mb: 0.5 }}>
                        {pickup.items && typeof pickup.items === 'string'
                          ? JSON.parse(pickup.items).map(i => i.product_name).join(', ')
                          : ''}
                      </Typography>
                      <Typography fontSize={12} color="text.secondary">
                        Pickup: {pickup.pickup_time || pickup.order_date}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Available Stocks */}
      <Box mt={3} px={2} mb={3}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#1e293b' }}>
              Available Stocks
            </Typography>
            <List sx={{ p: 0 }}>
              {products.slice(0, 5).map((item, index) => (
                <ListItem
                  key={`${item.product_name}-${index}`}
                  sx={{ 
                    px: 0,
                    borderBottom: index < 4 ? '1px solid #f1f5f9' : 'none'
                  }}
                  secondaryAction={
                    <Typography fontWeight={600} sx={{ color: '#16a34a' }}>
                      {item.unit}
                    </Typography>
                  }
                >
                  <ListItemAvatar sx={{ mr: 2 }}>
                    <Avatar 
                      variant="rounded"
                      src={item.product_image ? `${baseurl}/${item.product_image}` : ''}
                      sx={{ 
                        bgcolor: '#dcfce7', 
                        color: '#16a34a',
                        width: 56,
                        height: 56,
                        borderRadius: 2
                      }}
                    >
                      {!item.product_image && (item.icon || item.product_name?.[0] || '?')}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={item.product_name}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                onClick={() => navigate('/AvailableStock')}
                variant="contained"
                fullWidth
                sx={{ 
                  background: 'linear-gradient(90deg, #004D26, #00A84F)',
                  color: 'white',
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { 
                    background: 'linear-gradient(90deg, #003D1F, #008A40)'
                  }
                }}
              >
                View All Stocks
              </Button>
            </Box>
          </CardContent>
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