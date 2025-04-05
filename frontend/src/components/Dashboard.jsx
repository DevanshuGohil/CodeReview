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
import PRActivitySummary from './dashboard/PRActivitySummary';
import TeamCollaborationMetrics from './dashboard/TeamCollaborationMetrics';
import ProjectHealthIndicators from './dashboard/ProjectHealthIndicators';
import PersonalActivityFeed from './dashboard/PersonalActivityFeed';

const Dashboard = () => {
    const { currentUser: user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('all');
    const [userProjects, setUserProjects] = useState([]);

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

    useEffect(() => {
        const fetchUserProjects = async () => {
            if (!user) return;
            try {
                const projectsRes = await api.get('/projects');
                setUserProjects(projectsRes.data);
            } catch (err) {
                setError(err.message || 'Failed to load user projects');
            }
        };
        fetchUserProjects();
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
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome back, {user ? `${user.firstName || user.username}` : 'User'}!
                </Typography>
            </Box>

            {/* Left Column: PR Activity Summary and Projects */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Left Column */}
                <Grid item xs={12} md={5}>
                    <Grid container spacing={3}>
                        {/* PR Activity Summary */}
                        <Grid item xs={12}>
                            <PRActivitySummary />
                        </Grid>

                        {/* Projects Section */}
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, height: '100%', width: '110%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" component="h2">
                                        Your Projects
                                    </Typography>
                                    <Button
                                        component={Link}
                                        to="/projects/new"
                                        startIcon={<AddIcon />}
                                        variant="contained"
                                        size="small"
                                    >
                                        New Project
                                    </Button>
                                </Box>

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
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Right Column: Team Collaboration */}
                <Grid item xs={12} md={7} width="90%">
                    {userTeams && userTeams.length > 0 && (
                        <TeamCollaborationMetrics team={userTeams[0]} timeframeFilter={timeframe} />
                    )}
                </Grid>
            </Grid>

            {/* Project Health Indicators and Activity Feed Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <ProjectHealthIndicators userProjects={userProjects} timeframeFilter={timeframe} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <PersonalActivityFeed />
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
