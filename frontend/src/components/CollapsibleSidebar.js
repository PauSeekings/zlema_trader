import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Drawer,
  Paper,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  CircularProgress
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Newspaper,
  ExpandMore
} from '@mui/icons-material';
import axios from 'axios';

const CollapsibleSidebar = ({ pair }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/news', {
        params: {
          currency_pair: pair,
          enable_ai_analysis: true
        }
      });
      setNewsData(response.data);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNews();
    }
  }, [isOpen, pair]);

  const sidebarWidth = 350; // Match the right column width (md={3} = 25% of 12 columns)

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'BUY': return '#4caf50';
      case 'SELL': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'BUY': return '🟢';
      case 'SELL': return '🔴';
      default: return '🟡';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <IconButton
        onClick={toggleSidebar}
        sx={{
          position: 'fixed',
          left: isOpen ? sidebarWidth - 20 : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1200,
          backgroundColor: '#1a1a1a',
          color: '#888888',
          border: '1px solid #333',
          borderRadius: '0 4px 4px 0',
          '&:hover': {
            backgroundColor: '#333',
          }
        }}
      >
        {isOpen ? <ChevronLeft /> : <ChevronRight />}
      </IconButton>

      {/* Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={isOpen}
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            boxSizing: 'border-box',
            backgroundColor: '#1a1a1a',
            borderRight: '1px solid #333',
            marginTop: '64px', // Account for AppBar height
            height: 'calc(100vh - 64px)'
          },
        }}
      >
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
            <Newspaper sx={{ mr: 1 }} />
            News Feed
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : newsData && newsData.news_items ? (
            <Box sx={{ mt: 2 }}>
              {newsData.news_items.map((item, index) => (
                <Accordion key={index} sx={{ backgroundColor: '#1a1a1a', mb: 1 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={{ color: '#888888' }} />}
                    sx={{
                      backgroundColor: '#1a1a1a',
                      '& .MuiAccordionSummary-content': { margin: '8px 0' }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <Typography variant="body2" sx={{ color: '#888888', fontSize: '0.75rem', mb: 0.5 }}>
                        {item.published} | {item.source}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ffffff', fontSize: '0.875rem', lineHeight: 1.3 }}>
                        {item.title}
                      </Typography>
                      {item.analysis && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: getImpactColor(item.analysis.impact),
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {getImpactIcon(item.analysis.impact)} {item.analysis.impact} ({item.analysis.confidence})
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ backgroundColor: '#1a1a1a', p: 2 }}>
                    <Typography variant="body2" sx={{ color: '#cccccc', mb: 1 }}>
                      {item.description}
                    </Typography>
                    {item.analysis && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#888888', fontSize: '0.75rem', mb: 0.5 }}>
                          AI Analysis:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#cccccc', fontSize: '0.75rem' }}>
                          {item.analysis.reasoning}
                        </Typography>
                      </Box>
                    )}
                    {item.link && (
                      <Link
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#4caf50',
                          fontSize: '0.75rem',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        Read more →
                      </Link>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Chip
                label="News feed unavailable"
                color="secondary"
                variant="outlined"
              />
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Check your internet connection and try again.
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Main content margin adjustment */}
      <Box
        sx={{
          marginLeft: isOpen ? sidebarWidth : 0,
          transition: 'margin-left 0.3s ease',
        }}
      />
    </>
  );
};

export default CollapsibleSidebar; 