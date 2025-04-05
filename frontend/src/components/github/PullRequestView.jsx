import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../axiosConfig';
import PullRequestDetails from './PullRequestDetails';
import FileChangesList from './FileChangesList';
import DiffViewer from './DiffViewer';
import PRApprovalPanel from './PRApprovalPanel';
import PRCommentSection from './PRCommentSection';
import { Typography, Container, Box, Button, Alert, CircularProgress, Divider } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import '../../styles/pull-request.css';

const PullRequestView = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [prData, setPrData] = useState(null);
    const [project, setProject] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const { projectId, pullNumber } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        const fetchPullRequestData = async () => {
            try {
                setLoading(true);

                // First fetch the project to get GitHub repo details
                const projectResponse = await api.get(`/projects/${projectId}`);
                const projectData = projectResponse.data;

                if (mounted) {
                    setProject(projectData);

                    if (!projectData.githubRepo || !projectData.githubRepo.owner || !projectData.githubRepo.repo) {
                        throw new Error('This project has no GitHub repository configured');
                    }

                    const { owner, repo } = projectData.githubRepo;

                    // Then fetch pull request data using owner and repo from project
                    const url = `/github/${owner}/${repo}/pulls/${pullNumber}/complete`;
                    console.log('Fetching PR data from:', url);

                    const response = await api.get(url);
                    console.log('PR Response received:', response.status);

                    console.log('Files count:', response.data.files?.length || 0);

                    // Process and sort files by name for easier navigation
                    const files = response.data.files || [];
                    files.sort((a, b) => a.filename.localeCompare(b.filename));

                    const processedData = {
                        ...response.data,
                        files,
                    };

                    setPrData(processedData);

                    // Select the first file that has a patch if available
                    if (files.length > 0) {
                        const fileWithPatch = files.find(f => f.patch) || files[0];
                        setSelectedFile(fileWithPatch);
                    }
                }
            } catch (err) {
                if (mounted) {
                    console.error("Error fetching PR data:", err);
                    console.error("Full error:", err.response?.data || err.message);
                    setError(err.response?.data?.message || err.message || "Failed to fetch pull request data");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchPullRequestData();

        return () => {
            mounted = false;
        };
    }, [projectId, pullNumber]);

    const handleFileSelect = (file) => {
        setSelectedFile(file);
    };

    if (loading) return (
        <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography color="white" sx={{ mt: 2 }}>Loading pull request data...</Typography>
        </Container>
    );

    if (error) return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(`/projects/${projectId}/pulls`)}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            >
                Back to Pull Requests
            </Button>
        </Container>
    );

    if (!prData || !project) return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Alert severity="warning">No data available for this pull request.</Alert>
        </Container>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" color="white">
                    Pull Request #{pullNumber}
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/projects/${projectId}/pulls`)}
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                >
                    Back to Pull Requests
                </Button>
            </Box>

            <PullRequestDetails pullRequest={prData.pull_request} />

            <PRApprovalPanel projectId={projectId} pullRequest={prData.pull_request} />

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.12)' }} />

            <div className="pr-content">
                <div className="sidebar">
                    <FileChangesList
                        files={prData.files}
                        selectedFile={selectedFile}
                        onFileSelect={handleFileSelect}
                    />
                </div>

                <div className="main-content">
                    <DiffViewer file={selectedFile} />
                </div>
            </div>

            <PRCommentSection projectId={projectId} pullRequest={prData.pull_request} />
        </Container>
    );
};

export default PullRequestView;
