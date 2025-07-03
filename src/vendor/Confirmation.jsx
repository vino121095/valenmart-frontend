import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  BottomNavigation,
  Paper,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useLocation, useNavigate } from 'react-router-dom';
import VendorFooter from '../vendorfooter';

const Confirmation = () => {
  const location = useLocation();
  const products = location.state?.products || [];

  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box bgcolor="#F4F4F6" minHeight="100vh" pb={10}>
      {/* Header */}
      <Box
        bgcolor="#00A86B"
        color="white"
        px={2}
        py={2}
        display="flex"
        alignItems="center"
      >
        <IconButton
          onClick={handleBack}
          sx={{
            backgroundColor: '#FFFFFF4D',
            color: 'white',
            borderRadius: '50%',
            p: 1,
            mr: 1,
            cursor: 'pointer',
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 28 }} />
        </IconButton>
        <Typography variant="h6" fontWeight="bold">
          Confirmation
        </Typography>
      </Box>

      {/* Success Section */}
      <Box m={2} p={3} bgcolor="white" borderRadius={2} textAlign="center">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          width={72}
          height={72}
          bgcolor="#00A86B1A"
          borderRadius="50%"
          mx="auto"
          mt={2}
        >
          <CheckCircleIcon sx={{ fontSize: 48, color: '#00A86B' }} />
        </Box>
        <Typography variant="h6" fontWeight="bold" mt={2}>
          Product Submitted
        </Typography>
        <Typography color="text.secondary">
          Your product has been sent for admin approval
        </Typography>
      </Box>

      {/* Product Summary */}
      <Box mx={2} my={1} p={2} bgcolor="white" borderRadius={2}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          Product Summary
        </Typography>
        {products.map((product, index) => (
          <Box key={index} mb={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                variant="rounded"
                src={product.image || 'https://via.placeholder.com/60x60.png?text=Item'}
                sx={{ width: 60, height: 60 }}
              />
              <Box>
                <Typography fontWeight="bold">{product.name}</Typography>
                <Typography color="text.secondary" fontSize="14px">
                  Category: {product.category}
                </Typography>
                <Typography fontSize="14px">{product.stock} kg</Typography>
              </Box>
            </Stack>
            <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
              <Chip label="Pending" sx={{ bgcolor: '#FFF7E0', color: '#FFB300' }} />
              <Typography fontSize="13px" color="text.secondary">
                Expected response within 24 hours
              </Typography>
            </Box>
            <Box mt={1} display="flex" justifyContent="space-between">
              <Typography fontSize="13px" color="text.secondary">
                Request ID: #{Math.floor(100000 + Math.random() * 900000)}
              </Typography>
              <Typography fontSize="13px" color="#00A86B">
                Submitted: Just now
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

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

export default Confirmation;
