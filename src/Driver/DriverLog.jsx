import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Box, Button, Card, CardContent, Container, Grid, IconButton, Typography, Tabs, Tab, Avatar, Chip, CircularProgress, Alert, Paper, BottomNavigation, Badge } from '@mui/material';
import { FilterList, LocalShipping, ShoppingCart } from '@mui/icons-material';
import { Notifications, Dashboard, Assignment, Person, ListAlt } from '@mui/icons-material';
import DriverFooter from '../driverfooter';
import baseurl from '../baseurl/ApiService';
import velaanLogo from '../assets/velaanLogo.png';

export default function DriverLog() {
  const location = useLocation();
  const navigate = useNavigate();

  const pathToValue = {
    '/DriverDash': 0,
    '/DriverTask': 1,
    '/DriverLog': 2,
    '/DriverAccount': 3,
  };

  const value = pathToValue[location.pathname] ?? 0;

  const [tab, setTab] = useState(0);
  const [completedPickups, setCompletedPickups] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [driverName, setDriverName] = useState('Driver');
  const [driverProfileImage, setDriverProfileImage] = useState('');

  useEffect(() => {
    const fetchDriverDetails = async () => {
      try {
        const userData = localStorage.getItem('userData');
        const parsedData = userData ? JSON.parse(userData) : {};
        const driverId = localStorage.getItem('driver_id') || parsedData.did || parsedData.id;
        if (!driverId) return;
        const authToken = localStorage.getItem('token');
        const response = await fetch(`${baseurl}/api/driver-details/${driverId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        const driverData = data.data || data;
        const firstName = driverData.first_name || driverData.name || 'Driver';
        const lastName = driverData.last_name || '';
        const fullName = lastName ? `${firstName} ${lastName}` : firstName;
        const profileImage = driverData.driver_image ? `${baseurl}/${driverData.driver_image}` : '';
        setDriverName(fullName);
        setDriverProfileImage(profileImage);
      } catch (e) {}
    };
    fetchDriverDetails();
    const fetchNotifications = async () => {
      try {
        const authToken = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const driverId = userData.id || userData.did || localStorage.getItem('driver_id');
        if (!driverId) return;
        const response = await fetch(`${baseurl}/api/driver-notification/all/${driverId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
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
    const fetchCompletedTasks = async () => {
      setLoading(true);
      setError('');
      try {
        const userData = localStorage.getItem('userData');
        const driverId = localStorage.getItem('driver_id') ||
          (userData ? JSON.parse(userData).id : null);
        if (!driverId) throw new Error('Driver ID not found. Please login again.');

        // Fetch regular orders
        const response = await fetch(`${baseurl}/api/order/all`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        let ordersArray = [];
        if (data.data && Array.isArray(data.data)) {
          ordersArray = data.data;
        } else if (Array.isArray(data)) {
          ordersArray = data;
        }

        // Fetch procurement pickups
        const procurementRes = await fetch(`${baseurl}/api/procurement/all`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!procurementRes.ok) throw new Error('Failed to fetch procurement pickups');
        const procurementData = await procurementRes.json();
        let procurementArray = [];
        if (procurementData.data && Array.isArray(procurementData.data)) {
          procurementArray = procurementData.data;
        } else if (Array.isArray(procurementData)) {
          procurementArray = procurementData;
        }

        // Filter for this driver (regular orders)
        const assignedOrders = ordersArray.filter(order =>
          String(order.driver_id) === String(driverId)
        );

        // Log assigned orders for debugging
        // console.log('Assigned Orders:', assignedOrders);

        // Filter procurement pickups assigned to this driver
        const assignedProcurements = procurementArray.filter(order =>
          String(order.driver_id) === String(driverId)
        );

        // Completed regular pickups
        const completedRegularPickups = assignedOrders.filter(order =>
          (order.type === 'Pickup' || order.status === 'pending') && order.status === 'Completed'
        ).map(order => ({
          procurement: false,
          oid: order.oid || order.order_id || `#${Math.floor(Math.random() * 9000) + 1000}`,
          type: 'Pickup',
          location: order.CustomerProfile?.institution_name || order.location || 'Unknown Location',
          address: `${
            order.address || order.pickup_address || order.delivery_address || (order.CustomerProfile && order.CustomerProfile.address) || 'Address not available'
          }, ${
            order.city || (order.CustomerProfile && order.CustomerProfile.city) || ''
          }, ${
            order.state || (order.CustomerProfile && order.CustomerProfile.state) || ''
          }, ${
            order.pincode || (order.CustomerProfile && order.CustomerProfile.pincode) || ''
          }`,
          time: order.time || order.delivery_time || 'Time not set',
          status: order.status || 'Completed',
        }));

        // Completed procurement pickups
        const completedProcurementPickups = assignedProcurements.filter(order =>
          order.status === 'Received'
        ).map(order => ({
          procurement: true,
          oid: order.procurement_id || `#${Math.floor(Math.random() * 9000) + 1000}`,
          type: 'Pickup',
          location: order.vendor_name || order.vendor?.name || 'Vendor Location',
          address: `${
            order.vendor?.address || order.address || order.pickup_address || 'Address not available'
          }, ${
            order.vendor?.city || order.city || ''
          }, ${
            order.vendor?.state || order.state || ''
          }, ${
            order.vendor?.pincode || order.pincode || ''
          }`,
          time: order.pickup_time || order.expected_delivery_date || order.order_date || 'Time not set',
          status: order.status === 'Received' ? 'Completed' : 'Received' || 'Completed',
        }));



        // Completed deliveries (regular orders) - robust status check
        const completedDeliveries = assignedOrders.filter(order =>
          (order.type === 'Delivery' || order.status === 'Out for Delivery' || order.status === 'Delivered') &&
          (order.status && ['delivered', 'completed'].includes(order.status.toLowerCase()))
        ).map(order => ({
          oid: order.oid || order.order_id || `#${Math.floor(Math.random() * 9000) + 1000}`,
          type: 'Delivery',
          location: order.CustomerProfile?.institution_name || order.location || 'Unknown Location',
          address: `${order.address || 'Address not available'}, ${order.city || ''}`,
          time: order.time || order.delivery_time || 'Time not set',
          status: order.status || 'Delivered',
          charge: order.delivery_charge || order.charge || order.price || 0
        }));

        setCompletedPickups([...completedRegularPickups, ...completedProcurementPickups]);
        setCompletedDeliveries(completedDeliveries);
        const procurementWithCharge = await Promise.all(
          completedProcurementPickups.map(async (delivery) => {
            const charge = await fetchDeliveryCharge(delivery.oid);
            return { ...delivery, charge };
          })
        );
        setCompletedPickups(procurementWithCharge);
   
        const deliveriesWithCharge = await Promise.all(
          completedDeliveries.map(async (delivery) => {
            const charge = await fetchDeliveryCharge(delivery.oid);
            return { ...delivery, charge };
          })
        );
        setCompletedDeliveries(deliveriesWithCharge);
      } catch (err) {
        setError(err.message || 'Failed to load activity logs');
        setCompletedPickups([]);
        setCompletedDeliveries([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCompletedTasks();
  }, []);

  const fetchDeliveryCharge = async (orderId) => {
    try {
      const response = await fetch(`${baseurl}/api/delivery/get-delivery/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch delivery details');
      const data = await response.json();

      return data.data.charges || data.charge || data.price || 0;
    } catch (err) {
      return 0;
    }
  };


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
          <img src={velaanLogo} alt="Velaan Logo" style={{ height: '50px' }} />
          <Box display="flex" alignItems="center" gap={1.5}>
            <IconButton 
              onClick={() => navigate('/driver-notifications')}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <Badge badgeContent={notificationCount} color="error">
                <Notifications sx={{ fontSize: 26 }} />
              </Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold', width: 40, height: 40 }} src={driverProfileImage || undefined}>
              {!driverProfileImage && (driverName?.[0] || 'D')}
            </Avatar>
          </Box>
        </Box>
      </Box>

      <Container sx={{ px: 2 }}>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{completedDeliveries.length}</Typography>
                <Typography variant="body2" color="text.secondary">Deliveries Completed</Typography>
                <LocalShipping color="action" />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{completedPickups.length}</Typography>
                <Typography variant="body2" color="text.secondary">Pickups Completed</Typography>
                <ShoppingCart color="action" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Tabs
          value={tab}
          onChange={(e, newValue) => setTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Pickups" />
          <Tab label="Deliveries" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="success" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {tab === 0 && (
              <Box>
                {completedPickups.length === 0 ? (
                  <Typography align="center" color="text.secondary">No completed pickups.</Typography>
                ) : (
                  completedPickups.map((pickup, idx) => (
                    <Card key={idx} sx={{ mb: 2 }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* <Avatar
                          variant="rounded"
                          src="https://via.placeholder.com/60"
                          sx={{ width: 56, height: 56, mr: 2 }}
                        /> */}
                        <Box flex={1}>
                          <Typography variant="subtitle1">Order {pickup.oid}</Typography>
                          <Typography variant="body2" color="text.secondary">{pickup.address}</Typography>
                          <Typography variant="caption">Completed at {pickup.time}</Typography>
                          {pickup.charge > 0 && (
                            <Typography variant="body2" color="primary">
                              Delivery Charge: ₹{pickup.charge}
                            </Typography>
                          )}
                        </Box>
                        <Chip label={pickup.status} size="small" color="success" />
                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>
            )}

            {tab === 1 && (
              <Box>
                {completedDeliveries.length === 0 ? (
                  <Typography align="center" color="text.secondary">No completed deliveries.</Typography>
                ) : (
                  completedDeliveries.map((delivery, idx) => (
                    <Card key={idx} sx={{ mb: 2 }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* <Avatar
                          variant="rounded"
                          src="https://via.placeholder.com/60"
                          sx={{ width: 56, height: 56, mr: 2 }}
                        /> */}
                        <Box flex={1}>
                          <Typography variant="subtitle1">Order {delivery.oid}</Typography>
                          <Typography variant="body2" color="text.secondary">{delivery.address}</Typography>
                          <Typography variant="caption">Delivered at {delivery.time}</Typography>
                          {delivery.charge > 0 && (
                            <Typography variant="body2" color="primary">
                              Delivery Charge: ₹{delivery.charge}
                            </Typography>
                          )}
                        </Box>
                        <Chip label={delivery.status ==='Delivered' ? 'Completed' : 'Completed'} size="small" color="success" />
                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>
            )}
          </>
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