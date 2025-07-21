import React, { useState, useEffect } from "react";
import {
    Avatar,
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

const Products = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });
    const { incrementCartCount, fetchCartCount } = useCart();
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        fetch(`${baseurl}/api/category/all`)
            .then((res) => res.json())
            .then((data) => {
                if (data?.data) {
                    const formatted = data.data.map((item) => ({
                        label: item.category_name,
                        image: `${baseurl}/${item.category_image.replace(/\\/g, "/")}`,
                    }));
                    setCategories(formatted);
                }
            })
            .catch((error) => console.error("Error fetching categories:", error));
    }, []);

    useEffect(() => {
        fetch(`${baseurl}/api/product/all`)
            .then((res) => res.json())
            .then((data) => {
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
            })
            .catch((error) => console.error("Error fetching products:", error));
    }, []);

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

            const response = await fetch(`${baseurl}/api/cart/create`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

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

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box sx={{ pb: 10 }}>
            <Header />

            {/* Search */}
            <Box sx={{ px: 2 }}>
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
                        placeholder="Search Vegetables..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </Paper>

                {/* Categories */}
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 2,
                            fontWeight: 600,
                            color: "#333",
                            fontSize: "1.1rem",
                        }}
                    >
                        Browse by Category
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            overflowX: "auto",
                            gap: 2,
                            pb: 1,
                            "&::-webkit-scrollbar": {
                                height: "4px",
                            },
                            "&::-webkit-scrollbar-track": {
                                background: "#f1f1f1",
                                borderRadius: "4px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                                background: "#00B76F",
                                borderRadius: "4px",
                            },
                        }}
                    >
                        {categories.map((cat, index) => (
                            <Card
                                key={index}
                                onClick={() => setSelectedCategory(cat.label)}
                                sx={{
                                    minWidth: 110,
                                    maxWidth: 110,
                                    flexShrink: 0,
                                    borderRadius: 2,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    border: selectedCategory === cat.label ? '2px solid #00B76F' : 'none',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    },
                                }}
                            >
                                <CardMedia
                                    component="img"
                                    height="80"
                                    image={cat.image}
                                    sx={{
                                        objectFit: 'cover',
                                        borderTopLeftRadius: 8,
                                        borderTopRightRadius: 8,
                                    }}
                                />
                                <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: '#333',
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {cat.label}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}

                    </Box>
                </Box>

                {/* Products */}
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
                        Available Now
                    </Typography>
                    <Grid container spacing={1.5}>
                        {filteredProducts.slice(0, 4).map((product, index) => (
                            <Grid item xs={6} key={product.id || index}>
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
                                                    color: "#00B76F",
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
                                                        bgcolor: "#00B76F",
                                                        color: "#fff",
                                                        width: 24,
                                                        height: 24,
                                                        "&:hover": { bgcolor: "#00985D" },
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
                                                        bgcolor: "#00B76F",
                                                        color: "#fff",
                                                        width: 24,
                                                        height: 24,
                                                        "&:hover": { bgcolor: "#00985D" },
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
                                                backgroundColor: "#00B76F",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                py: 1,
                                                borderRadius: 2,
                                                textTransform: "none",
                                                color: "#fff",
                                                "&:hover": { backgroundColor: "#00985D" },
                                                "&:disabled": { backgroundColor: "#cccccc" },
                                            }}
                                            onClick={() =>
                                                handleAddToCart(product, quantities[product.id] || 1)
                                            }
                                        >
                                            <ShoppingCartIcon sx={{ fontSize: "0.9rem", mr: 0.5 }} />
                                            {loading ? "Adding..." : "ADD TO CART"}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* View All */}
                <Box sx={{ mt: 4, mb: 2 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        sx={{
                            backgroundColor: "#00B76F",
                            borderRadius: 2,
                            py: 1.8,
                            fontWeight: 600,
                            fontSize: "1rem",
                            textTransform: "none",
                            color: "#fff",
                            boxShadow: "0 4px 12px rgba(0, 183, 111, 0.3)",
                            "&:hover": {
                                backgroundColor: "#00985D",
                                boxShadow: "0 6px 16px rgba(0, 183, 111, 0.4)",
                            },
                        }}
                        onClick={() => navigate("/all-products")}
                    >
                        VIEW ALL PRODUCTS
                    </Button>
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

export default Products;