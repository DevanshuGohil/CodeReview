// components/projects/ProjectForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import TeamSelector from '../teams/TeamSelector';
import { useAuth } from '../../context/AuthContext';
import {
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Box,
    Alert,
    Grid,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Divider,
    Card,
    CardContent,
    CardHeader
} from '@mui/material';

const ProjectForm = () => {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [description, setDescription] = useState('');
    const [teams, setTeams] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [githubOwner, setGithubOwner] = useState('');
    const [githubRepo, setGithubRepo] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Check if user has permission to create projects
    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'manager') {
            setError('You do not have permission to create projects. Only managers can create projects.');
            // Redirect after a short delay
            const timer = setTimeout(() => {
                navigate('/projects');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await api.get('/teams');
                setTeams(response.data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchTeams();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Double-check permissions before submission
        if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
            setError('You do not have permission to create projects.');
            return;
        }

        try {
            // Format teams for API
            const formattedTeams = selectedTeams.map(teamId => ({
                team: teamId,
                accessLevel: 'read'
            }));

            // Format GitHub repo data
            const githubRepoData = {};
            if (githubOwner && githubRepo) {
                githubRepoData.owner = githubOwner;
                githubRepoData.repo = githubRepo;
                githubRepoData.url = `https://github.com/${githubOwner}/${githubRepo}`;
            }

            await api.post('/projects', {
                name,
                key,
                description,
                teams: formattedTeams,
                githubRepo: githubRepoData
            });

            navigate('/projects');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleTeamSelect = (teamId) => {
        if (selectedTeams.includes(teamId)) {
            setSelectedTeams(selectedTeams.filter(id => id !== teamId));
        } else {
            setSelectedTeams([...selectedTeams, teamId]);
        }
    };

    // Auto-generate key from project name
    const handleNameChange = (e) => {
        const newName = e.target.value;
        setName(newName);

        // Generate key from name (uppercase, no spaces)
        if (!key || key === name.toUpperCase().replace(/\s+/g, '')) {
            setKey(newName.toUpperCase().replace(/\s+/g, ''));
        }
    };

    // If user doesn't have permission, show restricted message
    if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'manager') {
        return (
            <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    You do not have permission to create projects. Only managers can create projects.
                </Alert>
                <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/projects"
                    sx={{ mt: 2 }}
                >
                    Back to Projects
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom color="text.primary" sx={{ mb: 4 }}>
                Create New Project
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={3}>
                    {/* Project basic info section */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            required
                            id="name"
                            label="Project Name"
                            variant="outlined"
                            value={name}
                            onChange={handleNameChange}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.23)',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                    },
                                },
                                mb: 3
                            }}
                        />

                        <TextField
                            fullWidth
                            required
                            id="key"
                            label="Project Key"
                            variant="outlined"
                            value={key}
                            onChange={(e) => setKey(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                            inputProps={{ maxLength: 10 }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.23)',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                    },
                                },
                                mb: 0.5
                            }}
                        />
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', ml: 1.5 }}>
                            A short, unique identifier for this project (e.g., PROJ, TEST)
                        </Typography>
                    </Grid>

                    {/* Description section */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            id="description"
                            label="Description"
                            variant="outlined"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            multiline
                            rows={7}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.23)',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                    },
                                }
                            }}
                        />
                    </Grid>

                    {/* Teams section */}
                    <Grid item xs={12}>
                        <Card variant="outlined" sx={{
                            bgcolor: 'background.paper',
                            borderColor: 'rgba(255, 255, 255, 0.12)',
                            borderRadius: 1,
                            mb: 3
                        }}>
                            <CardHeader
                                title="Teams"
                                sx={{
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                                    py: 1.5,
                                    '& .MuiCardHeader-title': {
                                        color: 'text.primary',
                                        fontSize: '1.1rem'
                                    }
                                }}
                            />
                            <CardContent sx={{ bgcolor: 'background.default' }}>
                                {teams.length === 0 ? (
                                    <Typography color="text.secondary">
                                        No teams available. {currentUser?.role === 'manager' || currentUser?.role === 'admin' ? (
                                            <Link to="/teams/new" style={{ color: '#1976d2' }}>Create a team</Link>
                                        ) : (
                                            <span>Only managers can create teams.</span>
                                        )}
                                    </Typography>
                                ) : (
                                    <Grid container spacing={1}>
                                        {teams.map(team => (
                                            <Grid item xs={12} sm={6} md={4} key={team._id}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={selectedTeams.includes(team._id)}
                                                            onChange={() => handleTeamSelect(team._id)}
                                                            sx={{
                                                                color: 'rgba(255, 255, 255, 0.7)',
                                                                '&.Mui-checked': {
                                                                    color: 'primary.main',
                                                                }
                                                            }}
                                                        />
                                                    }
                                                    label={team.name}
                                                    sx={{ color: 'text.primary' }}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* GitHub Repository section */}
                    <Grid item xs={12}>
                        <Card variant="outlined" sx={{
                            bgcolor: 'background.paper',
                            borderColor: 'rgba(255, 255, 255, 0.12)',
                            borderRadius: 1,
                            mb: 3
                        }}>
                            <CardHeader
                                title="GitHub Repository"
                                sx={{
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                                    py: 1.5,
                                    '& .MuiCardHeader-title': {
                                        color: 'text.primary',
                                        fontSize: '1.1rem'
                                    }
                                }}
                            />
                            <CardContent sx={{ bgcolor: 'background.default' }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            id="githubOwner"
                                            label="Repository Owner"
                                            variant="outlined"
                                            value={githubOwner}
                                            onChange={(e) => setGithubOwner(e.target.value)}
                                            placeholder="e.g., octocat"
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
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            id="githubRepo"
                                            label="Repository Name"
                                            variant="outlined"
                                            value={githubRepo}
                                            onChange={(e) => setGithubRepo(e.target.value)}
                                            placeholder="e.g., hello-world"
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
                                </Grid>
                                <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
                                    Optional: Link a GitHub repository to this project for PR reviews and code integration
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Buttons section */}
                    <Grid item xs={12} sx={{ textAlign: 'right' }}>
                        <Button
                            variant="outlined"
                            component={Link}
                            to="/projects"
                            sx={{
                                mr: 2,
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
                            Create Project
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default ProjectForm;
