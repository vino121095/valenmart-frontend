import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
  InputBase,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer";
import baseurl from "../baseurl/ApiService";
import Header from "../Header";
import { useCart } from "../context/CartContext";

const ViewAllProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const { incrementCartCount, fetchCartCount } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${baseurl}/api/product/all`);
      const data = await response.json();

      if (data?.data) {
        const formatted = data.data
          .filter((item) => item.is_active === "Available")
          .map((item) => ({
            id: item.pid,
            name: item.product_name,
            price: item.price,
            unit: item.unit,
            description: item.discription,
            category: item.category,
            image: `${baseurl}/${item.product_image.replace(/\\/g, "/")}`,
          }));
        setProducts(formatted);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      showSnackbar("Failed to load products", "error");
    }
  };

  const handleIncrement = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 1) + 1,
    }));
  };

  const handleDecrement = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max((prev[productId] || 1) - 1, 1),
    }));
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddToCart = async (product, quantity) => {
    if (loading) return;
    setLoading(true);

    try {
        const customerId = localStorage.getItem("customer_id");
      const parsedCustomerId = JSON.parse(customerId);

      const authToken =
        localStorage.getItem("authToken") || localStorage.getItem("token");

      const headers = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // Fetch the cart and find the current quantity for this product
      const cart_response = await fetch(
        `${baseurl}/api/cart/${parsedCustomerId}`,
        {
          method: "GET",
          headers: headers,
        }
      );

      let currentqty = 0;
      if (cart_response.ok) {
        const cart_data = await cart_response.json();
        const cartItem = cart_data.find((item) => item.product_id === product.id);
        currentqty = cartItem ? cartItem.quantity : 0;
      }

      const requestBody = {
        customer_id: parsedCustomerId,
        product_id: product.id,
        product_name: product.name,
        price: parseFloat(product.price),
        quantity: currentqty + parseInt(quantity),
        unit: product.unit,
        total_price: parseFloat(product.price) * (currentqty + parseInt(quantity)),
        category: product.category,
        image: product.image,
      };

      // console.log('Request body:', requestBody); // Debug log

      const response = await fetch(`${baseurl}/api/cart/create`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      // console.log('Response status:', response.status); // Debug log

      const data = await response.json();
      // console.log('Response data:', data); // Debug log

      if (response.ok) {
        showSnackbar(`${product.name} added to cart successfully!`, "success");
        fetchCartCount();
        setQuantities((prev) => ({
          ...prev,
          [product.id]: 1,
        }));
      } else {
        console.error("Failed to add to cart:", data);

        if (response.status === 401) {
          showSnackbar("Please login to add items to cart", "error");
          setTimeout(() => navigate("/login"), 1500);
        } else if (response.status === 400) {
          showSnackbar(`Error: ${data.message || "Invalid request"}`, "error");
        } else {
          showSnackbar(
            `Failed to add to cart: ${data.message || "Unknown error"}`,
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        showSnackbar(
          "Network error. Please check your connection and try again.",
          "error"
        );
      } else {
        showSnackbar("Something went wrong. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const searchSuggestions = searchQuery.length > 0
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "priceLowToHigh") return a.price - b.price;
    if (sortBy === "priceHighToLow") return b.price - a.price;
    return 0;
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ pt: 10, pb: 10 }}>
      <Header />

      {/* Search */}
      <Box sx={{ px: 2 }}>
        <Box sx={{ position: "relative" }}>
          <Paper
            component="form"
            sx={{
              mt: 2,
              mb: 3,
              display: "flex",
              alignItems: "center",
              borderRadius: 3,
              px: 2,
              py: 0.5,
              backgroundColor: "#f5f5f5",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <SearchIcon sx={{ color: "#666", mr: 1 }} />
            <InputBase
              sx={{ ml: 1, flex: 1, fontSize: "0.9rem" }}
              placeholder="Search Products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
          </Paper>
          {showSuggestions && searchSuggestions.length > 0 && (
            <Paper
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 10,
                maxHeight: 200,
                overflow: "auto",
                boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
              }}
            >
              <List sx={{ py: 0 }}>
                {searchSuggestions.map((product) => (
                  <ListItem
                    key={product.id}
                    button
                    onClick={() => {
                      setSearchQuery(product.name);
                      setShowSuggestions(false);
                    }}
                    sx={{ py: 1, "&:hover": { backgroundColor: "#f5f5f5" } }}
                  >
                    <ListItemText primary={product.name} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {/* Filter and Sort */}
        <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
          <FilterListIcon sx={{ color: "#666" }} />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2, backgroundColor: "#f5f5f5" }}
            >
              <MenuItem value="">Default</MenuItem>
              <MenuItem value="priceLowToHigh">Price: Low to High</MenuItem>
              <MenuItem value="priceHighToLow">Price: High to Low</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Products Grid */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: "#333",
              fontSize: "1.1rem",
            }}
          >
            All Products
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: { xs: 1, sm: 1.5, md: 2 },
            px: { xs: 1.5, sm: 1.5, md: 2 }
          }}>
            {sortedProducts.map((product, index) => (
              <Box key={product.id || index} sx={{ 
                width: { xs: 'calc(50% - 4px)', sm: 'calc(25% - 6px)', md: 'calc(25% - 6px)' },
                minWidth: { xs: 'calc(50% - 4px)', sm: 'calc(25% - 6px)', md: 'calc(25% - 6px)' }
              }}>
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    transition: "transform 0.2s",
                    minHeight: "200px",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="100"
                    image={product.image}
                    alt={product.name}
                    sx={{
                      objectFit: "cover",
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                    }}
                  />

                  <CardContent sx={{ p: 1.5, flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        color: "#333",
                        mb: 0.5,
                        lineHeight: 1.2,
                      }}
                    >
                      {product.name}
                    </Typography>

                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#059212",
                          fontWeight: 600,
                          fontSize: "0.9rem",
                        }}
                      >
                        ₹{product.price}/kg
                      </Typography>

                      <Box display="flex" alignItems="center">
                        <IconButton
                          size="small"
                          onClick={() => handleDecrement(product.id)}
                          sx={{
                            background: "linear-gradient(90deg, #004D26, #00A84F)",
                            color: "#fff",
                            width: 24,
                            height: 24,
                            "&:hover": { background: "linear-gradient(90deg, #003D1F, #008A40)" },
                          }}
                        >
                          <RemoveIcon sx={{ fontSize: "0.8rem" }} />
                        </IconButton>
                        <Typography
                          sx={{
                            mx: 1,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            minWidth: "16px",
                            textAlign: "center",
                          }}
                        >
                          {quantities[product.id] || 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleIncrement(product.id)}
                          sx={{
                            background: "linear-gradient(90deg, #004D26, #00A84F)",
                            color: "#fff",
                            width: 24,
                            height: 24,
                            "&:hover": { background: "linear-gradient(90deg, #003D1F, #008A40)" },
                          }}
                        >
                          <AddIcon sx={{ fontSize: "0.8rem" }} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "#666",
                        fontSize: "0.7rem",
                      }}
                    >
                      {product.description || "Fresh Market Co."}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ px: 1.5, pb: 1.5 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{
                        background: "linear-gradient(90deg, #004D26, #00A84F)",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        py: 1,
                        borderRadius: 2,
                        textTransform: "none",
                        color: "#fff",
                        whiteSpace: "nowrap",
                        "&:hover": { backgroundColor: "#047010" },
                        "&:disabled": { backgroundColor: "#cccccc" },
                      }}
                      onClick={() =>
                        handleAddToCart(product, quantities[product.id] || 1)
                      }
                    >
                      <ShoppingCartIcon sx={{ fontSize: "0.8rem", mr: 0.5 }} />
                      {loading ? "Adding..." : "ADD TO CART"}
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Footer */}
      <Paper
        sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <Footer />
      </Paper>
    </Box>
  );
};

export default ViewAllProducts;