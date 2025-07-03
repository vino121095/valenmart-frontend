import React, { useState, useEffect } from 'react';
import {
     Avatar, Box, Card, CardActions, CardContent, CardMedia,
    Grid, IconButton, InputBase, Paper, Typography, Button, Snackbar, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import Footer from '../Footer';
import baseurl from '../baseurl/ApiService';
import Header from '../Header';
import { useCart } from '../context/CartContext';

const Products = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { incrementCartCount } = useCart();

    useEffect(() => {
        fetch(`${baseurl}/api/category/all`)
            .then((res) => res.json())
            .then((data) => {
                if (data?.data) {
                    const formatted = data.data.map((item) => ({
                        label: item.category_name,
                        image: `${baseurl}/${item.category_image.replace(/\\/g, '/')}`,
                    }));
                    setCategories(formatted);
                }
            })
            .catch((error) => console.error('Error fetching categories:', error));
    }, []);

    useEffect(() => {
        fetch(`${baseurl}/api/product/all`)
            .then((res) => res.json())
            .then((data) => {
                if (data?.data) {
                    const formatted = data.data
                        .filter((item) => item.is_active === 'Available')
                        .map((item) => ({
                            id: item.pid,
                            name: item.product_name,
                            price: item.price,
                            unit: item.unit,
                            description: item.discription,
                            category: item.category,
                            image: `${baseurl}/${item.product_image.replace(/\\/g, '/')}`,
                        }));
                    setProducts(formatted);
                }
            })
            .catch((error) => console.error('Error fetching products:', error));
    }, []);

    const handleIncrement = (productId) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: (prev[productId] || 1) + 1,
        }));
    };

    const handleDecrement = (productId) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max((prev[productId] || 1) - 1, 1),
        }));
    };

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleAddToCart = async (product, quantity) => {
        // Prevent multiple clicks
        if (loading) return;
        
        setLoading(true);
        
        try {
            console.log('Adding to cart:', { product, quantity }); // Debug log
            
            // Get authentication token if required
            const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
            
            const requestBody = {
                customer_id: JSON.parse(localStorage.getItem('customer_id')),
                product_id: product.id,
                product_name: product.name,
                price: parseFloat(product.price),
                quantity: parseInt(quantity),
                unit: product.unit,
                total_price: parseFloat(product.price) * parseInt(quantity),
                category: product.category,
                image: product.image,
            };
            
            console.log('Request body:', requestBody); // Debug log
            
            const headers = {
                'Content-Type': 'application/json',
            };
            
            // Add authorization header if token exists
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const response = await fetch(`${baseurl}/api/cart/create`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
            });

            console.log('Response status:', response.status); // Debug log
            
            const data = await response.json();
            console.log('Response data:', data); // Debug log

            if (response.ok) {
                // Show success message
                showSnackbar(`${product.name} added to cart successfully!`, 'success');
                
                // Increment cart count
                incrementCartCount();
                
                // Reset quantity for this product
                setQuantities(prev => ({
                    ...prev,
                    [product.id]: 1
                }));
            } else {
                console.error('Failed to add to cart:', data);
                
                if (response.status === 401) {
                    showSnackbar('Please login to add items to cart', 'error');
                    setTimeout(() => navigate('/login'), 1500);
                } else if (response.status === 400) {
                    showSnackbar(`Error: ${data.message || 'Invalid request'}`, 'error');
                } else {
                    showSnackbar(`Failed to add to cart: ${data.message || 'Unknown error'}`, 'error');
                }
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showSnackbar('Network error. Please check your connection and try again.', 'error');
            } else {
                showSnackbar('Something went wrong. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ pb: 10 }}>
            <Header/>

            {/* Search */}
            <Box sx={{ px: 1 }}>
                <Paper
                    component="form"
                    sx={{
                        mt: 2, mb: 2, display: 'flex', alignItems: 'center',
                        borderRadius: 5, px: 2, justifyContent: 'center'
                    }}
                >
                    <SearchIcon />
                    <InputBase
                        sx={{ ml: 1, flex: 1 }}
                        placeholder="Search Vegetables..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </Paper>

                {/* Categories */}
                <Box>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Browse by Category</Typography>
                    <Box justifyContent='center' sx={{ display: 'flex', overflowX: 'auto', gap: 2, pb: 1 }}>
                        {categories.map((cat, index) => (
                            <Card key={index} sx={{ minWidth: 100, maxWidth: 120, p: 1, flexShrink: 0 }}>
                                <CardMedia component="img" height="60" image={cat.image} sx={{ objectFit: 'cover', borderRadius: 1 }} />
                                <Typography variant="caption">{cat.label}</Typography>
                            </Card>
                        ))}
                    </Box>
                </Box>

                {/* Products */}
                <Box>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Available Now</Typography>
                    <Grid container spacing={2} justifyContent='center'>
                        {filteredProducts.slice(0, 4).map((product, index) => (
                            <Grid item xs={12} sm={6} key={product.id || index}>
                                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <CardMedia
                                        component="img"
                                        height="120"
                                        image={product.image}
                                        alt={product.name}
                                        sx={{ objectFit: 'cover', borderRadius: 2 }}
                                    />

                                    <CardContent sx={{ p: 1 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body1" fontWeight="bold">
                                                {product.name}
                                            </Typography>
                                            <Box display="flex" alignItems="center">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDecrement(product.id)}
                                                    sx={{
                                                        bgcolor: '#00B76F',
                                                        color: '#fff',
                                                        width: 24,
                                                        height: 24,
                                                        '&:hover': { bgcolor: '#00985D' },
                                                    }}
                                                >
                                                    <RemoveIcon fontSize="inherit" />
                                                </IconButton>
                                                <Typography mx={0.5} fontSize="0.8rem">
                                                    {quantities[product.id] || 1}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleIncrement(product.id)}
                                                    sx={{
                                                        bgcolor: '#00B76F',
                                                        color: '#fff',
                                                        width: 24,
                                                        height: 24,
                                                        '&:hover': { bgcolor: '#00985D' },
                                                    }}
                                                >
                                                    <AddIcon fontSize="inherit" />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Typography variant="subtitle2" color="#00B76F" mt={0.5}>
                                            ₹{product.price}/kg
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                            Fresh Market Co.
                                        </Typography>
                                    </CardContent>

                                    <CardActions sx={{ px: 1, pb: 1 }}>
                                        <Button
                                            fullWidth
                                            size="medium"
                                            variant="contained"
                                            disabled={loading}
                                            sx={{
                                                backgroundColor: '#00B76F',
                                                fontSize: '0.8rem',
                                                '&:hover': { backgroundColor: '#00985D' },
                                                '&:disabled': { backgroundColor: '#cccccc' },
                                            }}
                                            onClick={() => handleAddToCart(product, quantities[product.id] || 1)}
                                        >
                                            <ShoppingCartIcon sx={{ fontSize: '1rem', mr: 1 }} />
                                            {loading ? 'Adding...' : 'Add to Cart'}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* View All */}
                <Box textAlign="center" mt={4}>
                    <Button
                        fullWidth
                        variant="contained"
                        sx={{
                            backgroundColor: '#00B76F',
                            borderRadius: 2,
                            py: 1.5,
                            fontWeight: 500,
                            '&:hover': { backgroundColor: '#00985D' },
                        }}
                        onClick={() => navigate('/all-products')}
                    >
                        View All Products
                    </Button>
                </Box>
            </Box>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Footer */}
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
                <Footer />
            </Paper>
        </Box>
    );
};

export default Products;