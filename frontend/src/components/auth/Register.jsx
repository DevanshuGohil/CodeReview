// components/auth/Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Container,
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    Grid,
    CircularProgress,
    Link as MuiLink,
    LinearProgress
} from '@mui/material';
import { PersonAdd as PersonAddIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from '@mui/icons-material';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        special: false,
        number: false,
        alphabet: false,
        strength: 0
    });
    const { register, setUser } = useAuth();
    const navigate = useNavigate();

    const { username, email, password, confirmPassword, firstName, lastName } = formData;

    // Password validation
    useEffect(() => {
        const hasLength = password.length >= 8;
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasAlphabet = /[a-zA-Z]/.test(password);

        // Calculate password strength (0-100)
        let strength = 0;
        if (password.length > 0) {
            // Base points for length
            strength += Math.min(password.length * 5, 40);

            // Points for character variety
            if (hasSpecial) strength += 20;
            if (hasNumber) strength += 20;
            if (hasAlphabet) strength += 20;
        }

        setPasswordValidation({
            length: hasLength,
            special: hasSpecial,
            number: hasNumber,
            alphabet: hasAlphabet,
            strength
        });
    }, [password]);

    // Password strength color
    const getStrengthColor = (strength) => {
        if (strength < 30) return '#f44336'; // Red
        if (strength < 60) return '#ff9800'; // Orange
        return '#4caf50'; // Green
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Check password validation
        const { length, special, number, alphabet } = passwordValidation;
        if (!length || !special || !number || !alphabet) {
            setError('Password does not meet the requirements');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await register({
                username,
                email,
                password,
                firstName,
                lastName
            });

            setUser(response.data.user);
            navigate('/dashboard');
        } catch (err) {
            if (err.response?.data?.errors) {
                // Display password validation errors from server
                setError(
                    <div>
                        <p>{err.response.data.message}</p>
                        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                            {err.response.data.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                );
            } else {
                setError(err.response?.data?.message || 'Failed to register');
            }
            setLoading(false);
        }
    };

    // Render validation icon
    const ValidationIcon = ({ isValid }) => (
        isValid
            ? <CheckCircleIcon fontSize="small" sx={{ color: '#4caf50', ml: 1 }} />
            : <CancelIcon fontSize="small" sx={{ color: '#f44336', ml: 1 }} />
    );

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mt: 8,
                    mb: 4
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        width: '100%',
                        borderRadius: 2
                    }}
                >
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Typography
                            component="h1"
                            variant="h4"
                            sx={{ fontWeight: 500, mb: 1 }}
                        >
                            Create Account
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Join CodeReview to start collaborating
                        </Typography>
                    </Box>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3 }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Grid container spacing={2} sx={{ mb: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    id="firstName"
                                    label="First Name"
                                    name="firstName"
                                    autoComplete="given-name"
                                    value={firstName}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    id="lastName"
                                    label="Last Name"
                                    name="lastName"
                                    autoComplete="family-name"
                                    value={lastName}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            value={username}
                            onChange={handleChange}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            type="email"
                            value={email}
                            onChange={handleChange}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="password"
                            label="Password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={handleChange}
                            error={password.length > 0 && !passwordValidation.length}
                        />

                        {/* Password validation indicators */}
                        {password.length > 0 && (
                            <Box sx={{ mt: 1, mb: 2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={passwordValidation.strength}
                                    sx={{
                                        mb: 1,
                                        height: 8,
                                        borderRadius: 5,
                                        backgroundColor: 'rgba(0,0,0,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: getStrengthColor(passwordValidation.strength)
                                        }
                                    }}
                                />

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Password must have:
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            At least 8 characters
                                        </Typography>
                                        <ValidationIcon isValid={passwordValidation.length} />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            At least one special character (e.g., !@#$%^&*)
                                        </Typography>
                                        <ValidationIcon isValid={passwordValidation.special} />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            At least one number
                                        </Typography>
                                        <ValidationIcon isValid={passwordValidation.number} />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            At least one letter
                                        </Typography>
                                        <ValidationIcon isValid={passwordValidation.alphabet} />
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="confirmPassword"
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={handleChange}
                            error={confirmPassword.length > 0 && password !== confirmPassword}
                            helperText={confirmPassword.length > 0 && password !== confirmPassword ? "Passwords don't match" : ""}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading || !passwordValidation.length || !passwordValidation.special || !passwordValidation.number || !passwordValidation.alphabet || password !== confirmPassword}
                            startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                            sx={{ py: 1.5 }}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2">
                                Already have an account?{' '}
                                <MuiLink
                                    component={Link}
                                    to="/login"
                                    sx={{ fontWeight: 500 }}
                                >
                                    Login
                                </MuiLink>
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;
