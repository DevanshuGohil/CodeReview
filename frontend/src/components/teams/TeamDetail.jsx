// components/teams/TeamDetail.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { useParams, Link, useNavigate } from 'react-router-dom';
import UserSelector from '../users/UserSelector';
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
    TableContainer,
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
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const TeamDetail = () => {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedUser, setSelectedUser] = useState('');
    const [addingMember, setAddingMember] = useState(false);

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);

    const navigate = useNavigate();
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { showSuccess, showError } = useSnackbar();

    // Check if user is a manager (can manage team members)
    const canManageTeam = currentUser?.role === 'manager';

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/teams/${id}`);
                setTeam(response.data);
                setEditName(response.data.name);
                setEditDescription(response.data.description || '');
                setLoading(false);
            } catch (err) {
                setError(err.response.data.message);
                setLoading(false);
            }
        };

        fetchTeam();
    }, [id]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!canManageTeam) {
            showError("Only managers can add team members");
            return;
        }

        try {
            setAddingMember(true);
            const response = await api.post(`/teams/${id}/members`, {
                userId: selectedUser,
                role: 'member' // Default role is always 'member'
            });

            setTeam(response.data);
            setSelectedUser('');
            showSuccess('User successfully added to the team!');
        } catch (err) {
            showError(err.response?.data?.message || err.message);
        } finally {
            setAddingMember(false);
        }
    };

    const handleRemoveMember = async (userId, userName) => {
        setError(null);
        setSuccessMessage(null);

        if (!canManageTeam) {
            showError("Only managers can remove team members");
            return;
        }

        try {
            const response = await api.delete(`/teams/${id}/members/${userId}`);
            setTeam(response.data);
            showSuccess('User successfully removed from the team!');
            setRemoveMemberDialogOpen(false);
            setMemberToRemove(null);
        } catch (err) {
            showError(err.response?.data?.message || err.message);
            setRemoveMemberDialogOpen(false);
            setMemberToRemove(null);
        }
    };

    const openRemoveMemberDialog = (member) => {
        setMemberToRemove(member);
        setRemoveMemberDialogOpen(true);
    };

    const handleStartEditing = () => {
        setIsEditing(true);
        setEditName(team.name);
        setEditDescription(team.description || '');
    };

    const handleCancelEditing = () => {
        setIsEditing(false);
    };

    const handleSaveTeamDetails = async () => {
        setError(null);
        setSuccessMessage(null);

        if (!canManageTeam) {
            showError("Only managers can update team details");
            return;
        }

        try {
            await api.put(`/teams/${id}`, {
                name: editName,
                description: editDescription
            });

            // Fetch the updated team to ensure we have all data, including members
            const updatedTeamResponse = await api.get(`/teams/${id}`);
            setTeam(updatedTeamResponse.data);

            setIsEditing(false);
            showSuccess('Team details updated successfully!');
        } catch (err) {
            showError(err.response?.data?.message || err.message);
        }
    };

    const handleDeleteTeam = async () => {
        if (!canManageTeam) {
            showError("Only managers can delete teams");
            return;
        }

        try {
            await api.delete(`/teams/${id}`);
            showSuccess('Team deleted successfully');
            navigate('/teams');
        } catch (err) {
            showError(err.response?.data?.message || err.message);
        }
    };

    if (loading) return <Container maxWidth="lg" sx={{ mt: 4 }}><Typography>Loading team details...</Typography></Container>;
    if (error && !team) return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="error">Error: {error}</Alert></Container>;
    if (!team) return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="warning">Team not found</Alert></Container>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}
            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                {isEditing ? (
                    <TextField
                        label="Team Name"
                        variant="outlined"
                        fullWidth
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        sx={{ mr: 2 }}
                    />
                ) : (
                    <Typography variant="h4" component="h1" color="text.primary">
                        {team.name}
                    </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {canManageTeam && !isEditing && (
                        <>
                            <Tooltip title="Edit Team Details">
                                <IconButton
                                    onClick={handleStartEditing}
                                    color="primary"
                                >
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Team">
                                <IconButton
                                    onClick={() => setDeleteDialogOpen(true)}
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    {isEditing && (
                        <>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveTeamDetails}
                                disabled={!editName.trim()}
                                sx={{ mr: 1 }}
                            >
                                Save
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleCancelEditing}
                            >
                                Cancel
                            </Button>
                        </>
                    )}
                    {!isEditing && (
                        <Button
                            component={Link}
                            to="/teams"
                            startIcon={<ArrowBackIcon />}
                            variant="outlined"
                            sx={{ borderRadius: 1 }}
                        >
                            Back to Teams
                        </Button>
                    )}
                </Box>
            </Box>

            {isEditing ? (
                <TextField
                    label="Team Description"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    sx={{ mb: 4 }}
                />
            ) : team.description && (
                <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                    {team.description}
                </Typography>
            )}

            <Card variant="outlined" sx={{ mb: 4, bgcolor: 'background.paper' }}>
                <CardHeader
                    title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h5">Team Members</Typography>
                            <Chip
                                label={`${team.members.length} ${team.members.length === 1 ? 'Member' : 'Members'}`}
                                color="primary"
                                size="small"
                            />
                        </Box>
                    }
                    sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}
                />
                <CardContent>
                    {team.members.length > 0 ? (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        {canManageTeam && <TableCell align="right">Actions</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {team.members.map(member => (
                                        <TableRow key={member.user._id}>
                                            <TableCell>
                                                {member.user.firstName} {member.user.lastName}
                                            </TableCell>
                                            <TableCell>
                                                {member.user.email}
                                            </TableCell>
                                            {canManageTeam && (
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => openRemoveMemberDialog(member)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            This team has no members yet.
                            {canManageTeam && " Add members using the form below."}
                        </Alert>
                    )}

                    {canManageTeam && (
                        <>
                            <Divider sx={{ my: 4 }} />
                            <Box component="form" onSubmit={handleAddMember} sx={{ width: '100%' }}>
                                <Typography variant="h6" gutterBottom>Add Member</Typography>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={9}>
                                        <UserSelector
                                            value={selectedUser}
                                            onChange={setSelectedUser}
                                            excludeUsers={team.members.map(member => member.user._id)}
                                            sx={{ width: '100%', minWidth: '300px' }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={!selectedUser || addingMember}
                                            fullWidth
                                            startIcon={addingMember ? <CircularProgress size={20} color="inherit" /> : null}
                                        >
                                            {addingMember ? 'Adding...' : 'Add to Team'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </>
                    )}
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
                    Confirm Team Deletion
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        Are you sure you want to delete team "{team?.name}"? This action cannot be undone.
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
                        onClick={handleDeleteTeam}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 1 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Remove Member Confirmation Dialog */}
            <Dialog
                open={removeMemberDialogOpen}
                onClose={() => setRemoveMemberDialogOpen(false)}
                PaperProps={{
                    sx: { bgcolor: '#2d2d2d', color: 'white', borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    Confirm Member Removal
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        Are you sure you want to remove {memberToRemove?.user?.username || memberToRemove?.user?.email || 'this user'} from the team?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={() => setRemoveMemberDialogOpen(false)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleRemoveMember(memberToRemove?.user?._id, memberToRemove?.user?.username || memberToRemove?.user?.email)}
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

export default TeamDetail;
