import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Container,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Grid,
  Paper,
  BottomNavigation,
  Badge
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import VendorFooter from '../vendorfooter';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import baseurl from '../baseurl/ApiService';

const Reports = () => {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${baseurl}/api/procurement/all`);
        const data = await response.json();
        setProcurements(data.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const authToken = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const vendorId = userData.id || userData.vendor_id || localStorage.getItem('vendor_id');
        if (!vendorId) return;
        const response = await fetch(`${baseurl}/api/vendor-notification/all/${vendorId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data && data.notifications) {
          const unreadCount = data.notifications.filter(n => !n.is_read).length;
          setNotificationCount(unreadCount);
        }
      } catch (e) {}
    };
    fetchNotifications();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // Process procurement data for charts
  const processSupplyData = () => {
    const supplyByDate = {};

    procurements.forEach(procurement => {
      const date = new Date(procurement.order_date).toLocaleDateString();
      const items = JSON.parse(procurement.items.replace(/'/g, '"'));

      items.forEach(item => {
        if (!supplyByDate[date]) {
          supplyByDate[date] = 0;
        }
        supplyByDate[date] += item.quantity;
      });
    });

    return Object.keys(supplyByDate).map(date => ({
      date,
      supply: supplyByDate[date]
    }));
  };

  const processRevenueData = () => {
    const revenueByDate = {};

    procurements.forEach(procurement => {
      const date = new Date(procurement.order_date).toLocaleDateString();
      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
      }
      revenueByDate[date] += parseFloat(procurement.total_amount);
    });

    return Object.keys(revenueByDate).map(date => ({
      date,
      revenue: revenueByDate[date],
      profit: revenueByDate[date] * 0.7 // Assuming 30% cost, 70% profit
    }));
  };

  const processProductData = () => {
    const productRevenue = {};

    procurements.forEach(procurement => {
      const items = JSON.parse(procurement.items.replace(/'/g, '"'));

      items.forEach(item => {
        const productName = item.product_id === 1 ? 'Potatoes' :
          item.product_id === 2 ? 'Tomatoes' :
            item.product_id === 3 ? 'Spinach' : 'Other';

        if (!productRevenue[productName]) {
          productRevenue[productName] = 0;
        }
        productRevenue[productName] += item.quantity * item.unit_price;
      });
    });

    return Object.keys(productRevenue).map(name => ({
      name,
      value: productRevenue[name]
    }));
  };

  const processTopProducts = () => {
    const productQuantities = {};

    procurements.forEach(procurement => {
      const items = JSON.parse(procurement.items.replace(/'/g, '"'));

      items.forEach(item => {
        const productName = item.product_id === 1 ? 'Potatoes' :
          item.product_id === 2 ? 'Tomatoes' :
            item.product_id === 3 ? 'Spinach' : 'Other';

        if (!productQuantities[productName]) {
          productQuantities[productName] = 0;
        }
        productQuantities[productName] += item.quantity;
      });
    });

    return Object.keys(productQuantities).map(name => ({
      name,
      value: productQuantities[name]
    }));
  };

  // Calculate performance metrics based on procurement data
// Calculate performance metrics based on procurement data
const calculatePerformanceMetrics = () => {
  if (procurements.length === 0) return { profitMargin: 0, inventoryTurnover: 0 };
  
  const productRevenueData = processProductData();
  const totalRevenue = productRevenueData.reduce((sum, product) => sum + product.value, 0);
  
  const totalCost = procurements.reduce((sum, procurement) => {
    const items = JSON.parse(procurement.items.replace(/'/g, '"'));
    const procurementCost = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    return sum + procurementCost;
  }, 0);
  
  const profit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  
  // Simple inventory turnover calculation
  const inventoryTurnover = procurements.length > 0 ? 
    (totalSupply / procurements.length).toFixed(1) : 0;
  
  return {
    profitMargin: profitMargin.toFixed(1),
    inventoryTurnover
  };
};

  const exportToExcel = () => {
    let dataToExport = [];
    const worksheetName = tabIndex === 0 ? 'Supply Report' :
      tabIndex === 1 ? 'Revenue Report' : 'Analysis Report';

    if (tabIndex === 0) {
      // Supply data
      dataToExport = [
        ['Metric', 'Value'],
        ['Total Supply (kg)', totalSupply],
        ['Total Revenue (₹)', totalRevenue.toFixed(2)],
        ...topProducts.map(p => [p.name, `${p.value} kg`])
      ];
    } else if (tabIndex === 1) {
      // Revenue data
      dataToExport = [
        ['Metric', 'Value'],
        ['Total Supply (kg)', totalSupply],
        ['Total Revenue (₹)', totalRevenue.toFixed(2)],
        ...productRevenueData.map(p => [p.name, `₹${p.value.toFixed(2)}`])
      ];
    } else {
      // Analysis data
      const { profitMargin, inventoryTurnover } = calculatePerformanceMetrics();
      dataToExport = [
        ['Metric', 'Value'],
        ['Profit Margin', `${profitMargin}%`],
        ['Inventory Turnover', `${inventoryTurnover} X`],
        ['Expected Revenue', `₹${(totalRevenue * 1.08).toFixed(2)}`],
        ['Top Product', topProducts.length > 0 ? topProducts[0].name : 'N/A']
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, worksheetName);
    XLSX.writeFile(wb, `${worksheetName}.xlsx`);
  };

  const exportToPDF = () => {
    const input = reportRef.current;
    const reportTitle = tabIndex === 0 ? 'Supply Report' :
      tabIndex === 1 ? 'Revenue Report' : 'Analysis Report';

    html2canvas(input, {
      scale: 2,
      logging: true,
      useCORS: true
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${reportTitle}.pdf`);
    });
  };

  const supplyHistoryData = processSupplyData();
  const revenueTrendData = processRevenueData();
  const productRevenueData = processProductData();
  const topProducts = processTopProducts();

  // Calculate totals
  const totalSupply = topProducts.reduce((sum, product) => sum + product.value, 0);
  const totalRevenue = productRevenueData.reduce((sum, product) => sum + product.value, 0);

  // Calculate max values for progress bars
  const maxSupplyValue = Math.max(...topProducts.map(p => p.value), 1);
  const maxRevenueValue = Math.max(...productRevenueData.map(p => p.value), 1);

  // Calculate performance metrics
  const { profitMargin, inventoryTurnover } = calculatePerformanceMetrics();

  // Month data for comparison
  const monthData = [
    { name: 'Supply', April: 60, May: totalSupply },
    { name: 'Orders', April: 40, May: procurements.length },
    { name: 'Revenue', April: 55, May: totalRevenue / 1000 },
    { name: 'Profit', April: 35, May: (totalRevenue * 0.7) / 1000 },
  ];

  const handleNotificationClick = () => {
    navigate('/vendor-notifications');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <>
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
        <Box display="flex" alignItems="center">
          <IconButton
            onClick={handleBack}
            sx={{
              backgroundColor: '#FFFFFF4D',
              color: 'white',
              borderRadius: '50%',
              p: 1,
              mr: 2,
              '&:hover': { backgroundColor: '#FFFFFF80' },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">
            Reports
          </Typography>
        </Box>
        <Badge badgeContent={notificationCount} color="error">
          <IconButton 
            onClick={handleNotificationClick}
            sx={{ color: 'white' }}
          >
            <NotificationsIcon />
          </IconButton>
        </Badge>
      </Box>

      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        centered
        variant="fullWidth"
        sx={{
          '& .MuiTab-root': { fontWeight: 600, color: '00A859' },
          '& .Mui-selected': { color: '#00A859' },
          '& .MuiTabs-indicator': { backgroundColor: '#00A859' },
        }}
      >
        <Tab label="Supply" />
        <Tab label="Revenue" />
        <Tab label="Analysis" />
      </Tabs>

      <Container maxWidth="sm" sx={{ mb: 10, px: 2, py: 2, bgcolor: '#F4F4F6' }} ref={reportRef}>
        {/* --- Tab 1: Supply --- */}
        {tabIndex === 0 && (
          <>
            <Box display="flex" justifyContent="space-between" mt={3} mb={2}>
              <Card sx={{ width: '48%', backgroundColor: '#f8f8f8' }}>
                <CardContent>
                  <Typography variant="subtitle2">Total Supply</Typography>
                  <Typography variant="h6" fontWeight="bold">{totalSupply} kg</Typography>
                  <Typography color="green" fontSize={12}>↑ 12% from last period</Typography>
                </CardContent>
              </Card>
              <Card sx={{ width: '48%', backgroundColor: '#f8f8f8' }}>
                <CardContent>
                  <Typography variant="subtitle2">Total Revenue</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{totalRevenue.toFixed(2)}</Typography>
                  <Typography color="green" fontSize={12}>↑ 8% from last period</Typography>
                </CardContent>
              </Card>
            </Box>

            <Typography variant="subtitle1" mt={3} mb={1}>Supply History</Typography>
            <Card>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={supplyHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="supply" stroke="#4caf50" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Typography variant="subtitle1" mt={3} mb={1}>Top Products</Typography>
            <Card>
              <CardContent>
                {topProducts.map(product => (
                  <Box key={product.name} mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography fontWeight="500">{product.name}</Typography>
                      <Typography>{product.value} kg</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(product.value / maxSupplyValue) * 100}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#eee',
                        '& .MuiLinearProgress-bar': { backgroundColor: '#4caf50' },
                      }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<DescriptionIcon />}
                sx={{ bgcolor: '#ccc', mr: 1, color: '#666666' }}
                onClick={exportToExcel}
              >
                Export Excel
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                sx={{ bgcolor: '#ccc', ml: 1, color: '#666666' }}
                onClick={exportToPDF}
              >
                Export PDF
              </Button>
            </Box>
          </>
        )}

        {/* --- Tab 2: Revenue --- */}
        {tabIndex === 1 && (
          <>
            <Box display="flex" justifyContent="space-between" mt={3} mb={2}>
              <Card sx={{ width: '48%', backgroundColor: '#f8f8f8' }}>
                <CardContent>
                  <Typography variant="subtitle2">Total Supply</Typography>
                  <Typography variant="h6" fontWeight="bold">{totalSupply} kg</Typography>
                  <Typography color="green" fontSize={12}>↑ 12% from last period</Typography>
                </CardContent>
              </Card>
              <Card sx={{ width: '48%', backgroundColor: '#f8f8f8' }}>
                <CardContent>
                  <Typography variant="subtitle2">Total Revenue</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{totalRevenue.toFixed(2)}</Typography>
                  <Typography color="green" fontSize={12}>↑ 8% from last period</Typography>
                </CardContent>
              </Card>
            </Box>

            <Typography variant="subtitle1" mt={2} mb={1}>Revenue Trend</Typography>
            <Card>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#FFA500" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="profit" stroke="#4caf50" strokeWidth={2} strokeDasharray="5 5" dot />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Typography variant="subtitle1" mt={3} mb={1}>Revenue by Product</Typography>
            <Card>
              <CardContent>
                {productRevenueData.map(product => (
                  <Box key={product.name} mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography fontWeight="500">{product.name}</Typography>
                      <Typography>₹{product.value.toFixed(2)}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(product.value / maxRevenueValue) * 100}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#eee',
                        '& .MuiLinearProgress-bar': { backgroundColor: '#FFA500' },
                      }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<DescriptionIcon />}
                sx={{ bgcolor: '#ccc', mr: 1, color: '#666666' }}
                onClick={exportToExcel}
              >
                Export Excel
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                sx={{ bgcolor: '#ccc', ml: 1, color: '#666666' }}
                onClick={exportToPDF}
              >
                Export PDF
              </Button>
            </Box>
          </>
        )}

        {/* --- Tab 3: Analysis --- */}
        {tabIndex === 2 && (
          <>
            <Card sx={{ mt: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">Performance Summary</Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Typography>Profit Margin</Typography>
                  <Typography fontWeight="bold">{profitMargin}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={parseFloat(profitMargin)}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    mt: 1,
                    mb: 2,
                    backgroundColor: '#E0E0E0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4CAF50',
                    },
                  }}
                />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Inventory Turnover</Typography>
                  <Typography fontWeight="bold">{inventoryTurnover} X</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(parseFloat(inventoryTurnover) / 10) * 100}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    mt: 1,
                    backgroundColor: '#E0E0E0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4CAF50',
                    },
                  }}
                />
              </CardContent>
            </Card>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                Month over Month
              </Typography>

              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="flex-end" gap={2} mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 12, height: 12, bgcolor: '#ccc' }} />
                      <Typography variant="body2">April</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 12, height: 12, bgcolor: '#4CAF50' }} />
                      <Typography variant="body2">May</Typography>
                    </Box>
                  </Box>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthData} barGap={8}>
                      <XAxis dataKey="name" />
                      <Tooltip />
                      <Bar dataKey="April" fill="#ccc" />
                      <Bar dataKey="May" fill="#4CAF50" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>Predictions</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body2">Expected Revenue</Typography>
                      <Typography variant="h5" fontWeight="bold" mt={1}>₹{(totalRevenue * 1.08).toFixed(2)}</Typography>
                      <Typography fontSize={12} color="green">↑ 8% projected growth</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="body2">Top Product</Typography>
                      <Typography variant="h6" fontWeight="bold" mt={1}>
                        {topProducts.length > 0 ? topProducts[0].name : 'N/A'}
                      </Typography>
                      <Typography fontSize={12} color="green">Based on seasonal trends</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Box mt={3}>
              <Card sx={{ bgcolor: '#E9F6ED', borderRadius: 2 }}>
                <CardContent>
                  <Typography fontWeight="bold" color="#006400">Insight: Consider increasing spinach supply</Typography>
                  <Typography fontSize={14}>High demand-to-supply ratio indicates opportunity</Typography>
                </CardContent>
              </Card>
            </Box>

            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<DescriptionIcon />}
                sx={{ bgcolor: '#ccc', mr: 1, color: '#666666' }}
                onClick={exportToExcel}
              >
                Export Excel
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                sx={{ bgcolor: '#ccc', ml: 1, color: '#666666' }}
                onClick={exportToPDF}
              >
                Export PDF
              </Button>
            </Box>
          </>
        )}
      </Container>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}
        elevation={3}
      >
        <BottomNavigation showLabels sx={{ backgroundColor: '#f5f5f5' }}>
          <VendorFooter />
        </BottomNavigation>
      </Paper>
    </>
  );
};

export default Reports;