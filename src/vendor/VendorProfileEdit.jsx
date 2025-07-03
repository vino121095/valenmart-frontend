import React, { useEffect, useState } from 'react';
import { Box, Button, Container, TextField, Typography, Paper, Snackbar, Alert, CircularProgress, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import baseurl from '../baseurl/ApiService';
import VendorFooter from '../vendorfooter';

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

  return (
    <>
      <Container maxWidth="sm" sx={{ mt: 4, mb: 8 }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" mb={2} fontWeight="bold">Edit Organization Details</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                label="Type"
                name="type"
                value={vendor.type}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
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
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="Email"
                name="email"
                value={vendor.email}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="Phone"
                name="phone"
                value={vendor.phone}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="Address"
                name="address"
                value={vendor.address}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="City"
                name="city"
                value={vendor.city}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="State"
                name="state"
                value={vendor.state}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="Pincode"
                name="pincode"
                value={vendor.pincode}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="Status"
                name="status"
                value={vendor.status}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
                required
                select
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" color="secondary" onClick={() => navigate(-1)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="success" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </form>
          )}
        </Paper>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
      <VendorFooter />
    </>
  );
};

export default VendorProfileEdit; 