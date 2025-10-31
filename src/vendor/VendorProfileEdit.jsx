import React, { useEffect, useState } from 'react';
import { Box, Button, Container, TextField, Typography, Paper, Snackbar, Alert, CircularProgress, MenuItem, IconButton, Badge } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import baseurl from '../baseurl/ApiService';
import VendorFooter from '../vendorfooter';
import { ArrowBack } from '@mui/icons-material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const VendorProfileEdit = () => {
  const [vendor, setVendor] = useState({
    type: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    status: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    // Get vendor id from localStorage or userData
    let vendorId = null;
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    vendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
    if (!vendorId) {
      setLoading(false);
      setSnackbar({ open: true, message: 'Vendor ID not found', severity: 'error' });
      return;
    }
    fetch(`${baseurl}/api/vendor/${vendorId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const v = data.data || {};
        setVendor({
          type: v.type || '',
          contact_person: v.contact_person || '',
          email: v.email || '',
          phone: v.phone || '',
          address: v.address || '',
          city: v.city || '',
          state: v.state || '',
          pincode: v.pincode || '',
          status: v.status || ''
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setSnackbar({ open: true, message: 'Failed to fetch vendor details', severity: 'error' });
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

  const handleChange = (e) => {
    setVendor({ ...vendor, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let vendorId = null;
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    vendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
    try {
      const response = await fetch(`${baseurl}/api/vendor/update/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(vendor)
      });
      if (!response.ok) throw new Error('Failed to update vendor details');
      setSnackbar({ open: true, message: 'Vendor details updated!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Error', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
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
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="h6" fontWeight="bold">
              Edit Organization Details
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

      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#16a34a' }} />
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                label="Type"
                name="type"
                value={vendor.type}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2.5 }}
                required
                select
              >
                <MenuItem value="Vendor">Vendor</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
              <TextField
                label="Contact Person"
                name="contact_person"
                value={vendor.contact_person}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2.5 }}
                required
              />
              <TextField
                label="Email"
                name="email"
                value={vendor.email}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2.5 }}
                required
              />
              <TextField
                label="Phone"
                name="phone"
                value={vendor.phone}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2.5 }}
                required
              />
              <TextField
                label="Address"
                name="address"
                value={vendor.address}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2.5 }}
                required
              />
              <TextField
                label="City"
                name="city"
                value={vendor.city}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2.5 }}
                required
              />
              <TextField
                label="State"
                name="state"
                value={vendor.state}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2.5 }}
                required
              />
              <TextField
                label="Pincode"
                name="pincode"
                value={vendor.pincode}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2.5 }}
                required
              />
              <TextField
                label="Status"
                name="status"
                value={vendor.status}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 3 }}
                required
                select
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(-1)} 
                  disabled={saving}
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#64748b',
                    borderColor: '#e2e8f0',
                    '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={saving}
                  fullWidth
                  sx={{
                    background: 'linear-gradient(90deg, #004D26, #00A84F)',
                    color: 'white !important',
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { background: 'linear-gradient(90deg, #003D1F, #008A40)' }
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </form>
          )}
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <VendorFooter />
    </Box>
  );
};

export default VendorProfileEdit; 