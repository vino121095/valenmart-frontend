import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  BottomNavigation,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Switch,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import VendorFooter from '../vendorfooter';
import { useAuth } from '../App';
import baseurl from '../baseurl/ApiService';

const VProfile = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [navIndex, setNavIndex] = useState(4); // Profile tab selected by default
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [vendorInfo, setVendorInfo] = useState({ contact_person: '', email: '' });

  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // Get vendor id from localStorage or userData
    let vendorId = null;
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    vendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
    if (!vendorId) {
      setVendorInfo({ contact_person: '', email: '' });
      return;
    }
    fetch(`${baseurl}/api/vendor/${vendorId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        // Support both object and array response
        const vendor = Array.isArray(data.data) ? data.data[0] : data.data;
        const contact_person = vendor?.contact_person || userData.contact_person || '';
        const email = vendor?.email || userData.email || '';
        setVendorInfo({ contact_person, email });
      })
      .catch(() => {
        setVendorInfo({
          contact_person: userData.contact_person || '',
          email: userData.email || ''
        });
      });
  }, []);

  const handleBottomNavChange = (event, newValue) => {
    setNavIndex(newValue);
    // Add navigation logic here if needed
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  const handleSignOutClick = () => {
    setSignOutDialogOpen(true);
  };

  const handleSignOutConfirm = () => {
    logout();
    setSignOutDialogOpen(false);
    navigate('/login');
  };

  const handleSignOutCancel = () => {
    setSignOutDialogOpen(false);
  };

  return (
    <Box sx={{ pb: 10, bgcolor: '#f8f8fb', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        <IconButton onClick={handleBack}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 1 }}>
          Account Settings
        </Typography>
      </Box>

      {/* Profile Info */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: '#f2f2f7',
          py: 4,
        }}
      >
        {/* <Avatar sx={{ bgcolor: '#a8dfc1', width: 80, height: 80, fontSize: 40 }}>
          {vendorInfo.contact_person ? vendorInfo.contact_person.charAt(0).toUpperCase() : 'V'}
        </Avatar> */}
        <Typography variant="h6" mt={2}>
          {vendorInfo.contact_person || 'Vendor Name'}
        </Typography>
        <Typography color="text.secondary">
          {vendorInfo.email || 'vendor@email.com'}
        </Typography>
      </Box>

      {/* Settings Section */}
      <Container sx={{ mt: 2 }}>
        <Box
          sx={{
            bgcolor: '#d6f0e0',
            px: 2,
            py: 1,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" color="success.main">
            SETTINGS
          </Typography>
        </Box>

        <Paper sx={{ borderRadius: '0 0 12px 12px' }}>
          <List disablePadding>
            <ListItem button onClick={() => navigate('/VendorProfileEdit')}>
              <ListItemText
                primary="Organization Details"
                secondary="Manage organization details and address"
              />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemText
                primary="Login Credentials"
                secondary="Update login credentials"
              />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => navigate('/vendor-notifications')}>
              <ListItemText primary="Notifications" secondary="View your notifications" />
            </ListItem>
            <Divider />
            <ListItem
              secondaryAction={
                <Switch
                  edge="end"
                  color="success"
                  checked={notificationsEnabled}
                  onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                />
              }
            >
              <ListItemText primary="Notifications" />
            </ListItem>
            <Divider />
            <ListItem
              secondaryAction={
                <Switch
                  edge="end"
                  color="success"
                  checked={darkModeEnabled}
                  onChange={() => setDarkModeEnabled(!darkModeEnabled)}
                />
              }
            >
              <ListItemText primary="Dark Mode" />
            </ListItem>
          </List>

          <Divider />
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Button 
              variant="text" 
              sx={{ color: 'red' }}
              onClick={handleSignOutClick}
            >
              Sign Out
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Sign Out Confirmation Dialog */}
      <Dialog
        open={signOutDialogOpen}
        onClose={handleSignOutCancel}
        aria-labelledby="signout-dialog-title"
        aria-describedby="signout-dialog-description"
      >
        <DialogTitle id="signout-dialog-title">
          Sign Out
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="signout-dialog-description">
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSignOutCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSignOutConfirm} color="error" variant="contained">
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>

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
        <BottomNavigation
          showLabels
          sx={{ backgroundColor: '#f5f5f5' }}
          value={navIndex}
          onChange={handleBottomNavChange}
        >
          <VendorFooter />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default VProfile;
