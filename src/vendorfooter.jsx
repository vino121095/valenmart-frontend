import React from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import IncompleteCircleIcon from '@mui/icons-material/DonutLarge';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';

const VendorFooter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Map current path to a numeric index
  const pathToIndex = {
    '/vdashboard': 0,
    '/ProcurementOrder': 1,
    '/AddProduct': 2,
    '/Reports': 3,
    '/VProfile': 4,
  };

  const indexToPath = {
    0: '/vdashboard',
    1: '/ProcurementOrder',
    2: '/AddProduct',
    3: '/Reports',
    4: '/VProfile',
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
        <BottomNavigationAction label="Orders" icon={<ListAltIcon />} />
        <BottomNavigationAction label="Add" icon={<AddCircleOutlineIcon />} />
        <BottomNavigationAction label="Reports" icon={<ReceiptIcon />} />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default VendorFooter;
