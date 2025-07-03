import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const NegotiationPage = ({ userRole = 'admin' }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'vendor',
      text: 'Hi, I can offer 100 kg of lemons for ₹50/kg.',
      timestamp: '2025-05-30 10:00 AM',
    },
    {
      sender: 'admin',
      text: 'Can you reduce the price to ₹45/kg?',
      timestamp: '2025-05-30 10:10 AM',
    },
  ]);

  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim() === '') return;
    const newMsg = {
      sender: userRole,
      text: newMessage,
      timestamp: new Date().toLocaleString(),
    };
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const handleApprove = () => {
    const newMsg = {
      sender: 'admin',
      text: 'Approved. We will proceed with the negotiation terms.',
      timestamp: new Date().toLocaleString(),
    };
    setMessages([...messages, newMsg]);
  };

  const handleReject = () => {
    const newMsg = {
      sender: 'admin',
      text: 'Rejected. Please propose a better price.',
      timestamp: new Date().toLocaleString(),
    };
    setMessages([...messages, newMsg]);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, px: 2 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Product Negotiation
      </Typography>
      <Paper variant="outlined" sx={{ height: 500, p: 2, overflowY: 'auto', mb: 2 }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            display="flex"
            flexDirection="column"
            alignItems={msg.sender === userRole ? 'flex-end' : 'flex-start'}
            mb={2}
          >
            <Paper
              sx={{
                p: 1.5,
                maxWidth: '75%',
                backgroundColor: msg.sender === 'admin' ? '#E3F2FD' : '#E8F5E9',
              }}
            >
              <Typography variant="body1">{msg.text}</Typography>
              <Typography variant="caption" color="text.secondary">
                {msg.timestamp}
              </Typography>
            </Paper>
          </Box>
        ))}
      </Paper>

      {userRole === 'admin' && (
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              fullWidth
              onClick={handleApprove}
            >
              Approve
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              fullWidth
              onClick={handleReject}
            >
              Reject
            </Button>
          </Grid>
        </Grid>
      )}

      <Divider sx={{ mb: 2 }} />

      <Box display="flex" gap={1}>
        <TextField
          fullWidth
          placeholder="Type your message or price proposal..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          size="small"
        />
        <IconButton color="primary" onClick={handleSend}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default NegotiationPage;
