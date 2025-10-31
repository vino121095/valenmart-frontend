import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  BottomNavigation,
  Paper,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import { useLocation, useNavigate } from 'react-router-dom';
import VendorFooter from '../vendorfooter';
import { useState, useEffect } from 'react';
import baseurl from '../baseurl/ApiService';

const Confirmation = () => {
  const location = useLocation();
  const products = location.state?.products || [];
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();

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

  return (
    <Box bgcolor="#F4F4F6" minHeight="100vh" pb={10} pt={14}>
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
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              onClick={handleBack}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Typography variant="h6" fontWeight="bold">
              Confirmation
            </Typography>
          </Box>
          <IconButton
            onClick={() => navigate('/vendor-notifications')}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
            }}
          >
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Box>
      </Box>

      {/* Success Section */}
      <Box m={2} p={3} bgcolor="white" borderRadius={2} textAlign="center">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          width={72}
          height={72}
          bgcolor="#00A86B1A"
          borderRadius="50%"
          mx="auto"
          mt={2}
        >
          <CheckCircleIcon sx={{ fontSize: 48, color: '#00A86B' }} />
        </Box>
        <Typography variant="h6" fontWeight="bold" mt={2}>
          Product Submitted
        </Typography>
        <Typography color="text.secondary">
          Your product has been sent for admin approval
        </Typography>
      </Box>

      {/* Product Summary */}
      <Box mx={2} my={1} p={2} bgcolor="white" borderRadius={2}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          Product Summary
        </Typography>
        {products.map((product, index) => (
          <Box key={index} mb={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              {product.imageUrl || product.image ? (
                <Avatar
                  variant="rounded"
                  src={product.imageUrl || product.image}
                  alt={product.name}
                  sx={{ width: 60, height: 60 }}
                />
              ) : (
                <Avatar
                  variant="rounded"
                  sx={{ 
                    width: 60, 
                    height: 60,
                    bgcolor: '#dcfce7',
                    color: '#16a34a',
                    fontSize: 24,
                    fontWeight: 'bold'
                  }}
                >
                  {product.name?.charAt(0).toUpperCase()}
                </Avatar>
              )}
              <Box>
                <Typography fontWeight="bold">{product.name}</Typography>
                <Typography color="text.secondary" fontSize="14px">
                  Category: {product.category}
                </Typography>
                <Typography fontSize="14px">{product.stock} kg</Typography>
              </Box>
            </Stack>
            <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
              <Chip label="Pending" sx={{ bgcolor: '#FFF7E0', color: '#FFB300' }} />
              <Typography fontSize="13px" color="text.secondary">
                Expected response within 24 hours
              </Typography>
            </Box>
            <Box mt={1} display="flex" justifyContent="space-between">
              <Typography fontSize="13px" color="text.secondary">
                Request ID: #{Math.floor(100000 + Math.random() * 900000)}
              </Typography>
              <Typography fontSize="13px" color="#00A86B">
                Submitted: Just now
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
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

export default Confirmation;
