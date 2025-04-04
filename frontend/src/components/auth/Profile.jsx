import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../axiosConfig';
import {
    Container,
    Grid,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Divider,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Save as SaveIcon,
    Key as KeyIcon
} from '@mui/icons-material';

const Profile = () => {
    const { currentUser, setUser } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
    });
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const [nameErrors, setNameErrors] = useState({
        firstName: '',
        lastName: ''
    });

    // Password validation regex patterns
    const passwordValidations = {
        minLength: /.{8,}/,
        hasUpperCase: /[A-Z]/,
        hasNumber: /\d/,
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
    };

    // Load user data into form when component mounts
    useEffect(() => {
        if (currentUser) {
            setFormData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || ''
            });
        }
    }, [currentUser]);

    const handleChange = (e) => {
        const { id, value } = e.target;

        // Name field validation (alphabets only)
        if (id === 'firstName' || id === 'lastName') {
            // Allow letters, spaces, hyphens, and apostrophes
            if (value && !/^[A-Za-z\s\-']+$/.test(value)) {
                setNameErrors({
                    ...nameErrors,
                    [id]: 'Only alphabetic characters, spaces, hyphens, and apostrophes are allowed'
                });
            } else {
                setNameErrors({
                    ...nameErrors,
                    [id]: ''
                });
            }
        }

        setFormData({
            ...formData,
            [id]: value
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.id]: e.target.value
        });
    };

    const handleTogglePasswordVisibility = (field) => {
        setShowPassword({
            ...showPassword,
            [field]: !showPassword[field]
        });
    };

    const validatePassword = (password) => {
        const errors = [];

        if (!passwordValidations.minLength.test(password)) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!passwordValidations.hasUpperCase.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!passwordValidations.hasNumber.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!passwordValidations.hasSpecialChar.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check for name validation errors
        if (nameErrors.firstName || nameErrors.lastName) {
            setError('Please fix the validation errors before submitting');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Only send fields that can be updated (username is read-only)
            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email
            };

            const response = await api.put('/users/me', updateData);

            // Update the user in context
            setUser(response.data);

            setSuccess(true);
            setLoading(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordError(null);
        setPasswordSuccess(false);

        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            setPasswordLoading(false);
            return;
        }

        // Validate password complexity
        const passwordErrors = validatePassword(passwordData.newPassword);
        if (passwordErrors.length > 0) {
            setPasswordError(passwordErrors.join('. '));
            setPasswordLoading(false);
            return;
        }

        try {
            await api.put('/users/me/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            // Clear password fields
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            setPasswordSuccess(true);
            setPasswordLoading(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setPasswordSuccess(false);
            }, 3000);
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to update password');
            setPasswordLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <Container sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2, color: 'white' }}>Loading user data...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper
                        elevation={0}
                        variant="outlined"
                        sx={{
                            p: 3,
                            mb: 3,
                            bgcolor: 'rgba(18, 18, 18, 0.9)',
                            borderColor: 'rgba(255, 255, 255, 0.12)'
                        }}
                    >
                        <Typography variant="h5" component="h1" color="white" sx={{ mb: 3 }}>
                            Profile Settings
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 3 }}>Profile updated successfully!</Alert>}

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                id="username"
                                label="Username"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={formData.username}
                                disabled
                                InputProps={{
                                    readOnly: true,
                                    sx: { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                                helperText="Username cannot be changed"
                                FormHelperTextProps={{ sx: { color: 'rgba(255, 255, 255, 0.5)' } }}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                                    },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                            />

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        id="firstName"
                                        label="First Name"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        error={!!nameErrors.firstName}
                                        helperText={nameErrors.firstName}
                                        InputProps={{ sx: { color: 'white' } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                                            },
                                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        id="lastName"
                                        label="Last Name"
                                        variant="outlined"
                                        fullWidth
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        error={!!nameErrors.lastName}
                                        helperText={nameErrors.lastName}
                                        InputProps={{ sx: { color: 'white' } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                                            },
                                            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            <TextField
                                id="email"
                                label="Email"
                                type="email"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                InputProps={{ sx: { color: 'white' } }}
                                sx={{
                                    my: 2,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                        '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                                    },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loading || nameErrors.firstName || nameErrors.lastName}
                                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                sx={{ mt: 2 }}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Box>
                    </Paper>

                    <Paper
                        elevation={0}
                        variant="outlined"
                        sx={{
                            p: 3,
                            bgcolor: 'rgba(18, 18, 18, 0.9)',
                            borderColor: 'rgba(255, 255, 255, 0.12)'
                        }}
                    >
                        <Typography variant="h5" component="h2" color="white" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <KeyIcon />
                            Change Password
                        </Typography>

                        {passwordError && <Alert severity="error" sx={{ mb: 3 }}>{passwordError}</Alert>}
                        {passwordSuccess && <Alert severity="success" sx={{ mb: 3 }}>Password changed successfully!</Alert>}

                        <Box component="form" onSubmit={handlePasswordSubmit}>
                            <TextField
                                id="currentPassword"
                                label="Current Password"
                                type={showPassword.currentPassword ? 'text' : 'password'}
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                required
                                InputProps={{
                                    sx: { color: 'white' },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => handleTogglePasswordVisibility('currentPassword')}
                                                edge="end"
                                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                            >
                                                {showPassword.currentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                        '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                                    },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                            />

                            <TextField
                                id="newPassword"
                                label="New Password"
                                type={showPassword.newPassword ? 'text' : 'password'}
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                                InputProps={{
                                    sx: { color: 'white' },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => handleTogglePasswordVisibility('newPassword')}
                                                edge="end"
                                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                            >
                                                {showPassword.newPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                helperText="Password must be at least 8 characters, include one uppercase letter, one number, and one special character."
                                FormHelperTextProps={{ sx: { color: 'rgba(255, 255, 255, 0.5)' } }}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                        '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                                    },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                            />

                            <TextField
                                id="confirmPassword"
                                label="Confirm New Password"
                                type={showPassword.confirmPassword ? 'text' : 'password'}
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                                InputProps={{
                                    sx: { color: 'white' },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => handleTogglePasswordVisibility('confirmPassword')}
                                                edge="end"
                                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                            >
                                                {showPassword.confirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                                        '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                                    },
                                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                color="error"
                                disabled={passwordLoading}
                                startIcon={passwordLoading ? <CircularProgress size={20} /> : <KeyIcon />}
                                sx={{ mt: 2 }}
                            >
                                {passwordLoading ? 'Changing Password...' : 'Change Password'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Profile; 