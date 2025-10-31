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
        minWidth: '320px',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
      }} 
      elevation={0}
    >
      <BottomNavigation
        showLabels
        value={currentValue}
        onChange={(event, newValue) => {
          const newPath = indexToPath[newValue];
          navigate(newPath);
        }}
        sx={{ 
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          minHeight: '64px',
          borderRadius: '24px 24px 0 0',
          paddingTop: '8px',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: isVerySmall ? '4px 2px' : isMobile ? '6px 4px' : '8px 12px',
            color: '#64748b',
            transition: 'all 0.3s ease',
            borderRadius: '12px',
            '& .MuiBottomNavigationAction-label': {
              fontSize: isVerySmall ? '0.7rem' : isMobile ? '0.8rem' : '0.85rem',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'visible',
              textOverflow: 'clip',
              maxWidth: 'none',
              textAlign: 'center',
              color: '#64748b',
              fontWeight: 500,
              marginTop: '4px'
            },
            '& .MuiSvgIcon-root': {
              fontSize: isVerySmall ? '1.2rem' : isMobile ? '1.3rem' : '1.6rem',
              color: '#64748b'
            }
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: '#16a34a',
            backgroundColor: '#dcfce7',
            '& .MuiBottomNavigationAction-label': {
              color: '#16a34a',
              fontWeight: 600
            },
            '& .MuiSvgIcon-root': {
              color: '#16a34a',
              transform: 'scale(1.1)'
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