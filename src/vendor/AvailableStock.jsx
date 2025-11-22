import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  BottomNavigation,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InventoryIcon from '@mui/icons-material/Inventory';
import Badge from '@mui/material/Badge';
import VendorFooter from '../vendorfooter';
import baseurl from '../baseurl/ApiService';
import velaanLogo from '../assets/velaanLogo.png';

const AvailableStock = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [vendorName, setVendorName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${baseurl}/api/product/all`)
      .then((response) => response.json())
      .then((res) => {
        const productData = Array.isArray(res.data) ? res.data : [];
        console.log('Product data:', productData[0]); // Debug: Check first product structure
        setProducts(productData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
        setLoading(false);
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
    const fetchVendorName = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const vendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
        const token = localStorage.getItem('token');
        if (vendorId && token) {
          const response = await fetch(`${baseurl}/api/vendor/${vendorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          setVendorName(data.full_name || data.org_name || data.company || data.name || 'Vendor');
        }
      } catch (e) { setVendorName('Vendor'); }
    };
    fetchNotifications();
    fetchVendorName();
  }, []);

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
          <Box component="img" src={velaanLogo} alt="Velaan Logo" sx={{ height: 50 }} />
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
              {vendorName?.[0] || 'V'}
            </Avatar>
          </Box>
        </Box>
      </Box>

      {/* Products Grid */}
      <Box sx={{ px: 2, maxWidth: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center'}}>
            <CircularProgress sx={{ color: '#16a34a' }} />
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <InventoryIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 600 }}>No products available</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>Add products to see them here.</Typography>
          </Box>
        ) : (
          <Grid container spacing={2} sx={{flexDirection:'column'}}>
            {products.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      {item.product_image ? (
                        <Box
                          component="img"
                          src={`${baseurl}/${item.product_image}`}
                          alt={item.product_name}
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 2,
                            objectFit: 'cover',
                            bgcolor: '#f1f5f9'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: '#dcfce7',
                          color: '#16a34a',
                          fontSize: 24,
                          fontWeight: 'bold',
                          borderRadius: 2,
                          display: item.product_image ? 'none' : 'flex'
                        }}
                      >
                        {item.product_name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1e293b', mb: 0.5 }} noWrap>
                          {item.product_name}
                        </Typography>
                        <Chip
                          label="In Stock"
                          size="small"
                          sx={{
                            bgcolor: '#dcfce7',
                            color: '#16a34a',
                            fontSize: '0.7rem',
                            height: 22,
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          Quantity
                        </Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ color: '#1e293b' }}>
                          {item.unit} kg
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          Price/kg
                        </Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ color: '#16a34a' }}>
                          ₹{parseFloat(item.price).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Footer */}
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
        <BottomNavigation showLabels sx={{ backgroundColor: '#f5f5f5' }}>
          <VendorFooter />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default AvailableStock;
