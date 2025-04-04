// components/teams/TeamDetail.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { useParams, Link } from 'react-router-dom';
import UserSelector from '../users/UserSelector';
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
    Stack,
    TextField,
    IconButton,
    Tooltip
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

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const { id } = useParams();
    const { currentUser } = useAuth();

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
                setError(err.message);
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
            setError("Only managers can add team members");
            return;
        }

        try {
            const response = await api.post(`/teams/${id}/members`, {
                userId: selectedUser,
                role: 'member' // Default role is always 'member'
            });

            setTeam(response.data);
            setSelectedUser('');
            setSuccessMessage('User successfully added to the team!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleRemoveMember = async (userId, userName) => {
        setError(null);
        setSuccessMessage(null);

        if (!canManageTeam) {
            setError("Only managers can remove team members");
            return;
        }

        // Show confirmation dialog
        if (!window.confirm(`Are you sure you want to remove ${userName} from the team?`)) {
            return;
        }

        try {
            const response = await api.delete(`/teams/${id}/members/${userId}`);
            setTeam(response.data);
            setSuccessMessage('User successfully removed from the team!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
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
            setError("Only managers can update team details");
            return;
        }

        try {
            const response = await api.put(`/teams/${id}`, {
                name: editName,
                description: editDescription
            });

            // Fetch the updated team to ensure we have all data, including members
            const updatedTeamResponse = await api.get(`/teams/${id}`);
            setTeam(updatedTeamResponse.data);

            setIsEditing(false);
            setSuccessMessage('Team details updated successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    if (loading) return <Container maxWidth="lg" sx={{ mt: 4 }}><Typography>Loading team details...</Typography></Container>;
    if (error && !team) return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="error">Error: {error}</Alert></Container>;
    if (!team) return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="warning">Team not found</Alert></Container>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
                        <Tooltip title="Edit Team Details">
                            <IconButton
                                onClick={handleStartEditing}
                                color="primary"
                            >
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
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

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

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
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => handleRemoveMember(
                                                            member.user._id,
                                                            `${member.user.firstName} ${member.user.lastName}`
                                                        )}
                                                    >
                                                        Remove
                                                    </Button>
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
                            <Box component="form" onSubmit={handleAddMember}>
                                <Typography variant="h6" gutterBottom>Add Member</Typography>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={8}>
                                        <UserSelector
                                            value={selectedUser}
                                            onChange={setSelectedUser}
                                            excludeUsers={team.members.map(member => member.user._id)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={!selectedUser}
                                            fullWidth
                                        >
                                            Add to Team
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
};

export default TeamDetail;
