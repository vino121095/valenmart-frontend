// Footer.js
import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import IncompleteCircleIcon from '@mui/icons-material/DonutLarge';
import InboxIcon from '@mui/icons-material/Inbox';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isVerySmall = useMediaQuery('(max-width: 400px)');

  // Map current path to a numeric index
  const pathToIndex = {
    '/': 0,
    '/products': 1,
    '/OrderCard': 2,
    '/invoice': 3,
    '/profile': 4,
  };

  const indexToPath = {
    0: '/',
    1: '/products',
    2: '/OrderCard',
    3: '/invoice',
    4: '/profile',
  };

  const currentPath = location.pathname;
  const currentValue = pathToIndex[currentPath] ?? 0;

  // Use shorter labels for very small screens
  const getLabel = (fullLabel) => {
    if (isVerySmall) {
      const shortLabels = {
        'Dashboard': 'Home',
        'Products': 'Shop',
        'Orders': 'Orders',
        'Invoices': 'Bills',
        'Profile': 'Profile'
      };
      return shortLabels[fullLabel] || fullLabel;
    }
    return fullLabel;
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: 1000,
        width: '100%',
        minWidth: '320px'
      }} 
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={currentValue}
        onChange={(event, newValue) => {
          const newPath = indexToPath[newValue];
          navigate(newPath);
        }}
        sx={{ 
          backgroundColor: '#f5f5f5',
          minHeight: '56px',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: isVerySmall ? '4px 2px' : isMobile ? '6px 4px' : '6px 12px',
            '& .MuiBottomNavigationAction-label': {
              fontSize: isVerySmall ? '0.65rem' : isMobile ? '0.7rem' : '0.75rem',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'visible',
              textOverflow: 'clip',
              maxWidth: 'none',
              textAlign: 'center'
            },
            '& .MuiSvgIcon-root': {
              fontSize: isVerySmall ? '1.1rem' : isMobile ? '1.2rem' : '1.5rem',
            }
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: '#4CAF50',
            '& .MuiBottomNavigationAction-label': {
              color: '#4CAF50',
            }
          }
        }}
      >
        <BottomNavigationAction 
          label={getLabel("Dashboard")} 
          icon={<IncompleteCircleIcon />} 
        />
        <BottomNavigationAction 
          label={getLabel("Products")} 
          icon={<InboxIcon />} 
        />
        <BottomNavigationAction 
          label={getLabel("Orders")} 
          icon={<ListAltIcon />} 
        />
        <BottomNavigationAction 
          label={getLabel("Invoices")} 
          icon={<ReceiptIcon />} 
        />
        <BottomNavigationAction 
          label={getLabel("Profile")} 
          icon={<PersonIcon />} 
        />
      </BottomNavigation>
    </Paper>
  );
};

export default Footer;