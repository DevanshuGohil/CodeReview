// components/teams/TeamList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Container,
    Typography,
    Button,
    Box,
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
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';

const TeamList = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setLoading(true);
                const response = await api.get('/teams');
                setTeams(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    if (loading) return <Container maxWidth="lg" sx={{ mt: 4 }}><Typography>Loading teams...</Typography></Container>;
    if (error) return <Container maxWidth="lg" sx={{ mt: 4 }}><Typography color="error">Error: {error}</Typography></Container>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom color="text.primary">
                    Teams
                </Typography>
                {currentUser?.role === 'manager' && (
                    <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/teams/new"
                        startIcon={<AddIcon />}
                        sx={{
                            borderRadius: 2,
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)',
                            '&:hover': {
                                boxShadow: '0 6px 10px rgba(0, 0, 0, 0.6)'
                            }
                        }}
                    >
                        Create Team
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                <Table sx={{ minWidth: 650 }} aria-label="teams table">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'background.default' }}>
                            <TableCell>Team Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Members</TableCell>
                            <TableCell>Created By</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {teams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No teams found</TableCell>
                            </TableRow>
                        ) : (
                            teams.map(team => (
                                <TableRow
                                    key={team._id}
                                    sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                                >
                                    <TableCell component="th" scope="row">
                                        <Typography variant="body1" fontWeight="medium">
                                            {team.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
                                            {team.description || 'No description'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Chip
                                                icon={<PeopleIcon />}
                                                label={team.members.length}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ mr: 1 }}
                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {team.createdBy?.username || 'Unknown'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            component={Link}
                                            to={`/teams/${team._id}`}
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

export default TeamList;
