import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Container, Typography, TextField, Button, Grid, Card, CardContent, IconButton, Tab, Tabs, Badge, CircularProgress, Alert, Modal } from '@mui/material';
import { ArrowBack, FilterList } from '@mui/icons-material';
import { Notifications, Dashboard, Assignment, Person, ListAlt } from '@mui/icons-material';
import DriverFooter from '../driverfooter';
import baseurl from '../baseurl/ApiService';

export default function DriverTask() {
  const location = useLocation();
  
  const pathToValue = {
    '/DriverDash': 0,
    '/DriverTask': 1,
    '/DriverLog': 2,
    '/DriverAccount': 3,
  };

  const value = pathToValue[location.pathname] ?? 0;

  const [tabIndex, setTabIndex] = useState(0);
  const [pickups, setPickups] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [deliveryImage, setDeliveryImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Pickup completion modal state
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [pickupImage, setPickupImage] = useState(null);
  const [pickupUploading, setPickupUploading] = useState(false);

  // Fetch and classify orders
  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const userData = localStorage.getItem('userData');
      const driverId = localStorage.getItem('driver_id') ||
        (userData ? JSON.parse(userData).id : null) ||
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

      // DEBUG: Log procurement data
      console.log('Procurement API Data:', procurementArray);

      // Filter for this driver (regular orders)
      const assignedOrders = ordersArray.filter(order =>
        String(order.driver_id) === String(driverId)
      );

      // Filter procurement pickups assigned to this driver and status 'Approved'
      const assignedProcurements = procurementArray.filter(order =>
        String(order.driver_id) === String(driverId) && 
        (order.status === 'Approved' || order.status === 'Waiting for Approval' || order.status === 'Picked')
      );

      // DEBUG: Log assigned procurements
      console.log('Assigned Procurements:', assignedProcurements);

      // Classify as pickups or deliveries (regular orders)
      const pickupOrders = assignedOrders.filter(order =>
        order.type === 'Pickup' ||
        order.status === 'pending'
      );
      const deliveryOrders = assignedOrders.filter(order =>
        order.type === 'Delivery' ||
        order.status === 'Out for Delivery' || order.status === 'Completed' || order.status === 'Waiting for Approval'
      );

      // Transform procurement pickups
      const transformedProcurements = assignedProcurements.map(order => ({
        procurement: true,
        oid: order.procurement_id || `#${Math.floor(Math.random() * 9000) + 1000}`,
        type: 'Pickup',
        location: order.vendor_name || order.vendor?.name || 'Vendor Location',
        address: `${order.vendor_address || order.address || 'Address not available'}, ${order.vendor_city || order.city || ''}`,
        time: order.pickup_time || order.expected_delivery_date || order.order_date || 'Time not set',
        status: order.status || 'Approved',
      }));

      // Transform regular pickups
      const transformedPickups = pickupOrders.map(order => ({
        procurement: false,
        oid: order.oid || order.order_id || `#${Math.floor(Math.random() * 9000) + 1000}`,
        type: 'Pickup',
        location: order.CustomerProfile?.institution_name || order.location || 'Unknown Location',
        address: `${order.address || 'Address not available'}, ${order.city || ''}`,
        time: order.time || order.delivery_time || 'Time not set',
        status: order.status || 'pending',
      }));

      // Transform regular deliveries
      const transformedDeliveries = deliveryOrders.map(order => ({
        oid: order.oid || order.order_id || `#${Math.floor(Math.random() * 9000) + 1000}`,
        type: 'Delivery',
        location: order.CustomerProfile?.institution_name || order.location || 'Unknown Location',
        address: `${order.address || 'Address not available'}, ${order.city || ''}`,
        time: order.time || order.delivery_time || 'Time not set',
        status: order.status || 'pending',
      }));

      // Combine pickups (regular + procurement)
      setPickups([...transformedPickups, ...transformedProcurements]);
      setDeliveries(transformedDeliveries);
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
      setPickups([]);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  // Modal handlers
  const handleOpenModal = (delivery) => {
    setSelectedDelivery(delivery);
    setModalOpen(true);
    setDeliveryImage(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDelivery(null);
    setDeliveryImage(null);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDeliveryImage(e.target.files[0]);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedDelivery) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('status', 'Delivered');
      if (deliveryImage) {
        formData.append('delivery_image', deliveryImage);
      }
      console.log(selectedDelivery)
      const response = await fetch(`${baseurl}/api/delivery/mark-delivered/${selectedDelivery.oid || selectedDelivery.order_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to update status');
      const data = await response.json();

      // Update the deliveries state with the new delivery info
      setDeliveries(prev =>
        prev.map(del =>
          (del.oid || del.order_id) === (selectedDelivery.oid || selectedDelivery.order_id)
            ? { ...del, status: data.delivery.status, delivery_image: data.delivery.delivery_image }
            : del
        )
      );

      // Refetch orders (optional, can be removed if not needed)
      // await fetchOrders();
      setModalOpen(false);
      setSelectedDelivery(null);
      setDeliveryImage(null);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUploading(false);
    }
  };

  const handleStartDelivery = async (delivery) => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/order/update/${delivery.oid}`, {
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

  // Handler to mark procurement pickup as Picked
  const handleStartPickup = async (pickup) => {
    if (!pickup.procurement) return; // Only for procurement pickups
    try {
      const response = await fetch(`${baseurl}/api/procurement/update/${pickup.oid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Approved' }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      // Refresh the list
      fetchOrders();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Pickup completion modal handlers
  const handleOpenPickupModal = (pickup) => {
    setSelectedPickup(pickup);
    setPickupModalOpen(true);
    setPickupImage(null);
  };

  const handleClosePickupModal = () => {
    setPickupModalOpen(false);
    setSelectedPickup(null);
    setPickupImage(null);
  };

  const handlePickupImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPickupImage(e.target.files[0]);
    }
  };

  const handlePickupCompletion = async () => {
    if (!selectedPickup) return;
    setPickupUploading(true);
    try {
      const formData = new FormData();
      formData.append('status', 'Picked');
      if (pickupImage) {
        formData.append('delivery_image', pickupImage);
      }
      const response = await fetch(`${baseurl}/api/delivery/mark-delivered/${selectedPickup.oid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to update status');
      
      // Update the pickups state with the new status
      setPickups(prev =>
        prev.map(pickup =>
          pickup.oid === selectedPickup.oid
            ? { ...pickup, status: 'Completed' }
            : pickup
        )
      );

      setPickupModalOpen(false);
      setSelectedPickup(null);
      setPickupImage(null);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setPickupUploading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 7 }}>
      {/* Modal for status update */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2, minWidth: 300
        }}>
          <Typography variant="h6" mb={2}>Mark as Delivered</Typography>
          <Typography variant="body2" mb={2}>
            Upload proof of delivery and confirm status update.
          </Typography>
          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
          >
            {deliveryImage ? "Image Selected" : "Upload Image"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
          </Button>
          {deliveryImage && (
            <Box mb={2}>
              <img
                src={URL.createObjectURL(deliveryImage)}
                alt="Proof"
                style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }}
              />
            </Box>
          )}
          <Button
            variant="contained"
            color="success"
            fullWidth
            onClick={handleStatusUpdate}
            disabled={uploading}
          >
            {uploading ? "Updating..." : "Mark as Delivered"}
          </Button>
          <Button
            variant="text"
            color="secondary"
            fullWidth
            onClick={handleCloseModal}
            sx={{ mt: 1 }}
          >
            Cancel
          </Button>
        </Box>
      </Modal>

      {/* Modal for pickup completion */}
      <Modal open={pickupModalOpen} onClose={handleClosePickupModal}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2, minWidth: 300
        }}>
          <Typography variant="h6" mb={2}>Mark as Received</Typography>
          <Typography variant="body2" mb={2}>
            Upload proof of pickup and confirm status update.
          </Typography>
          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
          >
            {pickupImage ? "Image Selected" : "Upload Image"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handlePickupImageChange}
            />
          </Button>
          {pickupImage && (
            <Box mb={2}>
              <img
                src={URL.createObjectURL(pickupImage)}
                alt="Proof"
                style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }}
              />
            </Box>
          )}
          <Button
            variant="contained"
            color="success"
            fullWidth
            onClick={handlePickupCompletion}
            disabled={pickupUploading}
          >
            {pickupUploading ? "Updating..." : "Mark as Received"}
          </Button>
          <Button
            variant="text"
            color="secondary"
            fullWidth
            onClick={handleClosePickupModal}
            sx={{ mt: 1 }}
          >
            Cancel
          </Button>
        </Box>
      </Modal>
      <Box sx={{ bgcolor: '#2bb673', color: 'white', p: 2 }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <IconButton color="inherit">
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" ml={1}>Task Management</Typography>
          <IconButton color="inherit">
            <Badge color="error" variant="dot">
              <FilterList />
            </Badge>
          </IconButton>
        </Grid>
      </Box>

      <Box sx={{ bgcolor: '#fff', px: 2 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} variant="fullWidth">
          <Tab label="Pickups" />
          <Tab label="Deliveries" />
        </Tabs>
      </Box>

      <Container sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="success" />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {tabIndex === 0 && (
              pickups.length === 0 ? (
                <Typography>No pickups assigned.</Typography>
              ) : (
                pickups.map((pickup, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">
                          Pickup {pickup.oid || pickup.order_id}
                        </Typography>
                        <Typography variant="body2" color="green">
                          {pickup.time || pickup.delivery_time || 'Time not set'}
                        </Typography>
                      </Grid>
                      <Typography variant="body2">{pickup.CustomerProfile?.institution_name || pickup.location || 'Unknown Location'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pickup.address || 'Address not available'}, {pickup.city || ''}
                      </Typography>
                      <Typography variant="body2">
                        {pickup.CustomerProfile?.deliveryNo ? `Delivery No: ${pickup.CustomerProfile.deliveryNo}` : ''}
                      </Typography>
                      <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor:
                              pickup.status && (pickup.status.toLowerCase().trim() === 'pending' || pickup.status === 'Waiting for Approval')
                                ? 'green'
                                : pickup.status && pickup.status.toLowerCase().trim() === 'picked'
                                ? 'orange'
                                : 'grey',
                            color: 'white'
                          }}
                          onClick={() => {
                            if ((pickup.status && (pickup.status.toLowerCase().trim() === 'pending' || pickup.status === 'Waiting for Approval')) && pickup.procurement) {
                              handleStartPickup(pickup);
                            } else if (pickup.status && pickup.status.toLowerCase().trim() === 'approved' && pickup.procurement) {
                              handleOpenPickupModal(pickup);
                            }
                          }}
                          disabled={pickup.status && pickup.status.toLowerCase().trim() === 'picked'}
                        >
                          {(pickup.status && (pickup.status.toLowerCase().trim() === 'pending' || pickup.status === 'Waiting for Approval'))
                            ? 'Start Pickup'
                            : pickup.status && pickup.status.toLowerCase().trim() === 'approved'
                            ? 'Mark as Picked'
                            : pickup.status && pickup.status.toLowerCase().trim() === 'picked'
                            ? 'Picked'
                            : 'Picked'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )
            )}
            {tabIndex === 1 && (
              deliveries.length === 0 ? (
                <Typography>No deliveries assigned.</Typography>
              ) : (
                deliveries.map((delivery, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">
                          Delivery {delivery.oid || delivery.order_id}
                        </Typography>
                        <Typography variant="body2" color="blue">
                          {delivery.time || delivery.delivery_time || 'Time not set'}
                        </Typography>
                      </Grid>
                      <Typography variant="body2">
                        {delivery.CustomerProfile?.institution_name || delivery.location || 'Unknown Location'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {delivery.address || 'Address not available'}, {delivery.city || ''}
                      </Typography>
                      <Typography variant="body2">
                        {delivery.CustomerProfile?.deliveryNo ? `Delivery No: ${delivery.CustomerProfile.deliveryNo}` : ''}
                      </Typography>
                      <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                        {delivery.status === 'Out for Delivery' ? (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ bgcolor: 'orange', color: 'white' }}
                            onClick={() => handleOpenModal(delivery)}
                          >
                            Out for Delivery
                          </Button>
                        ) : delivery.status === 'Completed' ? (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ bgcolor: 'blue', color: 'white' }}
                          >
                            Delivered
                          </Button>
                        ) : delivery.status === 'Delivered' ? (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ bgcolor: 'green', color: 'white' }}
                          >
                            Delivered
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ bgcolor: 'blue', color: 'white' }}
                            onClick={() => handleStartDelivery(delivery)}
                          >
                            Start Delivery
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )
            )}
          </>
        )}
      </Container>
      <DriverFooter />
    </Box>
  );
}