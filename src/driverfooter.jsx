import React from 'react';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as TasksIcon,
  Receipt as ActivityIcon,
  Person as ProfileIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const pathToValue = {
  '/driver-dashboard': 0,
  '/driver-tasks': 1,
  '/driver-activity': 2,
  '/driver-profile': 3,
};

const valueToPath = [
  '/driver-dashboard',
  '/driver-tasks',
  '/driver-activity',
  '/driver-profile',
];

const DriverFooter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const value = pathToValue[location.pathname] ?? 0;

  const handleChange = (event, newValue) => {
    navigate(valueToPath[newValue]);
  };

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={value}
        onChange={handleChange}
        sx={{ backgroundColor: '#f5f5f5' }}
      >
        <BottomNavigationAction label="Dashboard" icon={<DashboardIcon />} sx={{ color: value === 0 ? '#4CAF50' : '#000' }} />
        <BottomNavigationAction label="Tasks" icon={<TasksIcon />} sx={{ color: value === 1 ? '#4CAF50' : '#000' }} />
        <BottomNavigationAction label="Activity" icon={<ActivityIcon />} sx={{ color: value === 2 ? '#4CAF50' : '#000' }} />
        <BottomNavigationAction label="Profile" icon={<ProfileIcon />} sx={{ color: value === 3 ? '#4CAF50' : '#000' }} />
      </BottomNavigation>
    </Paper>
  );
};

export default DriverFooter; 