import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Badge,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Avatar
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import baseurl from '../baseurl/ApiService';
import velaanLogo from '../assets/velaanLogo.png';

const VendorNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount]= useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vendorName, setVendorName] = useState('Vendor');

  useEffect(() => {
    // Fetch vendor name (copy from Vdashboard)
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const vendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
    const token = localStorage.getItem('token');
    if (vendorId && token) {
      fetch(`/api/vendor/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const apiName = data.full_name || data.org_name || data.company || data.name || data.vendor_name || 'Vendor';
          setVendorName(apiName);
        })
        .catch((err) => {
          console.error('Error fetching vendor name:', err);
          setVendorName('Vendor');
        });
    } else {
      setVendorName('Vendor');
    }
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const authToken = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const vendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
        if (!vendorId) {
          setError('Vendor not authenticated');
          setLoading(false);
          return;
        }
        const response = await fetch(`${baseurl}/api/vendor-notification/all/${vendorId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        if (data && data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setNotificationCount(data.notifications.filter(n => n.is_read === false).length);
        } else {
          setNotifications([]);
          setNotificationCount(0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
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

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'order':
        return <AssignmentIcon sx={{ color: '#16a34a' }} />;
      case 'shipping':
        return <ShippingIcon sx={{ color: '#3b82f6' }} />;
      case 'payment':
        return <PaymentIcon sx={{ color: '#16a34a' }} />;
      default:
        return <NotificationsIcon sx={{ color: '#f59e0b' }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f8fafc' }}>
        <CircularProgress size={40} sx={{ color: '#16a34a' }} />
        <Typography variant="body1" sx={{ mt: 2, color: '#64748b' }}>
          Loading notifications...
        </Typography>
      </Box>
    );
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
            >
              <Badge 
                badgeContent={notificationCount} 
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: '#dc2626',
                    color: 'white'
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold', width: 40, height: 40 }}>
              {vendorName?.[0] || 'V'}
            </Avatar>
          </Box>
        </Box>
      </Box>
      <Box sx={{ px: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
        )}
        {!loading && notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, p: 4, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <NotificationsIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>No notifications</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>You don't have any notifications yet.</Typography>
          </Box>
        ) : (
          notifications.map((notification, index) => (
            <Card
              key={notification.nid || index}
              elevation={0}
              sx={{ 
                mb: 2, 
                borderRadius: 3, 
                border: '1px solid #e2e8f0',
                bgcolor: notification.is_read ? 'white' : '#f0fdf4',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
              }}
              onClick={() => !notification.is_read && markNotificationAsRead(notification.nid)}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ 
                    bgcolor: '#dcfce7', 
                    borderRadius: 2, 
                    p: 1.5, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    {getNotificationIcon(notification.Order?.status)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1e293b' }}>
                        Order #{notification.Order?.order_id || notification.Order?.procurement_id}
                      </Typography>
                      {!notification.is_read && (
                        <Chip 
                          label="New" 
                          size="small" 
                          sx={{ 
                            bgcolor: '#16a34a', 
                            color: 'white', 
                            fontSize: '0.7rem',
                            height: 20,
                            fontWeight: 600
                          }} 
                        />
                      )}
                    </Box>
                    <Chip 
                      label={notification.Order?.status || 'New Order'} 
                      size="small" 
                      sx={{ 
                        bgcolor: '#e2e8f0', 
                        color: '#475569', 
                        fontSize: '0.7rem',
                        height: 22,
                        mb: 1
                      }} 
                    />
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
};

export default VendorNotifications; 