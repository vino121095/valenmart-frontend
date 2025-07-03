import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Divider,
    Avatar,
    AppBar,
    IconButton,
    Button,
    Snackbar,
    Alert,
    CircularProgress,
    BottomNavigation
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';
import baseurl from '../baseurl/ApiService';

const OrderStatus = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId, status: initialStatus } = location.state || {};
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                console.log('No orderId provided');
                setError('No order ID provided');
                setLoading(false);
                return;
            }

            try {
                const authToken = localStorage.getItem('token');
                console.log('Fetching order details for ID:', orderId);

                const response = await fetch(`${baseurl}/api/order/${orderId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch order details');
                }

                const responseData = await response.json();
                // console.log('API Response Data:', responseData);
                
                // Check if the response has data property
                const data = responseData.data || responseData;
                console.log('Order Details:', data);
                
                if (!data) {
                    throw new Error('No order data received');
                }

                setOrderDetails(data);
            } catch (error) {
                console.error('Error fetching order details:', error);
                setError('Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    // Get current step based on order status
    const getCurrentStep = (status) => {
        if (!status) return 0;
        
        const statusMap = {
            'new order': 0,
            'out for delivery': 2,
            'shipping': 3,
            'delivered': 4
        };
        
        return statusMap[status.toLowerCase()] || 0;
    };

    const steps = [
        {
            title: 'Order Confirmed',
            subtitle: 'Your Order has been confirmed',
            completed: true,
        },
        {
            title: 'Preparing Order',
            subtitle: 'Your Items are being packed',
            completed: true,
        },
        {
            title: 'Out for Delivery',
            completed: false,
        },
        {
            title: 'Order Shipping',
            subtitle: 'Your Order has been shipped',
            completed: false,
        },
        {
            title: 'Delivered',
            subtitle: 'Order has been delivered',
            completed: false,
        }
    ];

    // Update steps based on current order status
    const currentStep = orderDetails ? getCurrentStep(orderDetails.status) : getCurrentStep(initialStatus);
    console.log('Current Step:', currentStep, 'Order Status:', orderDetails?.status || initialStatus);

    steps.forEach((step, index) => {
        step.completed = index <= currentStep;
    });

    const handleFinishOrder = async () => {
        try {
            const authToken = localStorage.getItem('token');
            const response = await fetch(`${baseurl}/api/order/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    status: 'Delivered'
                })
            });

            if (response.ok) {
                setSnackbar({
                    open: true,
                    message: 'Order status updated successfully!',
                    severity: 'success'
                });
                // Refresh order details
                const updatedData = await response.json();
                setOrderDetails(updatedData);
            } else {
                throw new Error('Failed to update order status');
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to update order status. Please try again.',
                severity: 'error'
            });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                gap: 2
            }}>
                <CircularProgress sx={{ color: '#00B074' }} />
                <Typography>Loading order details...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">{error}</Alert>
                <Button 
                    onClick={() => navigate(-1)}
                    sx={{ mt: 2 }}
                    variant="contained"
                >
                    Go Back
                </Button>
            </Box>
        );
    }

    if (!orderDetails) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="warning">No order details found</Alert>
                <Button 
                    onClick={() => navigate(-1)}
                    sx={{ mt: 2 }}
                    variant="contained"
                >
                    Go Back
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 7 }}>
            <Header/>

            {/* Order ID */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 2, backgroundColor: '#f9f9fb' }}>
                <Typography fontWeight={600}>
                    Order ID: <span style={{ color: '#333' }}>#{orderDetails?.order_id}</span>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Placed on {new Date(orderDetails?.order_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </Typography>
            </Paper>

            {/* Timeline Steps */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 3, backgroundColor: '#f9f9fb' }}>
                {steps.map((step, index) => (
                    <Box key={index} display="flex" alignItems="flex-start" position="relative" pb={index !== steps.length - 1 ? 3 : 0}>
                        {/* Line */}
                        {index !== steps.length - 1 && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: 14,
                                    top: 24,
                                    bottom: 0,
                                    width: '2px',
                                    backgroundColor: step.completed ? '#00B76F' : '#E0E0E0',
                                }}
                            />
                        )}

                        {/* Status Icon */}
                        <Avatar
                            sx={{
                                bgcolor: step.completed ? '#E2F7EC' : '#E0E0E0',
                                width: 28,
                                height: 28,
                                mt: '2px',
                            }}
                        >
                            {step.completed ? (
                                <CheckCircleIcon sx={{ fontSize: 20, color: '#00B76F' }} />
                            ) : (
                                <FiberManualRecordIcon sx={{ fontSize: 14, color: '#BDBDBD' }} />
                            )}
                        </Avatar>

                        {/* Text */}
                        <Box ml={2}>
                            <Typography fontWeight={600}>{step.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {step.subtitle}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Paper>

            {/* Order Summary */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 3, backgroundColor: '#f9f9fb' }}>
                <Typography fontWeight={600} mb={1}>
                    Order Details
                </Typography>
                {orderDetails?.OrderItems?.map(item => (
                    <Typography key={item.order_item_id}>
                        {item.Product?.product_name} ({item.quantity} {item.Product?.unit || 'units'})
                    </Typography>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                    <Typography fontWeight={600}>Total: ₹{orderDetails?.total_amount?.toFixed(2)}</Typography>
                </Box>
            </Paper>

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

            {/* Footer */}
            <Paper
                sx={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                }}
                elevation={3}
            >
                <BottomNavigation showLabels sx={{ backgroundColor: "#f5f5f5" }}>
                    <Footer />
                </BottomNavigation>
            </Paper>
        </Box>
    );
};

export default OrderStatus;
