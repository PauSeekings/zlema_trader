import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { Newspaper } from '@mui/icons-material';

const NewsPanel = ({ pair }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
        <Newspaper sx={{ mr: 1, verticalAlign: 'middle' }} />
        News Feed
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <Chip
          label="Coming Soon"
          color="secondary"
          variant="outlined"
        />
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          AI-powered news analysis for {pair} will be available soon.
        </Typography>
      </Box>
    </Paper>
  );
};

export default NewsPanel; 