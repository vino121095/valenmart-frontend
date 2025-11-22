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
  Grid,
  Avatar,
  Paper,
  BottomNavigation
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import baseurl from '../baseurl/ApiService';
import DriverFooter from '../driverfooter';
import velaanLogo from '../assets/velaanLogo.png';

const DriverNotifications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialDriverInfo = (location.state && location.state.driverInfo) ? location.state.driverInfo : { name: 'Driver', initials: 'D' };
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [driverInfo, setDriverInfo] = useState(initialDriverInfo);
  const [driverProfileImage, setDriverProfileImage] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const authToken = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const driverId = userData.id || userData.did || localStorage.getItem('driver_id');
        if (!driverId) {
          setError('Driver not authenticated');
          setLoading(false);
          return;
        }
        const response = await fetch(`${baseurl}/api/driver-notification/all/${driverId}`, {
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
          const unreadCount = data.notifications.filter(n => !n.is_read).length;
          setNotificationCount(unreadCount);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Only fetch if not provided by state
    if (initialDriverInfo && initialDriverInfo.name !== 'Driver') return;
    // Fetch driver info for avatar and greeting (copy from DriverDashboard)
    const fetchDriverDetails = async () => {
      try {
        const userData = localStorage.getItem('userData');
        const parsedData = userData ? JSON.parse(userData) : {};
        const driverId = localStorage.getItem('driver_id') || parsedData.did || parsedData.id;
        if (!driverId) return;
        const authToken = localStorage.getItem('token');
        const response = await fetch(`${baseurl}/api/driver-details/${driverId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch driver details');
        const data = await response.json();
        const driverData = data.data || data;
        const firstName = driverData.first_name || driverData.name || 'Driver';
        const lastName = driverData.last_name || '';
        const fullName = lastName ? `${firstName} ${lastName}` : firstName;
        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        const profileImage = driverData.driver_image ? `${baseurl}/${driverData.driver_image}` : '';
        setDriverInfo({ name: fullName, initials });
        setDriverProfileImage(profileImage);
      } catch (error) {
        setDriverInfo({ name: 'Driver', initials: 'D' });
      }
    };
    fetchDriverDetails();
  }, [initialDriverInfo]);

  const markNotificationAsRead = async (notificationId) => {
    try {
      const authToken = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const driverId = userData.id || userData.did || localStorage.getItem('driver_id');
      await fetch(`${baseurl}/api/driver-notification/mark-read/${driverId}`, {
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
    } catch (error) {
      // ignore
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'order':
        return <AssignmentIcon sx={{ color: '#00B074' }} />;
      case 'shipping':
        return <ShippingIcon sx={{ color: '#2196F3' }} />;
      case 'payment':
        return <PaymentIcon sx={{ color: '#4CAF50' }} />;
      default:
        return <NotificationsIcon sx={{ color: '#FFA000' }} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'order':
        return '#E8F5E9';
      case 'shipping':
        return '#E3F2FD';
      case 'payment':
        return '#E8F5E9';
      default:
        return '#FFF3E0';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#fafafa' }}>
        <CircularProgress size={40} sx={{ color: '#00B074' }} />
        <Typography variant="body1" sx={{ mt: 2, color: '#666' }}>
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
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold', width: 40, height: 40 }} src={driverProfileImage || undefined}>
              {!driverProfileImage && driverInfo.initials}
            </Avatar>
          </Box>
        </Box>
      </Box>
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      )}
      <Box sx={{ p: 2 }}>
        {!loading && notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 6, p: 4, bgcolor: 'white', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>No notifications</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>You don't have any notifications yet.</Typography>
          </Box>
        ) : (
          notifications.map((notification, index) => (
            <Card
              key={notification.nid || index}
              sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', bgcolor: getNotificationColor(notification.Order?.status), cursor: 'pointer' }}
              onClick={() => !notification.is_read && markNotificationAsRead(notification.nid)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ bgcolor: 'white', borderRadius: '50%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getNotificationIcon(notification.Order?.status)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle1" fontWeight={600}>Order #{notification.Order?.order_id || notification.Order?.procurement_id}</Typography>
                      <Chip label={notification.Order?.status || 'New Order'} size="small" sx={{ bgcolor: 'white', color: '#666', fontSize: '0.75rem' }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{notification.message}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">{new Date(notification.createdAt).toLocaleString()}</Typography>
                      {!notification.is_read && (
                        <Chip label="New" size="small" color="primary" sx={{ fontSize: '0.75rem' }} />
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
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
};

export default DriverNotifications; 