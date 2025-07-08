import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, TextField, Button, Grid, Card, CardContent, IconButton, Tab, Tabs, Badge, CircularProgress, Alert, Modal, Divider, Chip } from '@mui/material';
import { ArrowBack, FilterList, Phone, LocationOn, Person, ShoppingCart, Close } from '@mui/icons-material';
import { Notifications, Dashboard, Assignment, Person as PersonIcon, ListAlt } from '@mui/icons-material';
import DriverFooter from '../driverfooter';
import baseurl from '../baseurl/ApiService';

export default function DriverTask() {
  const location = useLocation();
  const navigate = useNavigate();
  
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

  // Detail view modals
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemType, setItemType] = useState(''); // 'pickup' or 'delivery'

  // Fetch vendor details by ID
  const fetchVendorDetails = async (vendorId) => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/vendor/${vendorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch vendor details');
        return null;
      }
      
      const data = await response.json();
      // console.log('Vendor details:', data);
      return data;
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      return null;
    }
  };

  // Fetch order items details
  const fetchOrderItems = async () => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/order-items/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch order items');
        return null;
      }
      
      const data = await response.json();
      // console.log('Order items:', data);
      return data;
    } catch (error) {
      console.error('Error fetching order items:', error);
      return null;
    }
  };

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
      // console.log('Procurement API Data:', procurementArray);

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
      // console.log('Assigned Procurements:', assignedProcurements);

      // Classify as pickups or deliveries (regular orders)
      const pickupOrders = assignedOrders.filter(order =>
        order.type === 'Pickup' ||
        order.status === 'pending'
      );
      const deliveryOrders = assignedOrders.filter(order =>
        order.type === 'Delivery' ||
        order.status === 'Out for Delivery' || order.status === 'Completed' || order.status === 'Waiting for Approval'
      );

      // Transform procurement pickups with vendor details
      const transformedProcurements = await Promise.all(
        assignedProcurements.map(async (order) => {
          // Fetch vendor details if vendor_id is available
          let vendorDetails = null;
          if (order.vendor_id) {
            // console.log('Fetching vendor details for vendor_id:', order.vendor_id);
            vendorDetails = await fetchVendorDetails(order.vendor_id);
            // console.log('Vendor details fetched:', vendorDetails);
          } else {
            // console.log('No vendor_id found for order:', order.procurement_id);
          }

          const transformedPickup = {
            procurement: true,
            oid: order.procurement_id || `#${Math.floor(Math.random() * 9000) + 1000}`,
            type: 'Pickup',
            location: order.vendor_name || order.vendor?.name || vendorDetails?.contact_person || 'Vendor Location',
            address: `${order.vendor_address || order.vendor.address || vendorDetails?.address || 'Address not available'}, ${order.vendor_city || order.city || vendorDetails?.city || ''}`,
            time: order.pickup_time || order.expected_delivery_date || order.order_date || 'Time not set',
            status: order.status || 'Approved',
            // Add detailed information
            vendor_name: order.vendor_name || order.vendor?.name || vendorDetails?.data.contact_person || 'Unknown Vendor',
            vendor_address: order.vendor_address || order.vendor.address || vendorDetails?.data.address || 'Address not available',
            vendor_city: order.vendor_city || order.vendor.city || vendorDetails?.data.city || '',
            vendor_state: vendorDetails?.state || order.vendor.state || '',
            vendor_pincode: vendorDetails?.data.pincode || order.vendor.pincode || '',
            vendor_phone: order.vendor_phone || order.contact_phone || vendorDetails?.data.phone || 'Not provided',
            vendor_email: vendorDetails?.data.email || 'Not provided',
            vendor_id: order.vendor_id,
            items: order.items || [],
            notes: order.notes || '',
            order_date: order.order_date || '',
            expected_delivery_date: order.expected_delivery_date || '',
            total_amount: order.price || order.total_amount || 0,
            // Ensure items are properly formatted
            raw_items: order.items,
          };

          // console.log('Transformed procurement pickup:', transformedPickup);
          return transformedPickup;
        })
      );

      // Transform regular pickups
      const transformedPickups = pickupOrders.map(order => ({
        procurement: false,
        oid: order.oid || order.order_id || `#${Math.floor(Math.random() * 9000) + 1000}`,
        type: 'Pickup',
        location: order.CustomerProfile?.institution_name || order.location || 'Unknown Location',
        address: `${order.vendor.address || 'Address not available'}, ${order.city || ''}`,
        time: order.time || order.delivery_time || 'Time not set',
        status: order.status || 'pending',
        // Add detailed information
        customer_name: order.CustomerProfile?.contact_person_name || order.customer_name || 'Unknown Customer',
        customer_address: order.vendor.address || 'Address not available',
        customer_city: order.vendor.city || '',
        customer_phone: order.CustomerProfile?.contact_person_phone || order.contact_phone || 'Not provided',
        customer_email: order.CustomerProfile?.contact_person_email || order.email || 'Not provided',
        items: order.items || [],
        notes: order.notes || '',
        order_date: order.order_date || '',
        delivery_time: order.delivery_time || '',
        total_amount: order.total_amount || 0,
        // Ensure items are properly formatted
        raw_items: order.items,
      }));

      // Fetch all order items once
      const orderItemsData = await fetchOrderItems();
      // console.log('All order items fetched:', orderItemsData);

      // Transform regular deliveries with order items
      const transformedDeliveries = deliveryOrders.map((order) => {
        // Find order items for this specific order
        let orderItems = [];
        if (orderItemsData && orderItemsData.data && Array.isArray(orderItemsData.data)) {
          orderItems = orderItemsData.data.filter(item => 
            String(item.order_id) === String(order.oid || order.order_id)
          );
          // console.log(`Order items for order ${order.oid || order.order_id}:`, orderItems);
        }

        return {
          oid: order.oid || order.order_id || `#${Math.floor(Math.random() * 9000) + 1000}`,
          type: 'Delivery',
          location: order.CustomerProfile?.institution_name || order.location || 'Unknown Location',
          address: `${order.address || 'Address not available'}, ${order.city || ''}`,
          time: order.time || order.delivery_time || 'Time not set',
          status: order.status || 'pending',
          // Add detailed information
          customer_name: order.CustomerProfile?.contact_person_name || order.customer_name || 'Unknown Customer',
          customer_address: order.address || 'Address not available',
          customer_city: order.city || '',
          customer_state: order.state || '',
          customer_pincode: order.postal_code || order.pincode || '',
          customer_phone: order.CustomerProfile?.contact_person_phone || order.contact_phone || 'Not provided',
          customer_email: order.CustomerProfile?.contact_person_email || order.email || 'Not provided',
          items: order.items || [],
          notes: order.notes || '',
          order_date: order.order_date || '',
          delivery_time: order.delivery_time || '',
          total_amount: order.total_amount || 0,
          // Ensure items are properly formatted
          raw_items: order.items,
          // Add order items information
          order_items: orderItems,
          order_id: order.oid || order.order_id,
        };
      });

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

  // Detail modal handlers
  const handleOpenDetailModal = (item, type) => {
    // console.log('Opening detail modal for:', item);
    // console.log('Item type:', type);
    // console.log('Is procurement:', item.procurement);
    // console.log('Vendor details:', {
    //   vendor_name: item.vendor_name,
    //   vendor_phone: item.vendor_phone,
    //   vendor_address: item.vendor_address,
    //   vendor_city: item.vendor_city,
    //   vendor_id: item.vendor_id
    // });
    setSelectedItem(item);
    setItemType(type);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedItem(null);
    setItemType('');
  };

  // Parse items for display
  const parseItems = (items) => {
    if (!items) return [];
    
    // For deliveries, try to use order_items first if available
    if (itemType === 'delivery' && selectedItem?.order_items && selectedItem.order_items.length > 0) {
      // console.log('Using order_items for delivery:', selectedItem.order_items);
      
      return selectedItem.order_items.map(item => ({
        product_name: item.product_name || item.name || getProductName(item.product_id) || 'Unknown Product',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || item.price || 0,
        product_id: item.product_id
      }));
    }
    
    // Try to use raw_items if available (for better data preservation)
    const itemsToParse = selectedItem?.raw_items || items;
    
    // console.log('Parsing items:', itemsToParse);
    
    // If items is a string, try to parse it
    if (typeof itemsToParse === 'string') {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(itemsToParse);
        // console.log('Parsed JSON items:', parsed);
        
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            product_name: item.product_name || item.name || getProductName(item.product_id) || 'Unknown Product',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || item.price || 0,
            product_id: item.product_id
          }));
        } else if (typeof parsed === 'object') {
          return [{
            product_name: parsed.product_name || parsed.name || getProductName(parsed.product_id) || 'Unknown Product',
            quantity: parsed.quantity || 1,
            unit_price: parsed.unit_price || parsed.price || 0,
            product_id: parsed.product_id
          }];
        }
      } catch (e) {
        // console.log('Failed to parse JSON, treating as string:', itemsToParse);
        // If JSON parsing fails, treat as a simple string
        return [{
          product_name: itemsToParse,
          quantity: 1,
          unit_price: 0,
          product_id: null
        }];
      }
    }
    
    // If items is already an array
    if (Array.isArray(itemsToParse)) {
      return itemsToParse.map(item => ({
        product_name: item.product_name || item.name || getProductName(item.product_id) || 'Unknown Product',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || item.price || 0,
        product_id: item.product_id
      }));
    }
    
    // If items is an object
    if (typeof itemsToParse === 'object' && itemsToParse !== null) {
      return [{
        product_name: itemsToParse.product_name || itemsToParse.name || getProductName(itemsToParse.product_id) || 'Unknown Product',
        quantity: itemsToParse.quantity || 1,
        unit_price: itemsToParse.unit_price || itemsToParse.price || 0,
        product_id: itemsToParse.product_id
      }];
    }
    
    // console.log('No items found or unrecognized format');
    return [];
  };

  // Helper function to get product name from product ID
  const getProductName = (productId) => {
    if (!productId) return null;
    
    // You might want to fetch product names from an API or use a mapping
    const productMap = {
      1: 'Potatoes',
      2: 'Tomatoes', 
      3: 'Spinach',
      4: 'Onions',
      5: 'Carrots',
      6: 'Beans',
      7: 'Peas',
      8: 'Cabbage',
      9: 'Cauliflower',
      10: 'Brinjal'
      // Add more product mappings as needed
    };
    return productMap[productId] || `Product ${productId}`;
  };

  // Helper function to format address
  const formatAddress = (item) => {
    // console.log('Formatting address for item:', item);
    // console.log('Item type:', itemType);
    // console.log('Is procurement:', item?.procurement);
    
    if (item?.procurement) {
      // For procurement pickups, show vendor address
      const address = item.vendor_address || item.address || 'Address not available';
      const city = item.vendor_city || item.city || '';
      const state = item.vendor_state || item.state || '';
      const pincode = item.vendor_pincode || item.pincode || '';
      

      let formattedAddress = address;
      if (city) formattedAddress += `, ${city}`;
      if (state) formattedAddress += `, ${state}`;
      if (pincode) formattedAddress += ` - ${pincode}`;
      // console.log("DEBUG values:",  address, city, state, pincode );
      // console.log('Vendor address formatted:', formattedAddress);
      return formattedAddress;
    } else {
      // For regular pickups and deliveries, show customer address
      const address = item?.customer_address || item?.address || 'Address not available';
      const city = item?.customer_city || item?.city || '';
      const state = item?.customer_state || item?.state || '';
      const pincode = item?.customer_pincode || item?.postal_code || item?.pincode || '';
      
      let formattedAddress = address;
      if (city) formattedAddress += `, ${city}`;
      if (state) formattedAddress += `, ${state}`;
      if (pincode) formattedAddress += ` - ${pincode}`;
      
      // console.log('Customer address formatted:', formattedAddress);
      return formattedAddress;
    }
  };

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
      // console.log(selectedDelivery)
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
      {/* Detail View Modal */}
      <Modal open={detailModalOpen} onClose={handleCloseDetailModal}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2, minWidth: 400, maxWidth: 600, maxHeight: '80vh', overflow: 'auto'
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              {itemType === 'pickup' ? 'Pickup Details' : 'Delivery Details'}
            </Typography>
            <IconButton onClick={handleCloseDetailModal}>
              <Close />
            </IconButton>
          </Box>
          
          {selectedItem && (
            <>
              <Box mb={3}>
                <Chip 
                  label={`${itemType === 'pickup' ? 'Pickup' : 'Delivery'} #${selectedItem.oid}`}
                  color="primary"
                  sx={{ mb: 2 }}
                />
                <Chip 
                  label={selectedItem.status}
                  color={selectedItem.status === 'Completed' || selectedItem.status === 'Delivered' ? 'success' : 'warning'}
                  sx={{ ml: 1 }}
                />
              </Box>

              <Grid container spacing={3}>
                {/* Contact Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1} display="flex" alignItems="center">
                    <Person sx={{ mr: 1 }} />
                    {itemType === 'pickup' && selectedItem.procurement ? 'Vendor Information' : 'Customer Information'}
                  </Typography>
                  <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {itemType === 'pickup' && selectedItem.procurement 
                        ? (selectedItem.vendor_name || 'Unknown Vendor')
                        : (selectedItem.customer_name || 'Unknown Customer')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" mt={1}>
                      <Phone sx={{ mr: 1, fontSize: 16 }} />
                      {itemType === 'pickup' && selectedItem.procurement 
                        ? (selectedItem.vendor_phone || 'Phone not provided')
                        : (selectedItem.customer_phone || 'Phone not provided')}
                    </Typography>
                    {itemType === 'pickup' && selectedItem.procurement ? (
                      selectedItem.vendor_email && (
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          {selectedItem.vendor_email}
                        </Typography>
                      )
                    ) : (
                      selectedItem.customer_email && (
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          {selectedItem.customer_email}
                        </Typography>
                      )
                    )}
                  </Box>
                </Grid>

                {/* Address Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1} display="flex" alignItems="center">
                    <LocationOn sx={{ mr: 1 }} />
                    Address
                  </Typography>
                  <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2">
                      {formatAddress(selectedItem)}
                    </Typography>
                  </Box>
                </Grid>

                {/* Products Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1} display="flex" alignItems="center">
                    <ShoppingCart sx={{ mr: 1 }} />
                    Products
                  </Typography>
                  <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                    {parseItems(selectedItem.items).length > 0 ? (
                      parseItems(selectedItem.items).map((item, index) => (
                        <Box key={index} sx={{ mb: 1, pb: 1, borderBottom: index < parseItems(selectedItem.items).length - 1 ? '1px solid #ddd' : 'none' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {item.product_name || getProductName(item.product_id) || `Product ${index + 1}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Quantity: {item.quantity || 1} kg
                          </Typography>
                          {item.unit_price > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              Price: ₹{item.unit_price}/kg
                            </Typography>
                          )}
                          {item.quantity && item.unit_price && (
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                              Total: ₹{(item.quantity * item.unit_price).toFixed(2)}
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No product details available
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Order Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    Order Information
                  </Typography>
                  <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Order Date</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedItem.order_date || selectedItem.order_details?.order_date || 'Not specified'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          {itemType === 'pickup' ? 'Pickup Time' : 'Delivery Time'}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedItem.time || selectedItem.delivery_time || selectedItem.order_details?.delivery_time || 'Not specified'}
                        </Typography>
                      </Grid>
                      {selectedItem.total_amount > 0 && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            ₹{selectedItem.total_amount || selectedItem.order_details?.total_amount || 0}
                          </Typography>
                        </Grid>
                      )}
                      {selectedItem.order_id && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Order ID</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            #{selectedItem.order_id}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Grid>

                {/* Notes */}
                {selectedItem.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                      Notes
                    </Typography>
                    <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                      <Typography variant="body2">
                        {selectedItem.notes}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </Box>
      </Modal>

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
          <IconButton color="inherit" onClick={() => navigate(-1)}>
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
                  <Card key={index} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => handleOpenDetailModal(pickup, 'pickup')}>
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
                        {formatAddress(pickup)}
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
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent modal from opening
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
                  <Card key={index} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => handleOpenDetailModal(delivery, 'delivery')}>
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
                        {formatAddress(delivery)}
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
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent modal from opening
                              handleOpenModal(delivery);
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent modal from opening
                              handleStartDelivery(delivery);
                            }}
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