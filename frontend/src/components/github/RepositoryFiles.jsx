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
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useSnackbar } from '../common/SnackbarProvider';

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
    const [currentPath, setCurrentPath] = useState('');
    const [gitProvider, setGitProvider] = useState('github'); // Default to GitHub
    const { showSuccess, showError } = useSnackbar();

    // Parse path from URL if present
    useEffect(() => {
        const pathParam = new URLSearchParams(location.search).get('path');
        if (pathParam) {
            setCurrentPath(pathParam);
        }
    }, [location]);

    // Fetch project and repo data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await api.get(`/projects/${projectId}`);
                setProject(response.data);

                // Determine the Git provider from project data
                if (response.data.gitlabRepo) {
                    setGitProvider('gitlab');
                } else if (response.data.bitbucketRepo) {
                    setGitProvider('bitbucket');
                } else {
                    // Default to GitHub
                    setGitProvider('github');
                }

                const repoInfo = response.data.githubRepo || response.data.gitlabRepo || response.data.bitbucketRepo;

                if (!repoInfo) {
                    throw new Error('No repository information found for this project');
                }

                // Get the provider-specific endpoint
                const providerEndpoint = api.getProviderEndpoint(gitProvider);
                const { owner, repo } = repoInfo;

                const filesResponse = await api.get(`${providerEndpoint}/${owner}/${repo}/contents`, {
                    params: { path: currentPath }
                });

                setFiles(filesResponse.data.files || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching repository data:', err);
                showError(`Failed to load repository files: ${err.response?.data?.message || err.message}`);
                setLoading(false);
            }
        };

        if (projectId) {
            fetchData();
        }
    }, [projectId, currentPath, gitProvider, showError]);

    const navigateToFolder = (path) => {
        setCurrentPath(path);
        // Update URL without reloading
        navigate(`/projects/${projectId}/files?path=${encodeURIComponent(path)}`, { replace: true });
    };

    const navigateUp = () => {
        const pathParts = currentPath.split('/');
        pathParts.pop();
        const newPath = pathParts.join('/');
        navigateToFolder(newPath);
    };

    // Function to view file content
    const handleViewFile = async (file) => {
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

            // Use the utility function to fetch raw file content via our proxy
            const response = await api.fetchRawFile(file.download_url);
            setFileContent(response.data);
            setFileLoading(false);  // Set loading to false after successfully fetching content

        } catch (err) {
            console.error('Error fetching file content:', err);
            setFileError(`Failed to load file content: ${err.response?.data?.message || err.message}`);
            showError(`Failed to load file content: ${err.response?.data?.message || err.message}`);
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
        showSuccess('File content copied to clipboard');
    };

    // Determine file language for syntax highlighting
    const getFileLanguage = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'jsx': 'jsx',
            'ts': 'typescript',
            'tsx': 'tsx',
            'json': 'json',
            'html': 'html',
            'css': 'css',
            'md': 'markdown',
            'py': 'python',
            'java': 'java',
            'rb': 'ruby',
            'php': 'php',
            'c': 'c',
            'cpp': 'cpp',
            'go': 'go',
            'rs': 'rust',
            'sh': 'bash',
            'yml': 'yaml',
            'yaml': 'yaml',
            'xml': 'xml'
        };
        return languageMap[extension] || 'text';
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

    // Get repo info based on provider
    const repoInfo = project.githubRepo || project.gitlabRepo || project.bitbucketRepo;
    const { owner, repo } = repoInfo;

    // Build breadcrumbs for the path
    const pathParts = currentPath ? currentPath.split('/') : [];
    const breadcrumbs = [
        { name: 'Root', path: '' },
        ...pathParts.map((part, index) => {
            const path = pathParts.slice(0, index + 1).join('/');
            return { name: part, path };
        })
    ];

    // Get the appropriate provider icon
    const getProviderIcon = () => {
        switch (gitProvider) {
            case 'gitlab':
                return <img src="/assets/gitlab-icon.svg" alt="GitLab" style={{ width: 24, height: 24 }} />;
            case 'bitbucket':
                return <img src="/assets/bitbucket-icon.svg" alt="Bitbucket" style={{ width: 24, height: 24 }} />;
            case 'github':
            default:
                return <GitHubIcon />;
        }
    };

    // Get provider name for display
    const getProviderName = () => {
        switch (gitProvider) {
            case 'gitlab': return 'GitLab';
            case 'bitbucket': return 'Bitbucket';
            case 'github':
            default: return 'GitHub';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" color="white" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getProviderIcon()}
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
                                    component="div"
                                    onClick={file.type === 'dir' ?
                                        () => navigateToFolder(file.path) :
                                        () => handleViewFile(file)
                                    }
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                                        cursor: 'pointer'
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
                                                startIcon={getProviderIcon()}
                                            >
                                                {getProviderName()}
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
                            color="inherit"
                            onClick={handleCloseFileViewer}
                            aria-label="close"
                            sx={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    {fileLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                            <CircularProgress />
                            <Typography color="white" sx={{ ml: 2 }}>Loading file content...</Typography>
                        </Box>
                    ) : fileError ? (
                        <Box sx={{ p: 3 }}>
                            <Alert severity="error" sx={{ mb: 2 }}>{fileError}</Alert>
                            <Button
                                href={selectedFile?.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="contained"
                                color="primary"
                                startIcon={getProviderIcon()}
                            >
                                View on {getProviderName()}
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ overflow: 'auto', maxHeight: '70vh' }}>
                            <SyntaxHighlighter
                                language={selectedFile ? getFileLanguage(selectedFile.name) : 'text'}
                                style={atomOneDark}
                                customStyle={{
                                    margin: 0,
                                    padding: '1.5rem',
                                    backgroundColor: 'transparent',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    overflow: 'auto'
                                }}
                                showLineNumbers
                            >
                                {fileContent}
                            </SyntaxHighlighter>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default RepositoryFiles;
