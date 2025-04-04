// components/projects/ProjectList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Container,
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GitHubIcon from '@mui/icons-material/GitHub';
import VisibilityIcon from '@mui/icons-material/Visibility';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await api.get('/projects');
                setProjects(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) return <Container maxWidth="lg" sx={{ mt: 4 }}><Typography>Loading projects...</Typography></Container>;
    if (error) return <Container maxWidth="lg" sx={{ mt: 4 }}><Typography color="error">Error: {error}</Typography></Container>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom color="text.primary">
                    Projects
                </Typography>
                {currentUser?.role === 'manager' && (
                    <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/projects/new"
                        startIcon={<AddIcon />}
                        sx={{
                            borderRadius: 2,
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)',
                            '&:hover': {
                                boxShadow: '0 6px 10px rgba(0, 0, 0, 0.6)'
                            }
                        }}
                    >
                        Create Project
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                <Table sx={{ minWidth: 650 }} aria-label="projects table">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'background.default' }}>
                            <TableCell>Project Name</TableCell>
                            <TableCell>Key</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Teams</TableCell>
                            <TableCell>GitHub</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No projects found</TableCell>
                            </TableRow>
                        ) : (
                            projects.map(project => (
                                <TableRow
                                    key={project._id}
                                    sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                                >
                                    <TableCell component="th" scope="row">
                                        <Typography variant="body1" fontWeight="medium">
                                            {project.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={project.key}
                                            size="small"
                                            sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)', color: 'primary.main' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
                                            {project.description || 'No description'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={project.teams.length}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {project.githubRepo?.url ? (
                                            <Tooltip title="View GitHub Repository">
                                                <IconButton
                                                    size="small"
                                                    href={project.githubRepo.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <GitHubIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                Not linked
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            component={Link}
                                            to={`/projects/${project._id}`}
                                            size="small"
                                            color="primary"
                                            startIcon={<VisibilityIcon />}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default ProjectList;
