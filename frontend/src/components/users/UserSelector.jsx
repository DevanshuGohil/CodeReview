// components/users/UserSelector.jsx
import React, { useState, useEffect } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Typography,
    Box,
    Alert
} from '@mui/material';
import api from '../../axiosConfig';

const UserSelector = ({
    value,
    onChange,
    excludeUsers = [],
    label = "User",
    size = "medium",
    fullWidth = true,
    sx = {} // Add sx prop with default empty object
}) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await api.get('/users');

                // Filter out excluded users
                const filteredUsers = response.data.filter(
                    user => !excludeUsers.includes(user._id)
                );

                setUsers(filteredUsers);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchUsers();
    }, [excludeUsers]);

    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">Loading users...</Typography>
        </Box>
    );

    if (error) return (
        <Alert severity="error" sx={{ my: 1 }}>Error: {error}</Alert>
    );

    if (users.length === 0) return (
        <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>No users available</Typography>
    );

    return (
        <FormControl
            variant="outlined"
            size={size}
            fullWidth={fullWidth}
            sx={{
                minWidth: '250px',
                ...sx // Spread custom sx props
            }}
        >
            <InputLabel
                id="user-select-label"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
                {label}
            </InputLabel>
            <Select
                labelId="user-select-label"
                id="user-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                label={label}
                sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.23)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                    }
                }}
            >
                <MenuItem value="">
                    <em>Select a user</em>
                </MenuItem>
                {users.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.username || 'Unknown User')}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default UserSelector;
