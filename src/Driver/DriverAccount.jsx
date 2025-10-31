import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Switch,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge
  // BottomNavigation, BottomNavigationAction, Paper 
} from '@mui/material';
import { Notifications, Dashboard, Assignment, Person, ListAlt, ArrowBack, LocalShipping, ShoppingCart } from '@mui/icons-material';
import DriverFooter from '../driverfooter';

import baseurl from '../baseurl/ApiService';

const activityData = {
  deliveriesCompleted: 16,
  pickupsCompleted: 8,
  pickups: [
    {
      orderId: '#1234',
      address: '123 Main St, Apt 4B',
      time: '10:30 AM',
      status: 'Completed',
    },
    {
      orderId: '#1235',
      address: '456 Oak Avenue',
      time: '11:15 AM',
      status: 'Completed',
    },
    {
      orderId: '#1236',
      address: '789 Maple Drive',
      time: '12:45 PM',
      status: 'Completed',
    },
  ],
};

export default function DriverAccount() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [driverInfo, setDriverInfo] = useState({ name: '', email: '', profileImage: '', initials: '' });
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
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
        if (!response.ok) return;
        const data = await response.json();
        const driverData = data.data || data;
        const firstName = driverData.first_name || driverData.name || '';
        const lastName = driverData.last_name || '';
        const fullName = lastName ? `${firstName} ${lastName}` : firstName;
        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        const profileImage = driverData.driver_image ? `${baseurl}/${driverData.driver_image}` : (driverData.avatar || '');
        setDriverInfo({
          name: fullName,
          email: driverData.email || '',
          profileImage,
          initials
        });
      } catch (e) {}
    };
    fetchDriverDetails();
  }, []);

  const handleLogout = async () => {
    try {
      const userData = localStorage.getItem('userData');
      const parsedData = userData ? JSON.parse(userData) : {};
      const driverId = localStorage.getItem('driver_id') || parsedData.did || parsedData.id;
      const authToken = localStorage.getItem('token');
      
      if (driverId && authToken) {
        await fetch(`${baseurl}/api/driver-details/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            login_log_id: parsedData.login_log_id || null
          })
        });
      }
    } catch (e) {
      console.error('Error logging out:', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      localStorage.removeItem('userData');
      localStorage.removeItem('userRole');
      localStorage.removeItem('driver_id');
      setOpenLogoutDialog(false);
      window.location.replace('/login');
    }
  };

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
  };

  const handleCloseLogoutDialog = () => {
    setOpenLogoutDialog(false);
  };

  const pathToValue = {
    '/DriverDash': 0,
    '/DriverTask': 1,
    '/DriverLog': 2,
    '/DriverAccount': 3,
  };

  const value = pathToValue[location.pathname] ?? 0;
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
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              onClick={() => navigate(-1)}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="h6" fontWeight="bold">
              Account Settings
            </Typography>
          </Box>
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
        </Box>
      </Box>

      <Container sx={{ mt: 3 }}>
        <Box textAlign="center" mb={3}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: '#d4edda', color: '#2e7d32', fontSize: 32, mx: 'auto' }} src={driverInfo.profileImage || undefined}>
            {!driverInfo.profileImage && driverInfo.initials}
          </Avatar>
          <Typography variant="h6" mt={1}>{driverInfo.name}</Typography>
          <Typography variant="body2" color="text.secondary">{driverInfo.email}</Typography>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ color: '#2e7d32', mb: 2 }}>SETTINGS</Typography>
            <Box mb={2} sx={{ cursor: 'pointer' }} onClick={() => navigate('/driver-profile/edit')}>
              <Typography variant="subtitle1">Personal Details</Typography>
              <Typography variant="body2" color="text.secondary">Manage Personal Details and Address</Typography>
            </Box>
            <Box mt={3}>
              <Typography 
                variant="subtitle1" 
                color="error" 
                onClick={handleLogoutClick}
                sx={{ cursor: 'pointer' }}
              >
                Sign Out
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Dialog
        open={openLogoutDialog}
        onClose={handleCloseLogoutDialog}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to logout?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLogoutDialog}>Cancel</Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bottom Navigation */}
      <Box
        component="div"
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}
      >
        <DriverFooter />
      </Box>

    </Box>
  );
}