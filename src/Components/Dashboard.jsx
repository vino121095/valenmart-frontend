import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Avatar,
  Card,
  CardContent,
  Stack,
  Button,
  Box,
  Paper,
  BottomNavigation,
  CircularProgress,
} from "@mui/material";

import Footer from "../Footer";
import Header from "../Header";
import { useNavigate } from "react-router-dom";
import baseurl from "../baseurl/ApiService";
import { useAuth } from "../App";

function Dashboard() {
  const navigate = useNavigate();
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    delivered: 0,
    cancelled: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrderStats = async () => {
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

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const responseData = await response.json();
        const orders = responseData.data || [];

        // Calculate order statistics
        const stats = orders.reduce((acc, order) => {
          const status = order.status?.toLowerCase();
          if (status === 'new order') {
            acc.pending++;
          } else if (status === 'delivered') {
            acc.delivered++;
          } else if (status === 'cancelled') {
            acc.cancelled++;
          }
          return acc;
        }, { pending: 0, delivered: 0, cancelled: 0 });

        setOrderStats(stats);

        // Calculate top ordered products
        const productCounts = {};
        orders.forEach(order => {
          if (order.OrderItems && Array.isArray(order.OrderItems)) {
            order.OrderItems.forEach(item => {
              if (!item) return;
              
              const productId = item.product_id;
              if (!productId) return;

              // Get product details from the nested Product object
              const productDetails = {
                name: item.Product?.product_name || 'Unknown Product',
                image: item.Product?.product_image
  ? `${baseurl}/${item.Product.product_image.replace(/\\/g, '/')}`
  : 'https://png.pngtree.com/png-clipart/20200709/original/pngtree-carrot-png-image_799236.jpg',

                quantity: parseInt(item.quantity) || 0,
                unit: item.Product?.unit || 'units'
              };
              console.log('Product Details:', productDetails);

              if (!productCounts[productId]) {
                productCounts[productId] = {
                  ...productDetails,
                  totalQuantity: 0,
                  orderCount: 0
                };
              }

              productCounts[productId].totalQuantity += productDetails.quantity;
              productCounts[productId].orderCount += 1;
            });
          }
        });

        // Convert to array and sort by total quantity
        const topProductsArray = Object.entries(productCounts)
          .map(([id, data]) => ({
            id,
            ...data
          }))
          .filter(product => product.totalQuantity > 0) // Only include products with orders
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .slice(0, 3); // Get top 3 products

        setTopProducts(topProductsArray);

        // Get recent orders (last 3)
        const sortedOrders = [...orders]
          .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
          .slice(0, 3);

        setRecentOrders(sortedOrders);

      } catch (error) {
        console.error('Error fetching order stats:', error);
        setError('Failed to load order statistics');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrderStats();
    }
  }, [user]);

  return (
    <Box sx={{ backgroundColor: "#F6F8FA", minHeight: "100vh", pb: 7 }}>
      {/* ✅ Header: Only Cart shown */}
      <Header
  // showCart={true}
  // showNotifications={true}
  // showButton={true}
    />

      {/* Main Content */}
      <Container>
        {/* 🔹 Order Summary */}
        <Card sx={{ my: 2, borderRadius: 2, boxShadow: 1 }}>
          <CardContent>
            <Typography sx={{ color: "black", mb: 2 }}>Order Summary</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} sx={{ color: '#00B074' }} />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ textAlign: 'center' }}>{error}</Typography>
            ) : (
              <Box sx={{ display: "flex", gap: 2 }}>
                {[
                  { label: "Pending", value: orderStats.pending, bg: "#F0FFF4", color: "#00B074" },
                  { label: "Delivered", value: orderStats.delivered, bg: "#FFFAF0", color: "#ED8936" },
                  { label: "Cancelled", value: orderStats.cancelled, bg: "#F0F5FF", color: "#3182CE" },
                ].map((item, idx) => (
                  <Card key={idx} sx={{ width: 120, height: 66, backgroundColor: item.bg }}>
                    <CardContent sx={{ p: "10px 10px 5px" }}>
                      <Stack spacing={0.5}>
                        <Typography sx={{ color: "black", fontSize: 14 }}>{item.label}</Typography>
                        <Typography variant="h5" sx={{ color: item.color }}>
                          {item.value}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* 🔹 Top Order Products */}
        <Card sx={{ my: 2, borderRadius: 2, boxShadow: 1 }}>
          <CardContent>
            <Typography sx={{ mb: 1 }}>Top Order Products</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} sx={{ color: '#00B074' }} />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ textAlign: 'center' }}>{error}</Typography>
            ) : topProducts.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 2 }}>
                No products ordered yet
              </Typography>
            ) : (
              topProducts.map((product, idx) => (
                <Box
                  key={product.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    m: 2,
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      src={product.image}
                      alt={product.name}
                      sx={{
                        width: 24,
                        height: 24,
                        backgroundColor: "#4CAF5026",
                        padding: "15px",
                        borderRadius: "50%",
                      }}
                    />

                    <Box>
                      <Typography sx={{ color: "black" }}>{product.name}</Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                        Ordered {product.orderCount} times
                      </Typography>
                    </Box>
                  </Box>
                  <Typography
                    sx={{
                      backgroundColor: "#4CAF5026",
                      color: "#00B074",
                      borderRadius: "50px",
                      px: 2,
                      py: 0.5,
                      fontSize: 12,
                    }}
                  >
                    {product.totalQuantity} kg
                  </Typography>
                </Box>
              ))
            )}
          </CardContent>
        </Card>

        {/* 🔹 Recent Orders */}
        <Card sx={{ my: 2, borderRadius: 2, boxShadow: 1 }}>
          <CardContent>
            <Typography sx={{ mb: 1 }}>Recent Orders</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} sx={{ color: '#00B074' }} />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ textAlign: 'center' }}>{error}</Typography>
            ) : recentOrders.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 2 }}>
                No recent orders
              </Typography>
            ) : (
              recentOrders.map((order, idx) => (
                <Box
                  key={order.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 3,
                    py: 1,
                    my: 1,
                    backgroundColor: "#F7FAFC",
                    borderRadius: 1,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 500, fontSize: 12 }}>
                      #{order.order_id}
                    </Typography>
                    <Typography sx={{ color: "gray", fontSize: 12 }}>
                      {new Date(order.order_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      backgroundColor: order.status === 'Delivered' ? "#FFFAF0" : "#4CAF5026",
                      color: order.status === 'Delivered' ? "#ED8936" : "#00B074",
                      borderRadius: "50px",
                      px: 2,
                      py: 0.5,
                      fontSize: 12,
                      boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    {order.status}
                  </Typography>
                </Box>
              ))
            )}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                onClick={() => navigate("/OrderCard")}
                variant="contained"
                sx={{ backgroundColor: "#00B074", color: "white" }}
              >
                View All Orders
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* 🔹 Pending Invoices */}
        <Card sx={{ my: 2, mx: 2, borderRadius: 2, boxShadow: 3 }}>
          <CardContent
            sx={{
              pr: {
                xs: "10px",
                sm: "20px",
                md: "30px",
              },
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Pending Invoices
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mt: 2,
                p: { xs: 2, sm: 3 },
                backgroundColor: "#FFFAF0",
                borderRadius: 2,
                width: "100%",
              }}
            >
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                textAlign="center"
                gap={1}
                sx={{ width: "100%", maxWidth: 400 }}
              >
                <Typography sx={{ fontSize: "16px" }}>
                  You have <strong style={{ color: "#ED8936" }}>2 pending invoices</strong> to review
                </Typography>

                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#DD6B20",
                    height: 28,
                    fontSize: 12,
                    textTransform: "none",
                    px: 2,
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#c95f1c",
                    },
                  }}
                  onClick={() => navigate("/invoice")}
                >
                  View All
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* 🔻 Bottom Navigation */}
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
}

export default Dashboard;
