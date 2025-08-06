import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Drawer,
    Paper,
    Typography,
    Chip
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Newspaper
} from '@mui/icons-material';

const CollapsibleSidebar = ({ pair }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const sidebarWidth = 280;

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