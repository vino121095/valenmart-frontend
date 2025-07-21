import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Footer from '../Footer';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../Header';
import baseurl from '../baseurl/ApiService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../App';

const ShoppingCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  const { decrementCartCount } = useCart();

  // Fetch user details
  const fetchUserDetails = async () => {
    try {
      const customerId = JSON.parse(localStorage.getItem('customer_id'));
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${baseurl}/api/user/${customerId}`, {
        method: 'GET',
        headers: headers,
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
      } else {
        console.error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Fetch cart items and user details when component mounts
  useEffect(() => {
    fetchCartItems();
    fetchUserDetails();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get customer ID from localStorage
      const customerId = localStorage.getItem('customer_id');
      
      if (!customerId) {
        setError('Please login to view your cart');
        setLoading(false);
        return;
      }

      const parsedCustomerId = JSON.parse(customerId);
      
      // Get auth token
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${baseurl}/api/cart/${parsedCustomerId}`, {
        method: 'GET',
        headers: headers,
      });

      // console.log('Cart fetch response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        // console.log('Cart data:', data);

        if (data && Array.isArray(data)) {
          const formattedItems = data.map(item => ({
            id: item.product_id || item.id,
            cartId: item.id || item.cart_id, // Store cart ID for updates/deletes
            name: item.product_name,
            price: parseFloat(item.price_at_time),
            image: item.Product.product_image,
            unit: item.Product.unit,
            category: item.Product.category,
            gst: item.Product.gst || 0, // Store GST value directly in the item
            total_price: parseFloat(item.price_at_time)
          }));

          setCartItems(formattedItems);

          // Set initial quantities
          const initialQuantities = {};
          data.forEach(item => {
            initialQuantities[item.product_id || item.id] = parseInt(item.quantity) || 1;
          });
          setQuantities(initialQuantities);
        } else {
          setCartItems([]);
          setQuantities({});
        }
      } else if (response.status === 404) {
        // No cart items found
        setCartItems([]);
        setQuantities({});
      } else {
        throw new Error(`Failed to fetch cart: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateCartQuantity = async (productId, newQuantity, cartId) => {
    if (updating) return;
    
    try {
      setUpdating(true);
      
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      const customerId = JSON.parse(localStorage.getItem('customer_id'));
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Find the item to get current details
      const item = cartItems.find(item => item.id === productId);
      console.log(newQuantity)
      const requestBody = {
        customer_id: customerId,
        product_id: productId,
        product_name: item.product_name,
        price: item.price,
        quantity: newQuantity,
        unit: item.unit,
        total_price: item.price * newQuantity,
        category: item.category,
        image: item.image,
      };

      // Use POST to create/update cart item
      const response = await fetch(`${baseurl}/api/cart/create`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        // Update local state
        setQuantities(prev => ({
          ...prev,
          [productId]: newQuantity,
        }));
        
        // Update cart items total price
        setCartItems(prev => prev.map(item => 
          item.id === productId 
            ? { ...item, total_price: item.price * newQuantity }
            : item
        ));
      } else {
        throw new Error('Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      alert('Failed to update cart. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleIncrement = (productId, cartId) => {
    const newQuantity = (quantities[productId] || 1) + 1;
    // console.log(newQuantity)
    updateCartQuantity(productId, newQuantity, cartId);
  };

  const handleDecrement = (productId, cartId) => {
    const currentQuantity = quantities[productId] || 1;
    if (currentQuantity > 1) {
      const newQuantity = currentQuantity - 1;
      // console.log(newQuantity)
      updateCartQuantity(productId, newQuantity, cartId);
    }
  };

  const handleRemoveItem = async (productId, cartId) => {
    try {
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      const customerId = JSON.parse(localStorage.getItem('customer_id'));
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${baseurl}/api/cart/delete/${cartId}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (response.ok) {
        // Remove from local state
        setCartItems(prev => prev.filter(item => item.id !== productId));
        setQuantities(prev => {
          const newQuantities = { ...prev };
          delete newQuantities[productId];
          return newQuantities;
        });
        
        // Decrement cart count
        decrementCartCount();
      } else {
        throw new Error('Failed to delete item from cart');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * (quantities[item.id] || 1), 0);
  
  // Calculate GST based on each product's GST percentage
  const gstAmount = cartItems.reduce((sum, item) => {
    const itemTotal = item.price * (quantities[item.id] || 1);
    const gstPercentage = item.gst || 0; // Access GST directly from the item
    return sum + (itemTotal * (gstPercentage / 100));
  }, 0);
  
  const total = subtotal + gstAmount;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    navigate('/checkout', {
      state: {
        cartItems,
        quantities,
        subtotal,
        gstAmount,
        total,
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header showBackArrow={true} label="Shopping Cart" />
        <Container sx={{ mt: 3, mb: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#10b981', mb: 2 }} size={40} />
            <Typography variant="body2" color="text.secondary">Loading your cart...</Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header showBackArrow={true} label="Shopping Cart" />
        <Container sx={{ mt: 3, mb: 10 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #fee2e2', backgroundColor: '#fef2f2' }}>
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
            <Button 
              variant="contained" 
              onClick={fetchCartItems}
              sx={{
                backgroundColor: '#10b981',
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#059669' }
              }}
            >
              Retry
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header showBackArrow={true} label="Shopping Cart" />
      <Container sx={{ mt: 2, mb: 20, maxWidth: '480px !important' }}>
        
        {/* Cart Items Section */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, overflow: 'hidden' }}>
          {cartItems.length === 0 ? (
            <Box textAlign="center" py={8} px={3}>
              <Box 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  backgroundColor: '#f1f5f9', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}
              >
                <Typography sx={{ fontSize: 32 }}>🛒</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold" color="text.primary" mb={1}>
                Your cart is empty
              </Typography>
              <Typography color="text.secondary" variant="body2" mb={3}>
                Add some delicious items to get started
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/products')}
                sx={{
                  backgroundColor: '#10b981',
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#059669' }
                }}
              >
                Continue Shopping
              </Button>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {cartItems.map((item, index) => (
                <ListItem
                  key={item.id}
                  sx={{ 
                    borderBottom: index === cartItems.length - 1 ? 'none' : '1px solid #f1f5f9',
                    py: 3,
                    px: 3,
                    position: 'relative'
                  }}
                >
                  {/* Delete Button */}
                  <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                    <IconButton 
                      onClick={() => handleRemoveItem(item.id, item.cartId)}
                      sx={{
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        width: 32,
                        height: 32,
                        '&:hover': { backgroundColor: '#fecaca' }
                      }}
                      size="small"
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>

                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      src={baseurl + '/' + item.image}
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: 2,
                        border: '2px solid #f1f5f9'
                      }}
                    />
                  </ListItemAvatar>
                  
                  <ListItemText
                    sx={{ ml: 2, pr: 4 }}
                    primary={
                      <Typography fontWeight="bold" variant="body1" sx={{ mb: 0.5, lineHeight: 1.3 }}>
                        {item.name}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Fresh Market Co. • ₹{item.price}/{item.unit}
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="#10b981" sx={{ mb: 2 }}>
                          ₹{(item.price * (quantities[item.id] || 1)).toFixed(2)}
                        </Typography>
                        
                        {/* Quantity Controls */}
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconButton 
                            onClick={() => handleDecrement(item.id, item.cartId)} 
                            disabled={updating || (quantities[item.id] || 1) <= 1}
                            sx={{
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              width: 36,
                              height: 36,
                              '&:hover': { backgroundColor: '#e2e8f0' },
                              '&:disabled': { opacity: 0.5 }
                            }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          
                          <Box 
                            sx={{ 
                              backgroundColor: '#dcfce7', 
                              color: '#16a34a',
                              borderRadius: 2, 
                              px: 2, 
                              py: 1,
                              minWidth: 48,
                              textAlign: 'center',
                              fontWeight: 600
                            }}
                          >
                            {quantities[item.id] || 1}
                          </Box>
                          
                          <IconButton 
                            onClick={() => handleIncrement(item.id, item.cartId)} 
                            disabled={updating}
                            sx={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              width: 36,
                              height: 36,
                              '&:hover': { backgroundColor: '#059669' },
                              '&:disabled': { opacity: 0.5 }
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Price Breakdown */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Box display="flex" alignItems="center" mb={3}>
            <Typography sx={{ fontSize: 18, mr: 1 }}>🧾</Typography>
            <Typography fontWeight="bold" variant="body1">Bill Summary</Typography>
          </Box>
          
          <Box sx={{ space: 2 }}>
            <Grid container justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Grid item>
                <Box display="flex" alignItems="center">
                  <Typography sx={{ fontSize: 16, mr: 1 }}>📦</Typography>
                  <Typography color="text.secondary">Subtotal</Typography>
                </Box>
              </Grid>
              <Grid item>
                <Typography fontWeight="500">₹{subtotal.toFixed(2)}</Typography>
              </Grid>
            </Grid>
            
            {/* <Grid container justifyContent="space-between" sx={{ mb: 2 }}>
              <Grid item>
                <Box display="flex" alignItems="center">
                  <Typography sx={{ fontSize: 16, mr: 1 }}>📊</Typography>
                  <Typography color="text.secondary">GST</Typography>
                </Box>
              </Grid>
              <Grid item>
                <Typography fontWeight="500">₹{gstAmount.toFixed(2)}</Typography>
              </Grid>
            </Grid> */}
            
            <Box sx={{ borderTop: '2px solid #f1f5f9', pt: 2 }}>
              <Grid container justifyContent="space-between">
                <Grid item>
                  <Typography variant="h6" fontWeight="bold">Total Amount</Typography>
                </Grid>
                <Grid item>
                  <Typography variant="h6" fontWeight="bold" color="#10b981">₹{total.toFixed(2)}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Fixed Checkout Button */}
      {cartItems.length > 0 && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0,
            borderTop: '1px solid #e2e8f0',
            borderRadius: 0
          }} 
          elevation={8}
        >
          <Container sx={{ maxWidth: '480px !important' }}>
            <Box sx={{ p: 3 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCheckout}
                disabled={updating}
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: 3,
                  py: 2,
                  fontSize: 16,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  }
                }}
              >
                {updating ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                    <span>Processing...</span>
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
                    <span>Proceed to Checkout</span>
                    <Box 
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        px: 2, 
                        py: 0.5, 
                        borderRadius: 2,
                        fontWeight: 'bold'
                      }}
                    >
                      ₹{total.toFixed(0)}
                    </Box>
                  </Box>
                )}
              </Button>
              
              <Box mt={2} display="flex" justifyContent="center" gap={3}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 8, height: 8, backgroundColor: '#10b981', borderRadius: '50%' }} />
                  <Typography variant="caption" color="text.secondary">Secure Payment</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 8, height: 8, backgroundColor: '#3b82f6', borderRadius: '50%' }} />
                  <Typography variant="caption" color="text.secondary">Fast Delivery</Typography>
                </Box>
              </Box>
            </Box>
          </Container>
        </Paper>
      )}

      <Box sx={{ height: 80 }} /> {/* Spacer for fixed footer */}
      <Paper sx={{ position: 'fixed', bottom: cartItems.length > 0 ? 140 : 0, left: 0, right: 0 }} elevation={3}>
        <Footer />
      </Paper>
    </Box>
  );
};

export default ShoppingCart;