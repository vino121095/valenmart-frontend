import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Badge,
  Divider,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import Header from '../Header';
import { useLocation, useNavigate } from 'react-router-dom';
import baseurl from '../baseurl/ApiService';
import { useAuth } from '../App';
import Footer from '../Footer';

const Notifications = ({customerId}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const authToken = localStorage.getItem('token');
        const customerId = user?.uid || user?.id;
        
        if (!customerId) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const response = await fetch(`${baseurl}/api/notification/all/${customerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();
        // console.log('Raw API Response:', data);

        // Handle the notifications array from the response
        if (data && data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        } else {
          console.error('Unexpected notification data format:', data);
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const markNotificationAsRead = async (notificationId) => {
    try {
      const authToken = localStorage.getItem('token');
      const response = await fetch(`${baseurl}/api/notification/all/${customerId}`,  {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'order':
        return <AssignmentIcon sx={{ color: '#16a34a' }} />;
      case 'shipping':
        return <ShippingIcon sx={{ color: '#16a34a' }} />;
      case 'payment':
        return <PaymentIcon sx={{ color: '#16a34a' }} />;
      default:
        return <NotificationsIcon sx={{ color: '#16a34a' }} />;
    }
  };



  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: '#f8fafc'
      }}>
        <CircularProgress size={40} sx={{ color: '#10b981' }} />
        <Typography variant="body1" sx={{ mt: 2, color: '#666' }}>
          Loading notifications...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pt: 10 }}>
      <Header label="Notifications" showBackArrow={true} />

      {error && (
        <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ p: 2, mb: 10 }}>
        {!loading && notifications.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            mt: 6, 
            p: 4,
            bgcolor: 'white',
            borderRadius: 3,
            border: '1px solid #e2e8f0'
          }}>
            <NotificationsIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              No notifications
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You don't have any notifications yet.
            </Typography>
          </Box>
        ) : (
          notifications.map((notification, index) => {
            // console.log('Rendering notification:', notification);
            return (
              <Card 
                key={notification.nid || index}
                elevation={0}
                sx={{ 
                  mb: 2, 
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  bgcolor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => !notification.is_read && markNotificationAsRead(notification.nid)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ 
                      bgcolor: '#dcfce7', 
                      borderRadius: '50%', 
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getNotificationIcon(notification.Order?.status)}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Order #{notification.Order.order_id}
                        </Typography>
                        <Chip 
                          label={notification.Order?.status || 'New Order'}
                          size="small"
                          sx={{ 
                            bgcolor: '#dcfce7',
                            color: '#16a34a',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {notification.message}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                        {!notification.is_read && (
                          <Chip 
                            label="New"
                            size="small"
                            sx={{ 
                              bgcolor: '#10b981',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default Notifications; 