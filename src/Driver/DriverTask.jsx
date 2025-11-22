import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, TextField, Button, Grid, Card, CardContent, IconButton, Tab, Tabs, Badge, CircularProgress, Alert, Modal, Divider, Chip, Paper, BottomNavigation, Avatar } from '@mui/material';
import { FilterList, Phone, LocationOn, Person, ShoppingCart, Close, Schedule, LocalShipping } from '@mui/icons-material';
import { Notifications, Dashboard, Assignment, Person as PersonIcon, ListAlt } from '@mui/icons-material';
import DriverFooter from '../driverfooter';
import baseurl from '../baseurl/ApiService';
import velaanLogo from '../assets/velaanLogo.png';

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
  const [notificationCount, setNotificationCount] = useState(0);
  const [driverName, setDriverName] = useState('Driver');
  const [driverProfileImage, setDriverProfileImage] = useState('');

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
  
  // Products state
  const [products, setProducts] = useState({});

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

  // Fetch products and create a mapping
  const fetchProducts = async () => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/product/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch products');
        return {};
      }
      
      const data = await response.json();
      // console.log('Products data:', data);
      
      // Create a mapping of product_id to product_name
      const productMap = {};
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach(product => {
          productMap[product.pid || product.id] = product.product_name;
        });
      }
      
      return productMap;
    } catch (error) {
      console.error('Error fetching products:', error);
      return {};
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

      // Fetch products mapping
      const productMap = await fetchProducts();
      setProducts(productMap);

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
            // Add product map for easy lookup
            productMap: productMap
          };

          console.log('Transformed procurement pickup:', transformedPickup);
          console.log('Procurement items:', order.items);
          return transformedPickup;
        })
      );

      // Fetch all order items once
      const orderItemsData = await fetchOrderItems();

      // Transform regular pickups with order items
      const transformedPickups = pickupOrders.map(order => {
        // Find order items for this specific order
        let orderItems = [];
        if (orderItemsData && orderItemsData.data && Array.isArray(orderItemsData.data)) {
          orderItems = orderItemsData.data.filter(item => 
            String(item.order_id) === String(order.oid)
          );
        }

        return {
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
          // Add order items information
          order_items: orderItems,
          order_id: order.oid || order.order_id,
          // Add product map for easy lookup
          productMap: productMap
        };
      });
      // console.log('All order items fetched:', orderItemsData);

      // Transform regular deliveries with order items
      const transformedDeliveries = deliveryOrders.map((order) => {
        // Find order items for this specific order
        let orderItems = [];
        if (orderItemsData && orderItemsData.data && Array.isArray(orderItemsData.data)) {
          orderItems = orderItemsData.data.filter(item => 
            String(item.order_id) === String(order.oid)
          );
          // console.log(`Order items for order ${order.oid}:`, orderItems);
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
          // Add product map for easy lookup
          productMap: productMap
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
    // eslint-disable-next-line
  }, []);

  // Detail modal handlers
  const handleOpenDetailModal = (item, type) => {
    console.log('Opening detail modal for:', item);
    console.log('Item type:', type);
    console.log('Is procurement:', item.procurement);
    console.log('Items:', item.items);
    console.log('Raw items:', item.raw_items);
    console.log('Order items:', item.order_items);
    console.log('Product map:', item.productMap);
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
    
    // For procurement pickups, use items directly
    if (selectedItem?.procurement && selectedItem.items) {
      console.log('Using procurement items:', selectedItem.items);
      const itemsToParse = selectedItem.items;
      
      // If items is a string, try to parse it
      if (typeof itemsToParse === 'string') {
        try {
          const parsed = JSON.parse(itemsToParse);
          if (Array.isArray(parsed)) {
            return parsed.map(item => ({
              product_id: item.product_id,
              product_name: selectedItem.productMap[item.product_id] || `Product ${item.product_id}`,
              quantity: item.quantity || 1,
              unit_price: item.unit_price || item.price || 0
            }));
          }
        } catch (e) {
          console.log('Failed to parse procurement items JSON');
        }
      }
      
      // If items is already an array
      if (Array.isArray(itemsToParse)) {
        return itemsToParse.map(item => ({
          product_id: item.product_id,
          product_name: selectedItem.productMap[item.product_id] || `Product ${item.product_id}`,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || item.price || 0
        }));
      }
    }
    
    // Try to use order_items first if available (for regular pickups and deliveries)
    if (selectedItem?.order_items && selectedItem.order_items.length > 0) {
      console.log('Using order_items:', selectedItem.order_items);
      
      return selectedItem.order_items.map(item => ({
        product_id: item.product_id || item.Product?.pid || item.Product?.id,
        product_name: item.Product?.product_name || item.Product?.name || item.name || selectedItem.productMap[item.product_id || item.Product?.pid || item.Product?.id] || `Product ${item.product_id}`,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || item.price || 0
      }));
    }
    
    // Try to use raw_items if available (for better data preservation)
    const itemsToParse = selectedItem?.raw_items || items;
    
    console.log('Parsing items:', itemsToParse);
    console.log('Selected item:', selectedItem);
    
    // If items is a string, try to parse it
    if (typeof itemsToParse === 'string') {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(itemsToParse);
        // console.log('Parsed JSON items:', parsed);
        
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            product_id: item.product_id,
            product_name: selectedItem.productMap[item.product_id] || `Product ${item.product_id}`,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || item.price || 0
          }));
        } else if (typeof parsed === 'object') {
          return [{
            product_id: parsed.product_id,
            product_name: selectedItem.productMap[parsed.product_id] || `Product ${parsed.product_id}`,
            quantity: parsed.quantity || 1,
            unit_price: parsed.unit_price || parsed.price || 0
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
        product_id: item.product_id,
        product_name: selectedItem.productMap[item.product_id] || `Product ${item.product_id}`,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || item.price || 0
      }));
    }
    
    // If items is an object
    if (typeof itemsToParse === 'object' && itemsToParse !== null) {
      return [{
        product_id: itemsToParse.product_id,
        product_name: selectedItem.productMap[itemsToParse.product_id] || `Product ${itemsToParse.product_id}`,
        quantity: itemsToParse.quantity || 1,
        unit_price: itemsToParse.unit_price || itemsToParse.price || 0
      }];
    }
    
    // console.log('No items found or unrecognized format');
    return [];
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

  // Helper functions for button actions
  const handlePickupButtonClick = (e, pickup) => {
    e.stopPropagation();
    const status = pickup.status ? pickup.status.toLowerCase().trim() : '';
    
    if ((status === 'pending' || pickup.status === 'Waiting for Approval') && pickup.procurement) {
      handleStartPickup(pickup);
    } else if (status === 'approved' && pickup.procurement) {
      handleOpenPickupModal(pickup);
    }
  };

  const handleDeliveryButtonClick = (e, delivery) => {
    e.stopPropagation();
    
    if (delivery.status === 'Out for Delivery') {
      handleOpenModal(delivery);
    } else if (delivery.status !== 'Delivered' && delivery.status !== 'Completed') {
      handleStartDelivery(delivery);
    }
  };

  const getPickupButtonText = (pickup) => {
    const status = pickup.status ? pickup.status.toLowerCase().trim() : '';
    
    if (status === 'pending' || pickup.status === 'Waiting for Approval') {
      return '🚀 Start Pickup';
    } else if (status === 'approved') {
      return '✅ Mark as Picked';
    } else {
      return '✓ Picked';
    }
  };

  const getDeliveryButtonText = (delivery) => {
    if (delivery.status === 'Out for Delivery') {
      return '🚚 Mark as Delivered';
    } else if (delivery.status === 'Delivered' || delivery.status === 'Completed') {
      return '✓ Delivered';
    } else {
      return '🚀 Start Delivery';
    }
  };

  const getPickupButtonStyle = (pickup) => {
    const status = pickup.status ? pickup.status.toLowerCase().trim() : '';
    
    if (status === 'picked') {
      return {
        background: 'linear-gradient(90deg, #ff9800, #f57c00)',
        boxShadow: '0 4px 12px rgba(245, 124, 0, 0.3)',
        '&:hover': { 
          boxShadow: '0 6px 16px rgba(245, 124, 0, 0.4)', 
          transform: 'translateY(-1px)' 
        },
        '&:disabled': { 
          background: '#e0e0e0', 
          color: '#9e9e9e' 
        }
      };
    } else {
      return {
        background: 'linear-gradient(90deg, #00A84F, #004D26)',
        boxShadow: '0 4px 12px rgba(0, 168, 79, 0.3)',
        '&:hover': { 
          boxShadow: '0 6px 16px rgba(0, 168, 79, 0.4)', 
          transform: 'translateY(-1px)' 
        },
        '&:disabled': { 
          background: '#e0e0e0', 
          color: '#9e9e9e' 
        }
      };
    }
  };

  const getDeliveryButtonStyle = (delivery) => {
    if (delivery.status === 'Out for Delivery') {
      return {
        background: 'linear-gradient(90deg, #ff9800, #f57c00)',
        boxShadow: '0 4px 12px rgba(245, 124, 0, 0.3)',
        '&:hover': { 
          boxShadow: '0 6px 16px rgba(245, 124, 0, 0.4)', 
          transform: 'translateY(-1px)' 
        },
        '&:disabled': { 
          background: '#e0e0e0', 
          color: '#9e9e9e' 
        }
      };
    } else if (delivery.status === 'Delivered' || delivery.status === 'Completed') {
      return {
        background: 'linear-gradient(90deg, #66BB6A, #43A047)',
        boxShadow: '0 4px 12px rgba(102, 187, 106, 0.3)',
        '&:hover': { 
          boxShadow: '0 6px 16px rgba(102, 187, 106, 0.4)', 
          transform: 'translateY(-1px)' 
        },
        '&:disabled': { 
          background: '#e0e0e0', 
          color: '#9e9e9e' 
        }
      };
    } else {
      return {
        background: 'linear-gradient(90deg, #2196F3, #1565C0)',
        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
        '&:hover': { 
          boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)', 
          transform: 'translateY(-1px)' 
        },
        '&:disabled': { 
          background: '#e0e0e0', 
          color: '#9e9e9e' 
        }
      };
    }
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 10, pt: 14 }}>
      {/* Detail View Modal */}
      <Modal open={detailModalOpen} onClose={handleCloseDetailModal}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', borderRadius: 4, minWidth: 400, maxWidth: 600, maxHeight: '85vh', overflow: 'hidden'
        }}>
          <Box sx={{ background: itemType === 'pickup' ? 'linear-gradient(135deg, #00A84F, #004D26)' : 'linear-gradient(135deg, #2196F3, #1565C0)', color: 'white', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {itemType === 'pickup' ? '📦 Pickup Details' : '🚚 Delivery Details'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>Order #{selectedItem?.oid}</Typography>
            </Box>
            <IconButton onClick={handleCloseDetailModal} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
              <Close />
            </IconButton>
          </Box>
          
          <Box sx={{ p: 3, maxHeight: 'calc(85vh - 100px)', overflow: 'auto' }}>
          {selectedItem && (
            <>
              <Box mb={3} display="flex" gap={1}>
                <Chip 
                  label={itemType === 'pickup' ? 'PICKUP' : 'DELIVERY'}
                  sx={{ bgcolor: itemType === 'pickup' ? '#dcfce7' : '#e3f2fd', color: itemType === 'pickup' ? '#00A84F' : '#2196F3', fontWeight: 700, fontSize: 11 }}
                />
                <Chip 
                  label={selectedItem.status}
                  sx={{ bgcolor: selectedItem.status === 'Completed' || selectedItem.status === 'Delivered' ? '#e8f5e9' : '#fff3e0', color: selectedItem.status === 'Completed' || selectedItem.status === 'Delivered' ? '#43a047' : '#f57c00', fontWeight: 600 }}
                />
              </Box>

              <Grid container spacing={2.5}>
                {/* Contact Information */}
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Box sx={{ bgcolor: itemType === 'pickup' ? '#dcfce7' : '#e3f2fd', p: 1, borderRadius: 2 }}>
                          <Person sx={{ color: itemType === 'pickup' ? '#00A84F' : '#2196F3', fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {itemType === 'pickup' && selectedItem.procurement ? 'Vendor Information' : 'Customer Information'}
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="600" mb={1}>
                        {itemType === 'pickup' && selectedItem.procurement 
                          ? (selectedItem.vendor_name || 'Unknown Vendor')
                          : (selectedItem.customer_name || 'Unknown Customer')}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Phone sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" color="text.secondary">
                          {itemType === 'pickup' && selectedItem.procurement 
                            ? (selectedItem.vendor_phone || 'Phone not provided')
                            : (selectedItem.customer_phone || 'Phone not provided')}
                        </Typography>
                      </Box>
                      {((itemType === 'pickup' && selectedItem.procurement && selectedItem.vendor_email) || (itemType !== 'pickup' && selectedItem.customer_email)) && (
                        <Typography variant="body2" color="text.secondary">
                          {itemType === 'pickup' && selectedItem.procurement ? selectedItem.vendor_email : selectedItem.customer_email}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Address Information */}
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <Box sx={{ bgcolor: '#fef3c7', p: 1, borderRadius: 2 }}>
                          <LocationOn sx={{ color: '#f59e0b', fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold">Address</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatAddress(selectedItem)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Products Information */}
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Box sx={{ bgcolor: '#dbeafe', p: 1, borderRadius: 2 }}>
                          <ShoppingCart sx={{ color: '#3b82f6', fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold">Products</Typography>
                      </Box>
                      {(() => {
                        const parsedItems = parseItems(selectedItem.items);
                        console.log('Parsed items result:', parsedItems);
                        return parsedItems.length > 0 ? (
                          parsedItems.map((item, index) => (
                            <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                              <Typography variant="body2" fontWeight="600" mb={0.5}>
                                {item.product_name || `Product ${index + 1}`}
                              </Typography>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  Qty: {item.quantity || 1} kg {item.unit_price > 0 && `× ₹${item.unit_price}/kg`}
                                </Typography>
                                {item.quantity && item.unit_price && (
                                  <Typography variant="body2" color="success.main" fontWeight="bold">
                                    ₹{(item.quantity * item.unit_price).toFixed(2)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          ))
                        ) : (
                          <Box>
                            <Typography variant="body2" color="text.secondary" mb={2}>No product details available</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>Raw data: {JSON.stringify(selectedItem.items)}</Typography>
                          </Box>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Order Information */}
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" mb={2}>Order Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Order Date</Typography>
                          <Typography variant="body2" fontWeight="600">
                            {selectedItem.order_date || selectedItem.order_details?.order_date || 'Not specified'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            {itemType === 'pickup' ? 'Pickup Time' : 'Delivery Time'}
                          </Typography>
                          <Typography variant="body2" fontWeight="600">
                            {selectedItem.time || selectedItem.delivery_time || selectedItem.order_details?.delivery_time || 'Not specified'}
                          </Typography>
                        </Grid>
                        {selectedItem.total_amount > 0 && (
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" fontWeight="600">Total Amount</Typography>
                              <Typography variant="h6" fontWeight="bold" color="success.main">
                                ₹{selectedItem.total_amount || selectedItem.order_details?.total_amount || 0}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Notes */}
                {selectedItem.notes && (
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: '#fef9c3', border: '1px solid #fde047', boxShadow: 'none' }}>
                      <CardContent>
                        <Typography variant="subtitle2" fontWeight="bold" mb={1}>📝 Notes</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedItem.notes}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </>
          )}
          </Box>
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

      <Box sx={{ bgcolor: '#fff', px: 2 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} variant="fullWidth">
          <Tab label="Pickups" />
          <Tab label="Deliveries" />
        </Tabs>
      </Box>

      <Container sx={{ mt: 2, px: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="success" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        ) : (
          <>
            {tabIndex === 0 && (
              pickups.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '2px dashed #e0e0e0', bgcolor: '#fafafa' }}>
                  <LocalShipping sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" fontWeight="500">No pickups assigned</Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>Check back later for new tasks.</Typography>
                </Card>
              ) : (
                pickups.map((pickup, index) => (
                  <Card key={index} sx={{ mb: 2, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' } }}>
                    <Box display="flex">
                      <Box sx={{ width: 6, background: 'linear-gradient(180deg, #00A84F, #004D26)' }} />
                      <CardContent sx={{ flex: 1, p: 2.5 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ bgcolor: '#dcfce7', color: '#00A84F', px: 1.5, py: 0.5, borderRadius: 2, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>PICKUP</Box>
                            <Typography variant="subtitle2" fontWeight="bold" color="text.primary">#{pickup.oid || pickup.order_id}</Typography>
                          </Box>
                          <Box sx={{ bgcolor: pickup.status === 'Picked' ? '#fff3e0' : '#f3e5f5', color: pickup.status === 'Picked' ? '#f57c00' : '#7b1fa2', px: 1.5, py: 0.5, borderRadius: 2, fontSize: 11, fontWeight: 600 }}>
                            {pickup.status === 'Picked' ? 'Completed' : 'Ready'}
                          </Box>
                        </Box>
                        <Typography variant="body1" fontWeight="600" mb={0.5}>{pickup.CustomerProfile?.institution_name || pickup.location || 'Unknown Location'}</Typography>
                        <Typography variant="body2" color="text.secondary" mb={0.5} sx={{ fontSize: 13 }}>{formatAddress(pickup)}</Typography>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}><Schedule sx={{ fontSize: 14 }} />{pickup.time || pickup.delivery_time || 'Time not set'}</Typography>
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
                            ...getPickupButtonStyle(pickup)
                          }} 
                          onClick={(e) => handlePickupButtonClick(e, pickup)}
                          disabled={pickup.status && pickup.status.toLowerCase().trim() === 'picked'}
                        >
                          {getPickupButtonText(pickup)}
                        </Button>
                        <Button variant="text" fullWidth sx={{ mt: 1, textTransform: 'none', fontSize: 13 }} onClick={() => handleOpenDetailModal(pickup, 'pickup')}>View Details</Button>
                      </CardContent>
                    </Box>
                  </Card>
                ))
              )
            )}
            {tabIndex === 1 && (
              deliveries.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '2px dashed #e0e0e0', bgcolor: '#fafafa' }}>
                  <LocalShipping sx={{ fontSize: 64, color: '#bdbdbd', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" fontWeight="500">No deliveries assigned</Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>Check back later for new tasks.</Typography>
                </Card>
              ) : (
                deliveries.map((delivery, index) => (
                  <Card key={index} sx={{ mb: 2, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0', transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' } }}>
                    <Box display="flex">
                      <Box sx={{ width: 6, background: 'linear-gradient(180deg, #2196F3, #1565C0)' }} />
                      <CardContent sx={{ flex: 1, p: 2.5 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ bgcolor: '#e3f2fd', color: '#2196F3', px: 1.5, py: 0.5, borderRadius: 2, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>DELIVERY</Box>
                            <Typography variant="subtitle2" fontWeight="bold" color="text.primary">#{delivery.oid || delivery.order_id}</Typography>
                          </Box>
                          <Box sx={{ bgcolor: delivery.status === 'Out for Delivery' ? '#fff3e0' : delivery.status === 'Delivered' || delivery.status === 'Completed' ? '#e8f5e9' : '#f3e5f5', color: delivery.status === 'Out for Delivery' ? '#f57c00' : delivery.status === 'Delivered' || delivery.status === 'Completed' ? '#43a047' : '#7b1fa2', px: 1.5, py: 0.5, borderRadius: 2, fontSize: 11, fontWeight: 600 }}>
                            {delivery.status === 'Out for Delivery' ? 'In Progress' : delivery.status === 'Delivered' || delivery.status === 'Completed' ? 'Completed' : 'Ready'}
                          </Box>
                        </Box>
                        <Typography variant="body1" fontWeight="600" mb={0.5}>{delivery.CustomerProfile?.institution_name || delivery.location || 'Unknown Location'}</Typography>
                        <Typography variant="body2" color="text.secondary" mb={0.5} sx={{ fontSize: 13 }}>{formatAddress(delivery)}</Typography>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}><Schedule sx={{ fontSize: 14 }} />{delivery.time || delivery.delivery_time || 'Time not set'}</Typography>
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
                            ...getDeliveryButtonStyle(delivery)
                          }} 
                          onClick={(e) => handleDeliveryButtonClick(e, delivery)}
                          disabled={delivery.status === 'Delivered' || delivery.status === 'Completed'}
                        >
                          {getDeliveryButtonText(delivery)}
                        </Button>
                        <Button variant="text" fullWidth sx={{ mt: 1, textTransform: 'none', fontSize: 13 }} onClick={() => handleOpenDetailModal(delivery, 'delivery')}>View Details</Button>
                      </CardContent>
                    </Box>
                  </Card>
                ))
              )
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