import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Grid, Paper, IconButton, Avatar, Snackbar, Alert, Badge } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import Header from '../Header';
import Footer from '../Footer';
import { useAuth } from '../App';
import baseurl from '../baseurl/ApiService';
import { useNavigate } from 'react-router-dom';

const ProfileEdit = () => {
  const { user } = useAuth();
  const customerId = user?.uid || user?.id;
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: '',
    address: '',
    institution_name: '',
    institution_type: '',
    city: '',
    state: '',
    postal_code: '',
    // Add profile image state if needed
    profileImage: null,
    profileImageUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Placeholder for fetching profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!customerId) return;
      setLoading(true);
      try {
        const authToken = localStorage.getItem('token');
        const response = await fetch(`${baseurl}/api/customer-profile/${customerId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch profile');
        const responseData = await response.json();
        // console.log('Fetched responseData:', responseData);
        
        // Check if responseData.data exists and is an object before accessing
        if (responseData && responseData.data) {
          // console.log('Accessing data from responseData.data:', responseData.data);
          const data = responseData.data;
          // Map API response keys to state keys
          setProfileData(prev => ({
            ...prev,
            contact_person_name: data.contact_person_name || '',
            contact_person_email: data.contact_person_email || '',
            contact_person_phone: data.contact_person_phone || '',
            address: data.address || '',
            institution_name: data.institution_name || '',
            institution_type: data.institution_type || '',
            city: data.city || '',
            state: data.state || '',
            postal_code: data.postal_code || '',
            // Add mapping for profile_image if needed, assuming API provides a URL
            profileImageUrl: data.User && data.User.profile_image ? `${baseurl}/uploads/profile_images/${data.User.profile_image}` : '', // Use baseurl and profile_image path
          }));
        } else {
            console.error('Fetched data is not in the expected format or data property is missing:', responseData);
            setError('Failed to load profile data: Invalid response format.');
            setSnackbarMessage('Failed to load profile data: Invalid response format.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
      } catch (err) {
        setError('Failed to load profile data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [customerId]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileData({ ...profileData, profileImage: file, profileImageUrl: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSnackbarOpen(false); // Close previous snackbar

    // console.log('Profile data before sending:', profileData); // Log state before creating FormData

    const formData = new FormData();

    // Append fields if they are not empty strings or null
    // Mapping state keys to API keys based on the customer profile structure
    if (profileData.contact_person_name) formData.append('contact_person_name', profileData.contact_person_name);
    if (profileData.contact_person_email) formData.append('contact_person_email', profileData.contact_person_email);
    if (profileData.contact_person_phone) formData.append('contact_person_phone', profileData.contact_person_phone);
    if (profileData.address) formData.append('address', profileData.address);
    if (profileData.institution_name) formData.append('institution_name', profileData.institution_name);
    if (profileData.institution_type) formData.append('institution_type', profileData.institution_type);
    if (profileData.city) formData.append('city', profileData.city);
    if (profileData.state) formData.append('state', profileData.state);
    if (profileData.postal_code) formData.append('postal_code', profileData.postal_code);
    
    // Append profile image if selected (check if file object exists)
    if (profileData.profileImage instanceof File) {
        formData.append('profile_image', profileData.profileImage); // Assuming API expects 'profile_image'
    }

    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/customer-profile/update/${customerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save profile');
      }

      // Handle success
      const result = await response.json();
      // console.log('Profile updated successfully:', result);
      setError(''); // Clear any previous errors on success
      setSnackbarMessage('Profile updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      // Navigate back to profile page after a short delay
      setTimeout(() => {
        navigate('/Profile');
      }, 2000); // Navigate after 2 seconds

    } catch (err) {
      setError(err.message || 'Failed to save profile data.');
      console.error(err);
      setSnackbarMessage(err.message || 'Failed to save profile data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 10, bgcolor: '#f8f8fb', minHeight: '100vh' }}>
      <Header title="Edit Profile" />
      <Container sx={{ mt: 3 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom>Edit Profile</Typography>

          {/* Profile Picture Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  sx={{ bgcolor: 'rgba(0, 0, 0, 0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' } }}
                >
                  <input hidden accept="image/*" type="file" onChange={handleImageChange} />
                  <PhotoCamera />
                </IconButton>
              }
            >
              <Avatar
                sx={{ width: 100, height: 100, bgcolor: '#a8dfc1' }}
                src={profileData.profileImageUrl || ''}
              >
                {/* Default avatar content if no image */}
                {profileData.contact_person_name ? profileData.contact_person_name.charAt(0).toUpperCase() : 'S'}
              </Avatar>
            </Badge>
            <Typography variant="subtitle1" mt={1}>Upload Profile Picture</Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Contact Person Information */}
            <Typography variant="h6" gutterBottom sx={{ mt: 2, color: '#00B074' }}>Contact Person Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contact Person Name *"
                  name="contact_person_name"
                  value={profileData.contact_person_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address *"
                  name="contact_person_email"
                  value={profileData.contact_person_email}
                  onChange={handleChange}
                  required
                  type="email"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number *"
                  name="contact_person_phone"
                  value={profileData.contact_person_phone}
                  onChange={handleChange}
                  required
                  type="tel"
                />
              </Grid>
            </Grid>

            {/* Address Details */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4, color: '#00B074' }}>Address Details</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address *"
                  name="address"
                  value={profileData.address}
                  onChange={handleChange}
                  required
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Institute Name *"
                  name="institution_name"
                  value={profileData.institution_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Institute Type *"
                  name="institution_type"
                  value={profileData.institution_type}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City *"
                  name="city"
                  value={profileData.city}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="State/Province *"
                  name="state"
                  value={profileData.state}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Zip Code *"
                  name="postal_code"
                  value={profileData.postal_code}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>

            {/* Error display */}
            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}

            {/* Save Button */}
            <Box sx={{ mt: 4, textAlign: 'right' }}>
              <Button type="submit" variant="contained" color="success" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
      <Footer />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileEdit; 