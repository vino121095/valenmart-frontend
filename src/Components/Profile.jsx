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
  DialogActions,
  DialogContentText,
  CircularProgress,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';
import { useAuth } from '../App';
import baseurl from '../baseurl/ApiService';

const Profile = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [navIndex, setNavIndex] = useState(4); // Profile tab selected by default
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileDetails, setProfileDetails] = useState(null);

  // State for Reset Password Dialog
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');

  // State for Snackbar feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const navigate = useNavigate();
  const { user } = useAuth();
  const customerId = user?.uid || user?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!customerId) {
        setProfileLoading(false);
        setProfileError('User not authenticated or customer ID not available.');
        return;
      }
      setProfileLoading(true);
      setProfileError('');
      try {
        const authToken = localStorage.getItem('token');
        const response = await fetch(`${baseurl}/api/customer-profile/${customerId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch profile details');
        const responseData = await response.json();
        // console.log('Fetched profile data for Profile page:', responseData);

        // Check if responseData.data exists and is an object before accessing
        if (responseData && responseData.data) {
          const data = responseData.data;
          setProfileDetails({
            ...data,
            profileImageUrl: data.User.profile_image ? `${baseurl}/uploads/profile_images/${data.User.profile_image}` : '',
            // Assuming contact_person_name and contact_person_email are available directly in data.data
          });
        } else {
          console.error('Fetched data for Profile page is not in the expected format:', responseData);
          setProfileError('Failed to load profile details: Invalid response format.');
        }

      } catch (err) {
        setProfileError(err.message || 'Failed to load profile details.');
        console.error(err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [customerId]);

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
    // Clear all user data
    localStorage.clear();
    sessionStorage.clear();
    
    setSignOutDialogOpen(false);
    window.location.href = '/login';
    
    // console.log('User signed out successfully');
};

  const handleSignOutCancel = () => {
    setSignOutDialogOpen(false);
  };

  const handleOrganizationDetailsClick = () => {
    navigate('/profile/edit'); // Navigate to the new profile edit page
  };

  // Handle Reset Password dialog open/close
  const handleResetPasswordClick = () => {
    setResetPasswordDialogOpen(true);
    setResetPasswordError(''); // Clear previous errors
    setResetPasswordSuccess(''); // Clear previous success messages
  };

  const handleResetPasswordClose = () => {
    setResetPasswordDialogOpen(false);
    setResetPasswordError('');
    setResetPasswordSuccess('');
  };

  // Handle Reset Password submit (calling forgot-password API)
  const handleResetPasswordSubmit = async () => {
    setResetPasswordLoading(true);
    setResetPasswordError('');
    setResetPasswordSuccess('');

    try {
      // Use the email from profileDetails or user context if available
      const userEmail = profileDetails?.contact_person_email || user?.email;
      
      if (!userEmail) {
          setResetPasswordError('User email not available.');
          setResetPasswordLoading(false);
          return;
      }

      // console.log('Sending forgot password request for email:', userEmail); // Log the email being sent

      const response = await fetch(`${baseurl}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetPasswordSuccess(data.message || 'Password reset link sent to your email!');
        // Optionally close dialog after success
        // setTimeout(() => setResetPasswordDialogOpen(false), 2000);
      } else {
        setResetPasswordError(data.message || data.error || 'Failed to send password reset link.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setResetPasswordError('Network error. Please check your connection.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Handle Snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ pb: 10, bgcolor: '#f8f8fb', minHeight: '100vh' }}>
      <Header/>
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
        {profileLoading ? (
          <CircularProgress size={60} sx={{ color: '#a8dfc1' }} />
        ) : profileDetails ? (
          <>
            <Avatar sx={{ bgcolor: '#a8dfc1', width: 80, height: 80, fontSize: 40 }} src={profileDetails.profileImageUrl || ''}>
              {/* {profileDetails.institution_name ? profileDetails.institution_name.charAt(0).toUpperCase() : 'S'} */}
            </Avatar>
            <Typography variant="h6" mt={2}>
              {profileDetails.institution_name || 'SRM University'}
            </Typography>
            <Typography color="text.secondary">{profileDetails.contact_person_email || 'srmuniversity@example.com'}</Typography>
          </>
        ) : (
          <Typography color="error">{profileError || 'Profile details not available.'}</Typography>
        )}
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
            <ListItem button onClick={handleOrganizationDetailsClick}>
              <ListItemText
                primary="Organization Details"
                secondary="Manage organization details and address"
              />
            </ListItem>
            <Divider />
            <ListItem button onClick={handleResetPasswordClick}>
              <ListItemText
                primary="Login Credentials"
                secondary="Update login credentials"
              />
            </ListItem>
            <Divider />
            <ListItem button onClick={() => navigate('/OrderCard')}>
              <ListItemText
                primary="Purchase History"
                secondary="View your purchase history by product/date"
              />
            </ListItem>
            <Divider />
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

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onClose={handleResetPasswordClose}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Clicking 'Send Reset Link' will send a password reset link to your registered email address.
          </DialogContentText>
          {resetPasswordError && <Alert severity="error" sx={{ mt: 2 }}>{resetPasswordError}</Alert>}
          {resetPasswordSuccess && <Alert severity="success" sx={{ mt: 2 }}>{resetPasswordSuccess}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetPasswordClose} disabled={resetPasswordLoading}>Cancel</Button>
          <Button onClick={handleResetPasswordSubmit} disabled={resetPasswordLoading} variant="contained" color="primary">
             {resetPasswordLoading ? <CircularProgress size={20} /> : 'Send Reset Link'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* General Snackbar for other messages (optional) */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

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
          <Footer />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default Profile;