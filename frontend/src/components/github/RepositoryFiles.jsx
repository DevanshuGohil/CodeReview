// components/github/RepositoryFiles.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Typography,
    Container,
    Box,
    Button,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Divider,
    Breadcrumbs
} from '@mui/material';
import {
    Folder as FolderIcon,
    InsertDriveFile as FileIcon,
    ArrowBack as ArrowBackIcon,
    ArrowUpward as ArrowUpwardIcon,
    GitHub as GitHubIcon,
    MergeType as MergeTypeIcon
} from '@mui/icons-material';

const RepositoryFiles = () => {
    const [files, setFiles] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { projectId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Get the current path from query params or default to empty string
    const queryParams = new URLSearchParams(location.search);
    const currentPath = queryParams.get('path') || '';

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

                const { owner, repo } = projectData.githubRepo;

                // Then fetch repository files
                const filesResponse = await api.get(`/github/${owner}/${repo}/contents`, {
                    params: { path: currentPath }
                });

                setFiles(filesResponse.data.files);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId, currentPath]);

    const navigateToFolder = (path) => {
        navigate(`/projects/${projectId}/repository?path=${path}`);
    };

    const navigateUp = () => {
        if (!currentPath) return;

        const parts = currentPath.split('/');
        parts.pop();
        const newPath = parts.join('/');

        navigate(`/projects/${projectId}/repository${newPath ? `?path=${newPath}` : ''}`);
    };

    if (loading) return (
        <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography color="white" sx={{ mt: 2 }}>Loading repository files...</Typography>
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

    // Build breadcrumbs for the path
    const pathParts = currentPath ? currentPath.split('/') : [];
    const breadcrumbs = [
        { name: 'Root', path: '' },
        ...pathParts.map((part, index) => {
            const path = pathParts.slice(0, index + 1).join('/');
            return { name: part, path };
        })
    ];

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" color="white" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GitHubIcon />
                        Repository Files
                    </Typography>
                    <Typography variant="h6" color="rgba(255,255,255,0.7)">
                        {owner}/{repo}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<MergeTypeIcon />}
                        component={Link}
                        to={`/projects/${projectId}/pulls`}
                        sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                    >
                        Pull Requests
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(`/projects/${projectId}`)}
                        sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                    >
                        Back to Project
                    </Button>
                </Box>
            </Box>

            <Paper variant="outlined" sx={{ mb: 4, bgcolor: 'rgba(18, 18, 18, 0.9)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Breadcrumbs aria-label="repository path" separator="›" sx={{ color: 'white' }}>
                        {breadcrumbs.map((crumb, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            return isLast ? (
                                <Typography key={crumb.path} color="primary">
                                    {crumb.name}
                                </Typography>
                            ) : (
                                <Button
                                    key={crumb.path}
                                    color="primary"
                                    size="small"
                                    onClick={() => navigateToFolder(crumb.path)}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {crumb.name}
                                </Button>
                            );
                        })}
                    </Breadcrumbs>

                    {currentPath && (
                        <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<ArrowUpwardIcon />}
                            onClick={navigateUp}
                        >
                            Up
                        </Button>
                    )}
                </Box>

                <List>
                    {files.length === 0 ? (
                        <ListItem>
                            <ListItemText primary="No files found in this directory" sx={{ color: 'rgba(255,255,255,0.7)' }} />
                        </ListItem>
                    ) : (
                        files.map((file, index) => (
                            <React.Fragment key={index}>
                                <ListItem
                                    button={file.type === 'dir'}
                                    onClick={file.type === 'dir' ? () => navigateToFolder(file.path) : undefined}
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                    }}
                                >
                                    <ListItemIcon>
                                        {file.type === 'dir' ? (
                                            <FolderIcon sx={{ color: '#90caf9' }} />
                                        ) : (
                                            <FileIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={file.name}
                                        sx={{ color: 'white' }}
                                    />
                                    {file.type === 'file' && file.download_url && (
                                        <Button
                                            href={file.download_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                        >
                                            View
                                        </Button>
                                    )}
                                </ListItem>
                                {index < files.length - 1 && (
                                    <Divider variant="inset" component="li" sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
                                )}
                            </React.Fragment>
                        ))
                    )}
                </List>
            </Paper>
        </Container>
    );
};

export default RepositoryFiles;
