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
    CircularProgress,
    IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../Footer';
import baseurl from '../baseurl/ApiService';
import { useAuth } from '../App';
import { useCart } from '../context/CartContext';
import ArrowBack from '@mui/icons-material/ArrowBack';

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
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
    const [showAddAddressForm, setShowAddAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
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

    // On profile load, set addresses array with profile address as first element
    useEffect(() => {
        if (!profileLoading && user) {
            setAddresses([deliveryDetails]);
            setSelectedAddressIndex(0);
        }
        // eslint-disable-next-line
    }, [profileLoading]);

    // Add useEffect to fetch previous order addresses
    useEffect(() => {
        const fetchPreviousAddresses = async () => {
            if (!user) return;
            try {
                const authToken = localStorage.getItem('token');
                const customerId = user?.uid || user?.id;
                const response = await fetch(`${baseurl}/api/order/customer/${customerId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    const orders = data.data || [];
                    // Extract address fields from each order
                    const prevAddresses = orders.map(order => ({
                        institution_name: order.institution_name || '',
                        institution_type: order.institution_type || '',
                        address: order.address || '',
                        city: order.city || '',
                        state: order.state || '',
                        postal_code: order.postal_code || '',
                        contact_person_name: order.delivery_contact_name || order.contact_person_name || '',
                        contact_person_email: order.contact_person_email || '',
                        contact_person_phone: order.delivery_contact_phone || order.contact_person_phone || '',
                        special_instructions: order.special_instructions || ''
                    }));
                    // Deduplicate addresses (by address+city+state+postal_code+contact_person_name+contact_person_phone)
                    const uniqueAddresses = [];
                    const seen = new Set();
                    // Get the current profile address for comparison
                    const profileAddr = addresses[0] || deliveryDetails;
                    prevAddresses.forEach(addr => {
                        const key = `${addr.institution_name}|${addr.institution_type}|${addr.address}|${addr.city}|${addr.state}|${addr.postal_code}|${addr.contact_person_name}|${addr.contact_person_phone}`;
                        // Compare with profile address
                        const isSameAsProfile = (
                            addr.institution_name === profileAddr.institution_name &&
                            addr.institution_type === profileAddr.institution_type &&
                            addr.address === profileAddr.address &&
                            addr.city === profileAddr.city &&
                            addr.state === profileAddr.state &&
                            addr.postal_code === profileAddr.postal_code &&
                            addr.contact_person_name === profileAddr.contact_person_name &&
                            addr.contact_person_phone === profileAddr.contact_person_phone
                        );
                        if (!seen.has(key) && !isSameAsProfile && addr.address && addr.city && addr.state && addr.postal_code) {
                            seen.add(key);
                            uniqueAddresses.push(addr);
                        }
                    });
                    // Add to addresses list (after profile address, before new addresses)
                    setAddresses(prev => {
                        const profileAddr = prev[0] || deliveryDetails;
                        const newAddresses = prev.slice(1 + uniqueAddresses.length);
                        return [profileAddr, ...uniqueAddresses, ...newAddresses];
                    });
                }
            } catch (err) {
                // Ignore errors for previous addresses
            }
        };
        fetchPreviousAddresses();
        // eslint-disable-next-line
    }, [user, profileLoading]);

    const handleInputChange = (field) => (event) => {
        setDeliveryDetails({
            ...deliveryDetails,
            [field]: event.target.value
        });
    };

    const handleNewAddressInputChange = (field) => (event) => {
        setNewAddress({
            ...newAddress,
            [field]: event.target.value
        });
    };

    const handleAddAddress = () => {
        setAddresses(prev => [...prev, newAddress]);
        setShowAddAddressForm(false);
        setNewAddress({
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
        setSelectedAddressIndex(addresses.length); // Select the newly added address
    };

    const getSelectedDeliveryDetails = () => {
        return addresses[selectedAddressIndex] || deliveryDetails;
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

            const selectedDetails = getSelectedDeliveryDetails();

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
                    special_instructions: selectedDetails.special_instructions,
                    total_amount: priceDetails.total,
                    payment_method: "cash on delivery",
                    address: selectedDetails.address,
                    city: selectedDetails.city,
                    state: selectedDetails.state,
                    postal_code: selectedDetails.postal_code,
                    delivery_contact_name: selectedDetails.contact_person_name,
                    delivery_contact_phone: selectedDetails.contact_person_phone,
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
                                specialInstructions: selectedDetails.special_instructions,
                                deliveryAddress: {
                                    address: selectedDetails.address,
                                    city: selectedDetails.city,
                                    state: selectedDetails.state,
                                    postalCode: selectedDetails.postal_code,
                                    contactName: selectedDetails.contact_person_name,
                                    contactPhone: selectedDetails.contact_person_phone
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={() => navigate(-1)} sx={{ color: '#fff', mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography fontWeight={600} fontSize={18}>
                        Checkout
                    </Typography>
                </Box>
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
                    {/* Address list with radio buttons */}
                    {addresses.length === 0 && profileLoading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box>
                            {addresses.map((addr, idx) => (
                                <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, background: idx === 0 ? '#f5fff5' : '#f9f9fb', display: 'flex', alignItems: 'flex-start' }}>
                                    <input
                                        type="radio"
                                        checked={selectedAddressIndex === idx}
                                        onChange={() => setSelectedAddressIndex(idx)}
                                        style={{ marginTop: 6, marginRight: 12 }}
                                    />
                                    <Box>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Delivery Address:</strong> {addr.institution_name}, {addr.address}, {addr.city}, {addr.state} - {addr.postal_code}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Contact Name:</strong> {addr.contact_person_name}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Contact Phone:</strong> {addr.contact_person_phone}
                                        </Typography>
                                        {addr.special_instructions && (
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Instructions:</strong> {addr.special_instructions}
                                            </Typography>
                                        )}
                                        {idx === 0 && <Typography variant="caption" color="success.main">(Profile Address)</Typography>}
                                    </Box>
                                </Box>
                            ))}
                            {/* Add Address Button */}
                            {!showAddAddressForm && (
                                <Button variant="outlined" onClick={() => setShowAddAddressForm(true)} sx={{ mt: 1 }}>
                                    Add Address
                                </Button>
                            )}
                            {/* Add Address Form */}
                            {showAddAddressForm && (
                                <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, background: '#fff' }}>
                                    <TextField
                                        fullWidth
                                        label="Institution Name"
                                        value={newAddress.institution_name}
                                        onChange={handleNewAddressInputChange('institution_name')}
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Institution Type"
                                        value={newAddress.institution_type}
                                        onChange={handleNewAddressInputChange('institution_type')}
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Delivery Address"
                                        value={newAddress.address}
                                        onChange={handleNewAddressInputChange('address')}
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="City"
                                        value={newAddress.city}
                                        onChange={handleNewAddressInputChange('city')}
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="State"
                                        value={newAddress.state}
                                        onChange={handleNewAddressInputChange('state')}
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Postal Code"
                                        value={newAddress.postal_code}
                                        onChange={handleNewAddressInputChange('postal_code')}
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Contact Name"
                                        value={newAddress.contact_person_name}
                                        onChange={handleNewAddressInputChange('contact_person_name')}
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Contact Email"
                                        value={newAddress.contact_person_email}
                                        onChange={handleNewAddressInputChange('contact_person_email')}
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Contact Phone"
                                        value={newAddress.contact_person_phone}
                                        onChange={handleNewAddressInputChange('contact_person_phone')}
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Special Instructions (Optional)"
                                        value={newAddress.special_instructions}
                                        onChange={handleNewAddressInputChange('special_instructions')}
                                        variant="outlined"
                                        multiline
                                        rows={2}
                                        sx={{ mb: 2 }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button variant="contained" onClick={handleAddAddress}>
                                            Save Address
                                        </Button>
                                        <Button variant="text" color="error" onClick={() => setShowAddAddressForm(false)}>
                                            Cancel
                                        </Button>
                                    </Box>
                                </Box>
                            )}
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