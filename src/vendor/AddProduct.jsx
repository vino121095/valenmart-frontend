import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  IconButton,
  Card,
  Paper,
  BottomNavigation,
  CardContent,
  Avatar,
  Grid,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import VendorFooter from '../vendorfooter';
import baseurl from '../baseurl/ApiService';

const AddProduct = () => {
  const [productData, setProductData] = useState({
    pid: 0,
    name: '',
    category: '',
    price: '',
    stock: '',
    image: null,
    imageUrl: '',
    notes: '',
    type: 'vendor', // Set default value
    cgst: 0,
    sgst: 0,
  });

  const [productList, setProductList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('productList');
    if (stored) {
      try {
        setProductList(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing stored products:', error);
        localStorage.removeItem('productList');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('productList', JSON.stringify(productList));
  }, [productList]);

  // Auto-clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch all products for dropdown
  useEffect(() => {
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
              category: item.category,
              raw: item,
            }));
          setAllProducts(formatted);
          setProductOptions(formatted);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  // When editing, ensure productData fields are in sync with product selection
  useEffect(() => {
    if (editIndex !== null && productList[editIndex]) {
      const selected = allProducts.find(p => p.name === productList[editIndex].name);
      if (selected) {
        setProductData(prev => ({
          ...prev,
          pid: selected.pid,
          name: selected.name,
          category: selected.category,
          imageUrl: selected.image,
        }));
      }
    }
    // eslint-disable-next-line
  }, [editIndex, allProducts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: (name === 'cgst' || name === 'sgst') ? Number(value) : value,
    }));
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB.');
        return;
      }

      setProductData((prev) => ({
        ...prev,
        image: file,
        imageUrl: URL.createObjectURL(file),
      }));
      setError('');
    }
  };

  const handleAddProduct = () => {
    const { name, price, stock, type } = productData;

    if (!name || !price || !stock || !type) {
      setError('Please fill all required fields (Name, Price, Stock, Type).');
      return;
    }

    if (parseFloat(price) <= 0) {
      setError('Price must be greater than 0.');
      return;
    }

    if (parseFloat(stock) <= 0) {
      setError('Stock must be greater than 0.');
      return;
    }

    const productToAdd = {
      ...productData,
      pid: productData.pid,
      price: parseFloat(price),
      stock: parseFloat(stock),
    };

    if (editIndex !== null) {
      const updatedList = [...productList];
      updatedList[editIndex] = productToAdd;
      setProductList(updatedList);
      setEditIndex(null);
      setSuccess('Product updated successfully!');
    } else {
      setProductList([...productList, productToAdd]);
      setSuccess('Product added successfully!');
    }

    setProductData({
      name: '',
      category: '',
      price: '',
      stock: '',
      image: null,
      imageUrl: '',
      notes: '',
      type: 'vendor',
      cgst: 0,
      sgst: 0,
    });
    setError('');
  };

  const handleDelete = (index) => {
    const updatedList = productList.filter((_, i) => i !== index);
    setProductList(updatedList);
    setSuccess('Product deleted successfully!');
  };

  const handleEdit = (index) => {
    setProductData(productList[index]);
    setEditIndex(index);
  };

  const handleRequestApproval = async () => {
    if (productList.length === 0) {
      setError('Please add at least one product before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const userData = localStorage.getItem('userData');
      const authToken = localStorage.getItem('token');
      const vendorId = localStorage.getItem('vendor_id');

      console.log('Debug - LocalStorage contents:');
      console.log('userData:', userData);
      console.log('authToken:', authToken);
      console.log('vendorId:', vendorId);

      if (!vendorId) {
        setError('Vendor ID not found. Please login again.');
        setIsSubmitting(false);
        return;
      }

      if (!authToken) {
        setError('Authentication token not found. Please login again.');
        setIsSubmitting(false);
        return;
      }

      // Calculate totals
      const totalItems = Math.round(productList.reduce((sum, product) => sum + parseFloat(product.stock || 0), 0));
      const totalPrice = productList.reduce((sum, product) => sum + (parseFloat(product.price || 0) * parseFloat(product.stock || 0)), 0);
      const avgPricePerUnit = productList.length > 0 ? totalPrice / totalItems : 0;
      
      // Get the most common type
      const types = productList.map(p => p.type).filter(Boolean);
      const typeCount = {};
      types.forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      const mostCommonType = Object.keys(typeCount).reduce((a, b) => 
        typeCount[a] > typeCount[b] ? a : b, 'vendor'
      );

      // Create items string
      const itemsString = JSON.stringify(productList.map(product => ({
        product_id: product.pid,
        quantity: Math.round(product.stock),
        unit_price: product.price
    })));

      // Get category
      const categories = productList.map(p => p.category).filter(Boolean);
      const category = categories.length > 0 ? categories[0] : 'General';

      // Calculate average tax rates
      const avgCGST = productList.length > 0 ? 
        productList.reduce((sum, p) => sum + (Number(p.cgst) || 0), 0) / productList.length : 0;
      const avgSGST = productList.length > 0 ? 
        productList.reduce((sum, p) => sum + (Number(p.sgst) || 0), 0) / productList.length : 0;

      // Create FormData
      const formData = new FormData();
      
      // Add required fields
      const today = new Date();
      const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      formData.append('order_date', today.toISOString().split('T')[0]);
      formData.append('expected_delivery_date', deliveryDate.toISOString().split('T')[0]);
      formData.append('type', mostCommonType);
      formData.append('vendor_id', vendorId.toString());
      formData.append('items', itemsString);
      formData.append('category', category);
      formData.append('unit', totalItems.toString());
      formData.append('price', avgPricePerUnit.toFixed(2));
      formData.append('status', 'Requested');
      formData.append('cgst', avgCGST.toFixed(2));
      formData.append('sgst', avgSGST.toFixed(2));
      
      // Combine all notes
      const allNotes = productList.map(p => p.notes).filter(Boolean).join('; ');
      const finalNotes = allNotes || `Vendor submission with ${productList.length} products. Total value: ₹${totalPrice.toFixed(2)}`;
      formData.append('notes', finalNotes);

      // Add first product image if available
      if (productList[0] && productList[0].image) {
        formData.append('procurement_product_image', productList[0].image);
      }

      console.log('Submitting to API...');
      console.log('Base URL from config:', baseurl);
      console.log('Request details:', {
        vendorId,
        totalItems,
        avgPrice: avgPricePerUnit.toFixed(2),
        category,
        type: mostCommonType,
        authToken: authToken ? 'Present' : 'Missing'
      });

      // Debug: Log all FormData entries
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(pair[0], `File: ${pair[1].name} (${pair[1].size} bytes)`);
        } else {
          console.log(pair[0], pair[1]);
        }
      }

      // Use the correct API endpoint (same as admin side)
      const apiEndpoint = `${baseurl}/api/procurement/create`;
      
      console.log('Submitting to:', apiEndpoint);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error(`Server returned invalid response: ${responseText.substring(0, 200)}...`);
      }

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          throw new Error('API endpoint not found. Please check your server configuration.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to perform this action.');
        } else {
          throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
      }

      console.log('Procurement request created successfully:', data);

      // Clear products and navigate
      setProductList([]);
      localStorage.removeItem('productList');
      
      setSuccess('Products submitted successfully for approval!');
      
      setTimeout(() => {
        navigate('/Confirmation', { state: { products: productList } });
      }, 2000);

    } catch (error) {
      console.error('Submission error:', error);
      
      let errorMessage = 'Failed to submit products. ';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage += 'Please check your internet connection and server status.';
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage += 'API endpoint not found. Please contact support.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage += 'Please login again.';
      } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
        errorMessage += 'Please check all required fields are filled correctly.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate(-1);

  return (
    <>
      <Box bgcolor="#F4F4F6" minHeight="100vh" pb={12}>
        <Box bgcolor="#00A86B" color="white" px={2} py={2} display="flex" alignItems="center">
          <IconButton
            onClick={handleBack}
            sx={{ backgroundColor: '#FFFFFF4D', color: 'white', borderRadius: '50%', p: 1, mr: 1 }}
          >
            <ArrowBackIcon sx={{ fontSize: 28 }} />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">Add Product</Typography>
        </Box>

        <Container maxWidth="sm" sx={{ mt: 4 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Add Product</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Enter product details and request approval
              </Typography>

              {/* Image Upload */}
              <Box mb={2}>
                {productData.imageUrl ? (
                  <Box textAlign="center">
                    <Avatar
                      src={productData.imageUrl}
                      alt="Product"
                      sx={{ width: 280, height: 180, mx: 'auto' }}
                      variant="rounded"
                    />
                    <Button 
                      size="small" 
                      onClick={() => setProductData(prev => ({ ...prev, image: null, imageUrl: '' }))}
                      sx={{ mt: 1 }}
                    >
                      Remove Image
                    </Button>
                  </Box>
                ) : (
                  <Box
                    onClick={handleClick}
                    sx={{
                      border: '2px dashed #E0E0E0',
                      borderRadius: 2,
                      textAlign: 'center',
                      padding: 4,
                      cursor: 'pointer',
                      backgroundColor: '#FAFAFA',
                      '&:hover': { borderColor: '#00A86B' },
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <IconButton
                      disableRipple
                      sx={{
                        backgroundColor: '#E6F4EA',
                        color: '#00A86B',
                        width: 56,
                        height: 56,
                        mb: 1,
                      }}
                    >
                      <AddIcon fontSize="large" />
                    </IconButton>
                    <Typography variant="body1" color="textSecondary">
                      Upload Product Image (Max 5MB)
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Product Name */}
              <Box mb={2}>
                <Typography fontWeight="bold" mb={0.5}>Product *</Typography>
                <TextField
                  select
                  fullWidth
                  name="name"
                  value={productData.name}
                  onChange={e => {
                    const selected = allProducts.find(p => p.name === e.target.value);
                    setProductData(prev => ({
                      ...prev,
                      pid: selected ? selected.id : 0,
                      name: selected ? selected.name : '',
                      category: selected ? selected.category : ''
                    }));
                  }}
                  SelectProps={{ native: true }}
                  size="small"
                  required
                >
                  <option value="">Select Product</option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </TextField>
              </Box>

              {/* Category (read-only) */}
              <Box mb={2}>
                <Typography fontWeight="bold" mb={0.5}>Category</Typography>
                <TextField
                  fullWidth
                  name="category"
                  value={productData.category}
                  InputProps={{ readOnly: true }}
                  size="small"
                  placeholder="Category will be auto-filled"
                />
              </Box>

              {/* Price and Stock Row */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography fontWeight="bold" mb={0.5}>Price per unit (₹) *</Typography>
                  <TextField
                    fullWidth
                    name="price"
                    value={productData.price}
                    onChange={handleChange}
                    size="small"
                    type="number"
                    placeholder="0.00"
                    inputProps={{ min: 0, step: 0.01 }}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography fontWeight="bold" mb={0.5}>Available Stock (kg) *</Typography>
                  <TextField
                    fullWidth
                    name="stock"
                    value={productData.stock}
                    onChange={handleChange}
                    size="small"
                    type="number"
                    placeholder="0"
                    inputProps={{ min: 0, step: 0.1 }}
                    required
                  />
                </Grid>
              </Grid>

              {/* Type Selection */}
              <Box mb={2}>
                <Typography fontWeight="bold" mb={0.5}>Type *</Typography>
                <TextField
                  select
                  fullWidth
                  name="type"
                  value={productData.type}
                  onChange={handleChange}
                  SelectProps={{ native: true }}
                  size="small"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="vendor">Vendor</option>
                  <option value="farmer">Farmer</option>
                </TextField>
              </Box>

              {/* CGST and SGST Row */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography fontWeight="bold" mb={0.5}>CGST (%)</Typography>
                  <TextField
                    fullWidth
                    name="cgst"
                    value={productData.cgst}
                    onChange={handleChange}
                    size="small"
                    type="number"
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    placeholder="0"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography fontWeight="bold" mb={0.5}>SGST (%)</Typography>
                  <TextField
                    fullWidth
                    name="sgst"
                    value={productData.sgst}
                    onChange={handleChange}
                    size="small"
                    type="number"
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    placeholder="0"
                  />
                </Grid>
              </Grid>

              {/* Notes Field */}
              <Box mb={2}>
                <Typography fontWeight="bold" mb={0.5}>Additional Notes</Typography>
                <TextField
                  fullWidth
                  name="notes"
                  value={productData.notes}
                  onChange={handleChange}
                  size="small"
                  multiline
                  rows={3}
                  placeholder="Enter any additional notes or special requirements"
                />
              </Box>

              <Button
                variant="outlined"
                sx={{ mt: 1, color: '#00B074', borderColor: '#00B074' }}
                onClick={handleAddProduct}
                disabled={!productData.name || !productData.price || !productData.stock || !productData.type}
              >
                {editIndex !== null ? 'Update Product' : 'Add Product'}
              </Button>

              {productList.length > 0 && (
                <>
                  <Typography variant="h6" fontWeight="bold" mt={4} mb={2}>
                    Products List ({productList.length})
                  </Typography>
                  {productList.map((product, index) => (
                    <Card key={product.id || index} elevation={1} sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item>
                            <Avatar
                              src={product.imageUrl}
                              alt={product.name}
                              sx={{ width: 56, height: 56 }}
                              variant="rounded"
                            />
                          </Grid>
                          <Grid item xs>
                            <Typography variant="subtitle1" fontWeight="bold">{product.name}</Typography>
                            <Typography variant="body2">Category: {product.category || 'Not specified'}</Typography>
                            <Typography variant="body2">Type: {product.type}</Typography>
                            <Typography variant="body2">Price: ₹{product.price}/kg | Stock: {product.stock} kg</Typography>
                            {(product.cgst > 0 || product.sgst > 0) && (
                              <Typography variant="body2">
                                Tax: CGST {product.cgst}% | SGST {product.sgst}%
                              </Typography>
                            )}
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                              Total: ₹{(parseFloat(product.price) * parseFloat(product.stock)).toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item>
                            <IconButton onClick={() => handleEdit(index)} disabled={isSubmitting}>
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDelete(index)} disabled={isSubmitting}>
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}

                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Summary:
                    </Typography>
                    <Typography variant="body2">
                      Total Items: {productList.reduce((sum, p) => sum + parseFloat(p.stock || 0), 0)} kg
                    </Typography>
                    <Typography variant="body2">
                      Total Value: ₹{productList.reduce((sum, p) => sum + (parseFloat(p.price || 0) * parseFloat(p.stock || 0)), 0).toFixed(2)}
                    </Typography>
                  </Box>
                </>
              )}

              <Button
                variant="contained"
                color="success"
                fullWidth
                onClick={handleRequestApproval}
                disabled={productList.length === 0 || isSubmitting}
                sx={{ backgroundColor: '#00B074', mt: 3 }}
              >
                {isSubmitting ? 'Submitting...' : 'Request Approval'}
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
        <BottomNavigation showLabels sx={{ backgroundColor: '#f5f5f5' }}>
          <VendorFooter />
        </BottomNavigation>
      </Paper>
    </>
  );
};

export default AddProduct;