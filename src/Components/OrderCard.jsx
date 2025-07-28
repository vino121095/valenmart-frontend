import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Card,
  Button,
  Slider,
  Avatar,
  Badge,
  Paper,
  BottomNavigation,
  CircularProgress,
  Alert,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { FilterList, ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Footer from '../Footer';
import Header from '../Header';
import baseurl from '../baseurl/ApiService';
import { useAuth } from '../App';

const OrderCard = ({ order, orderItems }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Calculate the total amount for an order
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

  // Map status to slider values
  const getSliderValue = (status) => {
    switch (status?.toLowerCase()) {
      case 'new order':
        return 0;
      case 'waiting for approval':
        return 33;
      case 'out for delivery':
        return 66;
      case 'delivered':
        return 100;
      default:
        return 0;
    }
  };

  // Get status color based on status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new order':
        return '#FFA000';
      case 'waiting for approval':
        return '#FFB300';
      case 'out for delivery':
        return '#2196F3';
      case 'delivered':
        return '#00B074';
      default:
        return '#757575';
    }
  };

  // Shorter labels for better display
  const sliderMarks = [
    { value: 0, label: 'New Order' },
    { value: 33, label: 'Waiting for Approval' },
    { value: 66, label: 'Out for Delivery' },
    { value: 100, label: 'Delivered' },
  ];

  const sliderValue = getSliderValue(order.status);
  const statusColor = getStatusColor(order.status);

  // Fetch order details by ID
  const fetchOrderDetails = async (orderId) => {
    setLoading(true);
    setError('');

    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/order/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrderDetails(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = () => {
    // console.log('Navigating to order status with order:', order);
    navigate('/order-status', {
      state: {
        orderId: order.oid,
        status: order.status,
        deliveryDate: orderDetails?.delivery_date,
        deliveryTime: orderDetails?.delivery_time
      }
    });
  };

  const handleCancelOrder = async () => {
    try {
      const authToken = localStorage.getItem('token');
      const orderId = order.oid || order.id || order.order_id;
      const response = await fetch(`${baseurl}/api/order/update/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: 'Cancelled' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel order');
      }

      // Show success message
      setError('');
      // Show success message before reloading
      alert('Order cancelled successfully!');
      // Refresh the page to show updated order status
      window.location.reload();
    } catch (error) {
      console.error('Error canceling order:', error);
      setError(error.message || 'Failed to cancel order');
    }
  };

  const handleViewInvoice = () => {
    navigate('/Invoicepage', {
      state: {
        orderId: order.id
      }
    });
  };

  useEffect(() => {
    if (order.id) {
      fetchOrderDetails(order.id);
    }
  }, [order.id]);

  return (
    <Card sx={{
      mb: 2,
      p: 2.5,
      borderRadius: 3,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        transform: 'translateY(-1px)'
      }
    }}>
      {/* Order Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a1a', mb: 0.5 }}>
          Order #{order.order_id}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          {new Date(order.order_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })} • {orderItems.filter(item => item.order_id === order.oid).length || 0} Items
        </Typography>
      </Box>

      {/* Progress Section */}
      <Box sx={{ mb: 2 }}>
        {/* Progress Bar */}
        <Box sx={{ mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={sliderValue}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#f0f0f0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: statusColor,
                background: `linear-gradient(90deg, ${statusColor} 0%, ${statusColor}dd 100%)`,
              },
            }}
          />
        </Box>

        {/* Status Labels */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1
        }}>
          {sliderMarks.map((mark, index) => (
            <Box
              key={mark.value}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                flex: 1
              }}
            >
              {/* Dot indicator */}
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: sliderValue >= mark.value ? statusColor : '#e0e0e0',
                  mb: 0.5,
                  transition: 'all 0.3s ease',
                  border: sliderValue >= mark.value ? `2px solid ${statusColor}` : '2px solid #e0e0e0',
                  boxShadow: sliderValue >= mark.value ? `0 0 8px ${statusColor}40` : 'none',
                }}
              />
              {/* Label */}
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: sliderValue >= mark.value ? 600 : 400,
                  color: sliderValue >= mark.value ? statusColor : '#999',
                  textAlign: 'center',
                  lineHeight: 1,
                }}
              >
                {mark.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Current Status */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 2,
        p: 1.5,
        backgroundColor: `${statusColor}10`,
        borderRadius: 2,
        border: `1px solid ${statusColor}30`
      }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: statusColor,
            animation: order.status !== 'Delivered' ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(0.95)',
                boxShadow: `0 0 0 0 ${statusColor}70`,
              },
              '70%': {
                transform: 'scale(1)',
                boxShadow: `0 0 0 4px ${statusColor}00`,
              },
              '100%': {
                transform: 'scale(0.95)',
                boxShadow: `0 0 0 0 ${statusColor}00`,
              },
            },
          }}
        />
        <Typography variant="body2" fontWeight={600} sx={{ color: statusColor }}>
          {order.status}
        </Typography>
      </Box>

      {/* Show loading state when fetching order details */}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={16} sx={{ color: statusColor }} />
          <Typography variant="caption" color="text.secondary">
            Loading order details...
          </Typography>
        </Box>
      )}

      {/* Show error if API call fails */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
          {error}
        </Alert>
      )}

      {/* Actions and Amount */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {order.status === 'New Order' && (
            <Button
              variant="contained"
              size="small"
              onClick={handleCancelOrder}
              sx={{
                bgcolor: '#f44336',
                color: 'white',
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                fontWeight: 600,
                '&:hover': { bgcolor: '#d32f2f' }
              }}
            >
              Cancel Order
            </Button>
          )}
          {order.status !== 'Delivered' && order.status !== 'New Order' && order.status !== 'Cancelled' && (
            <Button
              variant="contained"
              size="small"
              onClick={handleTrackOrder}
              sx={{
                bgcolor: statusColor,
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: statusColor,
                  filter: 'brightness(0.9)'
                }
              }}
            >
              Track Order
            </Button>
          )}
          {order.status === 'Delivered' && (
            <>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate(`/Invoicepage/${order.oid}`)}
                sx={{
                  bgcolor: statusColor,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                  fontWeight: 600,
                  mr: 1,
                  '&:hover': {
                    bgcolor: statusColor,
                    filter: 'brightness(0.9)'
                  }
                }}
              >
                View Invoice
              </Button>
            </>
          )}
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a1a' }}>
          ₹{calculateOrderTotal(order.oid)}
        </Typography>
      </Box>
    </Card>
  );
};

const OrderTrackingPage = () => {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isVerySmall = useMediaQuery('(max-width: 400px)');

  // Fetch all orders
  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const customerId = user?.uid || user?.id;
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/order/customer/${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all order items
  const fetchOrderItems = async () => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/order-items/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order items');
      }

      const data = await response.json();
      setOrderItems(data.data || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
      setError('Failed to load order items');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOrderItems();
  }, []);

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') {
      return !['Delivered', 'Cancelled'].includes(order.status);
    }
    return order.status.toLowerCase() === activeTab.toLowerCase();
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Get responsive tab labels
  const getTabLabel = (fullLabel) => {
    if (isVerySmall) {
      const shortLabels = {
        'All Orders': 'All',
        'Active': 'Active',
        'New Order': 'New',
        'Out for Delivery': 'Delivery',
        'Delivered': 'Done'
      };
      return shortLabels[fullLabel] || fullLabel;
    } else if (isMobile) {
      const mediumLabels = {
        'All Orders': 'All Orders',
        'Active': 'Active',
        'New Order': 'New Order',
        'Out for Delivery': 'Delivery',
        'Delivered': 'Delivered'
      };
      return mediumLabels[fullLabel] || fullLabel;
    }
    return fullLabel;
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Box sx={{ flex: 1, p: 3, maxWidth: 1200, mx: 'auto', width: '100%' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            My Orders
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all your orders in one place
          </Typography>
        </Box>

        {/* Tabs for filtering orders */}
        <Box sx={{ 
          mb: 3, 
          borderBottom: 1, 
          borderColor: 'divider',
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="order status tabs"
            variant={isVerySmall ? "scrollable" : "standard"}
            scrollButtons={isVerySmall ? "auto" : false}
            allowScrollButtonsMobile
            sx={{
              minHeight: isVerySmall ? '48px' : '56px',
              '& .MuiTab-root': {
                minWidth: isVerySmall ? '60px' : 'auto',
                fontSize: isVerySmall ? '0.7rem' : isMobile ? '0.8rem' : '0.875rem',
                padding: isVerySmall ? '6px 8px' : isMobile ? '8px 12px' : '12px 16px',
                textTransform: 'none',
                fontWeight: 500,
                '&.Mui-selected': {
                  color: '#4CAF50',
                  fontWeight: 600,
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#4CAF50',
                height: 3,
              }
            }}
          >
            <Tab label={getTabLabel("All Orders")} value="all" />
            <Tab label={getTabLabel("Active")} value="active" />
            <Tab label={getTabLabel("New Order")} value="New Order" />
            <Tab label={getTabLabel("Out for Delivery")} value="Out for Delivery" />
            <Tab label={getTabLabel("Delivered")} value="Delivered" />
          </Tabs>
        </Box>

        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error state */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Empty state */}
        {!loading && !error && filteredOrders.length === 0 && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            textAlign: 'center'
          }}>
            <ShoppingCart sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No orders found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {activeTab === 'all'
                ? "You haven't placed any orders yet."
                : `You don't have any ${activeTab.toLowerCase()} orders.`}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/products')}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Shop Now
            </Button>
          </Box>
        )}

        {/* Orders list */}
        {!loading && filteredOrders.length > 0 && (
          <Box>
            {filteredOrders
              .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
              .map(order => (
                <OrderCard
                  key={order.oid}
                  order={order}
                  orderItems={orderItems}
                />
              ))}
          </Box>
        )}
      </Box>

      <Footer />
    </Box>
  );
};

export default OrderTrackingPage;