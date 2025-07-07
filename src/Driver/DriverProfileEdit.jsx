import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  IconButton,
  Avatar,
  Snackbar,
  Alert,
  Badge,
  MenuItem
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import baseurl from '../baseurl/ApiService';
import Header from '../Header';
import DriverFooter from '../driverfooter';

const statusOptions = ['Available', 'Busy', 'Inactive'];

const DriverProfileEdit = () => {
  const navigate = useNavigate();
  const [driverId, setDriverId] = useState('');
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    emergency_phone: '',
    date_of_birth: '',
    vehicle_type: '',
    vehicle_number: '',
    vehicle: '',
    license_number: '',
    license_expiry_date: '',
    id_proof: '',
    state: '',
    country: '',
    status: '',
    profileImage: null,
    profileImageUrl: '',
    id_proofFile: null,
    id_proofUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Get driver ID from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    const parsed = userData ? JSON.parse(userData) : {};
    const id = parsed.did || parsed.id;
    setDriverId(id);
  }, []);

  // Fetch driver profile
  const fetchProfile = async () => {
    if (!driverId) return;
    setLoading(true);
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/driver-details/${driverId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const responseData = await response.json();
      const data = responseData.data || responseData;

      // Helper to format date strings to YYYY-MM-DD
      const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
      };

      setProfileData(prev => ({
        ...prev,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        emergency_phone: data.emergency_phone || '',
        date_of_birth: formatDate(data.date_of_birth),
        vehicle_type: data.vehicle_type || '',
        vehicle_number: data.vehicle_number || '',
        vehicle: data.vehicle || '',
        license_number: data.license_number || '',
        license_expiry_date: formatDate(data.license_expiry_date),
        id_proof: data.id_proof ? (Array.isArray(data.id_proof) ? data.id_proof.join(', ') : data.id_proof.replace(/\[|\]|"/g, '')) : '',
        state: data.state || '',
        country: data.country || '',
        status: data.status || '',
        profileImageUrl: data.driver_image ? `${baseurl}/${data.driver_image}` : '',
        id_proofUrl: data.id_proof ? `${baseurl}/${data.id_proof}` : '',
        profileImage: null,
        id_proofFile: null,
      }));
    } catch (err) {
      setError('Failed to load profile data.');
      setSnackbarMessage('Failed to load profile data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driverId) fetchProfile();
    // eslint-disable-next-line
  }, [driverId]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  // NEW: Separate handlers for each image
  const handleProfileImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileData(prev => ({
        ...prev,
        profileImage: file,
        profileImageUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleIdProofChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileData(prev => ({
        ...prev,
        id_proofFile: file,
        id_proofUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSnackbarOpen(false);

    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
      if (
        key === 'profileImage' ||
        key === 'id_proofFile' ||
        key === 'profileImageUrl' ||
        key === 'id_proofUrl'
      ) return;
      if (profileData[key]) formData.append(key, profileData[key]);
    });
    if (profileData.profileImage) formData.append('driver_image', profileData.profileImage);
    if (profileData.id_proofFile) formData.append('id_proof', profileData.id_proofFile);

    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/driver-details/update/${driverId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save profile');
      }

      setError('');
      setSnackbarMessage('Profile updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Refetch profile to get the new image path
      await fetchProfile();
      setTimeout(() => navigate('/driver-profile'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to save profile data.');
      setSnackbarMessage(err.message || 'Failed to save profile data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 10, bgcolor: '#f8f8fb', minHeight: '100vh' }}>
      <Header label="Edit Driver Profile" showBackArrow={true} showCart={false} showFilter={false} onBack={() => navigate(-1)} disableInstituteName={true} />

      {/* Summary Card */}
      <Paper sx={{ p: 3, m: { xs: 1, sm: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ width: 64, height: 64 }} src={profileData.profileImageUrl || ''}>
          {profileData.first_name ? profileData.first_name.charAt(0).toUpperCase() : 'D'}
        </Avatar>
        <Box>
          <Typography variant="h6">{profileData.first_name} {profileData.last_name}</Typography>
          <Typography variant="body2" color="text.secondary">{profileData.email}</Typography>
        </Box>
      </Paper>

      <Container sx={{ mt: 3 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" gutterBottom>Edit Profile</Typography>

          {/* Profile Picture Upload */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton color="primary" component="label" sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }}}>
                  <input hidden accept="image/*" type="file" onChange={handleProfileImageChange} />
                  <PhotoCamera />
                </IconButton>
              }
            >
              <Avatar sx={{ width: 120, height: 120 }} src={profileData.profileImageUrl || ''}>
                {profileData.first_name ? profileData.first_name.charAt(0).toUpperCase() : 'D'}
              </Avatar>
            </Badge>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Personal Details */}
              <Grid item xs={12} sm={6}><TextField label="First Name" name="first_name" value={profileData.first_name} onChange={handleChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Last Name" name="last_name" value={profileData.last_name} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="Email" name="email" type="email" value={profileData.email} onChange={handleChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Phone" name="phone" value={profileData.phone} onChange={handleChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Emergency Phone" name="emergency_phone" value={profileData.emergency_phone} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Date of Birth" name="date_of_birth" type="date" value={profileData.date_of_birth} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              
              {/* Vehicle Details */}
              <Grid item xs={12} sm={6}><TextField label="Vehicle Type" name="vehicle_type" value={profileData.vehicle_type} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Vehicle Number" name="vehicle_number" value={profileData.vehicle_number} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Vehicle" name="vehicle" value={profileData.vehicle} onChange={handleChange} fullWidth /></Grid>
              
              {/* License Details */}
              <Grid item xs={12} sm={6}><TextField label="License Number" name="license_number" value={profileData.license_number} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="License Expiry Date" name="license_expiry_date" type="date" value={profileData.license_expiry_date} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              
              {/* ID Proof */}
              <Grid item xs={12} sm={6}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Typography variant="subtitle2" mb={1}>ID Proof</Typography>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <IconButton
                        color="primary"
                        component="label"
                        sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                      >
                        <input hidden accept="image/*" type="file" onChange={handleIdProofChange} />
                        <PhotoCamera />
                      </IconButton>
                    }
                  >
                    <Avatar
                      sx={{ width: 80, height: 80, bgcolor: '#e0e0e0' }}
                      src={profileData.id_proofUrl || ''}
                      variant="rounded"
                    >
                      {profileData.id_proofUrl ? '' : 'ID'}
                    </Avatar>
                  </Badge>
                  <Typography variant="caption" color="text.secondary" mt={1}>
                    Upload ID Proof Image
                  </Typography>
                </Box>
              </Grid>
              
              {/* Location Details */}
              <Grid item xs={12} sm={6}><TextField label="State" name="state" value={profileData.state} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Country" name="country" value={profileData.country} onChange={handleChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Status" name="status" value={profileData.status} onChange={handleChange} fullWidth>
                  {statusOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <Button type="submit" variant="contained" color="success" sx={{ mt: 4, py: 1.5 }} fullWidth disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Paper>
      </Container>

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <DriverFooter />
    </Box>
  );
};

export default DriverProfileEdit; 