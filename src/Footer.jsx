// Footer.js
import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import IncompleteCircleIcon from '@mui/icons-material/DonutLarge';
import InboxIcon from '@mui/icons-material/Inbox';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={currentValue}
        onChange={(event, newValue) => {
          const newPath = indexToPath[newValue];
          navigate(newPath);
        }}
        sx={{ backgroundColor: '#f5f5f5' }}
      >
        <BottomNavigationAction label="Dashboard" icon={<IncompleteCircleIcon />} />
        <BottomNavigationAction label="Products" icon={<InboxIcon />} />
        <BottomNavigationAction label="Orders" icon={<ListAltIcon />} />
        <BottomNavigationAction label="Invoices" icon={<ReceiptIcon />} />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default Footer;
