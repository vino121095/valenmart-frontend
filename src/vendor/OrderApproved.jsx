import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  BottomNavigation,
  Paper,
  Container,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import VendorFooter from '../vendorfooter';


const OrderApproved = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleTrackOrder = () => {
    navigate('/Pickupdetails'); // remove `.jsx` from route path
  };

  return (
    <Box sx={{ bgcolor: '#F4F4F6', minHeight: '100vh', pb: 10 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: '#00A86B',
          color: '#fff',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton
          onClick={handleBack}
          sx={{
            backgroundColor: '#FFFFFF4D',
            color: 'white',
            borderRadius: '50%',
            p: 1,
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight="bold">
          Order Approved
        </Typography>
      </Box>

      {/* Main Content */}
      <Container sx={{ pt: 2 }}>
        {/* Status Card */}
       <Box m={2} p={3} bgcolor="white" borderRadius={2} textAlign="center">
            <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width={72}
            height={72}
            bgcolor="#00A86B1A" // light green with transparency (10% opacity)
            borderRadius="50%"
            mx="auto"
            mt={2}
            >
            <CheckCircleIcon sx={{ fontSize: 48, color: '#00A86B', width: 62, height: 62 }} />
            </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Order Approved!
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>
            Your order #4582 has been successfully approved and will be prepared.
          </Typography>

          <Box
            sx={{
              bgcolor: '#E4FCEB',
              color: '#00A86B',
              display: 'inline-block',
              px: 2,
              py: 0.5,
              borderRadius: 4,
              fontWeight: 500,
              mb: 1,
            }}
          >
            Ready for Pickup at 2:30 PM
          </Box>

          <Typography sx={{ color: 'text.secondary', mt: 1 }}>
            You’ll receive a notification when it’s ready.
          </Typography>
        </Box>

        {/* Order Timeline */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 2,
            p: 2,
            mb: 3,
          }}
        >
          <Typography fontWeight="bold" mb={2}>
            Order Timeline
          </Typography>

          {/* Step 1 */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: '#00A86B',
                width: 24,
                height: 24,
                mr: 2,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Box>
              <Typography fontWeight="bold">Order Received</Typography>
              <Typography variant="body2" color="text.secondary">
                Today, 10:30 AM
              </Typography>
            </Box>
          </Box>

          {/* Step 2 */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: '#00A86B',
                width: 24,
                height: 24,
                mr: 2,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Box>
              <Typography fontWeight="bold">Order Approved</Typography>
              <Typography variant="body2" color="text.secondary">
                Today, 11:25 AM
              </Typography>
            </Box>
          </Box>

          {/* Step 3 */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Avatar
              sx={{
                bgcolor: '#E0E0E0',
                width: 24,
                height: 24,
                mr: 2,
              }}
            />
            <Box>
              <Typography fontWeight="bold" color="text.secondary">
                Ready for Pickup
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today, 2:30 PM (Estimated)
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box display="flex" gap={2}>
          <Button
            onClick={handleTrackOrder}
            variant="contained"
            sx={{ bgcolor: '#00A86B', color: 'white', flex: 1 }}
          >
            Track Order
          </Button>
          <Button
            onClick={() => navigate('/orders')}
            variant="contained"
            sx={{ bgcolor: '#E0E0E0', color: '#424242', flex: 1 }}
          >
            Back to Orders
          </Button>
        </Box>
      </Container>

      {/* Bottom Navigation */}
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

export default OrderApproved;
