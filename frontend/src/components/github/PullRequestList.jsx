// components/github/PullRequestList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Typography, Container, Box, Button, Alert, CircularProgress, List, ListItem, ListItemText, Chip, Divider, Paper } from '@mui/material';
import { ArrowBack as ArrowBackIcon, GitHub as GitHubIcon } from '@mui/icons-material';

const PullRequestList = () => {
    const [pullRequests, setPullRequests] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { projectId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // First fetch the project to get GitHub repo details
                const projectResponse = await api.get(`/projects/${projectId}`);
                const projectData = projectResponse.data;
                setProject(projectData);

                if (!projectData.githubRepo || !projectData.githubRepo.owner || !projectData.githubRepo.repo) {
                    throw new Error('This project has no GitHub repository configured');
                }

                // Then fetch pull requests using owner and repo from project
                const { owner, repo } = projectData.githubRepo;
                const pullsResponse = await api.get(`/github/${owner}/${repo}/pulls`);
                setPullRequests(pullsResponse.data);

                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    if (loading) return (
        <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography color="white" sx={{ mt: 2 }}>Loading pull requests...</Typography>
        </Container>
    );

    if (error) return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(`/projects/${projectId}`)}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            >
                Back to Project
            </Button>
        </Container>
    );

    if (!project) return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Alert severity="warning">Project not found</Alert>
        </Container>
    );

    const { owner, repo } = project.githubRepo;

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" color="white" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GitHubIcon />
                        Pull Requests
                    </Typography>
                    <Typography variant="h6" color="rgba(255,255,255,0.7)">
                        {owner}/{repo}
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/projects/${projectId}`)}
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                >
                    Back to Project
                </Button>
            </Box>

            {pullRequests.length === 0 ? (
                <Alert severity="info" sx={{ mb: 4, backgroundColor: 'rgba(41, 98, 255, 0.1)', color: 'white' }}>
                    No pull requests found for this repository.
                </Alert>
            ) : (
                <Paper variant="outlined" sx={{ bgcolor: 'rgba(18, 18, 18, 0.9)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <List sx={{ width: '100%' }}>
                        {pullRequests.map((pr, index) => (
                            <React.Fragment key={pr.id}>
                                <ListItem
                                    alignItems="flex-start"
                                    component={Link}
                                    to={`/projects/${projectId}/pulls/${pr.number}`}
                                    sx={{
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.05)'
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="h6" color="white">
                                                    #{pr.number}: {pr.title}
                                                </Typography>
                                                <Chip
                                                    label={pr.state}
                                                    color={pr.state === 'open' ? 'success' : 'error'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <React.Fragment>
                                                <Typography color="rgba(255,255,255,0.7)" component="span" variant="body2">
                                                    {pr.body?.substring(0, 150) || 'No description'}
                                                    {pr.body?.length > 150 ? '...' : ''}
                                                </Typography>
                                                <Typography color="rgba(255,255,255,0.5)" variant="caption" display="block" sx={{ mt: 1 }}>
                                                    Opened by {pr.user.login} on {new Date(pr.created_at).toLocaleDateString()}
                                                </Typography>
                                            </React.Fragment>
                                        }
                                    />
                                </ListItem>
                                {index < pullRequests.length - 1 && (
                                    <Divider variant="inset" component="li" sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
                                )}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Container>
    );
};

export default PullRequestList;
