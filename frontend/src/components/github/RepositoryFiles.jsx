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
    Breadcrumbs,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton
} from '@mui/material';
import {
    Folder as FolderIcon,
    InsertDriveFile as FileIcon,
    ArrowBack as ArrowBackIcon,
    ArrowUpward as ArrowUpwardIcon,
    GitHub as GitHubIcon,
    MergeType as MergeTypeIcon,
    Close as CloseIcon,
    Code as CodeIcon,
    ContentCopy as CopyIcon
} from '@mui/icons-material';

const RepositoryFiles = () => {
    const [files, setFiles] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [fileLoading, setFileLoading] = useState(false);
    const [fileError, setFileError] = useState(null);
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

    // Function to view file content
    const handleViewFile = async (file) => {
        if (file.type !== 'file') return;

        setSelectedFile(file);
        setFileLoading(true);
        setFileError(null);

        try {
            // Check if file size is reasonable (< 1MB)
            if (file.size > 1000000) {
                setFileError("File is too large to display inline. Please use the GitHub link to view.");
                setFileLoading(false);
                return;
            }

            const response = await fetch(file.download_url);
            const content = await response.text();
            setFileContent(content);
        } catch (err) {
            setFileError("Failed to load file content: " + (err.message || "Unknown error"));
            console.error("Error loading file:", err);
        } finally {
            setFileLoading(false);
        }
    };

    // Close file viewer modal
    const handleCloseFileViewer = () => {
        setSelectedFile(null);
        setFileContent('');
        setFileError(null);
    };

    // Copy file content to clipboard
    const handleCopyContent = () => {
        navigator.clipboard.writeText(fileContent);
        // Could add a toast notification here
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
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                startIcon={<CodeIcon />}
                                                onClick={() => handleViewFile(file)}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                href={file.html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                startIcon={<GitHubIcon />}
                                            >
                                                GitHub
                                            </Button>
                                        </Box>
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

            {/* File Viewer Modal */}
            <Dialog
                open={!!selectedFile}
                onClose={handleCloseFileViewer}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(18, 18, 18, 0.95)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        minHeight: '70vh'
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileIcon />
                        <Typography variant="h6" component="div" sx={{ color: 'white' }}>
                            {selectedFile?.name}
                        </Typography>
                    </Box>
                    <Box>
                        <IconButton
                            color="primary"
                            onClick={handleCopyContent}
                            disabled={!fileContent || fileLoading || fileError}
                            aria-label="copy content"
                            title="Copy to clipboard"
                        >
                            <CopyIcon />
                        </IconButton>
                        <IconButton
                            edge="end"
                            color="inherit"
                            onClick={handleCloseFileViewer}
                            aria-label="close"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {fileLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
                            <CircularProgress />
                            <Typography sx={{ ml: 2, color: 'white' }}>Loading file content...</Typography>
                        </Box>
                    ) : fileError ? (
                        <Alert severity="error" sx={{ m: 2 }}>
                            {fileError}
                        </Alert>
                    ) : (
                        <Box
                            component="pre"
                            sx={{
                                m: 0,
                                p: 2,
                                overflow: 'auto',
                                width: '100%',
                                height: '100%',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontFamily: 'monospace',
                                bgcolor: 'rgba(30, 30, 30, 1)'
                            }}
                        >
                            {fileContent}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.12)', p: 2 }}>
                    <Button
                        href={selectedFile?.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<GitHubIcon />}
                        variant="outlined"
                    >
                        View on GitHub
                    </Button>
                    <Button onClick={handleCloseFileViewer} variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default RepositoryFiles;
