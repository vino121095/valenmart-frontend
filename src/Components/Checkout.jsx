import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Divider,
    TextField,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../Footer';
import baseurl from '../baseurl/ApiService';
import { useAuth } from '../App';
import { useCart } from '../context/CartContext';

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { cartItems = [], quantities = {}, total = 0 } = location.state || {};
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const { updateCartCount } = useCart();
    const [deliveryDetails, setDeliveryDetails] = useState({
        institution_name: '',
        institution_type: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        contact_person_name: '',
        contact_person_email: '',
        contact_person_phone: '',
        special_instructions: ''
    });
    const [products, setProducts] = useState([]);
    const [priceDetails, setPriceDetails] = useState({
        subtotal: 0,
        cgst: 0,
        sgst: 0,
        deliveryFee: 0,
        total: 0
    });

    // Fetch products data
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${baseurl}/api/product/all`);
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data.data);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, []);

    // Calculate price details whenever cartItems or products change
    useEffect(() => {
        if (cartItems.length > 0 && products.length > 0) {
            calculatePriceDetails();
        }
    }, [cartItems, products]);

    const calculatePriceDetails = () => {
        let subtotal = 0;
        let cgst = 0;
        let sgst = 0;
        let deliveryFee = 0;

        cartItems.forEach(item => {
            const product = products.find(p => p.pid === item.id);
            const quantity = quantities[item.id] || 1;
            const itemTotal = (item.price || 0) * quantity;

            subtotal += itemTotal;

            if (product) {
                cgst += (itemTotal * (product.cgst || 0)) / 100;
                sgst += (itemTotal * (product.sgst || 0)) / 100;
                deliveryFee += product.delivery_fee || 0;
            }
        });

        const total = subtotal + cgst + sgst + deliveryFee;

        setPriceDetails({
            subtotal: subtotal || 0,
            cgst: cgst || 0,
            sgst: sgst || 0,
            deliveryFee: deliveryFee || 0,
            total: total || 0
        });
    };

    // Fetch customer profile
    useEffect(() => {
        const fetchCustomerProfile = async () => {
            try {
                setProfileLoading(true);
                const customerId = user?.uid || user?.id;
                const authToken = localStorage.getItem('token');

                const headers = {
                    'Content-Type': 'application/json',
                };

                if (authToken) {
                    headers['Authorization'] = `Bearer ${authToken}`;
                }

                const response = await fetch(`${baseurl}/api/customer-profile/${customerId}`, {
                    method: 'GET',
                    headers: headers,
                });

                if (response.ok) {
                    const data = await response.json();
                    setDeliveryDetails(prev => ({
                        ...prev,
                        institution_name: data.data.institution_name || '',
                        institution_type: data.data.institution_type || '',
                        address: data.data.address || '',
                        city: data.data.city || '',
                        state: data.data.state || '',
                        postal_code: data.data.postal_code || '',
                        contact_person_name: data.data.contact_person_name || '',
                        contact_person_email: data.data.contact_person_email || '',
                        contact_person_phone: data.data.contact_person_phone || ''
                    }));
                }
            } catch (error) {
                console.error('Error fetching customer profile:', error);
                setSnackbar({
                    open: true,
                    message: 'Failed to load profile details. Please fill in the delivery details manually.',
                    severity: 'warning'
                });
            } finally {
                setProfileLoading(false);
            }
        };

        if (user) {
            fetchCustomerProfile();
        }
    }, [user]);

    const handleInputChange = (field) => (event) => {
        setDeliveryDetails({
            ...deliveryDetails,
            [field]: event.target.value
        });
    };

    const handlePlaceOrder = async () => {
        try {
            setLoading(true);

            // Get current date and time
            const now = new Date();
            const orderDate = now.toISOString().split('T')[0];

            // Set delivery date to tomorrow
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const deliveryDate = tomorrow.toISOString().split('T')[0];

            const response = await fetch(`${baseurl}/api/order/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cpid: user?.uid || user?.id,
                    order_date: orderDate,
                    status: "New Order",
                    delivery_date: deliveryDate,
                    delivery_time: "14:00",
                    special_instructions: deliveryDetails.special_instructions,
                    total_amount: priceDetails.total,
                    payment_method: "cash on delivery",
                    address: deliveryDetails.address,
                    city: deliveryDetails.city,
                    state: deliveryDetails.state,
                    postal_code: deliveryDetails.postal_code,
                    delivery_contact_name: deliveryDetails.contact_person_name,
                    delivery_contact_phone: deliveryDetails.contact_person_phone,
                    order_items: cartItems.map(item => ({
                        product_id: item.id,
                        quantity: quantities[item.id] || 1,
                        unit_price: item.price,
                        line_total: item.price * (quantities[item.id] || 1),
                        notes: item.notes || ''
                    })),
                })
            });

            if (response.ok) {
                const data = await response.json();

                // Clear cart items after successful order
                const customerId = user?.uid || user?.id;
                const authToken = localStorage.getItem('token');

                const clearCartResponse = await fetch(`${baseurl}/api/cart/delete-all/${customerId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (clearCartResponse.ok) {
                    // Update cart count to 0
                    updateCartCount(0);

                    setSnackbar({
                        open: true,
                        message: 'Order placed successfully!',
                        severity: 'success'
                    });

                    // Navigate to order confirmation page with complete order details
                    navigate('/order-conformation', {
                        state: {
                            orderDetails: {
                                orderId: data.data.oid,
                                orderDate: orderDate,
                                deliveryDate: deliveryDate,
                                deliveryTime: "14:00",
                                status: "New Order",
                                total_amount: priceDetails.total,
                                paymentMethod: "cash on delivery",
                                specialInstructions: deliveryDetails.special_instructions,
                                deliveryAddress: {
                                    address: deliveryDetails.address,
                                    city: deliveryDetails.city,
                                    state: deliveryDetails.state,
                                    postalCode: deliveryDetails.postal_code,
                                    contactName: deliveryDetails.contact_person_name,
                                    contactPhone: deliveryDetails.contact_person_phone
                                },
                                items: cartItems.map(item => ({
                                    id: item.id,
                                    name: item.name,
                                    price: item.price,
                                    quantity: quantities[item.id] || 1,
                                    total: item.price * (quantities[item.id] || 1)
                                })),
                                priceBreakdown: {
                                    subtotal: priceDetails.subtotal,
                                    deliveryFee: priceDetails.deliveryFee,
                                    cgst: priceDetails.cgst,
                                    sgst: priceDetails.sgst,
                                    total_amount: priceDetails.total
                                }
                            }
                        }
                    });
                } else {
                    throw new Error('Failed to clear cart');
                }
            } else {
                throw new Error('Failed to place order');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            setSnackbar({
                open: true,
                message: 'Failed to place order. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const hasMissingDetails = !deliveryDetails.institution_name ||
        !deliveryDetails.institution_type ||
        !deliveryDetails.address ||
        !deliveryDetails.city ||
        !deliveryDetails.state ||
        !deliveryDetails.postal_code ||
        !deliveryDetails.contact_person_name ||
        !deliveryDetails.contact_person_email ||
        !deliveryDetails.contact_person_phone;

    return (
        <Box sx={{ pb: 8 }}>
            {/* Header */}
            <Box
                sx={{
                    bgcolor: '#00B074',
                    color: '#fff',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Typography fontWeight={600} fontSize={18}>
                    Checkout
                </Typography>
            </Box>

            {/* Content */}
            <Box sx={{ p: 2 }}>
                {/* Delivery Details */}
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 3, background: '#f9f9fb' }}>
                    <Typography
                        variant="h5"
                        fontWeight={600}
                        mb={2}
                        sx={{
                            fontSize: '1.5rem',
                            color: '#333'
                        }}
                    >
                        Delivery Details
                    </Typography>
                    {profileLoading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : hasMissingDetails ? (
                        <Box>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Delivery Address"
                                value={`${deliveryDetails.institution_name}, ${deliveryDetails.address}, ${deliveryDetails.city}, ${deliveryDetails.state} - ${deliveryDetails.postal_code}`}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setDeliveryDetails(prev => ({
                                        ...prev,
                                        address: value
                                    }));
                                }}
                                variant="outlined"
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Contact Name"
                                value={deliveryDetails.contact_person_name}
                                onChange={handleInputChange('contact_person_name')}
                                variant="outlined"
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Contact Phone"
                                value={deliveryDetails.contact_person_phone}
                                onChange={handleInputChange('contact_person_phone')}
                                variant="outlined"
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Special Instructions (Optional)"
                                value={deliveryDetails.special_instructions}
                                onChange={handleInputChange('special_instructions')}
                                variant="outlined"
                                multiline
                                rows={2}
                            />
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="body1" gutterBottom>
                                <strong>Delivery Address:</strong> {deliveryDetails.institution_name}, {deliveryDetails.address}, {deliveryDetails.city}, {deliveryDetails.state} - {deliveryDetails.postal_code}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>Contact Name:</strong> {deliveryDetails.contact_person_name}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>Contact Phone:</strong> {deliveryDetails.contact_person_phone}
                            </Typography>
                            <TextField
                                fullWidth
                                label="Special Instructions (Optional)"
                                value={deliveryDetails.special_instructions}
                                onChange={handleInputChange('special_instructions')}
                                variant="outlined"
                                multiline
                                rows={2}
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    )}
                </Paper>

                {/* Order Summary */}
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 3, background: '#f9f9fb' }}>
                    <Typography fontWeight={600} mb={2}>
                        Order Summary
                    </Typography>
                    {cartItems.map(item => (
                        <Box key={item.id} display="flex" justifyContent="space-between" mb={1}>
                            <Typography>
                                {item.name} ({quantities[item.id] || 0} kg)
                            </Typography>
                            <Typography>₹{((item.price || 0) * (quantities[item.id] || 0)).toFixed(2)}</Typography>
                        </Box>
                    ))}
                </Paper>

                {/* Price Details */}
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 3, background: '#f9f9fb' }}>
                    <Typography fontWeight={600} mb={1}>Price Details</Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Subtotal</Typography>
                        <Typography>₹{(priceDetails.subtotal || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>Delivery Fee</Typography>
                        <Typography>₹{(priceDetails.deliveryFee || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>CGST</Typography>
                        <Typography>₹{(priceDetails.cgst || 0).toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>SGST</Typography>
                        <Typography>₹{(priceDetails.sgst || 0).toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between">
                        <Typography fontWeight={600}>Total</Typography>
                        <Typography fontWeight={600}>₹{(priceDetails.total || 0).toFixed(2)}</Typography>
                    </Box>
                </Paper>

                {/* Place Order Button */}
                <Button
                    fullWidth
                    variant="contained"
                    sx={{
                        backgroundColor: '#00B76F',
                        borderRadius: 2,
                        py: 1.5,
                        fontWeight: 600,
                        fontSize: '1rem',
                        mb: 2,
                        '&:hover': { backgroundColor: '#00a364' },
                        '&:disabled': { backgroundColor: '#cccccc' }
                    }}
                    onClick={handlePlaceOrder}
                    disabled={loading || (hasMissingDetails && !profileLoading)}
                >
                    {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
            </Box>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Fixed Bottom Navigation */}
            <Paper sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000
            }} elevation={3}>
                <Footer />
            </Paper>
        </Box>
    );
};

export default Checkout;