import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    AppBar,
    IconButton,
    Snackbar,
    Alert
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../Header';
import baseurl from '../baseurl/ApiService';

const OrderConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderDetails } = location.state || {};
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleTrackOrder = () => {
        // console.log('Navigating to order status with order:', orderDetails);
        navigate('/order-status', {
            state: {
                orderId: orderDetails?.orderId,
                status: orderDetails?.status,
                deliveryDate: orderDetails?.deliveryDate,
                deliveryTime: orderDetails?.deliveryTime
            }
        });
    };

    return (
        <Box>
            <Header />

            {/* Success Icon */}
            <Box display="flex" justifyContent="center" my={3}>
                <Box
                    sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        backgroundColor: '#E2F7EC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <CheckCircleIcon sx={{ fontSize: 60, color: '#00B76F' }} />
                </Box>
            </Box>

            {/* Confirmation Message */}
            <Typography variant="h6" fontWeight={600} align="center">
                Order Placed Successfully!
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" mb={3}>
                Your order <b>#{orderDetails?.orderId}</b> has been confirmed
            </Typography>

            {/* Order Details */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 2, background: '#f9f9fb' }}>
                <Typography fontWeight={600} mb={1}>
                    Order Details
                </Typography>
                {orderDetails?.items?.map(item => (
                    <Box key={item.id} display="flex" justifyContent="space-between" mb={1}>
                        <Typography>
                            {item.name} ({item.quantity || 0} kg)
                        </Typography>
                        <Typography>₹{(item.total || 0).toFixed(2)}</Typography>
                    </Box>
                ))}
                <Typography fontWeight={600} mt={2} mb={1}>
                    Delivery Address
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    {orderDetails?.deliveryAddress?.address}, {orderDetails?.deliveryAddress?.city}, {orderDetails?.deliveryAddress?.state} - {orderDetails?.deliveryAddress?.postalCode}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Contact: {orderDetails?.deliveryAddress?.contactName} ({orderDetails?.deliveryAddress?.contactPhone})
                </Typography>
                {orderDetails?.specialInstructions && (
                    <>
                        <Typography fontWeight={600} mt={2} mb={1}>
                            Special Instructions
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            {orderDetails.specialInstructions}
                        </Typography>
                    </>
                )}
                <Box display="flex" justifyContent="space-between" mt={2}>
                    <Typography>Subtotal</Typography>
                    <Typography>₹{(orderDetails?.priceBreakdown?.subtotal || 0).toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                    <Typography>Delivery Fee</Typography>
                    <Typography>₹{(orderDetails?.priceBreakdown?.deliveryFee || 0).toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                    <Typography>Taxes</Typography>
                    <Typography>₹{((orderDetails?.priceBreakdown?.cgst || 0) + (orderDetails?.priceBreakdown?.sgst || 0)).toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography fontWeight={600}>Total</Typography>
                    <Typography fontWeight={600}>₹{(orderDetails?.priceBreakdown?.total_amount|| 0).toFixed(2)}</Typography>
                </Box>
            </Paper>

            {/* Estimated Delivery */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 3, background: '#f9f9fb' }}>
                <Typography fontWeight={600} mb={1}>
                    Estimated Delivery
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {orderDetails?.deliveryDate} | {orderDetails?.deliveryTime}
                </Typography>
            </Paper>

            {/* Action Buttons */}
            <Box display="flex" gap={2}>
                <Button
                    fullWidth
                    variant="contained"
                    sx={{
                        backgroundColor: '#00B76F',
                        fontWeight: 600,
                        py: 1.3,
                        borderRadius: 2,
                        '&:hover': {
                            backgroundColor: '#00a364',
                        },
                    }}
                    onClick={handleTrackOrder}
                >
                    Track Order
                </Button>
                <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                        fontWeight: 600,
                        py: 1.3,
                        borderRadius: 2,
                        color: 'gray',
                        borderColor: 'gray',
                    }}
                    onClick={() => navigate('/')}
                >
                    Continue Shopping
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
        </Box>
    );
};

export default OrderConfirmation;