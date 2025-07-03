import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';

const DriverFooter = () => {
  const [value, setValue] = useState(0);
  const navigate = useNavigate();

  const handleChange = (event, newValue) => {
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/driver-dashboard'); // Assuming a driver dashboard route
        break;
      case 1:
        navigate('/driver-tasks'); // Assuming a driver tasks route
        break;
      case 2:
        navigate('/driver-activity'); // Assuming a driver activity route
        break;
      case 3:
        navigate('/driver-profile'); // Assuming a driver profile route
        break;
      default:
        break;
    }
  };

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={value}
        onChange={handleChange}
        sx={{ backgroundColor: '#f5f5f5' }} // Light grey background
      >
        <BottomNavigationAction label="Dashboard" icon={<DashboardIcon />} sx={{ color: value === 0 ? '#4CAF50' : '#888' }} />
        <BottomNavigationAction label="Tasks" icon={<TasksIcon />} sx={{ color: value === 1 ? '#4CAF50' : '#888' }} />
        <BottomNavigationAction label="Activity" icon={<ActivityIcon />} sx={{ color: value === 2 ? '#4CAF50' : '#888' }} />
        <BottomNavigationAction label="Profile" icon={<ProfileIcon />} sx={{ color: value === 3 ? '#4CAF50' : '#888' }} />
      </BottomNavigation>
    </Paper>
  );
};

export default DriverFooter; 