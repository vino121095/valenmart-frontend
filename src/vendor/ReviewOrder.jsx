import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Chip,
  Paper,
  BottomNavigation,
  Container,
  IconButton,
  Badge
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate, useLocation } from 'react-router-dom';
import VendorFooter from '../vendorfooter';
import baseurl from '../baseurl/ApiService';

const ReviewOrder = () => {
  const { state } = useLocation();
  const order = state?.order;
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);

  const itemsList = order?.items?.split(',') || [];
  const pricesList = order?.prices || [];

  // Dynamic price logic: default ₹40 if no price
  const subtotal = itemsList.reduce((total, item, index) => {
    const price = pricesList[index] ?? 40;
    return total + price;
  }, 0);

  const deliveryFee = subtotal > 0 ? 0.1 * subtotal : 0; // 10%
  const tax = subtotal > 0 ? 0.05 * subtotal : 0; // 5%
  const total = subtotal + deliveryFee + tax;

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
    fetchNotifications();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  // Safeguard values
  const orderId = order?.procurement_id || 'Unknown';
  const orderDate = order?.order_date
    ? new Date(order.order_date).toLocaleString()
    : 'N/A';
  const status = order?.status || 'Pending';
  const unit = order?.unit || 0;

  return (
    <Box sx={{ bgcolor: '#F4F4F6', minHeight: '100vh', pb: 7 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: '#00A86B',
          color: '#fff',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <IconButton
          sx={{
            backgroundColor: '#FFFFFF4D',
            color: 'white',
            borderRadius: '50%',
            p: 1
          }}
          aria-label="Go back"
          onClick={handleBack}
        >
          <ArrowBackIcon sx={{ fontSize: 28 }} />
        </IconButton>

        <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
          Review Order #{orderId}
        </Typography>
        <IconButton
          onClick={() => navigate('/vendor-notifications')}
          sx={{
            backgroundColor: '#FFFFFF4D',
            color: 'white'
          }}
        >
          <Badge badgeContent={notificationCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Box>

      <Container sx={{ pt: 2 }}>
        {/* Order Info */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography fontWeight="bold">Order Information</Typography>
              <Chip
                label={status}
                size="small"
                sx={{ bgcolor: '#FFF3E0', color: '#FF9800' }}
              />
            </Box>
            <Typography fontSize={14} mt={1}>
              Requested: {orderDate}
            </Typography>
            <Typography fontSize={14}>
              {unit} Unit(s) | {status}
            </Typography>
          </CardContent>
        </Card>

        {/* Items */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography fontWeight="bold" gutterBottom>
              Items
            </Typography>
            {itemsList.length > 0 ? (
              itemsList.map((item, index) => (
                <Box key={index} display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography>{item.trim()}</Typography>
                  <Typography>
                    ₹{pricesList[index] ?? 40}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography>No items found.</Typography>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography fontWeight="bold" gutterBottom>
              Order Summary
            </Typography>

            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography>Subtotal</Typography>
              <Typography>₹{subtotal.toFixed(2)}</Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography>Delivery Fee (10%)</Typography>
              <Typography>₹{deliveryFee.toFixed(2)}</Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Taxes (5%)</Typography>
              <Typography>₹{tax.toFixed(2)}</Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography fontWeight="bold">Total</Typography>
              <Typography fontWeight="bold">₹{total.toFixed(2)}</Typography>
            </Box>

            <Box sx={{ backgroundColor: '#f9f9f9', p: 2, borderRadius: 2 }}>
              <Typography fontWeight="bold" gutterBottom>
                Delivery Notes
              </Typography>
              <Typography fontSize={14} color="text.secondary">
                Kindly handle the load with care.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box display="flex" justifyContent="space-between" mt={2} gap={2}>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#E0E0E0',
              color: '#424242',
              flex: 1
            }}
          >
            Decline
          </Button>
          <Button
            onClick={() => navigate('/OrderApproved')}
            variant="contained"
            sx={{
              bgcolor: '#00A86B',
              color: '#fff',
              flex: 1
            }}
          >
            Approve
          </Button>
        </Box>
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
          <VendorFooter />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default ReviewOrder;
