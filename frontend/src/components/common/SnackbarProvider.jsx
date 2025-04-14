import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Create context
const SnackbarContext = createContext();

// Custom hook to use the snackbar
export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};

export const SnackbarProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info'); // 'success', 'error', 'warning', 'info'
    const [duration, setDuration] = useState(5000);

    // Function to show a snackbar
    const showSnackbar = (message, severity = 'info', duration = 5000) => {
        setMessage(message);
        setSeverity(severity);
        setDuration(duration);
        setOpen(true);
    };

    // Helper functions for different types of messages
    const showSuccess = (message, duration = 5000) => showSnackbar(message, 'success', duration);
    const showError = (message, duration = 6000) => showSnackbar(message, 'error', duration);
    const showInfo = (message, duration = 5000) => showSnackbar(message, 'info', duration);
    const showWarning = (message, duration = 5000) => showSnackbar(message, 'warning', duration);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const value = {
        showSnackbar,
        showSuccess,
        showError,
        showInfo,
        showWarning
    };

    return (
        <SnackbarContext.Provider value={value}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={duration}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleClose}
                    severity={severity}
                    variant="filled"
                    action={
                        <IconButton
                            size="small"
                            aria-label="close"
                            color="inherit"
                            onClick={handleClose}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    }
                >
                    {message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

export default SnackbarProvider; 