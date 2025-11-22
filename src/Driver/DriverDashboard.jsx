import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Box, Button, Card, CardContent, Container, Divider, Grid, Typography, BottomNavigation, BottomNavigationAction, Paper, CircularProgress, Alert, IconButton } from '@mui/material';
import { Notifications, Dashboard, Assignment, Person, ListAlt, LocalShipping, CheckCircle, Schedule, TrendingUp } from '@mui/icons-material';
import DriverFooter from '../driverfooter';
import baseurl from '../baseurl/ApiService';
import DriverNotifications from './DriverNotifications';
import velaanLogo from '../assets/velaanLogo.png';

function formatAddress(task) {
  // For procurement pickups, show vendor address
  if (task.type === 'Pickup' && (task.vendor_address || task.vendor_city || task.vendor_state || task.vendor_pincode)) {
    let address = task.vendor_address || task.address || 'Address not available';
    let city = task.vendor_city || task.city || '';
    let state = task.vendor_state || task.state || '';
    let pincode = task.vendor_pincode || task.pincode || '';
    let formattedAddress = address;
    if (city) formattedAddress += `, ${city}`;
    if (state) formattedAddress += `, ${state}`;
    if (pincode) formattedAddress += ` - ${pincode}`;
    return formattedAddress;
  } else {
    // For regular pickups and deliveries, show customer address
    let address = task.customer_address || task.address || 'Address not available';
    let city = task.customer_city || task.city || '';
    let state = task.customer_state || task.state || '';
    let pincode = task.customer_pincode || task.postal_code || task.pincode || '';
    let formattedAddress = address;
    if (city) formattedAddress += `, ${city}`;
    if (state) formattedAddress += `, ${state}`;
    if (pincode) formattedAddress += ` - ${pincode}`;
    return formattedAddress;
  }
}

export default function DriverDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [driverInfo, setDriverInfo] = useState({ name: 'Driver', initials: 'D' });
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  const pathToValue = {
    '/DriverDash': 0,
    '/DriverTask': 1,
    '/DriverLog': 2,
    '/DriverAccount': 3,
  };

  const value = pathToValue[location.pathname] ?? 0;

  // Function to fetch driver details
  const fetchDriverDetails = async () => {
    try {
      const userData = localStorage.getItem('userData');
      const parsedData = userData ? JSON.parse(userData) : {};
      const driverId = localStorage.getItem('driver_id') || parsedData.did || parsedData.id;

      if (!driverId) {
        console.error('Driver ID could not be found in localStorage.');
        return;
      }

      const authToken = localStorage.getItem('token');
      // console.log('Driver ID:', driverId);
      // console.log('Auth Token:', authToken ? 'Present' : 'Missing');

      const response = await fetch(`${baseurl}/api/driver-details/${driverId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      // console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch driver details');
      }

      const data = await response.json();
      // console.log('Driver API Response:', data);

      // Extract driver information
      const driverData = data.data || data;
      const firstName = driverData.first_name || driverData.name || 'Driver';
      const lastName = driverData.last_name || '';
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      const profileImage = `${baseurl}/${driverData.driver_image}` || driverData.avatar || '';

      setDriverInfo({
        name: fullName,
        initials: initials,
        profileImage: profileImage
      });

    } catch (error) {
      console.error("Error fetching driver details, using fallback.", error);
      // Fallback to user data from localStorage
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          const firstName = parsedData.first_name || parsedData.name || 'Driver';
          const lastName = parsedData.last_name || '';
          const fullName = lastName ? `${firstName} ${lastName}` : firstName;
          const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
          
          setDriverInfo({
            name: fullName,
            initials: initials
          });
        }
      } catch (fallbackError) {
        console.error('Error parsing fallback driver data:', fallbackError);
      }
    }
  };

  // Function to fetch order data
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = localStorage.getItem('userData');
      const parsedData = userData ? JSON.parse(userData) : {};
      const driverId = localStorage.getItem('driver_id') || parsedData.did || parsedData.id;

      if (!driverId) {
        throw new Error('Driver ID not found. Please login again.');
      }

      // Fetch regular orders
      const orderRes = await fetch(`${baseurl}/api/order/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!orderRes.ok) {
        throw new Error(`Failed to fetch orders: ${orderRes.status}`);
      }
      const orderData = await orderRes.json();
      let ordersArray = [];
      if (orderData.data && Array.isArray(orderData.data)) {
        ordersArray = orderData.data;
      } else if (Array.isArray(orderData)) {
        ordersArray = orderData;
      }

      // Fetch procurement pickups
      const procurementRes = await fetch(`${baseurl}/api/procurement/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!procurementRes.ok) {
        throw new Error(`Failed to fetch procurement pickups: ${procurementRes.status}`);
      }
      const procurementData = await procurementRes.json();
      let procurementArray = [];
      if (procurementData.data && Array.isArray(procurementData.data)) {
        procurementArray = procurementData.data;
      } else if (Array.isArray(procurementData)) {
        procurementArray = procurementData;
      }

      // DEBUG: Log procurement data
      // console.log('Procurement API Data:', procurementArray);

      // Filter regular deliveries assigned to this driver
      const assignedOrders = ordersArray.filter(order =>
        String(order.driver_id) === String(driverId) &&
        (order.status === 'pending' || order.status === 'Waiting for Approval')
      );

      // Filter procurement pickups assigned to this driver and status 'Approved'
      const assignedProcurements = procurementArray.filter(order =>
        String(order.driver_id) === String(driverId) && order.status === 'Waiting for Approval'
      );

      // DEBUG: Log assigned procurements
      // console.log('Assigned Procurements:', assignedProcurements);

      // Transform deliveries
      const transformedOrders = assignedOrders.map(order => ({
        id: order.oid || order.order_id || `#${Math.floor(Math.random() * 9000) + 1000}`,
        type: 'Delivery',
        location: order.CustomerProfile?.institution_name || 'Unknown Location',
        address: `${order.address || 'Address not available'}, ${order.city || ''}, ${order.state || ''}, ${order.postal_code || ''}`,
        time: order.delivery_time || 'Time not set',
        action: 'Start Delivery',
        status: order.status || 'pending'
      }));

      // Transform procurement pickups
      const transformedProcurements = assignedProcurements.map(order => ({
        id: order.procurement_id || `#${Math.floor(Math.random() * 9000) + 1000}`,
        type: 'Pickup',
        location: order.vendor_name || order.vendor?.name || 'Vendor Location',
        address: `${order.vendor.address || order.address || 'Address not available'}, ${order.vendor.city || order.city || ''}, ${order.vendor.state || order.city || ''}, ${order.vendor.pincode || order.city || ''}`,
        time: order.pickup_time || order.expected_delivery_date || order.order_date || 'Time not set',
        action: 'Start Pickup',
        status: order.status || 'Approved'
      }));

      // Combine both for display
      const allTasks = [...transformedOrders, ...transformedProcurements];
      setDeliveries(allTasks);

      // Calculate task counts
      const pending = allTasks.filter(d => d.status === 'pending' || d.status === 'Approved').length;
      const completed = allTasks.filter(d => d.status === 'completed' || d.status === 'Picked' || d.status === 'Delivered').length;

      setPendingTasks(pending);
      setCompletedTasks(completed);

    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
      setDeliveries([]);
      setPendingTasks(0);
      setCompletedTasks(0);
    } finally {
      setLoading(false);
    }
  };

  // Function to update order status to 'shipped'
  const handleStartDelivery = async (orderId) => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/order/update/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: 'Out for Delivery' })
      });

      if (!response.ok) throw new Error('Failed to update order status');
      fetchOrders();
    } catch (err) {
      alert('Failed to update order status: ' + err.message);
    }
  };
  const handlePickup = async (orderId) => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/procurement/update/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: 'Approved' })
      });

      if (!response.ok) throw new Error('Failed to update order status');
      fetchOrders();
    } catch (err) {
      alert('Failed to update order status: ' + err.message);
    }
  };

  // Fetch notifications on component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const authToken = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const driverId = userData.id || userData.did || localStorage.getItem('driver_id');
        if (!driverId) return;
        const response = await fetch(`${baseurl}/api/driver-notification/all/${driverId}`, {
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

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
    fetchDriverDetails();
  }, []);

  
  const markNotificationAsRead = async (notificationId) => {
    try {
      const authToken = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const driver_id = userData.id || userData.driver_id || localStorage.getItem('driver_id');
      await fetch(`${baseurl}/api/driver-notification/mark-read/${driver_id}`, {
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

  const handlenotification = () => {
    markNotificationAsRead();
    navigate('/driver-notifications', { state: { driverInfo } });
  }

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
          <img src={velaanLogo} alt="Velaan Logo" style={{ height: '50px' }} />
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
                <Notifications sx={{ fontSize: 26 }} />
              </Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold', width: 40, height: 40 }} src={driverInfo.profileImage || undefined}>
              {!driverInfo.profileImage && driverInfo.initials}
            </Avatar>
          </Box>
        </Box>
      </Box>

      <Container sx={{ px: 2 }}>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6}>
            <Card sx={{ 
              bgcolor: '#fff3e0',
              borderRadius: 3,
              border: '2px solid #ffb74d',
              boxShadow: 'none'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Schedule sx={{ fontSize: 36, color: '#f57c00', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="#f57c00">
                  {pendingTasks}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="500">Pending Tasks</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ 
              bgcolor: '#e8f5e9',
              borderRadius: 3,
              border: '2px solid #81c784',
              boxShadow: 'none'
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircle sx={{ fontSize: 36, color: '#43a047', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="#43a047">
                  {completedTasks}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="500">Completed</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold">Upcoming Tasks</Typography>
          <Box display="flex" alignItems="center" gap={0.5} sx={{ color: '#00A84F' }}>
            <TrendingUp fontSize="small" />
            <Typography variant="body2" fontWeight="600">{deliveries.length} Active</Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="success" />
          </Box>
        ) : deliveries.length === 0 ? (
            <Card sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 3,
              border: '2px dashed #e0e0e0',
              bgcolor: '#fafafa'
            }}>
              <LocalShipping sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" fontWeight="500">
                No upcoming tasks
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                You're all caught up! Check back later.
              </Typography>
            </Card>
        ) : (
          deliveries.map((task, index) => (
              <Card key={index} sx={{ 
                mb: 2,
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)'
                }
              }}>
                <Box display="flex">
                  <Box sx={{ 
                    width: 6, 
                    background: task.type === 'Pickup' 
                      ? 'linear-gradient(180deg, #00A84F, #004D26)' 
                      : 'linear-gradient(180deg, #2196F3, #1565C0)'
                  }} />
                  <CardContent sx={{ flex: 1, p: 2.5 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{
                          bgcolor: task.type === 'Pickup' ? '#dcfce7' : '#e3f2fd',
                          color: task.type === 'Pickup' ? '#00A84F' : '#2196F3',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}>
                          {task.type}
                        </Box>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                          #{task.id}
                        </Typography>
                      </Box>
                      <Box sx={{
                        bgcolor: task.status === 'Out for Delivery' ? '#fff3e0' : '#f3e5f5',
                        color: task.status === 'Out for Delivery' ? '#f57c00' : '#7b1fa2',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {task.status === 'Out for Delivery' ? 'In Progress' : 'Ready'}
                      </Box>
                    </Box>
                    <Typography variant="body1" fontWeight="600" mb={0.5}>
                      {task.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={0.5} sx={{ fontSize: 13 }}>
                      {formatAddress(task)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                      <Schedule sx={{ fontSize: 14 }} />
                      {task.time}
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ 
                        mt: 2,
                        py: 1.2,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: 14,
                        color: 'white',
                        background: task.status === 'Out for Delivery'
                          ? 'linear-gradient(90deg, #ff9800, #f57c00)'
                          : task.type === 'Pickup' 
                            ? 'linear-gradient(90deg, #00A84F, #004D26)' 
                            : 'linear-gradient(90deg, #2196F3, #1565C0)',
                        boxShadow: task.status === 'Out for Delivery' ? '0 4px 12px rgba(245, 124, 0, 0.3)' : '0 4px 12px rgba(0, 168, 79, 0.3)',
                        '&:hover': {
                          boxShadow: task.status === 'Out for Delivery' ? '0 6px 16px rgba(245, 124, 0, 0.4)' : '0 6px 16px rgba(0, 168, 79, 0.4)',
                          transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                          background: '#e0e0e0',
                          color: '#9e9e9e'
                        }
                      }}
                      onClick={() => {
                        if (task.action === 'Start Delivery') {
                          handleStartDelivery(task.id);
                        } else {
                          handlePickup(task.id);
                        }
                      }}
                      disabled={task.status === 'Out for Delivery'}
                    >
                      {task.status === 'Out for Delivery' ? '🚚 Out for Delivery' : `🚀 ${task.action}`}
                    </Button>
                  </CardContent>
                </Box>
              </Card>
          ))
        )}
      </Container>

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
          <DriverFooter />
        </BottomNavigation>
      </Paper>

    </Box>
  );
}
