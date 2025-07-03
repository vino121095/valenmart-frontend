import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CircularProgress, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';
import { CartProvider } from './context/CartContext';

// Import Components
import Dashboard from './Components/Dashboard';
import Invoice from './Components/Invoice';
import Products from './Components/Products';
import ViewAllProducts from './Components/ViewAllProducts';
import ShoppingCart from './Components/ShoppingCart';
import Checkout from './Components/Checkout';
import OrderConfirmation from './Components/OrderConformation';
import OrderStatus from './Components/OrderStatus';
import OrderCard from './Components/OrderCard';
import InvoicesPage from './Components/Invoicepage';
import Profile from './Components/Profile';
import Notifications from './Components/Notifications';
import ProfileEdit from './Components/ProfileEdit';

// Import Vendor Components
import VDashboard from './vendor/Vdashboard';
import ReviewOrder from './vendor/ReviewOrder';
import OrderApproved from './vendor/OrderApproved';
import Pickupdetails from './vendor/Pickupdetails';
import AvailableStock from './vendor/AvailableStock';
import ProcurementOrder from './vendor/ProcurementOrder';
import EditOrder from './vendor/EditOrder';
import AddProduct from './vendor/AddProduct';
import Confirmation from './vendor/Confirmation';
import Reports from './vendor/Reports';
import VProfile from './vendor/vprofile';
import NegotiationPage from './vendor/NegotiationPage';
import VendorProfileEdit from './vendor/VendorProfileEdit';
import VendorNotifications from './vendor/VendorNotifications';

// Import Driver Components
import DriverDashboard from './Driver/DriverDashboard';
import DriverTask from './Driver/DriverTask';
import DriverLog from './Driver/DriverLog';
import DriverAccount from './Driver/DriverAccount';
import DriverProfileEdit from './Driver/DriverProfileEdit';
import DriverNotifications from './Driver/DriverNotifications';

// Import Auth Components
import Login from './auth/Login';
import CreatePassword from './auth/CreatePassword';

// Create Material UI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#00B074',
    },
    secondary: {
      main: '#00B76F',
    },
    success: {
      main: '#00B074',
    },
  },
});

// Create Auth Context
const AuthContext = createContext();

// Loading Component
const LoadingScreen = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      flexDirection: 'column'
    }}
  >
    <CircularProgress color="success" size={50} />
    <Typography sx={{ mt: 2, color: '#00B074' }}>Loading...</Typography>
  </Box>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect based on user role
    if (userRole === 'user') {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'vendor') {
      return <Navigate to="/vdashboard" replace />;
    } else if (userRole === 'driver') {
      return <Navigate to="/driver-dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
};

// Public Route Component (for login page when already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, userRole, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (isAuthenticated) {
    // Redirect based on user role
    if (userRole === 'user') {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'vendor') {
      return <Navigate to="/vdashboard" replace />;
    } else if (userRole === 'driver') {
      return <Navigate to="/driver-dashboard" replace />;
    }
  }
  
  return children;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    const role = localStorage.getItem('userRole');

    if (token && userData && role) {
      try {
        const parsedUserData = JSON.parse(userData);
        setIsAuthenticated(true);
        setUser(parsedUserData);
        setUserRole(role);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        localStorage.removeItem('customer_id');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData, role) => {
    console.log('Login function called with:', { token, userData, role });
    
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('userRole', role);
    
    // Store customer_id for cart functionality
    if (userData.uid) {
      const customerId = userData.uid;
      localStorage.setItem('customer_id', customerId);
      console.log('Customer ID stored:', customerId);
    }

    // Store vendor_id for vendor functionality
    if (role === 'vendor' && userData.vendor_id) {
      const vendorId = userData.vendor_id;
      localStorage.setItem('vendor_id', vendorId);
      console.log('Vendor ID stored:', vendorId);
    } else if (role === 'vendor' && userData.id) {
      // Fallback: some APIs might use 'id' instead of 'vendor_id'
      const vendorId = userData.id;
      localStorage.setItem('vendor_id', vendorId);
      console.log('Vendor ID stored (fallback):', vendorId);
    } else if (role === 'vendor') {
      console.log('Vendor login but no vendor_id found in userData:', userData);
      console.log('Available keys in userData:', Object.keys(userData));
    }

    // Store driver_id for driver functionality
    if (role === 'driver' && userData.did) {
      const driverId = userData.did;
      localStorage.setItem('driver_id', driverId);
      console.log('Driver ID stored:', driverId);
    } else if (role === 'driver' && userData.id) {
      // Fallback: some APIs might use 'id' instead of 'did'
      const driverId = userData.id;
      localStorage.setItem('driver_id', driverId);
      console.log('Driver ID stored (fallback):', driverId);
    } else if (role === 'driver') {
      console.log('Driver login but no did found in userData:', userData);
    }

    setIsAuthenticated(true);
    setUser(userData);
    setUserRole(role);
    
    console.log('Login completed. localStorage contents:');
    console.log('token:', localStorage.getItem('token'));
    console.log('userData:', localStorage.getItem('userData'));
    console.log('userRole:', localStorage.getItem('userRole'));
    console.log('vendor_id:', localStorage.getItem('vendor_id'));
    console.log('customer_id:', localStorage.getItem('customer_id'));
    console.log('driver_id:', localStorage.getItem('driver_id'));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('customer_id');
    localStorage.removeItem('vendor_id');
    localStorage.removeItem('driver_id');
    
    setIsAuthenticated(false);
    setUser(null);
    setUserRole(null);
  };

  const value = {
    isAuthenticated,
    user,
    userRole,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <AuthProvider>
          <CartProvider>
            <Router>
              <Routes>
                {/* Public Route for Password Reset - Ensure this is a simple Route and at the top */}
                <Route 
                  path="/reset-password"
                  element={<CreatePassword />} 
                />

                {/* Public Route - Login - Only this one should be wrapped */}
                <Route 
                  path="/" 
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } 
                />
                
                {/* User Routes - Protected */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/invoice" 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <Invoice />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/products" 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <Products />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/all-products" 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <ViewAllProducts />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/cart" 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <ShoppingCart />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <Checkout />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/order-conformation" 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <OrderConfirmation />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/order-status" 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <OrderStatus />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/OrderCard' 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <OrderCard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/Invoicepage/:id' 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <InvoicesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/Profile' 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/profile/edit' 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <ProfileEdit />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/notifications" 
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <Notifications />
                    </ProtectedRoute>
                  } 
                />

                {/* Vendor Routes - Protected */}
                <Route 
                  path='/vdashboard' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <VDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/vendor-notifications" 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <VendorNotifications />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/ReviewOrder' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <ReviewOrder />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/OrderApproved' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <OrderApproved />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/Pickupdetails' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <Pickupdetails />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/AvailableStock' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <AvailableStock />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/ProcurementOrder' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <ProcurementOrder />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/EditOrder' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <EditOrder />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/AddProduct' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <AddProduct />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/Confirmation' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <Confirmation />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/Reports' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/VProfile' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <VProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/NegotiationPage' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <NegotiationPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/VendorProfileEdit' 
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <VendorProfileEdit />
                    </ProtectedRoute>
                  } 
                />

                {/* Driver Routes - Protected */}
                <Route 
                  path="/driver-dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/driver-notifications" 
                  element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverNotifications />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/driver-tasks" 
                  element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverTask />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/driver-activity" 
                  element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverLog />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/driver-profile" 
                  element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverAccount />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/driver-profile/edit" 
                  element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverProfileEdit />
                    </ProtectedRoute>
                  } 
                />

                {/* Admin/Shared Routes - You can adjust roles as needed */}
                {/* Uncomment when you have these components */}
                {/*
                <Route 
                  path='/customers' 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'vendor']}>
                      <CustomerManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path='/create-customer' 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'vendor']}>
                      <CustomerRegistrationForm />
                    </ProtectedRoute>
                  } 
                />
                */}

                {/* Catch all route - redirect to login, should be last */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </CartProvider>
        </AuthProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;