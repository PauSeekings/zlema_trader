import React from 'react';
import {
    Box,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Typography,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

const KeyLevelsControls = ({ overlaySettings, setOverlaySettings }) => {
    const handleToggle = (type) => {
        setOverlaySettings(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Key Levels Overlay</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={overlaySettings.support}
                                    onChange={() => handleToggle('support')}
                                    sx={{
                                        color: '#00ff00',
                                        '&.Mui-checked': {
                                            color: '#00ff00',
                                        },
                                    }}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 2,
                                            bgcolor: '#00ff00',
                                            mr: 1
                                        }}
                                    />
                                    <Typography>Support Levels</Typography>
                                </Box>
                            }
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={overlaySettings.resistance}
                                    onChange={() => handleToggle('resistance')}
                                    sx={{
                                        color: '#ff0000',
                                        '&.Mui-checked': {
                                            color: '#ff0000',
                                        },
                                    }}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 2,
                                            bgcolor: '#ff0000',
                                            mr: 1
                                        }}
                                    />
                                    <Typography>Resistance Levels</Typography>
                                </Box>
                            }
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={overlaySettings.volume}
                                    onChange={() => handleToggle('volume')}
                                    sx={{
                                        color: '#ffff00',
                                        '&.Mui-checked': {
                                            color: '#ffff00',
                                        },
                                    }}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 2,
                                            bgcolor: '#ffff00',
                                            mr: 1
                                        }}
                                    />
                                    <Typography>Volume Profile</Typography>
                                </Box>
                            }
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={overlaySettings.fibonacci}
                                    onChange={() => handleToggle('fibonacci')}
                                    sx={{
                                        color: '#00ffff',
                                        '&.Mui-checked': {
                                            color: '#00ffff',
                                        },
                                    }}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 2,
                                            bgcolor: '#00ffff',
                                            mr: 1
                                        }}
                                    />
                                    <Typography>Fibonacci Levels</Typography>
                                </Box>
                            }
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={overlaySettings.pivots}
                                    onChange={() => handleToggle('pivots')}
                                    sx={{
                                        color: '#ff00ff',
                                        '&.Mui-checked': {
                                            color: '#ff00ff',
                                        },
                                    }}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 2,
                                            bgcolor: '#ff00ff',
                                            mr: 1
                                        }}
                                    />
                                    <Typography>Pivot Points</Typography>
                                </Box>
                            }
                        />
                    </FormGroup>
                </AccordionDetails>
            </Accordion>
        </Paper>
    );
};

export default KeyLevelsControls; 