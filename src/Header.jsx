// src/components/Header.js

import { Box, IconButton, Typography, Avatar, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useNavigate } from 'react-router-dom';
import { useCart } from './context/CartContext';
import { useState, useEffect } from 'react';
import baseurl from './baseurl/ApiService';
import { useAuth } from './App';

function Header({
  showBackArrow = true,
  label = 'Hello SRM',
  showNotifications = true,
  showCart = true,
  showAvatar = true,
  avatarText = 'S',
  showFilter = false,
  disableInstituteName = false,
}) {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [instituteName, setInstituteName] = useState('');
  const [headerProfileImageUrl, setHeaderProfileImageUrl] = useState('');

  // Fetch customer profile only if not disabled
  useEffect(() => {
    if (disableInstituteName) return;
    const fetchCustomerProfile = async () => {
      try {
        const customerId = user?.uid || user?.id;
        console.log('Customer ID:', customerId); // Debug log

        if (!customerId) {
          console.log('No customer ID found'); // Debug log
          return;
        }

        const authToken = localStorage.getItem('token');
        console.log('Auth Token:', authToken ? 'Present' : 'Missing'); // Debug log

        const response = await fetch(`${baseurl}/api/customer-profile/${customerId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });

        console.log('Response status:', response.status); // Debug log

        if (!response.ok) {
          throw new Error('Failed to fetch customer profile');
        }

        const data = await response.json();
        console.log('Full API Response:', data); // Debug log

        // Check all possible locations for institute name
        const possibleInstituteName = 
          data?.data?.institution_name || 
          data?.data?.instituteName ||
          data?.data?.name ||
          data?.institute_name ||
          data?.instituteName ||
          data?.name;

        console.log('Found institute name:', possibleInstituteName); // Debug log

        if (possibleInstituteName) {
          setInstituteName(possibleInstituteName);
        } else {
          // If no institute name found, try to get it from user data
          const userInstituteName = user?.institute_name || user?.instituteName;
          console.log('User institute name:', userInstituteName); // Debug log
          
          if (userInstituteName) {
            setInstituteName(userInstituteName);
          } else {
            console.log('No institute name found in any location'); // Debug log
          }
        }

        // Also check for profile image URL
        const possibleProfileImage = 
          data?.data?.User?.profile_image ||
          data?.data?.profile_image; // Check directly if not nested

        console.log('Found profile image path:', possibleProfileImage);

        if (possibleProfileImage) {
          // Assuming API returns a path like 'uploads/images/image.jpg'
          setHeaderProfileImageUrl(`${baseurl}/uploads/profile_images/${possibleProfileImage}`);
        } else {
          setHeaderProfileImageUrl(''); // Clear image if none found
          console.log('No profile image found in API response');
        }

      } catch (error) {
        console.error('Error fetching customer profile:', error);
      }
    };

    if (user) {
      console.log('User data:', user); // Debug log
      fetchCustomerProfile();
    } else {
      console.log('No user data available'); // Debug log
    }
  }, [user, disableInstituteName]);

  // Get the first letter of institute name for avatar
  const getAvatarText = () => {
    if (instituteName) {
      return instituteName.charAt(0).toUpperCase();
    }
    return 'S'; // Default to 'S' if no institute name
  };

  // Get the display label
  const getDisplayLabel = () => {
    if (!disableInstituteName && instituteName) {
      return instituteName;
    }
    return label; // Default label if no institute name or disabled
  };

  const markNotificationsAsRead = async () => {
    try {
      const authToken = localStorage.getItem('token');
      const customerId = user?.uid || user?.id;
      
      if (!customerId) return;

      const response = await fetch(`${baseurl}/api/notification/mark-read/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state to reflect all notifications as read
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          is_read: true
        }))
      );
      setNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const authToken = localStorage.getItem('token');
        const customerId = user?.uid || user?.id;
        
        if (!customerId) return;

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
        if (data && data.notifications) {
          setNotifications(data.notifications);
          // Count unread notifications
          const unreadCount = data.notifications.filter(notification => !notification.is_read).length;
          setNotificationCount(unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    // Set up polling every 30 seconds to check for new notifications
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleIconClick = (type) => {
    if (type === 'cart') navigate('/cart');
    if (type === 'notifications') {
      // Mark notifications as read when clicking the notification icon
      markNotificationsAsRead();
      navigate('/notifications', { 
        state: { 
          notifications: notifications
        } 
      });
    }
    if (type === 'back') navigate(-1);
    if (type === 'filter') alert('Filter clicked!'); // Replace with actual logic
  };

  return (
    <Box
      component="header"
      sx={{
        backgroundColor: '#00B074',
        p: { xs: 2, sm: 3, md: 2 },
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {/* Left: Back Arrow, Avatar, Label */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showBackArrow && (
          <IconButton
            onClick={() => handleIconClick('back')}
            sx={{
              backgroundColor: '#FFFFFF4D',
              color: 'white',
              borderRadius: '50%',
              p: 1,
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
        )}
        {showAvatar && (
          <Avatar src={headerProfileImageUrl || ''}>
            {getAvatarText()}
          </Avatar>
        )}
        <Typography variant="h6" sx={{ color: 'white' }}>
          {getDisplayLabel()}
        </Typography>
      </Box>

      {/* Right: Notification, Cart, Filter */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {showNotifications && (
          <IconButton
            onClick={() => handleIconClick('notifications')}
            sx={{
              backgroundColor: '#FFFFFF4D',
              color: 'white',
              borderRadius: '50%',
              p: 1,
            }}
          >
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        )}
        {showCart && (
          <IconButton
            onClick={() => handleIconClick('cart')}
            sx={{
              backgroundColor: '#FFFFFF4D',
              color: 'white',
              borderRadius: '50%',
              p: 1,
            }}
          >
            <Badge badgeContent={cartCount} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        )}
        {showFilter && (
          <IconButton
            onClick={() => handleIconClick('filter')}
            sx={{
              backgroundColor: '#FFFFFF4D',
              color: 'white',
              borderRadius: '50%',
              p: 1,
            }}
          >
            <FilterListIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

export default Header;