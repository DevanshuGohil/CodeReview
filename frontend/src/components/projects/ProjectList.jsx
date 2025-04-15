// components/projects/ProjectList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../common/SnackbarProvider';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
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
    Divider,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GitHubIcon from '@mui/icons-material/GitHub';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('name');
    const [order, setOrder] = useState('asc');
    const [selectedProject, setSelectedProject] = useState(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const { currentUser } = useAuth();
    const { showSuccess, showError } = useSnackbar();

    // Check if user is a manager (can delete projects)
    const canManageProject = currentUser?.role === 'manager';

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projects');
            setProjects(response.data);
            setFilteredProjects(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // Filter projects when search query changes
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredProjects(projects);
        } else {
            const lowercasedQuery = searchQuery.toLowerCase();
            const filtered = projects.filter(
                project =>
                    project.name.toLowerCase().includes(lowercasedQuery) ||
                    project.key.toLowerCase().includes(lowercasedQuery) ||
                    (project.description && project.description.toLowerCase().includes(lowercasedQuery)) ||
                    (project.createdBy?.username && project.createdBy.username.toLowerCase().includes(lowercasedQuery))
            );
            setFilteredProjects(filtered);
        }
        setPage(0); // Reset to first page on new search
    }, [searchQuery, projects]);

    const handleDeleteProject = async (projectId, projectName) => {
        try {
            // Check if current user has permission to delete
            if (!canManageProject) {
                showError('Only managers can delete projects');
                return;
            }

            await api.delete(`/projects/${projectId}`);
            // Remove the deleted project from the projects list
            const updatedProjects = projects.filter(p => p._id !== projectId);
            setProjects(updatedProjects);
            showSuccess(`Project "${projectName}" has been deleted successfully`);
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
        } catch (err) {
            console.error('Error deleting project:', err);
            showError(`Failed to delete project: ${err.response?.data?.message || err.message}`);
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
        }
    };

    const openDeleteDialog = (project) => {
        setProjectToDelete(project);
        setDeleteDialogOpen(true);
    };

    // Handle page change for pagination
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
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
        } else if (orderBy === 'teams') {
            return order === 'asc' ? a.teams.length - b.teams.length : b.teams.length - a.teams.length;
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

    // Sort and paginate projects
    const sortedProjects = filteredProjects.slice().sort((a, b) => compareValues(a, b, orderBy));
    const paginatedProjects = sortedProjects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Handle opening the detail dialog
    const handleRowClick = async (project) => {
        setSelectedProject(project); // Set basic project info immediately
        setDetailDialogOpen(true);
        setDetailLoading(true);

        try {
            // Fetch detailed project data
            const response = await api.get(`/projects/${project._id}`);
            const projectData = response.data;

            // Fetch details for each team *concurrently* and merge the results
            if (projectData.teams && projectData.teams.length > 0) {
                const updatedTeams = await Promise.all(
                    projectData.teams.map(async (projectTeam) => {
                        // Ensure projectTeam and projectTeam.team exist before accessing _id
                        const teamId = projectTeam?.team?._id;
                        if (!teamId) {
                            console.error("Team ID missing in project data:", projectTeam);
                            return { ...projectTeam, team: { ...(projectTeam?.team || {}), members: [] } }; // Return original structure with empty members
                        }

                        try {
                            const teamResponse = await api.get(`/teams/${teamId}`);
                            // Return the original projectTeam object but add the members array from the fetched details
                            return {
                                ...projectTeam, // Keep original structure { team: {...}, accessLevel: ... }
                                team: { // Merge members into the nested team object
                                    ...(projectTeam.team),
                                    members: teamResponse.data.members || [] // Add members array
                                }
                            };
                        } catch (error) {
                            console.error(`Error fetching team ${teamId} details:`, error);
                            // Return original structure but ensure members array exists (as empty) for consistent rendering
                            return { ...projectTeam, team: { ...(projectTeam.team || {}), members: [] } };
                        }
                    })
                );
                // Update the project data with the teams that now include member details
                projectData.teams = updatedTeams;
            }

            setSelectedProject(projectData); // Set the fully updated project data
        } catch (err) {
            console.error("Error fetching project details:", err);
            // Revert to basic data if detailed fetch fails
            setSelectedProject(project);
            showError('Failed to load full project details.');
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

    if (loading) return <Box sx={{ p: 3, color: 'white' }}><Typography>Loading projects...</Typography></Box>;
    if (error) return <Box sx={{ p: 3, color: '#f44336' }}><Typography>Error: {error}</Typography></Box>;

    return (
        <Box sx={{ p: 3, maxWidth: '100%', bgcolor: '#161616', minHeight: '100vh' }}>
            {/* Header with title and create button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Typography variant="h4" component="h1" sx={{ color: 'white', fontSize: '2.5rem', fontWeight: 400, mb: { xs: 2, sm: 0 } }}>
                    Projects
                </Typography>
                {currentUser?.role === 'manager' && (
                    <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/projects/new"
                        startIcon={<AddIcon />}
                        sx={{
                            borderRadius: 2,
                            bgcolor: '#2196f3',
                            px: 3,
                            py: 1,
                            width: { xs: '100%', sm: 'auto' }
                        }}
                    >
                        Create Project
                    </Button>
                )}
            </Box>

            {/* Search bar and results count */}
            <Box sx={{ display: 'flex', mb: 4, gap: 2, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box
                    sx={{
                        position: 'relative',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 1,
                        px: 2,
                        py: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        width: { xs: '100%', sm: 300 },
                        maxWidth: '100%',
                        bgcolor: 'rgba(0, 0, 0, 0.2)'
                    }}
                >
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 1 }} />
                    <input
                        type="text"
                        placeholder="Search projects by name"
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
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', width: { xs: '100%', sm: 'auto' }, textAlign: { xs: 'center', sm: 'left' } }}>
                    {filteredProjects.length} projects found
                </Typography>
            </Box>

            {/* Desktop Projects table - hidden on mobile */}
            <Box sx={{ mb: 3, bgcolor: '#1e1e1e', borderRadius: 1, overflow: 'hidden', display: { xs: 'none', md: 'block' } }}>
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
                                    Project Name
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
                                onClick={createSortHandler('key')}
                                style={{ cursor: 'pointer' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    Key
                                    {orderBy === 'key' && (
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
                                onClick={createSortHandler('teams')}
                                style={{ cursor: 'pointer' }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    Teams
                                    {orderBy === 'teams' && (
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
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    GitHub
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
                        {paginatedProjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                    No projects found
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedProjects.map((project) => (
                                <TableRow
                                    key={project._id}
                                    onClick={() => handleRowClick(project)}
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)', cursor: 'pointer' },
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                >
                                    <TableCell component="th" scope="row" sx={{ color: 'white', py: 2 }}>
                                        {project.name}
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        <Chip
                                            label={project.key}
                                            size="small"
                                            sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        {project.description || 'No description'}
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        <Chip
                                            label={project.teams.length}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(33, 150, 243, 0.2)',
                                                color: '#2196f3',
                                                borderRadius: '15px'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        {project.githubRepo?.url ? (
                                            <Tooltip title="View GitHub Repository">
                                                <IconButton
                                                    size="small"
                                                    href={project.githubRepo.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ color: '#2196f3' }}
                                                >
                                                    <GitHubIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                                Not linked
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        {project.createdAt ? (
                                            new Date(project.createdAt).toLocaleDateString('en-US', {
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
                                            <Tooltip title="View Project">
                                                <IconButton
                                                    component={Link}
                                                    to={`/projects/${project._id}`}
                                                    size="small"
                                                    sx={{
                                                        color: '#2196f3',
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {canManageProject && (
                                                <Tooltip title="Delete Project">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeleteDialog(project);
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
            </Box>

            {/* Mobile Projects Cards - shown only on mobile */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
                {paginatedProjects.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'rgba(255, 255, 255, 0.5)' }}>
                        No projects found
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {paginatedProjects.map((project) => (
                            <Box
                                key={project._id}
                                sx={{
                                    bgcolor: '#1e1e1e',
                                    borderRadius: 1,
                                    p: 2,
                                    '&:hover': { bgcolor: 'rgba(30, 30, 30, 0.8)', cursor: 'pointer' }
                                }}
                                onClick={() => handleRowClick(project)}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6" color="white">{project.name}</Typography>
                                        <Chip
                                            label={project.key}
                                            size="small"
                                            sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3', mt: 1 }}
                                        />
                                    </Box>
                                    <Stack direction="row" spacing={1}>
                                        <IconButton
                                            component={Link}
                                            to={`/projects/${project._id}`}
                                            size="small"
                                            sx={{
                                                color: '#2196f3',
                                                bgcolor: 'rgba(33, 150, 243, 0.1)',
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                        {canManageProject && (
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDeleteDialog(project);
                                                }}
                                                sx={{
                                                    color: '#f44336',
                                                    bgcolor: 'rgba(244, 67, 54, 0.1)',
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Stack>
                                </Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        mb: 2,
                                        display: '-webkit-box',
                                        overflow: 'hidden',
                                        WebkitBoxOrient: 'vertical',
                                        WebkitLineClamp: 2,
                                    }}
                                >
                                    {project.description || 'No description'}
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <GroupIcon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 1 }} />
                                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                                {project.teams.length} teams
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <CalendarTodayIcon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 1 }} />
                                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                                {project.createdAt ? (
                                                    new Date(project.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })
                                                ) : (
                                                    'N/A'
                                                )}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                                {project.githubRepo?.url && (
                                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                                        <GitHubIcon fontSize="small" sx={{ color: '#2196f3', mr: 1 }} />
                                        <Typography
                                            variant="body2"
                                            component="a"
                                            href={project.githubRepo.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            sx={{
                                                color: '#2196f3',
                                                textDecoration: 'none',
                                                '&:hover': { textDecoration: 'underline' }
                                            }}
                                        >
                                            View Repository
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Stack>
                )}
            </Box>

            {/* Pagination footer */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 0 }
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
                        {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredProjects.length)} of {filteredProjects.length}
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
                            disabled={page >= Math.ceil(filteredProjects.length / rowsPerPage) - 1}
                            sx={{
                                color: page >= Math.ceil(filteredProjects.length / rowsPerPage) - 1
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
                        Are you sure you want to delete project "{projectToDelete?.name}"? This action cannot be undone.
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
                        onClick={() => handleDeleteProject(projectToDelete?._id, projectToDelete?.name)}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 1 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Project Detail Dialog */}
            <Dialog
                open={detailDialogOpen}
                onClose={() => setDetailDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: '#1e1e1e', color: 'white', borderRadius: 2 }
                }}
            >
                {selectedProject && (
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
                                <InfoIcon sx={{ mr: 1, color: '#2196f3' }} />
                                <Typography variant="h5">
                                    {selectedProject.name}
                                    <Typography component="span" variant="body2" sx={{ ml: 1, color: 'rgba(255, 255, 255, 0.6)' }}>
                                        ({selectedProject.key})
                                    </Typography>
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
                                    <Typography sx={{ mr: 2, color: 'rgba(255, 255, 255, 0.7)' }}>Loading project details...</Typography>
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
                                            {selectedProject.description || 'No description provided.'}
                                        </Typography>
                                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />
                                    </Grid>

                                    {/* Project Details */}
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#2196f3', mb: 2 }}>
                                            Project Details
                                        </Typography>

                                        <List disablePadding>
                                            <ListItem disablePadding sx={{ mb: 1 }}>
                                                <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255, 255, 255, 0.7)' }}>
                                                    <CalendarTodayIcon fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Created on"
                                                    secondary={formatDate(selectedProject.createdAt)}
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
                                                    secondary={selectedProject.createdBy?.username || 'Unknown'}
                                                    primaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)', variant: 'body2' }}
                                                    secondaryTypographyProps={{ color: 'white' }}
                                                />
                                            </ListItem>

                                            {selectedProject.githubRepo && (
                                                <ListItem disablePadding sx={{ mb: 1 }}>
                                                    <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255, 255, 255, 0.7)' }}>
                                                        <GitHubIcon fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary="GitHub Repository"
                                                        secondary={
                                                            <Button
                                                                variant="text"
                                                                size="small"
                                                                href={selectedProject.githubRepo.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                startIcon={<LinkIcon />}
                                                                sx={{ color: '#2196f3', textTransform: 'none', p: 0 }}
                                                            >
                                                                {selectedProject.githubRepo.url}
                                                            </Button>
                                                        }
                                                        primaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)', variant: 'body2' }}
                                                    />
                                                </ListItem>
                                            )}
                                        </List>
                                    </Grid>

                                    {/* Teams */}
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#2196f3', mb: 2 }}>
                                            Teams ({selectedProject.teams?.length || 0})
                                        </Typography>

                                        {selectedProject.teams && selectedProject.teams.length > 0 ? (
                                            <List disablePadding>
                                                {selectedProject.teams.map(projectTeam => {
                                                    const team = projectTeam.team;
                                                    if (!team) return null;
                                                    return (
                                                        <ListItem
                                                            key={team._id}
                                                            disablePadding
                                                            sx={{
                                                                mb: 1,
                                                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                                                                borderRadius: 1,
                                                                p: 1
                                                            }}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 36, color: '#2196f3' }}>
                                                                <GroupIcon fontSize="small" />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={team.name}
                                                                secondary={
                                                                    (() => {
                                                                        let memberCount = 0;
                                                                        if (team.members && Array.isArray(team.members)) {
                                                                            memberCount = team.members.length;
                                                                        } else if (typeof team.memberCount === 'number') {
                                                                            memberCount = team.memberCount;
                                                                        }
                                                                        return memberCount === 1 ? "1 member" : `${memberCount} members`;
                                                                    })()
                                                                }
                                                                primaryTypographyProps={{ color: 'white' }}
                                                                secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.6)' }}
                                                            />
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                                No teams assigned to this project.
                                            </Typography>
                                        )}
                                    </Grid>
                                </Grid>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
                            <Button
                                component={Link}
                                to={`/projects/${selectedProject._id}`}
                                variant="contained"
                                sx={{ bgcolor: '#2196f3' }}
                            >
                                View Project Details
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default ProjectList;
