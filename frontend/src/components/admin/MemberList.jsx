import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    Alert,
    Skeleton,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    TextField,
    TableSortLabel
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Engineering as EngineerIcon,
    AdminPanelSettings as AdminIcon,
    SupervisorAccount as ManagerIcon,
    Upload as UploadIcon,
    Search as SearchIcon,
    KeyboardArrowLeft as KeyboardArrowLeftIcon,
    KeyboardArrowRight as KeyboardArrowRightIcon
} from '@mui/icons-material';
import api from '../../axiosConfig';
import { useSnackbar } from '../../components/common/SnackbarProvider';

const MemberList = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [openImportModal, setOpenImportModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        role: 'developer'
    });
    const [importData, setImportData] = useState({
        adminPassword: 'Admin@123',
        managerPassword: 'Manager@123',
        developerPassword: 'Developer@123',
        csvFile: null
    });
    const [processing, setProcessing] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('name');
    const [order, setOrder] = useState('asc');
    const { showSuccess, showError } = useSnackbar();

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/users');
            setUsers(response.data);
            setFilteredUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
            setError(errorMessage);
            showError(`Failed to fetch users: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        if (!users.length) {
            setFilteredUsers([]);
            return;
        }

        if (!searchQuery.trim()) {
            setFilteredUsers([...users]);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = users.filter(user =>
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query) ||
            (user.role || 'developer').toLowerCase().includes(query)
        );

        setFilteredUsers(filtered);
        setPage(0);
    }, [searchQuery, users]);

    // Sort users using useMemo to avoid unnecessary recalculations
    const sortedUsers = useMemo(() => {
        return [...filteredUsers].sort((a, b) => {
            let aValue, bValue;

            switch (orderBy) {
                case 'name':
                    aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
                    bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
                    break;
                case 'email':
                    aValue = a.email.toLowerCase();
                    bValue = b.email.toLowerCase();
                    break;
                case 'username':
                    aValue = a.username.toLowerCase();
                    bValue = b.username.toLowerCase();
                    break;
                case 'role':
                    aValue = (a.role || 'developer').toLowerCase();
                    bValue = (b.role || 'developer').toLowerCase();
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt || 0).getTime();
                    bValue = new Date(b.createdAt || 0).getTime();
                    break;
                default:
                    aValue = a[orderBy];
                    bValue = b[orderBy];
            }

            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
            }
        });
    }, [filteredUsers, order, orderBy]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const createSortHandler = (property) => () => {
        handleRequestSort(property);
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setFormData({
            role: user.role || 'developer'
        });
        setOpenEditModal(true);
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setOpenDeleteModal(true);
    };

    const handleEditSubmit = async () => {
        try {
            setProcessing(true);
            const response = await api.put(`/users/${selectedUser._id}`, {
                role: formData.role
            });

            if (response.status === 200) {
                const updatedUsers = users.map(user =>
                    user._id === selectedUser._id ? { ...user, role: formData.role } : user
                );
                setUsers(updatedUsers);

                showSuccess(`Successfully updated role for ${selectedUser.firstName} ${selectedUser.lastName}`);
                setOpenEditModal(false);
            }
        } catch (err) {
            console.error('Error updating user:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update user';
            showError(`Failed to update user: ${errorMessage}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteSubmit = async () => {
        try {
            setProcessing(true);
            const response = await api.delete(`/users/${selectedUser._id}`);

            if (response.status === 200) {
                const updatedUsers = users.filter(user => user._id !== selectedUser._id);
                setUsers(updatedUsers);

                showSuccess(`Successfully deleted ${selectedUser.firstName} ${selectedUser.lastName}`);
                setOpenDeleteModal(false);
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to delete user';
            showError(`Failed to delete user: ${errorMessage}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImportInputChange = (e) => {
        const { name, value } = e.target;
        setImportData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setImportData(prev => ({
                ...prev,
                csvFile: e.target.files[0]
            }));
        }
    };

    const handleImportClick = () => {
        setImportData({
            adminPassword: 'Admin@123',
            managerPassword: 'Manager@123',
            developerPassword: 'Developer@123',
            csvFile: null
        });
        setImportResult(null);
        setOpenImportModal(true);
    };

    const handleImportSubmit = async () => {
        if (!importData.csvFile) {
            showError('Please select a CSV file to import');
            return;
        }

        if (!importData.adminPassword || !importData.managerPassword || !importData.developerPassword) {
            showError('Please provide passwords for all role types');
            return;
        }

        try {
            setProcessing(true);
            setImportResult(null);

            const formData = new FormData();
            formData.append('csvFile', importData.csvFile);
            formData.append('adminPassword', importData.adminPassword);
            formData.append('managerPassword', importData.managerPassword);
            formData.append('developerPassword', importData.developerPassword);

            console.log('FormData keys:', [...formData.keys()]);

            const response = await api.post('/users/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 200) {
                console.log('Import successful:', response.data);
                setImportResult(response.data);
                fetchUsers();
                showSuccess(`Successfully imported ${response.data.success} users`);

                if (response.data.success > 0 && response.data.errors.length === 0) {
                    setTimeout(() => {
                        setOpenImportModal(false);
                    }, 2000);
                }
            } else {
                throw new Error(`Server responded with status ${response.status}`);
            }
        } catch (err) {
            console.error('Import error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to import users';
            setError(errorMessage);
            showError(`Failed to import users: ${errorMessage}`);

            setImportResult({
                success: 0,
                total: 0,
                errors: [errorMessage]
            });
        } finally {
            setProcessing(false);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <AdminIcon />;
            case 'manager':
                return <ManagerIcon />;
            default:
                return <EngineerIcon />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin':
                return '#9c27b0';
            case 'manager':
                return '#2196f3';
            default:
                return '#757575';
        }
    };

    // Paginate users
    const paginatedUsers = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (loading) {
        return (
            <Box sx={{ p: 3, color: 'white' }}>
                <Skeleton variant="rectangular" height={400} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: '100%', bgcolor: '#161616', minHeight: '100vh' }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
            }}>
                <Typography variant="h4" component="h1" sx={{ color: 'white', fontSize: '2.5rem', fontWeight: 400 }}>
                    Member Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={handleImportClick}
                    sx={{
                        borderRadius: 2,
                        bgcolor: '#2196f3',
                        px: 3,
                        py: 1
                    }}
                >
                    Import Users
                </Button>
            </Box>

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
                        placeholder="Search members by name, email, or role..."
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
                    {filteredUsers.length} members found
                </Typography>
            </Box>

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
                            >
                                <TableSortLabel
                                    active={orderBy === 'name'}
                                    direction={orderBy === 'name' ? order : 'asc'}
                                    onClick={createSortHandler('name')}
                                    sx={{
                                        color: 'white',
                                        '&.MuiTableSortLabel-active': {
                                            color: '#90caf9',
                                        },
                                        '& .MuiTableSortLabel-icon': {
                                            color: 'white !important',
                                        },
                                    }}
                                >
                                    Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                sx={{
                                    color: 'white',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    py: 2
                                }}
                            >
                                <TableSortLabel
                                    active={orderBy === 'username'}
                                    direction={orderBy === 'username' ? order : 'asc'}
                                    onClick={createSortHandler('username')}
                                    sx={{
                                        color: 'white',
                                        '&.MuiTableSortLabel-active': {
                                            color: '#90caf9',
                                        },
                                        '& .MuiTableSortLabel-icon': {
                                            color: 'white !important',
                                        },
                                    }}
                                >
                                    Username
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                sx={{
                                    color: 'white',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    py: 2
                                }}
                            >
                                <TableSortLabel
                                    active={orderBy === 'email'}
                                    direction={orderBy === 'email' ? order : 'asc'}
                                    onClick={createSortHandler('email')}
                                    sx={{
                                        color: 'white',
                                        '&.MuiTableSortLabel-active': {
                                            color: '#90caf9',
                                        },
                                        '& .MuiTableSortLabel-icon': {
                                            color: 'white !important',
                                        },
                                    }}
                                >
                                    Email
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                sx={{
                                    color: 'white',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    py: 2
                                }}
                            >
                                <TableSortLabel
                                    active={orderBy === 'role'}
                                    direction={orderBy === 'role' ? order : 'asc'}
                                    onClick={createSortHandler('role')}
                                    sx={{
                                        color: 'white',
                                        '&.MuiTableSortLabel-active': {
                                            color: '#90caf9',
                                        },
                                        '& .MuiTableSortLabel-icon': {
                                            color: 'white !important',
                                        },
                                    }}
                                >
                                    Role
                                </TableSortLabel>
                            </TableCell>
                            <TableCell
                                sx={{
                                    color: 'white',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    py: 2
                                }}
                            >
                                <TableSortLabel
                                    active={orderBy === 'createdAt'}
                                    direction={orderBy === 'createdAt' ? order : 'asc'}
                                    onClick={createSortHandler('createdAt')}
                                    sx={{
                                        color: 'white',
                                        '&.MuiTableSortLabel-active': {
                                            color: '#90caf9',
                                        },
                                        '& .MuiTableSortLabel-icon': {
                                            color: 'white !important',
                                        },
                                    }}
                                >
                                    Created At
                                </TableSortLabel>
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
                        {paginatedUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedUsers.map((user) => (
                                <TableRow
                                    key={user._id}
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                >
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        {user.firstName} {user.lastName}
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>{user.username}</TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>{user.email}</TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        <Chip
                                            icon={getRoleIcon(user.role)}
                                            label={user.role || 'developer'}
                                            sx={{
                                                bgcolor: `${getRoleColor(user.role)}20`,
                                                color: getRoleColor(user.role),
                                                borderRadius: '15px'
                                            }}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', py: 2 }}>
                                        {user.createdAt ? (
                                            new Date(user.createdAt).toLocaleDateString('en-US', {
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
                                            <Tooltip title="Change Role">
                                                <IconButton
                                                    onClick={() => handleEditClick(user)}
                                                    sx={{
                                                        color: '#2196f3',
                                                        '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.1)' }
                                                    }}
                                                    size="small"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete User">
                                                <IconButton
                                                    onClick={() => handleDeleteClick(user)}
                                                    sx={{
                                                        color: '#f44336',
                                                        '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' }
                                                    }}
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

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
                            {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredUsers.length)} of {filteredUsers.length}
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
                                disabled={page >= Math.ceil(filteredUsers.length / rowsPerPage) - 1}
                                sx={{
                                    color: page >= Math.ceil(filteredUsers.length / rowsPerPage) - 1
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

            <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="xs" fullWidth
                PaperProps={{
                    sx: { bgcolor: '#1e1e1e', color: 'white' }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    Change User Role
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Role</InputLabel>
                        <Select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            label="Role"
                            sx={{
                                color: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)'
                                }
                            }}
                        >
                            <MenuItem value="developer">Developer</MenuItem>
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Button
                        onClick={() => setOpenEditModal(false)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditSubmit}
                        variant="contained"
                        sx={{ bgcolor: '#2196f3' }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openDeleteModal}
                onClose={() => setOpenDeleteModal(false)}
                PaperProps={{
                    sx: { bgcolor: '#1e1e1e', color: 'white' }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    Delete User
                </DialogTitle>
                <DialogContent sx={{ pt: 2, pb: 2 }}>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Button
                        onClick={() => setOpenDeleteModal(false)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteSubmit}
                        variant="contained"
                        sx={{ bgcolor: '#f44336' }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openImportModal}
                onClose={() => !processing && setOpenImportModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: '#1e1e1e', color: 'white' }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    Import Users from CSV
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
                        Upload a CSV file with user data. The file should have headers: firstName, lastName, email, username, role
                    </Typography>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <input
                            accept=".csv"
                            type="file"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="csv-file-input"
                        />
                        <label htmlFor="csv-file-input">
                            <Button
                                variant="outlined"
                                component="span"
                                startIcon={<UploadIcon />}
                                fullWidth
                                sx={{
                                    color: 'white',
                                    borderColor: 'rgba(255, 255, 255, 0.23)',
                                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255, 255, 255, 0.05)' }
                                }}
                            >
                                {importData.csvFile ? importData.csvFile.name : 'Choose CSV File'}
                            </Button>
                        </label>
                    </FormControl>

                    <Typography variant="body2" sx={{ mt: 2, mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                        Default Passwords for Imported Users
                    </Typography>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            name="adminPassword"
                            label="Admin Password"
                            value={importData.adminPassword}
                            onChange={handleImportInputChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{
                                sx: { color: 'rgba(255, 255, 255, 0.7)' }
                            }}
                            InputProps={{
                                sx: {
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.23)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)'
                                    }
                                }
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            name="managerPassword"
                            label="Manager Password"
                            value={importData.managerPassword}
                            onChange={handleImportInputChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{
                                sx: { color: 'rgba(255, 255, 255, 0.7)' }
                            }}
                            InputProps={{
                                sx: {
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.23)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)'
                                    }
                                }
                            }}
                        />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <TextField
                            name="developerPassword"
                            label="Developer Password"
                            value={importData.developerPassword}
                            onChange={handleImportInputChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{
                                sx: { color: 'rgba(255, 255, 255, 0.7)' }
                            }}
                            InputProps={{
                                sx: {
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.23)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)'
                                    }
                                }
                            }}
                        />
                    </FormControl>

                    {importResult && (
                        <Box sx={{ mb: 2, mt: 3 }}>
                            <Alert
                                severity={importResult.errors.length === 0 ? "success" : "warning"}
                                sx={{ bgcolor: importResult.errors.length === 0 ? 'rgba(46, 125, 50, 0.1)' : 'rgba(237, 108, 2, 0.1)', color: importResult.errors.length === 0 ? '#81c784' : '#ffb74d' }}
                            >
                                {importResult.success} of {importResult.total} users imported successfully
                            </Alert>

                            {importResult.errors.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" sx={{ color: '#f44336', mb: 1 }}>
                                        Failed to import {importResult.errors.length} users:
                                    </Typography>
                                    <ul style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0, paddingLeft: '1.5rem' }}>
                                        {importResult.errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Button
                        onClick={() => setOpenImportModal(false)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImportSubmit}
                        variant="contained"
                        sx={{ bgcolor: '#4caf50' }}
                        disabled={!importData.csvFile || processing}
                    >
                        {processing ? 'Importing...' : 'Import Users'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MemberList; 