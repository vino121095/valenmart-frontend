import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardActions, CardContent, CardMedia,
    Grid, IconButton, InputBase, Paper, Typography, Button, Snackbar, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import Footer from '../Footer';
import baseurl from '../baseurl/ApiService';
import Header from '../Header';
import { useCart } from '../context/CartContext';

const ViewAllProducts = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { incrementCartCount } = useCart();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${baseurl}/api/product/all`);
            const data = await response.json();
            
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
        } catch (error) {
            console.error('Error fetching products:', error);
            showSnackbar('Failed to load products', 'error');
        }
    };

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
        if (loading) return;
        setLoading(true);
        
        try {
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
            
            const headers = {
                'Content-Type': 'application/json',
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const response = await fetch(`${baseurl}/api/cart/create`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
            });
            
            const data = await response.json();

            if (response.ok) {
                showSnackbar(`${product.name} added to cart successfully!`, 'success');
                incrementCartCount();
                setQuantities(prev => ({
                    ...prev,
                    [product.id]: 1
                }));
            } else {
                if (response.status === 401) {
                    showSnackbar('Please login to add items to cart', 'error');
                    setTimeout(() => navigate('/login'), 1500);
                } else {
                    showSnackbar(`Failed to add to cart: ${data.message || 'Unknown error'}`, 'error');
                }
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            showSnackbar('Something went wrong. Please try again.', 'error');
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
            <Header />

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
                        placeholder="Search Products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </Paper>

                {/* Products Grid */}
                <Box>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>All Products</Typography>
                    <Grid container spacing={2} justifyContent='center'>
                        {filteredProducts.map((product, index) => (
                            <Grid item xs={12} sm={6} md={4} key={product.id || index}>
                                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <CardMedia
                                        component="img"
                                        height="140"
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
                                            {product.description || 'Fresh Market Co.'}
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

export default ViewAllProducts; 