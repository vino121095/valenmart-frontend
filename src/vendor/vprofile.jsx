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
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import { useNavigate } from 'react-router-dom';
import VendorFooter from '../vendorfooter';
import { useAuth } from '../App';
import baseurl from '../baseurl/ApiService';
import velaanLogo from '../assets/velaanLogo.png';

const VProfile = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [navIndex, setNavIndex] = useState(4); // Profile tab selected by default
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [vendorInfo, setVendorInfo] = useState({ contact_person: '', email: '' });
  const [notificationCount, setNotificationCount] = useState(0);

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
    <Box sx={{ pb: 10, pt: 14, bgcolor: '#f8fafc', minHeight: '100vh' }}>
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
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              onClick={handleBack}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box component="img" src={velaanLogo} alt="Velaan Logo" sx={{ height: 50 }} />
          </Box>
          <Box display="flex" alignItems="center" gap={1.5}>
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
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 40, height: 40, fontSize: 18, fontWeight: 'bold' }}>
              {vendorInfo.contact_person ? vendorInfo.contact_person.charAt(0).toUpperCase() : 'V'}
            </Avatar>
          </Box>
        </Box>
      </Box>

      {/* Profile Info */}
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'white',
            py: 4,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            mb: 3
          }}
        >
          <Avatar sx={{ bgcolor: '#dcfce7', color: '#16a34a', width: 80, height: 80, fontSize: 32, fontWeight: 'bold' }}>
            {vendorInfo.contact_person ? vendorInfo.contact_person.charAt(0).toUpperCase() : 'V'}
          </Avatar>
          <Typography variant="h6" mt={2} fontWeight="bold" sx={{ color: '#1e293b' }}>
            {vendorInfo.contact_person || 'Vendor Name'}
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            {vendorInfo.email || 'vendor@email.com'}
          </Typography>
        </Box>
      </Container>

      {/* Settings Section */}
      <Container maxWidth="sm">
        <Typography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#1e293b', px: 0.5 }}>
          Settings
        </Typography>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <List disablePadding>
            <ListItem 
              button 
              onClick={() => navigate('/VendorProfileEdit')}
              sx={{
                py: 2,
                '&:hover': { bgcolor: '#f8fafc' }
              }}
            >
              <ListItemText
                primary="Organization Details"
                secondary="Manage organization details and address"
                primaryTypographyProps={{ fontWeight: 600, color: '#1e293b' }}
                secondaryTypographyProps={{ fontSize: 13 }}
              />
            </ListItem>
            <Divider />
            <ListItem 
              button 
              onClick={() => navigate('/vendor-notifications')}
              sx={{
                py: 2,
                '&:hover': { bgcolor: '#f8fafc' }
              }}
            >
              <ListItemText 
                primary="Notifications" 
                secondary="View your notifications"
                primaryTypographyProps={{ fontWeight: 600, color: '#1e293b' }}
                secondaryTypographyProps={{ fontSize: 13 }}
              />
            </ListItem>
          </List>
        </Paper>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button 
            variant="outlined"
            fullWidth
            sx={{ 
              color: '#dc2626',
              borderColor: '#dc2626',
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { 
                borderColor: '#b91c1c',
                bgcolor: '#fee2e2'
              }
            }}
            onClick={handleSignOutClick}
          >
            Sign Out
          </Button>
        </Box>
      </Container>

      {/* Sign Out Confirmation Dialog */}
      <Dialog
        open={signOutDialogOpen}
        onClose={handleSignOutCancel}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          Sign Out
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleSignOutCancel}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              color: '#64748b'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSignOutConfirm}
            variant="contained"
            sx={{
              bgcolor: '#dc2626',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#b91c1c' }
            }}
          >
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