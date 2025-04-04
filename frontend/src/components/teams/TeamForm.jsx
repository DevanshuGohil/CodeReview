// components/teams/TeamForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Box,
    Alert,
    Grid
} from '@mui/material';

const TeamForm = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Check if user has permission to create teams (managers and admins)
    useEffect(() => {
        if (currentUser && currentUser.role !== 'manager' && currentUser.role !== 'admin') {
            setError('You do not have permission to create teams. Only managers can create teams.');
            // Redirect after a short delay
            const timer = setTimeout(() => {
                navigate('/teams');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Double-check permissions before submission
        if (currentUser.role !== 'manager' && currentUser.role !== 'admin') {
            setError('You do not have permission to create teams.');
            return;
        }

        try {
            await api.post('/teams', { name, description });
            navigate('/teams');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    // If user doesn't have permission, show restricted message
    if (currentUser && currentUser.role !== 'manager' && currentUser.role !== 'admin') {
        return (
            <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    You do not have permission to create teams. Only managers can create teams.
                </Alert>
                <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/teams"
                    sx={{ mt: 2 }}
                >
                    Back to Teams
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom color="text.primary">
                    Create New Team
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                id="name"
                                label="Team Name"
                                variant="outlined"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.23)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                        },
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="description"
                                label="Description"
                                variant="outlined"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                multiline
                                rows={4}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.23)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                        },
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    variant="outlined"
                                    component={Link}
                                    to="/teams"
                                    sx={{
                                        borderColor: 'rgba(255, 255, 255, 0.23)',
                                        color: 'text.primary',
                                        '&:hover': {
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                                        }
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    sx={{
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)',
                                        '&:hover': {
                                            boxShadow: '0 6px 10px rgba(0, 0, 0, 0.6)'
                                        }
                                    }}
                                >
                                    Create Team
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default TeamForm;
