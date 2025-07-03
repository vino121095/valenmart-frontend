import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Typography,
  InputBase,
  Box,
  Card,
  CardContent,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  Stack,
  Badge,
  CircularProgress,
  Alert
} from '@mui/material';
import { ArrowBack, FilterList, ShoppingCart, Search, Home, Inventory, Assignment, Receipt, Person, CurrencyRupee } from '@mui/icons-material';
import Footer from '../Footer';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import baseurl from '../baseurl/ApiService';
import { useAuth } from '../App';

const Invoice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = localStorage.getItem('token');
        const customerId = user?.uid || user?.id;

        // Fetch orders
        const ordersResponse = await fetch(`${baseurl}/api/order/customer/${customerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (!ordersResponse.ok) {
          throw new Error('Failed to fetch orders');
        }

        const ordersData = await ordersResponse.json();
        setOrders(ordersData.data || []);

        // Fetch order items
        const itemsResponse = await fetch(`${baseurl}/api/order-items/all`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (!itemsResponse.ok) {
          throw new Error('Failed to fetch order items');
        }

        const itemsData = await itemsResponse.json();
        setOrderItems(itemsData.data || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewInvoice = (orderId) => {
    navigate('/Invoicepage', {
      state: {
        orderId: orderId
      }
    });
  };

  // Calculate order total including taxes and delivery fees
  const calculateOrderTotal = (orderId) => {
    const items = orderItems.filter(item => item.order_id === orderId);

    if (items.length === 0) return "0.00";

    const subtotal = items.reduce((sum, item) => {
      const lineTotal = parseFloat(item.line_total) || 0;
      return sum + lineTotal;
    }, 0);

    let cgstAmount = 0;
    let sgstAmount = 0;

    items.forEach(item => {
      const cgstRate = item.Product?.cgst || 0;
      const sgstRate = item.Product?.sgst || 0;
      const lineTotal = parseFloat(item.line_total) || 0;

      cgstAmount += (lineTotal * cgstRate) / 100;
      sgstAmount += (lineTotal * sgstRate) / 100;
    });

    const totalDeliveryFee = items.reduce(
      (acc, item) => acc + (Number(item.Product?.delivery_fee) || 0),
      0
    );

    const grandTotal = Number(subtotal) + Number(cgstAmount) + Number(sgstAmount) + Number(totalDeliveryFee);

    return isNaN(grandTotal) ? "0.00" : grandTotal.toFixed(2);
  };

  // Calculate summary statistics
  const pendingOrders = orders.filter(order => order.status !== 'Delivered');
  const deliveredOrders = orders.filter(order => order.status === 'Delivered');

  const totalPendingAmount = pendingOrders.reduce((sum, order) => {
    const calculatedTotal = calculateOrderTotal(order.oid);
    return sum + parseFloat(calculatedTotal);
  }, 0);

  const totalDeliveredAmount = deliveredOrders.reduce((sum, order) => {
    const calculatedTotal = calculateOrderTotal(order.oid);
    return sum + parseFloat(calculatedTotal);
  }, 0);

  // Filter orders based on search query
  const filteredOrders = orders.filter(order =>
    order.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        bgcolor: '#fafafa'
      }}>
        <CircularProgress size={40} sx={{ color: '#00B074' }} />
        <Typography variant="body1" sx={{ mt: 2, color: '#666' }}>
          Loading your invoices...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f6f8fa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Search */}
      <Box sx={{ px: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', borderRadius: 5, boxShadow: 1, px: 2 }}>
          <Search color="action" />
          <InputBase
            placeholder="Search Invoice..."
            fullWidth
            sx={{ ml: 1 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ px: 2, mt: 2, display: 'flex', gap: 2 }}>
        <Card sx={{ flex: 1, bgcolor: '#fff3e0', borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} color="orange">{pendingOrders.length}</Typography>
            <Typography variant="body2">Pending</Typography>
            <Typography variant="subtitle1" fontWeight={600}>₹{totalPendingAmount.toFixed(2)}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: '#e0f2f1', borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={600} color="green">{deliveredOrders.length}</Typography>
            <Typography variant="body2">Paid this month</Typography>
            <Typography variant="subtitle1" fontWeight={600}>₹{totalDeliveredAmount.toFixed(2)}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* All Pending Invoices */}
      <Box sx={{ px: 2, mt: 3, flexGrow: 1 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>All Invoices</Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {filteredOrders.length === 0 ? (
          <Box sx={{
            textAlign: 'center',
            mt: 6,
            p: 4,
            bgcolor: 'white',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <ShoppingCart sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              No invoices found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {searchQuery ? 'No matching invoices found.' : "You don't have any invoices yet."}
            </Typography>
          </Box>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.oid} sx={{ mb: 2, p: 2, borderRadius: 3, boxShadow: 1, position: 'relative' }}>
              {/* Top-left content */}
              <Box>
                <Typography fontWeight={600}>Invoice #{order.order_id}</Typography>
                <Typography fontSize={14}>{order.status}</Typography>
                <Typography fontSize={13} color="text.secondary" mb={1}>
                  Due: {new Date(order.order_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Typography>
              </Box>

              {/* Top-right badge */}
              <Box sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: order.status === 'Delivered' ? '#e0f2f1' : '#fff3e0',
                px: 1.5,
                py: 0.5,
                borderRadius: 2
              }}>
                <Typography fontSize={12} color={order.status === 'Delivered' ? 'green' : 'orange'}>
                  {order.status}
                </Typography>
              </Box>

              {/* Bottom section */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="h6" color={order.status === 'Delivered' ? 'green' : 'orange'} fontWeight={600}>
                  ₹{calculateOrderTotal(order.oid)}
                </Typography>
                <Stack direction="column" spacing={1} alignItems="center">
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: order.status === 'Delivered' ? '#4caf50' : '#00B074',
                      textTransform: 'none',
                      color: 'white',
                      '&:hover': {
                        bgcolor: order.status === 'Delivered' ? '#388e3c' : '#008a5c'
                      }
                    }}
                    startIcon={<CurrencyRupee />}
                    onClick={() => {
                      if (order.status === 'Delivered') {
                        navigate(`/Invoicepage/${order.oid}`);
                      } else {
                        // Handle pay logic here instead of navigating
                        console.log("Handle payment here");
                      }
                    }}
                  >
                    {order.status === 'Delivered' ? 'View' : 'Pay'}
                  </Button>

                </Stack>
              </Box>
            </Card>
          ))
        )}

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            sx={{
              bgcolor: '#00B074',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#008a5c'
              }
            }}
          >
            Export All
          </Button>
          <Button
            variant="outlined"
            fullWidth
            sx={{
              borderColor: '#00a651',
              color: '#00a651',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#008a5c',
                color: '#008a5c'
              }
            }}
          >
            Remind
          </Button>
        </Box>
      </Box>

      {/* Bottom Navigation */}
      <BottomNavigation showLabels value={0} sx={{ mt: 'auto', borderTop: '1px solid #ccc' }}>
        <Footer />
      </BottomNavigation>
    </Box>
  );
};

export default Invoice;