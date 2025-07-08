import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  BottomNavigation
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VendorFooter from '../vendorfooter';
import baseurl from '../baseurl/ApiService';

const AvailableStock = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${baseurl}/api/product/all`)
      .then((response) => response.json())
      .then((res) => {
        setProducts(Array.isArray(res.data) ? res.data : []);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
      });
  }, []);

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
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            sx={{
              backgroundColor: '#FFFFFF4D',
              color: 'white',
              borderRadius: '50%',
              p: 1,
            }}
            onClick={() => navigate(-1)}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">
            Available Stocks
          </Typography>
        </Box>

        <IconButton
          sx={{
            backgroundColor: '#FFFFFF4D',
            color: 'white',
            borderRadius: '50%',
            p: 1,
          }}
        >
          <FilterListIcon />
        </IconButton>
      </Box>

      {/* Table */}
      <Box sx={{ p: 2 }}>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#E0E0E0' }}>
                <TableCell>
                  <Typography fontWeight="bold">Vegetable</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">Qty (kg)</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">Price/kg (₹)</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight="bold">Action</Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{parseFloat(item.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Footer */}
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

export default AvailableStock;
