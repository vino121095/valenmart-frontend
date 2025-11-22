import React from 'react';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isVerySmall = useMediaQuery('(max-width: 400px)');
  
  const value = pathToValue[location.pathname] ?? 0;

  const handleChange = (event, newValue) => {
    navigate(valueToPath[newValue]);
  };

  // Use shorter labels for very small screens
  const getLabel = (fullLabel) => {
    if (isVerySmall) {
      const shortLabels = {
        'Dashboard': 'Home',
        'Tasks': 'Tasks',
        'Activity': 'Activity',
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
        value={value}
        onChange={handleChange}
        sx={{ 
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          minHeight: '70px',
          borderRadius: '24px 24px 0 0',
          paddingTop: '8px',
          paddingBottom: '8px',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: isVerySmall ? '8px 4px' : isMobile ? '10px 8px' : '12px 12px',
            color: '#64748b',
            transition: 'all 0.3s ease',
            borderRadius: '16px',
            margin: '0 2px',
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
              color: '#64748b',
              marginBottom: '2px'
            }
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: '#16a34a',
            backgroundColor: '#dcfce7',
            paddingTop: isVerySmall ? '8px' : isMobile ? '10px' : '12px',
            paddingBottom: isVerySmall ? '8px' : isMobile ? '10px' : '12px',
            '& .MuiBottomNavigationAction-label': {
              color: '#16a34a',
              fontWeight: 600
            },
            '& .MuiSvgIcon-root': {
              color: '#16a34a',
              transform: 'scale(1.1)',
              marginBottom: '2px'
            }
          }
        }}
      >
        <BottomNavigationAction 
          label={getLabel("Dashboard")} 
          icon={<DashboardIcon />} 
        />
        <BottomNavigationAction 
          label={getLabel("Tasks")} 
          icon={<TasksIcon />} 
        />
        <BottomNavigationAction 
          label={getLabel("Activity")} 
          icon={<ActivityIcon />} 
        />
        <BottomNavigationAction 
          label={getLabel("Profile")} 
          icon={<ProfileIcon />} 
        />
      </BottomNavigation>
    </Paper>
  );
};

export default DriverFooter;