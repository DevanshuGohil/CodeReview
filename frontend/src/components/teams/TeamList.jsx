// components/teams/TeamList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../common/SnackbarProvider';
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
    Tooltip,
    ButtonGroup,
    TextField,
    InputAdornment,
    TablePagination,
    TableSortLabel,
    Grid,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemAvatar,
    Avatar,
    Divider,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import {
    Group as GroupIcon,
    Person as PersonIcon,
    CalendarToday as CalendarTodayIcon,
    Info as InfoIcon,
    Close as CloseIcon,
    Folder as FolderIcon,
    AccountCircle as AccountCircleIcon
} from '@mui/icons-material';

const TeamList = () => {
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('name');
    const [order, setOrder] = useState('asc');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const { currentUser } = useAuth();
    const { showSuccess, showError } = useSnackbar();

    // Check if user is a manager (can delete teams)
    const canManageTeam = currentUser?.role === 'manager';

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await api.get('/teams');
            setTeams(response.data);
            setFilteredTeams(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    // Filter teams when search query changes
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredTeams(teams);
        } else {
            const lowercasedQuery = searchQuery.toLowerCase();
            const filtered = teams.filter(
                team =>
                    team.name.toLowerCase().includes(lowercasedQuery) ||
                    (team.description && team.description.toLowerCase().includes(lowercasedQuery)) ||
                    (team.createdBy?.username && team.createdBy.username.toLowerCase().includes(lowercasedQuery)) ||
                    // Search in team members
                    team.members.some(member =>
                        member.user?.username?.toLowerCase().includes(lowercasedQuery) ||
                        member.user?.email?.toLowerCase().includes(lowercasedQuery)
                    )
            );
            setFilteredTeams(filtered);
        }
        setPage(0); // Reset to first page on new search
    }, [searchQuery, teams]);

    const handleDeleteTeam = async (teamId, teamName) => {
        try {
            // Check if current user has permission
            if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
                showError('Only managers and administrators can delete teams');
                return;
            }

            await api.delete(`/teams/${teamId}`);
            // Remove the deleted team from the teams list
            const updatedTeams = teams.filter(team => team._id !== teamId);
            setTeams(updatedTeams);
            showSuccess(`Team "${teamName}" has been deleted successfully`);
            setDeleteDialogOpen(false);
            setTeamToDelete(null);
        } catch (err) {
            console.error('Error deleting team:', err);
            showError(`Failed to delete team: ${err.response?.data?.message || err.message}`);
            setDeleteDialogOpen(false);
            setTeamToDelete(null);
        }
    };

    const openDeleteDialog = (team) => {
        setTeamToDelete(team);
        setDeleteDialogOpen(true);
    };

    // Handle page change for pagination
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle sorting
    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Create sort handler for a column
    const createSortHandler = (property) => () => {
        handleRequestSort(property);
    };

    // Sort function
    const compareValues = (a, b, orderBy) => {
        if (orderBy === 'createdBy') {
            const valueA = a.createdBy?.username || '';
            const valueB = b.createdBy?.username || '';
            return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        } else if (orderBy === 'members') {
            return order === 'asc' ? a.members.length - b.members.length : b.members.length - a.members.length;
        } else if (orderBy === 'createdAt') {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
            const valueA = a[orderBy] || '';
            const valueB = b[orderBy] || '';
            return typeof valueA === 'string'
                ? (order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA))
                : (order === 'asc' ? valueA - valueB : valueB - valueA);
        }
    };

    // Sort and paginate teams
    const sortedTeams = filteredTeams.slice().sort((a, b) => compareValues(a, b, orderBy));
    const paginatedTeams = sortedTeams.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Handle opening the detail dialog
    const handleRowClick = async (team) => {
        setSelectedTeam(team); // Set basic team info immediately
        setDetailDialogOpen(true);
        setDetailLoading(true);

        try {
            // Fetch detailed team data including members
            console.log("Fetching team details for:", team._id);
            const response = await api.get(`/teams/${team._id}`);
            console.log("Team details response:", response.data);
            setSelectedTeam(response.data);
        } catch (err) {
            console.error("Error fetching team details:", err);
            // Keep the basic team data if the detailed fetch fails
        } finally {
            setDetailLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <Container maxWidth="lg" sx={{ mt: 4 }}><Typography>Loading teams...</Typography></Container>;
    if (error) return <Container maxWidth="lg" sx={{ mt: 4 }}><Typography color="error">Error: {error}</Typography></Container>;

    return (
        <Box sx={{ p: 3, maxWidth: '100%', bgcolor: '#161616', minHeight: '100vh' }}>
            {/* Header with title and create button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ color: 'white', fontSize: '2.5rem', fontWeight: 400 }}>
                    Teams
                </Typography>
                {canManageTeam && (
                    <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/teams/new"
                        startIcon={<AddIcon />}
                        sx={{
                            borderRadius: 2,
                            bgcolor: '#2196f3',
                            px: 3,
                            py: 1
                        }}
                    >
                        Create Team
                    </Button>
                )}
            </Box>

            {/* Search bar and results count */}
            <Box sx={{ display: 'flex', mb: 4, gap: 2, alignItems: 'center' }}>
                <Box
                    sx={{
                        position: 'relative',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 1,
                        px: 2,
                        py: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        width: 300,
                        maxWidth: '100%',
                        bgcolor: 'rgba(0, 0, 0, 0.2)'
                    }}
                >
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 1 }} />
                    <input
                        type="text"
                        placeholder="Search teams by name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            width: '100%',
                            outline: 'none',
                            padding: '8px 0',
                            fontSize: '1rem'
                        }}
                    />
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {filteredTeams.length} teams found
                </Typography>
            </Box>

            {/* Teams table */}
            <Box sx={{ mb: 3, bgcolor: '#1e1e1e', borderRadius: 1, overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    color: 'white',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    py: 2
                                }}
                                onClick={createSortHandler('name')}
                                style={{ cursor: 'pointer' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    Team Name
                                    {orderBy === 'name' && (
                                        <ArrowUpwardIcon
                                            sx={{
                                                ml: 0.5,
                                                fontSize: '0.9rem',
                                                transform: order === 'desc' ? 'rotate(180deg)' : 'rotate(0)',
                                                transition: 'transform 0.2s'
                                            }}
                                        />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell
                                sx={{
                                    color: 'white',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    py: 2
                                }}
                                onClick={createSortHandler('description')}
                                style={{ cursor: 'pointer' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    Description
                                    {orderBy === 'description' && (
                                        <ArrowUpwardIcon
                                            sx={{
                                                ml: 0.5,
                                                fontSize: '0.9rem',
                                                transform: order === 'desc' ? 'rotate(180deg)' : 'rotate(0)',
                                                transition: 'transform 0.2s'
                                            }}
                                        />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell
                                sx={{
                                    color: 'white',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    py: 2
                                }}
                                onClick={createSortHandler('members')}
                                style={{ cursor: 'pointer' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    Members
                                    {orderBy === 'members' && (
                                        <ArrowUpwardIcon
                                            sx={{
                                                ml: 0.5,
                                                fontSize: '0.9rem',
                                                transform: order === 'desc' ? 'rotate(180deg)' : 'rotate(0)',
                                                transition: 'transform 0.2s'
                                            }}
                                        />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell
                                sx={{
                                    color: 'white',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    py: 2
                                }}
                                onClick={createSortHandler('createdBy')}
                                style={{ cursor: 'pointer' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    Created By
                                    {orderBy === 'createdBy' && (
                                        <ArrowUpwardIcon
                                            sx={{
                                                ml: 0.5,
                                                fontSize: '0.9rem',
                                                transform: order === 'desc' ? 'rotate(180deg)' : 'rotate(0)',
                                                transition: 'transform 0.2s'
                                            }}
                                        />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell
                                sx={{
                                    color: 'white',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    py: 2
                                }}
                                onClick={createSortHandler('createdAt')}
                                style={{ cursor: 'pointer' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    Created At
                                    {orderBy === 'createdAt' && (
                                        <ArrowUpwardIcon
                                            sx={{
                                                ml: 0.5,
                                                fontSize: '0.9rem',
                                                transform: order === 'desc' ? 'rotate(180deg)' : 'rotate(0)',
                                                transition: 'transform 0.2s'
                                            }}
                                        />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell
                                align="right"
                                sx={{
                                    color: 'white',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    py: 2
                                }}
                            >
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedTeams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                    No teams found
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedTeams.map((team) => (
                                <TableRow
                                    key={team._id}
                                    onClick={() => handleRowClick(team)}
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)', cursor: 'pointer' },
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                >
                                    <TableCell component="th" scope="row" sx={{ color: 'white', py: 2 }}>
                                        {team.name}
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        {team.description || team.name}
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Chip
                                                icon={<PeopleIcon />}
                                                label={team.members ? team.members.length : 0}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(33, 150, 243, 0.2)',
                                                    color: '#2196f3',
                                                    borderRadius: '15px'
                                                }}
                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        {team.createdBy?.username || 'Unknown'}
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        {team.createdAt ? (
                                            new Date(team.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })
                                        ) : (
                                            'N/A'
                                        )}
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 2 }}>
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Tooltip title="View Team">
                                                <IconButton
                                                    component={Link}
                                                    to={`/teams/${team._id}`}
                                                    size="small"
                                                    sx={{
                                                        color: '#2196f3',
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {canManageTeam && (
                                                <Tooltip title="Delete Team">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeleteDialog(team);
                                                        }}
                                                        sx={{
                                                            color: '#f44336',
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination footer */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 2 }}>
                            Rows per page:
                        </Typography>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            style={{
                                background: 'transparent',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                padding: '4px 8px'
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 2 }}>
                            {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredTeams.length)} of {filteredTeams.length}
                        </Typography>
                        <Box sx={{ display: 'flex' }}>
                            <IconButton
                                onClick={() => handleChangePage(null, page - 1)}
                                disabled={page === 0}
                                sx={{
                                    color: page === 0 ? 'rgba(255, 255, 255, 0.3)' : 'white',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                                    p: 1
                                }}
                            >
                                <KeyboardArrowLeftIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => handleChangePage(null, page + 1)}
                                disabled={page >= Math.ceil(filteredTeams.length / rowsPerPage) - 1}
                                sx={{
                                    color: page >= Math.ceil(filteredTeams.length / rowsPerPage) - 1
                                        ? 'rgba(255, 255, 255, 0.3)'
                                        : 'white',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                                    p: 1
                                }}
                            >
                                <KeyboardArrowRightIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </Box>
            </Box>

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
                        Are you sure you want to delete team "{teamToDelete?.name}"? This action cannot be undone.
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
                        onClick={() => handleDeleteTeam(teamToDelete?._id, teamToDelete?.name)}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 1 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Team Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: '#1e1e1e', color: 'white', borderRadius: 2 }
                }}
            >
                {selectedTeam && (
                    <>
                        <DialogTitle sx={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 3,
                            py: 2
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <GroupIcon sx={{ mr: 1, color: '#2196f3' }} />
                                <Typography variant="h5">
                                    {selectedTeam.name}
                                </Typography>
                            </Box>
                            <IconButton
                                onClick={() => setDetailDialogOpen(false)}
                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ px: 3, py: 2 }}>
                            {detailLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                                    <Typography sx={{ mr: 2, color: 'rgba(255, 255, 255, 0.7)' }}>Loading team details...</Typography>
                                    <CircularProgress size={24} sx={{ color: '#2196f3' }} />
                                </Box>
                            ) : (
                                <Grid container spacing={3}>
                                    {/* Description */}
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#2196f3', mb: 1 }}>
                                            Description
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.05rem', lineHeight: 1.6 }}>
                                            {selectedTeam.description || 'No description provided.'}
                                        </Typography>
                                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />
                                    </Grid>

                                    {/* Team Details */}
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#2196f3', mb: 2 }}>
                                            Team Details
                                        </Typography>

                                        <List disablePadding>
                                            <ListItem disablePadding sx={{ mb: 1 }}>
                                                <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255, 255, 255, 0.7)' }}>
                                                    <CalendarTodayIcon fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Created on"
                                                    secondary={formatDate(selectedTeam.createdAt)}
                                                    primaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)', variant: 'body2' }}
                                                    secondaryTypographyProps={{ color: 'white' }}
                                                />
                                            </ListItem>

                                            <ListItem disablePadding sx={{ mb: 1 }}>
                                                <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255, 255, 255, 0.7)' }}>
                                                    <PersonIcon fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Created by"
                                                    secondary={selectedTeam.createdBy?.username || 'Unknown'}
                                                    primaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)', variant: 'body2' }}
                                                    secondaryTypographyProps={{ color: 'white' }}
                                                />
                                            </ListItem>

                                            <ListItem disablePadding sx={{ mb: 1 }}>
                                                <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255, 255, 255, 0.7)' }}>
                                                    <FolderIcon fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Projects"
                                                    secondary={
                                                        selectedTeam.projects?.length > 0
                                                            ? `${selectedTeam.projects.length} projects associated`
                                                            : 'No projects associated'
                                                    }
                                                    primaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)', variant: 'body2' }}
                                                    secondaryTypographyProps={{ color: 'white' }}
                                                />
                                            </ListItem>
                                        </List>
                                    </Grid>

                                    {/* Team Members */}
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#2196f3', mb: 2 }}>
                                            Team Members ({selectedTeam.members?.length || 0})
                                        </Typography>

                                        {selectedTeam.members && selectedTeam.members.length > 0 ? (
                                            <List
                                                disablePadding
                                                sx={{
                                                    maxHeight: 300,
                                                    overflow: 'auto',
                                                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                                                    borderRadius: 1,
                                                    p: 1,
                                                    '&::-webkit-scrollbar': {
                                                        width: '8px',
                                                    },
                                                    '&::-webkit-scrollbar-thumb': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                        borderRadius: '4px',
                                                    },
                                                    '&::-webkit-scrollbar-track': {
                                                        backgroundColor: 'transparent',
                                                    }
                                                }}
                                            >
                                                {selectedTeam.members.map((member, index) => {
                                                    // Handle different member data structures
                                                    const userData = member.user || member;
                                                    const memberId = member._id || userData._id || index;

                                                    // Extract user info - handle both populated and non-populated user data
                                                    const firstName = userData.firstName || '';
                                                    const lastName = userData.lastName || '';
                                                    const username = userData.username || '';
                                                    const email = userData.email || '';
                                                    const role = userData.role || member.role || 'developer';

                                                    // Create display name from available data
                                                    let displayName = 'Anonymous';
                                                    if (firstName && lastName) {
                                                        displayName = `${firstName} ${lastName}`;
                                                    } else if (username) {
                                                        displayName = username;
                                                    }

                                                    return (
                                                        <ListItem
                                                            key={memberId}
                                                            disableGutters
                                                            sx={{
                                                                mb: 0.5,
                                                                py: 0.5,
                                                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                                            }}
                                                        >
                                                            <ListItemAvatar sx={{ minWidth: 40 }}>
                                                                <Avatar
                                                                    sx={{
                                                                        width: 30,
                                                                        height: 30,
                                                                        bgcolor: role === 'admin'
                                                                            ? '#9c27b0'
                                                                            : role === 'manager'
                                                                                ? '#2196f3'
                                                                                : '#757575'
                                                                    }}
                                                                >
                                                                    <AccountCircleIcon fontSize="small" />
                                                                </Avatar>
                                                            </ListItemAvatar>
                                                            <ListItemText
                                                                primary={displayName}
                                                                secondary={email}
                                                                primaryTypographyProps={{ color: 'white', variant: 'body2' }}
                                                                secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.6)', variant: 'caption' }}
                                                                sx={{ m: 0 }}
                                                            />
                                                            <Chip
                                                                label={role}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                                    color: 'rgba(255, 255, 255, 0.8)',
                                                                    fontSize: '0.7rem',
                                                                    height: 24
                                                                }}
                                                            />
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                No members in this team.
                                            </Typography>
                                        )}
                                    </Grid>

                                    {/* Projects detail */}
                                    {selectedTeam.projects && selectedTeam.projects.length > 0 && (
                                        <Grid item xs={12}>
                                            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />
                                            <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#2196f3', mb: 2 }}>
                                                Associated Projects
                                            </Typography>
                                            <Grid container spacing={1}>
                                                {selectedTeam.projects.map(project => (
                                                    <Grid item key={project._id} xs={12} sm={6} md={4}>
                                                        <Box
                                                            sx={{
                                                                bgcolor: 'rgba(33, 150, 243, 0.1)',
                                                                border: '1px solid rgba(33, 150, 243, 0.2)',
                                                                borderRadius: 1,
                                                                p: 1.5,
                                                                '&:hover': {
                                                                    bgcolor: 'rgba(33, 150, 243, 0.15)',
                                                                }
                                                            }}
                                                        >
                                                            <Typography variant="subtitle2" sx={{ color: 'white', mb: 0.5 }}>
                                                                {project.name}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 1 }}>
                                                                {project.key}
                                                            </Typography>
                                                            <Typography variant="body2" noWrap sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                                {project.description || 'No description'}
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Grid>
                                    )}
                                </Grid>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
                            <Button
                                component={Link}
                                to={`/teams/${selectedTeam._id}`}
                                variant="contained"
                                sx={{ bgcolor: '#2196f3' }}
                            >
                                View Team Details
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default TeamList;
