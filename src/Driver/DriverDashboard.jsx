import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Box, Button, Card, CardContent, Container, Divider, Grid, Typography, BottomNavigation, BottomNavigationAction, Paper, CircularProgress, Alert, IconButton } from '@mui/material';
import { Notifications, Dashboard, Assignment, Person, ListAlt, ArrowBack } from '@mui/icons-material';
import DriverFooter from '../driverfooter';
import baseurl from '../baseurl/ApiService';
import DriverNotifications from './DriverNotifications';

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
        action:
          order.status === 'Waiting for Approval'
            ? 'Start Delivery'
            : order.status === 'Out for Delivery'
            ? 'Out for Delivery'
            : 'View Details',
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
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 7 }}>
      <Box sx={{ bgcolor: '#2bb673', color: 'white', p: 2 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ width: 64, height: 64 }} src={driverInfo.profileImage || undefined}>
              {!driverInfo.profileImage && driverInfo.initials}
            </Avatar>
            <Typography variant="h6">Hello, {driverInfo.name}</Typography>
          </Grid>
          <Badge color="error" badgeContent={notificationCount}>
            <Notifications onClick={handlenotification} />
          </Badge>
        </Grid>
      </Box>

      <Container sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Pending Tasks</Typography>
                <Typography variant="h5">{pendingTasks}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Completed Tasks</Typography>
                <Typography variant="h5">{completedTasks}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box mt={4}>
          <Typography variant="h6" gutterBottom>Upcoming Tasks</Typography>
          
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
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No upcoming tasks available
              </Typography>
            </Card>
          ) : (
            deliveries.map((task, index) => (
              <Card key={index} sx={{ display: 'flex', mb: 2 }}>
                <Box sx={{ width: 5, bgcolor: task.type === 'Pickup' ? 'green' : 'blue' }} />
                <CardContent sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">Order {task.id} - {task.type}</Typography>
                  <Typography variant="body2">{task.location}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatAddress(task)}</Typography>
                  <Typography variant="body2" color="text.secondary">{task.order_date}</Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 1, bgcolor: task.type === 'Pickup' ? 'green' : 'blue', color: 'white' }}
                    onClick={() => {
                      if (task.action === 'Start Delivery') {
                        handleStartDelivery(task.id);
                      }
                      else{
                        handlePickup(task.id);
                      }
                    }}
                    disabled={task.status === 'Out for Delivery'}
                  >
                    {task.status === 'Out for Delivery' ? 'Out for Delivery' : task.action}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </Container>

      <DriverFooter />

    </Box>
  );
}
