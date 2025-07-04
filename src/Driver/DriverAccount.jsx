import React, { useState } from 'react';
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
  // BottomNavigation, BottomNavigationAction, Paper 
} from '@mui/material';
import { Notifications, Dashboard, Assignment, Person, ListAlt } from '@mui/icons-material';
import DriverFooter from '../driverfooter';

import {
  ArrowBack,
  FilterList,
  LocalShipping,
  ShoppingCart
} from '@mui/icons-material';

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    setOpenLogoutDialog(false);
    navigate('/login', { replace: true });
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
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 7 }}>
      <Box sx={{ bgcolor: '#2bb673', color: 'white', p: 2 }}>
        <Grid container alignItems="center">
          <IconButton color="inherit" onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" ml={1}>Account Settings</Typography>
        </Grid>
      </Box>

      <Container sx={{ mt: 3 }}>
        <Box textAlign="center" mb={3}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: '#d4edda', color: '#2e7d32', fontSize: 32, mx: 'auto' }}>S</Avatar>
          <Typography variant="h6" mt={1}>John</Typography>
          <Typography variant="body2" color="text.secondary">john@example.com</Typography>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="subtitle2" sx={{ color: '#2e7d32', mb: 2 }}>SETTINGS</Typography>
            <Box mb={2} sx={{ cursor: 'pointer' }} onClick={() => navigate('/driver-profile/edit')}>
              <Typography variant="subtitle1">Personal Details</Typography>
              <Typography variant="body2" color="text.secondary">Manage Personal Details and Address</Typography>
            </Box>
            <Divider />
            <Box my={2}>
              <Typography variant="subtitle1">Login Credentials</Typography>
              <Typography variant="body2" color="text.secondary">Update Login Credentials</Typography>
            </Box>
            <Divider />
            <Box my={2} sx={{ cursor: 'pointer' }} onClick={() => navigate('/driver-notifications')}>
              <Typography variant="subtitle1">Notifications</Typography>
              <Typography variant="body2" color="text.secondary">View your notifications</Typography>
            </Box>
            <Divider />
            <Box my={2} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Dark Mode</Typography>
              <Switch color="default" />
            </Box>
            <Box my={2} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Availability Status</Typography>
              <Switch color="primary" />
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

      <DriverFooter />

    </Box>
  );
}
