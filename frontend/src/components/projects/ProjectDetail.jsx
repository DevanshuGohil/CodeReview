// components/projects/ProjectDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../axiosConfig';
import { useParams, Link, useNavigate } from 'react-router-dom';
import TeamSelector from '../teams/TeamSelector';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../common/SnackbarProvider';
import {
    Container,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Card,
    CardHeader,
    CardContent,
    Grid,
    Alert,
    Divider,
    Chip,
    TextField,
    IconButton,
    Tooltip,
    alpha,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon,
    Code as CodeIcon,
    MergeType as MergeTypeIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Group as GroupIcon,
    People as PeopleIcon,
} from '@mui/icons-material';

const ProjectDetail = () => {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState('');
    // Keep the setters for future use without exposing the unused variables
    const [, setGithubOwner] = useState('');
    const [, setGithubRepo] = useState('');
    const [addingTeam, setAddingTeam] = useState(false);

    // Add project editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [successMessage, setSuccessMessage] = useState(null);

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [removeTeamDialogOpen, setRemoveTeamDialogOpen] = useState(false);
    const [teamToRemove, setTeamToRemove] = useState(null);

    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { showSuccess, showError } = useSnackbar();

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

                // Set GitHub repo values if they exist - keep for future use
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

    // Memoize the current teams array to avoid unnecessary re-renders of TeamSelector
    const currentTeamsMemo = useMemo(() => {
        return project?.teams ? project.teams.map(t => t.team._id) : [];
    }, [project?.teams]);

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
            setAddingTeam(true);
            await api.post(`/projects/${id}/teams`, {
                team: selectedTeam,
                accessLevel: 'read'
            });

            // Fetch the updated project to ensure we have all data including populated team details
            const updatedProjectResponse = await api.get(`/projects/${id}`);
            setProject(updatedProjectResponse.data);

            setSelectedTeam('');
            setSuccessMessage('Team added successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setAddingTeam(false);
        }
    };

    const handleRemoveTeam = async (teamId, teamName) => {
        if (!canManageProject) {
            showError("Only managers can remove teams from projects");
            return;
        }

        try {
            await api.delete(`/projects/${id}/teams/${teamId}`);

            // Fetch the updated project to ensure we have all data including populated team details
            const updatedProjectResponse = await api.get(`/projects/${id}`);
            setProject(updatedProjectResponse.data);
            showSuccess(`Team "${teamName}" has been removed from the project`);
            setRemoveTeamDialogOpen(false);
            setTeamToRemove(null);
        } catch (err) {
            showError(err.response?.data?.message || err.message);
            setRemoveTeamDialogOpen(false);
            setTeamToRemove(null);
        }
    };

    const openRemoveTeamDialog = (team) => {
        setTeamToRemove(team);
        setRemoveTeamDialogOpen(true);
    };

    // Add deleteProject handler
    const handleDeleteProject = async () => {
        if (!canManageProject) {
            showError("Only managers can delete projects");
            return;
        }

        try {
            await api.delete(`/projects/${id}`);
            showSuccess('Project deleted successfully');
            navigate('/projects');
        } catch (err) {
            showError(err.response?.data?.message || err.message);
        }
    };

    if (loading) return <Container maxWidth="lg" sx={{ mt: 4 }}><Typography color="white">Loading project details...</Typography></Container>;
    if (error && !project) return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="error">Error: {error}</Alert></Container>;
    if (!project) return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="warning">Project not found</Alert></Container>;

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
            {/* Header with Edit Functionality */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 0 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, mr: { xs: 0, md: 2 }, width: '100%' }}>
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
                                        borderColor: 'rgba(255,255,255,0.3)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.5)'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#2196f3'
                                    }
                                }
                            }}
                        />
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Typography variant="h4" component="h1" color="white" sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
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
                            label="Description"
                            variant="outlined"
                            fullWidth
                            multiline
                            rows={4}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                            InputProps={{
                                sx: {
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.3)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.5)'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#2196f3'
                                    }
                                }
                            }}
                        />
                    ) : (
                        <Typography variant="body1" color="rgba(255,255,255,0.7)" sx={{ mt: 1, fontSize: { xs: '0.95rem', md: '1rem' } }}>
                            {project.description || 'No description provided'}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', width: { xs: '100%', md: 'auto' } }}>
                    {isEditing ? (
                        <>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveProjectDetails}
                                disabled={!editName.trim()}
                                sx={{ mr: 1, flex: { xs: '1', md: 'none' } }}
                            >
                                Save
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleCancelEditing}
                                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', flex: { xs: '1', md: 'none' } }}
                            >
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                component={Link}
                                to="/projects"
                                startIcon={<ArrowBackIcon />}
                                variant="outlined"
                                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', mr: 1, flex: { xs: '1', md: 'none' } }}
                            >
                                Back to Projects
                            </Button>
                            {canManageProject && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => setDeleteDialogOpen(true)}
                                    sx={{ flex: { xs: '1', md: 'none' } }}
                                >
                                    Delete Project
                                </Button>
                            )}
                        </>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <GroupIcon sx={{ mr: 1, color: '#2196f3' }} />
                                <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>Teams</Typography>
                            </Box>
                            <Typography variant="body2" color="rgba(255,255,255,0.6)">
                                {project.teams ? project.teams.length : 0} teams assigned
                            </Typography>
                        </Box>
                    }
                    sx={{ borderBottom: '1px solid rgba(255,255,255,0.12)', py: { xs: 1.5, md: 2 } }}
                />

                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    {/* Teams list - show as a grid on mobile, table on desktop */}
                    {project.teams && project.teams.length > 0 ? (
                        <>
                            {/* Desktop view - table */}
                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: 'white' }}>Team Name</TableCell>
                                            <TableCell sx={{ color: 'white' }}>Description</TableCell>
                                            <TableCell sx={{ color: 'white' }}>Members</TableCell>
                                            {canManageProject && <TableCell align="right" sx={{ color: 'white' }}>Actions</TableCell>}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {project.teams.map(teamObj => {
                                            const team = teamObj.team;
                                            return (
                                                <TableRow key={team._id}>
                                                    <TableCell sx={{ color: 'white' }}>
                                                        <Link to={`/teams/${team._id}`} style={{ color: '#2196f3', textDecoration: 'none' }}>
                                                            {team.name}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                                        {team.description || 'No description'}
                                                    </TableCell>
                                                    <TableCell sx={{ color: 'white' }}>
                                                        <Chip
                                                            icon={<PeopleIcon />}
                                                            label={team.members ? team.members.length : 0}
                                                            size="small"
                                                            sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}
                                                        />
                                                    </TableCell>
                                                    {canManageProject && (
                                                        <TableCell align="right">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => openRemoveTeamDialog(team)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Box>

                            {/* Mobile view - cards grid */}
                            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                                <Grid container spacing={2}>
                                    {project.teams.map(teamObj => {
                                        const team = teamObj.team;
                                        return (
                                            <Grid item xs={12} key={team._id}>
                                                <Box sx={{
                                                    bgcolor: 'rgba(30, 30, 30, 0.6)',
                                                    p: 2,
                                                    borderRadius: 1,
                                                    position: 'relative'
                                                }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                        <Typography variant="subtitle1" color="white">
                                                            <Link to={`/teams/${team._id}`} style={{ color: '#2196f3', textDecoration: 'none' }}>
                                                                {team.name}
                                                            </Link>
                                                        </Typography>
                                                        {canManageProject && (
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => openRemoveTeamDialog(team)}
                                                                sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)' }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                    <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1 }}>
                                                        {team.description || 'No description'}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <PeopleIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.7)', mr: 0.5 }} />
                                                        <Typography variant="body2" color="rgba(255,255,255,0.7)">
                                                            {team.members ? team.members.length : 0} members
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Box>
                        </>
                    ) : (
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', py: 2, textAlign: 'center' }}>
                            No teams assigned to this project yet.{canManageProject && " Add a team using the form below."}
                        </Typography>
                    )}

                    {/* Add Team Form */}
                    {canManageProject && (
                        <Box sx={{ mt: 3 }}>
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />
                            <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', md: '1.25rem' } }}>Add Team to Project</Typography>

                            <Box component="form" onSubmit={handleAddTeam} sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 2,
                                alignItems: { xs: 'stretch', md: 'flex-end' }
                            }}>
                                <TeamSelector
                                    selectedTeam={selectedTeam}
                                    setSelectedTeam={setSelectedTeam}
                                    currentTeams={currentTeamsMemo}
                                    sx={{ flexGrow: 1 }}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={!selectedTeam || addingTeam}
                                    sx={{
                                        minWidth: { xs: '100%', md: '150px' },
                                        py: { xs: 1.2, md: 1 }
                                    }}
                                >
                                    {addingTeam ? (
                                        <CircularProgress size={24} sx={{ color: 'white' }} />
                                    ) : (
                                        'Add Team'
                                    )}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* PR Section */}
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <MergeTypeIcon sx={{ mr: 1, color: '#2196f3' }} />
                            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>Pull Requests</Typography>
                        </Box>
                    }
                    sx={{ borderBottom: '1px solid rgba(255,255,255,0.12)', py: { xs: 1.5, md: 2 } }}
                />
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Button
                        component={Link}
                        to={`/projects/${project._id}/pulls`}
                        variant="contained"
                        color="primary"
                        startIcon={<MergeTypeIcon />}
                        sx={{
                            width: { xs: '100%', md: 'auto' },
                            py: { xs: 1.2, md: 1 }
                        }}
                    >
                        View Pull Requests
                    </Button>
                </CardContent>
            </Card>

            {/* Code Section */}
            <Card
                variant="outlined"
                sx={{
                    bgcolor: 'rgba(18, 18, 18, 0.9)',
                    border: '1px solid rgba(255,255,255,0.12)'
                }}
            >
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CodeIcon sx={{ mr: 1, color: '#2196f3' }} />
                            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>Repository Code</Typography>
                        </Box>
                    }
                    sx={{ borderBottom: '1px solid rgba(255,255,255,0.12)', py: { xs: 1.5, md: 2 } }}
                />
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Button
                        component={Link}
                        to={`/projects/${project._id}/repository`}
                        variant="contained"
                        color="primary"
                        startIcon={<CodeIcon />}
                        sx={{
                            width: { xs: '100%', md: 'auto' },
                            py: { xs: 1.2, md: 1 }
                        }}
                    >
                        Browse Repository
                    </Button>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: { bgcolor: '#2d2d2d', color: 'white', borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    Confirm Project Deletion
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        Are you sure you want to delete project "{project?.name}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteProject}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 1 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Remove Team Confirmation Dialog */}
            <Dialog
                open={removeTeamDialogOpen}
                onClose={() => setRemoveTeamDialogOpen(false)}
                PaperProps={{
                    sx: { bgcolor: '#2d2d2d', color: 'white', borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    Confirm Team Removal
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        Are you sure you want to remove team "{teamToRemove?.name}" from this project?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={() => setRemoveTeamDialogOpen(false)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleRemoveTeam(teamToRemove?._id, teamToRemove?.name)}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 1 }}
                    >
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ProjectDetail;

