import {
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Chip,
  Paper,
  BottomNavigation,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import VendorFooter from '../vendorfooter';

const Pickupdetails = () => {
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmReady = () => {
    setOpenDialog(false);
    console.log('Items marked as ready');
    // You can add success snackbar or redirection here
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
          Pickup Details
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2 }}>
        {/* Order Info */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 2,
            p: 3,
            mb: 2,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography fontWeight="bold">Order #4570</Typography>
            <Typography color="text.secondary">Today</Typography>
          </Box>

          <Chip
            label="Preparing"
            size="small"
            sx={{
              bgcolor: '#FFEFD5',
              color: '#CC8400',
              mt: 1,
              fontWeight: 500,
            }}
          />

          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="text.secondary">Pickup Time</Typography>
            <Typography fontWeight="bold">Today, 2:30 PM</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="text.secondary">Total Weight</Typography>
            <Typography fontWeight="bold">24.5 kg</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="text.secondary">Total Items</Typography>
            <Typography fontWeight="bold">8 items</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography color="text.secondary">Admin Contact</Typography>
            <Typography fontWeight="bold">Ram Kumar</Typography>
          </Box>
        </Box>

        {/* Order Items */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 2,
            p: 2,
            mb: 2,
          }}
        >
          <Typography fontWeight="bold" mb={2}>
            Order Items
          </Typography>

          {[['Carrots', '2 Kg'], ['Tomatoes', '7.5 Kg'], ['Onions', '10 Kg'], ['Spinach', '3 Kg'],
            ['Capsicum', '4 Kg'], ['Potatoes', '8 Kg'], ['Cabbage', '5 Kg'], ['Green Chilly', '2 Kg']]
            .map(([item, qty], index) => (
              <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                <Typography color="text.secondary">{item}</Typography>
                <Typography fontWeight="bold">{qty}</Typography>
              </Box>
          ))}
        </Box>

        {/* Confirmation Prompt */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 2,
            p: 2,
            mb: 2,
          }}
        >
          <Typography fontWeight="bold">
            Confirm Items Ready for Pickup?
          </Typography>
          <Typography color="text.secondary" fontSize={14}>
            This will notify the admin that items are ready
          </Typography>
        </Box>

        {/* Buttons */}
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            sx={{ bgcolor: '#E0E0E0', color: '#424242', flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#00A86B', color: 'white', flex: 1 }}
            onClick={handleOpenDialog}
          >
            Mark Ready
          </Button>
        </Box>
      </Box>

      {/* Confirmation Dialog */}

<Dialog
  open={openDialog}
  onClose={handleCloseDialog}
  PaperProps={{
    sx: { p:1, textAlign: 'center', borderRadius: 3 },
  }}
>
  <Box m={1} p={1} bgcolor="white" borderRadius={2} textAlign="center">
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width={72}
      height={72}
      bgcolor="#00A86B1A" // light green with transparency
      borderRadius="50%"
      mx="auto"
      mt={2}
    >
      <CheckCircleIcon sx={{ fontSize: 48, color: '#00A86B' }} />
    </Box>
    <DialogTitle>Items marked as Ready!</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Admin has been notified successfully.
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ justifyContent: 'center', mt: 1 }}>
      <Button
        onClick={handleConfirmReady}
        variant="contained"
        sx={{ bgcolor: '#00A86B', color: 'white' }}
      >
        Done
      </Button>
    </DialogActions>
  </Box>
</Dialog>

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

export default Pickupdetails;
