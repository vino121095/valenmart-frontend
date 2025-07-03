import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Box, Button, Card, CardContent, Container, Grid, IconButton, Typography, Tabs, Tab, Avatar, Chip, CircularProgress, Alert } from '@mui/material';
import { ArrowBack, FilterList, LocalShipping, ShoppingCart } from '@mui/icons-material';
import { Notifications, Dashboard, Assignment, Person, ListAlt } from '@mui/icons-material';
import DriverFooter from '../driverfooter';
import baseurl from '../baseurl/ApiService';

export default function DriverLog() {
  const location = useLocation();

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

  useEffect(() => {
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
        console.log('Assigned Orders:', assignedOrders);

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
          address: `${order.address || 'Address not available'}, ${order.city || ''}`,
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
          address: `${order.vendor_address || order.address || 'Address not available'}, ${order.vendor_city || order.city || ''}`,
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
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 7 }}>
      <Box sx={{ bgcolor: '#2bb673', color: 'white', p: 2 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item display="flex" alignItems="center">
            <IconButton color="inherit">
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" ml={1}>Activity Logs</Typography>
          </Grid>
          <IconButton color="inherit">
            <FilterList />
          </IconButton>
        </Grid>
      </Box>

      <Container sx={{ mt: 2 }}>
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
      <DriverFooter />
    </Box>
  );
}