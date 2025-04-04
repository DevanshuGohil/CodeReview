// components/projects/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { useParams, Link, useNavigate } from 'react-router-dom';
import TeamSelector from '../teams/TeamSelector';
import { useAuth } from '../../context/AuthContext';
import {
    Container,
    Typography,
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardHeader,
    CardContent,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Divider,
    Chip,
    TextField,
    Stack,
    IconButton,
    Tooltip,
    alpha
} from '@mui/material';
import {
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon,
    GitHub as GitHubIcon,
    Link as LinkIcon,
    Code as CodeIcon,
    MergeType as MergeTypeIcon,
    Update as UpdateIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';

const ProjectDetail = () => {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [githubOwner, setGithubOwner] = useState('');
    const [githubRepo, setGithubRepo] = useState('');

    // Add project editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [successMessage, setSuccessMessage] = useState(null);

    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Check if user is a manager (can manage project)
    const canManageProject = currentUser?.role === 'manager';

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/projects/${id}`);
                setProject(response.data);

                // Set edit form initial values
                setEditName(response.data.name || '');
                setEditDescription(response.data.description || '');

                // Set GitHub repo values if they exist
                if (response.data.githubRepo) {
                    setGithubOwner(response.data.githubRepo.owner || '');
                    setGithubRepo(response.data.githubRepo.repo || '');
                }

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    // Add edit project functions
    const handleStartEditing = () => {
        setIsEditing(true);
        setEditName(project.name);
        setEditDescription(project.description || '');
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
    };

    const handleSaveProjectDetails = async () => {
        setError(null);
        setSuccessMessage(null);

        if (!canManageProject) {
            setError("Only managers can update project details");
            return;
        }

        try {
            await api.put(`/projects/${id}`, {
                name: editName,
                description: editDescription
            });

            // Fetch the updated project to ensure we have all data
            const updatedProjectResponse = await api.get(`/projects/${id}`);
            setProject(updatedProjectResponse.data);

            setIsEditing(false);
            setSuccessMessage('Project details updated successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleAddTeam = async (e) => {
        e.preventDefault();

        if (!canManageProject) {
            setError("Only managers can add teams to projects");
            return;
        }

        try {
            await api.post(`/projects/${id}/teams`, {
                team: selectedTeam,
                accessLevel: 'read'
            });

            // Fetch the updated project to ensure we have all data including populated team details
            const updatedProjectResponse = await api.get(`/projects/${id}`);
            setProject(updatedProjectResponse.data);

            setSelectedTeam('');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleRemoveTeam = async (teamId, teamName) => {
        if (!canManageProject) {
            setError("Only managers can remove teams from projects");
            return;
        }

        // Show confirmation dialog
        if (!window.confirm(`Are you sure you want to remove ${teamName} from this project?`)) {
            return;
        }

        try {
            await api.delete(`/projects/${id}/teams/${teamId}`);

            // Fetch the updated project to ensure we have all data including populated team details
            const updatedProjectResponse = await api.get(`/projects/${id}`);
            setProject(updatedProjectResponse.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleUpdateGithubRepo = async (e) => {
        e.preventDefault();

        if (!canManageProject) {
            setError("Only managers can update GitHub repository settings");
            return;
        }

        try {
            const response = await api.put(`/projects/${id}/github`, {
                owner: githubOwner,
                repo: githubRepo,
                url: `https://github.com/${githubOwner}/${githubRepo}`
            });

            setProject(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    if (loading) return <Container maxWidth="lg" sx={{ mt: 4 }}><Typography color="white">Loading project details...</Typography></Container>;
    if (error && !project) return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="error">Error: {error}</Alert></Container>;
    if (!project) return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="warning">Project not found</Alert></Container>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header with Edit Functionality */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, mr: 2 }}>
                    {isEditing ? (
                        <TextField
                            label="Project Name"
                            variant="outlined"
                            fullWidth
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                            InputProps={{
                                sx: {
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.23)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.5)'
                                    }
                                }
                            }}
                        />
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h4" component="h1" color="white">
                                {project.name}
                            </Typography>
                            <Chip
                                label={project.key}
                                color="primary"
                                size="medium"
                                sx={{ bgcolor: alpha('#1976d2', 0.2) }}
                            />
                            {canManageProject && !isEditing && (
                                <Tooltip title="Edit Project Details">
                                    <IconButton
                                        onClick={handleStartEditing}
                                        color="primary"
                                        size="small"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    )}

                    {/* Description with Edit Functionality */}
                    {isEditing ? (
                        <TextField
                            label="Project Description"
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={3}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                            InputProps={{
                                sx: {
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.23)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.5)'
                                    }
                                }
                            }}
                        />
                    ) : project.description && (
                        <Typography
                            variant="body1"
                            color="rgba(255,255,255,0.7)"
                            paragraph
                            sx={{ maxWidth: '800px', m: 0 }}
                        >
                            {project.description}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    {isEditing ? (
                        <>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveProjectDetails}
                                disabled={!editName.trim()}
                                sx={{ mr: 1 }}
                            >
                                Save
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleCancelEditing}
                                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                            >
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button
                            component={Link}
                            to="/projects"
                            startIcon={<ArrowBackIcon />}
                            variant="outlined"
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                        >
                            Back to Projects
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Success message for edits */}
            {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Teams Section */}
            <Card
                variant="outlined"
                sx={{
                    mb: 4,
                    bgcolor: 'rgba(18, 18, 18, 0.9)',
                    border: '1px solid rgba(255,255,255,0.12)'
                }}
            >
                <CardHeader
                    title={
                        <Typography variant="h5" color="white">Teams</Typography>
                    }
                    sx={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}
                />
                <CardContent>
                    {project.teams.length > 0 ? (
                        <TableContainer sx={{ mb: 4 }}>
                            <Table sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.12)' } }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: 'white' }}>Team</TableCell>
                                        <TableCell sx={{ color: 'white' }}>Description</TableCell>
                                        <TableCell sx={{ color: 'white' }}>Members</TableCell>
                                        {canManageProject && <TableCell align="right" sx={{ color: 'white' }}>Actions</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {project.teams.map(teamData => (
                                        <TableRow
                                            key={teamData.team._id}
                                            sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                                        >
                                            <TableCell>
                                                <Button
                                                    component={Link}
                                                    to={`/teams/${teamData.team._id}`}
                                                    color="primary"
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    {teamData.team.name}
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    color="rgba(255,255,255,0.7)"
                                                    sx={{
                                                        maxWidth: 200,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {teamData.team.description || 'No description'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={teamData.team.members && Array.isArray(teamData.team.members) ? teamData.team.members.length : 0}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ minWidth: '60px', textAlign: 'center' }}
                                                />
                                            </TableCell>
                                            {canManageProject && (
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveTeam(
                                                            teamData.team._id,
                                                            teamData.team.name
                                                        )}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info" sx={{ mb: 4, backgroundColor: 'rgba(41, 98, 255, 0.1)', color: 'white' }}>
                            No teams assigned to this project.
                            {canManageProject && " Add a team using the form below."}
                        </Alert>
                    )}

                    {canManageProject && (
                        <>
                            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.12)' }} />
                            <Box component="form" onSubmit={handleAddTeam}>
                                <Typography variant="h6" gutterBottom color="white">Add Team</Typography>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={8}>
                                        <TeamSelector
                                            value={selectedTeam}
                                            onChange={setSelectedTeam}
                                            excludeTeams={project.teams.map(t => t.team._id)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                            disabled={!selectedTeam}
                                            fullWidth
                                        >
                                            Add Team
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* GitHub Repository Section */}
            <Card
                variant="outlined"
                sx={{
                    mb: 4,
                    bgcolor: 'rgba(18, 18, 18, 0.9)',
                    border: '1px solid rgba(255,255,255,0.12)'
                }}
            >
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <GitHubIcon sx={{ color: 'white' }} />
                            <Typography variant="h5" color="white">GitHub Repository</Typography>
                        </Box>
                    }
                    sx={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}
                />
                <CardContent>
                    {project.githubRepo && project.githubRepo.url ? (
                        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography color="white">Current repository:</Typography>
                            <Button
                                href={project.githubRepo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<LinkIcon />}
                                sx={{ color: '#58a6ff', textTransform: 'none' }}
                            >
                                {project.githubRepo.owner}/{project.githubRepo.repo}
                            </Button>
                        </Box>
                    ) : (
                        <Typography color="rgba(255,255,255,0.7)" sx={{ mb: 3 }}>
                            No GitHub repository linked to this project.
                        </Typography>
                    )}

                    {canManageProject && (
                        <>
                            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.12)' }} />
                            <Box component="form" onSubmit={handleUpdateGithubRepo}>
                                <Typography variant="h6" gutterBottom color="white">Update GitHub Repository</Typography>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={5}>
                                        <TextField
                                            label="Repository Owner"
                                            variant="outlined"
                                            fullWidth
                                            value={githubOwner}
                                            onChange={(e) => setGithubOwner(e.target.value)}
                                            placeholder="e.g., octocat"
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                                            InputProps={{
                                                sx: {
                                                    color: 'white',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'rgba(255,255,255,0.23)'
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'rgba(255,255,255,0.5)'
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={5}>
                                        <TextField
                                            label="Repository Name"
                                            variant="outlined"
                                            fullWidth
                                            value={githubRepo}
                                            onChange={(e) => setGithubRepo(e.target.value)}
                                            placeholder="e.g., hello-world"
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                                            InputProps={{
                                                sx: {
                                                    color: 'white',
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'rgba(255,255,255,0.23)'
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'rgba(255,255,255,0.5)'
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                            disabled={!githubOwner || !githubRepo}
                                            fullWidth
                                            startIcon={<UpdateIcon />}
                                        >
                                            Update
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </>
                    )}

                    {project.githubRepo && project.githubRepo.url && (
                        <>
                            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.12)' }} />
                            <Typography variant="h6" gutterBottom color="white">GitHub Integration</Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Button
                                    component={Link}
                                    to={`/projects/${id}/pulls`}
                                    variant="outlined"
                                    startIcon={<MergeTypeIcon />}
                                    sx={{
                                        color: 'white',
                                        borderColor: 'rgba(255,255,255,0.3)',
                                        '&:hover': {
                                            borderColor: 'white',
                                            bgcolor: 'rgba(255,255,255,0.08)'
                                        }
                                    }}
                                >
                                    View Pull Requests
                                </Button>
                                <Button
                                    component={Link}
                                    to={`/projects/${id}/repository`}
                                    variant="outlined"
                                    startIcon={<CodeIcon />}
                                    sx={{
                                        color: 'white',
                                        borderColor: 'rgba(255,255,255,0.3)',
                                        '&:hover': {
                                            borderColor: 'white',
                                            bgcolor: 'rgba(255,255,255,0.08)'
                                        }
                                    }}
                                >
                                    Browse Repository Files
                                </Button>
                            </Stack>
                        </>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
};

export default ProjectDetail;

