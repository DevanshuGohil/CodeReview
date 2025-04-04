// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Divider,
    Skeleton,
    Alert,
    Stack
} from '@mui/material';
import {
    Add as AddIcon,
    Group as GroupIcon
} from '@mui/icons-material';

const Dashboard = () => {
    const { currentUser: user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const [projectsRes, teamsRes] = await Promise.all([
                    api.get('/projects'),
                    api.get('/teams')
                ]);
                setProjects(projectsRes.data);
                setTeams(teamsRes.data);
                setLoading(false);
            } catch (err) {
                setError(err.message || 'Failed to load dashboard data');
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (!user) return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Alert severity="info">Please log in to view your dashboard.</Alert>
        </Container>
    );

    if (loading) return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Skeleton variant="text" width="300px" height={60} sx={{ mb: 4 }} />
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Skeleton variant="rectangular" height={200} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Skeleton variant="rectangular" height={200} />
                </Grid>
            </Grid>
        </Container>
    );

    if (error) return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Alert severity="error">Error: {error}</Alert>
        </Container>
    );

    const userTeams = teams.filter(team => {
        if (!team.members || !Array.isArray(team.members)) return false;
        return team.members.some(member => {
            const memberId = member.user && typeof member.user === 'object'
                ? member.user._id
                : (typeof member.user === 'string' ? member.user : null);
            return memberId === user._id;
        });
    });

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
            {/* Header Section */}
            <Box sx={{
                mb: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="h3" component="h1" sx={{
                    fontWeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}>
                    Welcome, {user?.firstName || user?.username}!
                </Typography>

                {user?.role === 'manager' && (
                    <Stack direction="row" spacing={2}>
                        <Button
                            component={Link}
                            to="/projects/new"
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{
                                borderRadius: 1,
                                textTransform: 'none',
                                px: 3
                            }}
                        >
                            New Project
                        </Button>
                        <Button
                            component={Link}
                            to="/teams/new"
                            variant="contained"
                            color="secondary"
                            startIcon={<GroupIcon />}
                            sx={{
                                borderRadius: 1,
                                textTransform: 'none',
                                px: 3
                            }}
                        >
                            New Team
                        </Button>
                    </Stack>
                )}
            </Box>

            {/* Main Content */}
            <Grid container spacing={3}>
                {/* Projects Section */}
                <Grid item xs={12} md={8}>
                    <Paper
                        elevation={2}
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider'
                        }}
                    >
                        <Box sx={{
                            p: 2,
                            bgcolor: 'primary.dark',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Typography variant="h6" sx={{ color: 'primary.contrastText' }}>
                                Recent Projects
                            </Typography>
                            <Button
                                component={Link}
                                to="/projects"
                                sx={{
                                    color: 'primary.contrastText',
                                    textTransform: 'none',
                                    '&:hover': {
                                        color: 'primary.contrastText',
                                        opacity: 0.9
                                    }
                                }}
                            >
                                View All →
                            </Button>
                        </Box>
                        <Box sx={{ p: 3 }}>
                            {projects.length === 0 ? (
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography color="text.secondary">
                                        No projects found.
                                        {user?.role === 'manager' && (
                                            <Button
                                                component={Link}
                                                to="/projects/new"
                                                sx={{ ml: 1 }}
                                            >
                                                Create one
                                            </Button>
                                        )}
                                    </Typography>
                                </Box>
                            ) : (
                                <List disablePadding>
                                    {projects.slice(0, 5).map((project, index) => (
                                        <React.Fragment key={project._id}>
                                            {index > 0 && <Divider />}
                                            <ListItem disablePadding>
                                                <ListItemButton
                                                    component={Link}
                                                    to={`/projects/${project._id}`}
                                                    sx={{
                                                        py: 1.5,
                                                        '&:hover': {
                                                            bgcolor: 'action.hover'
                                                        }
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                                {project.name}
                                                            </Typography>
                                                        }
                                                        secondary={project.description}
                                                        secondaryTypographyProps={{
                                                            sx: { color: 'text.secondary' }
                                                        }}
                                                    />
                                                </ListItemButton>
                                            </ListItem>
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        {/* Teams Section */}
                        <Paper
                            elevation={2}
                            sx={{
                                borderRadius: 2,
                                overflow: 'hidden',
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider'
                            }}
                        >
                            <Box sx={{
                                p: 2,
                                bgcolor: 'secondary.dark',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Typography variant="h6" sx={{ color: 'secondary.contrastText' }}>
                                    My Teams
                                </Typography>
                                <Button
                                    component={Link}
                                    to="/teams"
                                    sx={{
                                        color: 'secondary.contrastText',
                                        textTransform: 'none',
                                        '&:hover': {
                                            color: 'secondary.contrastText',
                                            opacity: 0.9
                                        }
                                    }}
                                >
                                    View All →
                                </Button>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                {teams.length === 0 ? (
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography color="text.secondary">
                                            No teams found.
                                            {user?.role === 'manager' && (
                                                <Button
                                                    component={Link}
                                                    to="/teams/new"
                                                    sx={{ ml: 1 }}
                                                >
                                                    Create one
                                                </Button>
                                            )}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List disablePadding>
                                        {userTeams.map((team, index) => (
                                            <React.Fragment key={team._id}>
                                                {index > 0 && <Divider />}
                                                <ListItem disablePadding>
                                                    <ListItemButton
                                                        component={Link}
                                                        to={`/teams/${team._id}`}
                                                        sx={{
                                                            py: 1.5,
                                                            '&:hover': {
                                                                bgcolor: 'action.hover'
                                                            }
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                                    {team.name}
                                                                </Typography>
                                                            }
                                                        />
                                                    </ListItemButton>
                                                </ListItem>
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </Box>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
