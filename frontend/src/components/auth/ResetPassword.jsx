import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    Stack,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../axiosConfig';

const ResetPassword = () => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // Redirect to dashboard if user doesn't need to change password
    if (currentUser && !currentUser.requirePasswordChange && !success) {
        navigate('/dashboard');
        return null;
    }

    const handleTogglePasswordVisibility = (field) => {
        if (field === 'current') {
            setShowCurrentPassword(!showCurrentPassword);
        } else if (field === 'new') {
            setShowNewPassword(!showNewPassword);
        } else if (field === 'confirm') {
            setShowConfirmPassword(!showConfirmPassword);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors({
                ...validationErrors,
                [name]: ''
            });
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }

        if (!formData.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 6) {
            errors.newPassword = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your new password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/auth/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            setSuccess(true);

            // Log user out after 5 seconds
            setTimeout(() => {
                logout();
                navigate('/login');
            }, 5000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" align="center" gutterBottom>
                    {success ? 'Password Changed' : 'Reset Your Password'}
                </Typography>

                {success ? (
                    <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Your password has been changed successfully! You will be redirected to login with your new password in a few seconds.
                        </Alert>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                        >
                            Go to Login
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Typography variant="body1" color="text.secondary" gutterBottom align="center">
                            Please change your password to continue.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                            <Stack spacing={3}>
                                <TextField
                                    name="currentPassword"
                                    label="Current Password"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    error={!!validationErrors.currentPassword}
                                    helperText={validationErrors.currentPassword}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => handleTogglePasswordVisibility('current')} edge="end">
                                                    {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />

                                <TextField
                                    name="newPassword"
                                    label="New Password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    error={!!validationErrors.newPassword}
                                    helperText={validationErrors.newPassword}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => handleTogglePasswordVisibility('new')} edge="end">
                                                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />

                                <TextField
                                    name="confirmPassword"
                                    label="Confirm New Password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="outlined"
                                    error={!!validationErrors.confirmPassword}
                                    helperText={validationErrors.confirmPassword}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => handleTogglePasswordVisibility('confirm')} edge="end">
                                                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    size="large"
                                    disabled={loading}
                                >
                                    {loading ? 'Changing Password...' : 'Change Password'}
                                </Button>
                            </Stack>
                        </Box>
                    </>
                )}
            </Paper>
        </Container>
    );
};

export default ResetPassword; 