import React from 'react';
import { AppBar, Box, Button, Card, CardContent, Container, Grid, IconButton, Step, StepLabel, Stepper, Typography, Avatar, Chip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const orderDetails = {
  orderId: '#9283',
  type: 'Pickup',
  location: 'Green Basket Farms',
  address: '123 Farm Road',
  contact: '+91 98765 43210',
  time: '10:30 AM - 11:00 AM',
  items: [
    { name: 'Organic Tomatoes', qty: '5 kg', count: 5 },
    { name: 'Fresh Spinach', qty: '3 bunches', count: 3 },
    { name: 'Bell Peppers', qty: '2 kg (mixed colors)', count: 2 },
  ],
  currentStep: 2,
};

const steps = ['Accepted', 'Out for Pickup', 'Picked', 'Delivered'];

export default function DriverOrder() {
  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', pb: 7 }}>
      <Box sx={{ bgcolor: '#2bb673', color: 'white', p: 2 }}>
        <Grid container alignItems="center">
          <IconButton color="inherit">
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" ml={1}>Order Details</Typography>
        </Grid>
      </Box>

      <Container sx={{ mt: 2 }}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle1">Order {orderDetails.orderId}</Typography>
                <Typography variant="body2">{orderDetails.location}</Typography>
                <Typography variant="body2" color="text.secondary">{orderDetails.address}</Typography>
                <Typography variant="body2">Contact: {orderDetails.contact}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{orderDetails.time}</Typography>
              </Box>
              <Avatar
                src="https://via.placeholder.com/60"
                variant="rounded"
                sx={{ width: 60, height: 60 }}
              />
            </Grid>
            <Chip label={orderDetails.type} size="small" color="warning" sx={{ mt: 1 }} />
          </CardContent>
        </Card>

        <Box sx={{ bgcolor: '#e7f5e8', borderRadius: 2, p: 2, mb: 2 }}>
          <Typography variant="caption" display="block" gutterBottom>You → Farm</Typography>
          <Box height={120} display="flex" justifyContent="center" alignItems="center">
            <Typography>📍 You ———— 🚜 Farm</Typography>
          </Box>
          <Button variant="outlined" fullWidth>Directions</Button>
        </Box>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Items to Pickup</Typography>
            {orderDetails.items.map((item, idx) => (
              <Box key={idx} display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1, p: 1, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                <Chip label={item.count} size="small" color="success" />
                <Box flex={1} ml={2}>
                  <Typography variant="body2">{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.qty}</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Update Status</Typography>
            <Stepper activeStep={orderDetails.currentStep} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={index}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Typography align="center" variant="caption" display="block" sx={{ mt: 1 }}>Current: {steps[orderDetails.currentStep]}</Typography>
          </CardContent>
        </Card>

        <Button variant="contained" color="success" fullWidth>
          Picked from Vendor
        </Button>
      </Container>
    </Box>
  );
}
