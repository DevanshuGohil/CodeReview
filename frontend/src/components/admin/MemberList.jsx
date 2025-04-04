import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Alert,
    Skeleton,
    Box,
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
    CircularProgress,
    Snackbar
} from '@mui/material';
import {
    Person as PersonIcon,
    AdminPanelSettings as AdminIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Engineering as EngineerIcon,
    SupervisorAccount as ManagerIcon,
    Upload as UploadIcon,
    FileUpload as FileUploadIcon
} from '@mui/icons-material';
import api from '../../axiosConfig';

const MemberList = () => {
    const [users, setUsers] = useState([]);
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
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users');
            setUsers(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
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
            await api.put(`/users/${selectedUser._id}/role`, { role: formData.role });
            fetchUsers();
            setOpenEditModal(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user role');
        }
    };

    const handleDeleteSubmit = async () => {
        try {
            await api.delete(`/users/${selectedUser._id}`);
            fetchUsers();
            setOpenDeleteModal(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete user');
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
            setSnackbarMessage('Please select a CSV file to import');
            setSnackbarOpen(true);
            return;
        }

        if (!importData.adminPassword || !importData.managerPassword || !importData.developerPassword) {
            setSnackbarMessage('Please provide passwords for all role types');
            setSnackbarOpen(true);
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

            // Log the FormData keys for debugging
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
                setSnackbarMessage(`Successfully imported ${response.data.success} users`);
                setSnackbarOpen(true);

                // Close modal after successful import
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
            setSnackbarMessage(`Failed to import users: ${errorMessage}`);
            setSnackbarOpen(true);

            // Set empty import result with error information
            setImportResult({
                success: 0,
                total: 0,
                errors: [errorMessage]
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
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
                return 'secondary';
            case 'manager':
                return 'primary';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Skeleton variant="rectangular" height={400} />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
            <Paper
                elevation={2}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider'
                }}
            >
                <Box sx={{
                    p: 2,
                    bgcolor: 'primary.dark',
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h5" sx={{ color: 'primary.contrastText' }}>
                        Member Management
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<UploadIcon />}
                        onClick={handleImportClick}
                        sx={{ bgcolor: 'primary.light' }}
                    >
                        Import Users
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell>
                                        {user.firstName} {user.lastName}
                                    </TableCell>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getRoleIcon(user.role)}
                                            label={user.role || 'developer'}
                                            color={getRoleColor(user.role)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Tooltip title="Change Role">
                                                <IconButton
                                                    onClick={() => handleEditClick(user)}
                                                    color="primary"
                                                    size="small"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete User">
                                                <IconButton
                                                    onClick={() => handleDeleteClick(user)}
                                                    color="error"
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Edit User Modal */}
            <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Change User Role</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Role</InputLabel>
                        <Select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            label="Role"
                        >
                            <MenuItem value="developer">Developer</MenuItem>
                            <MenuItem value="manager">Manager</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
                    <Button onClick={handleEditSubmit} variant="contained" color="primary">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete User Modal */}
            <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteModal(false)}>Cancel</Button>
                    <Button onClick={handleDeleteSubmit} variant="contained" color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Import Users Modal */}
            <Dialog open={openImportModal} onClose={() => !processing && setOpenImportModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Import Users from CSV</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Upload a CSV file with user information. Each imported user will be created with a default password based on their role. Users will be prompted to change their password on first login.
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                CSV Format Requirements:
                            </Typography>
                            <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                                <li>File must be in CSV format with the correct headers</li>
                                <li>First row must contain these headers: <code>firstName,lastName,username,email,role</code></li>
                                <li>Role must be one of: <code>admin</code>, <code>manager</code>, or <code>developer</code></li>
                                <li>Username and email must be unique</li>
                                <li>All fields are required</li>
                            </ul>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                CSV Format Example:
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'background.default', fontFamily: 'monospace', fontSize: '0.85rem', overflowX: 'auto' }}>
                                firstName,lastName,username,email,role<br />
                                John,Doe,johndoe,john.doe@example.com,admin<br />
                                Jane,Smith,jsmith,jane.smith@example.com,manager<br />
                                Bob,Johnson,bjohnson,bob.johnson@example.com,developer
                            </Paper>
                            <Button
                                variant="text"
                                size="small"
                                sx={{ mt: 1 }}
                                component="a"
                                href="/sample_users.csv"
                                download="sample_users.csv"
                            >
                                Download Sample CSV
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="subtitle2">Default Passwords</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Set default passwords for each role. Users will be required to change these on first login.
                            </Typography>
                            <TextField
                                name="adminPassword"
                                label="Admin Password"
                                value={importData.adminPassword}
                                onChange={handleImportInputChange}
                                type="password"
                                fullWidth
                                margin="dense"
                                required
                                helperText="Suggested: Admin@123"
                            />
                            <TextField
                                name="managerPassword"
                                label="Manager Password"
                                value={importData.managerPassword}
                                onChange={handleImportInputChange}
                                type="password"
                                fullWidth
                                margin="dense"
                                required
                                helperText="Suggested: Manager@123"
                            />
                            <TextField
                                name="developerPassword"
                                label="Developer Password"
                                value={importData.developerPassword}
                                onChange={handleImportInputChange}
                                type="password"
                                fullWidth
                                margin="dense"
                                required
                                helperText="Suggested: Developer@123"
                            />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<FileUploadIcon />}
                                onClick={() => fileInputRef.current.click()}
                                disabled={processing}
                            >
                                Select CSV File
                            </Button>
                            {importData.csvFile && (
                                <Typography variant="body2">
                                    Selected: {importData.csvFile.name}
                                </Typography>
                            )}
                        </Box>

                        {importResult && (
                            <Alert severity={importResult.errors.length > 0 ? "warning" : "success"}>
                                Successfully imported {importResult.success} users.
                                {importResult.errors.length > 0 && (
                                    <>
                                        <Typography variant="body2" sx={{ mt: 1 }}>Errors ({importResult.errors.length}):</Typography>
                                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                                            {importResult.errors.slice(0, 5).map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                            {importResult.errors.length > 5 && <li>...and {importResult.errors.length - 5} more errors</li>}
                                        </ul>
                                    </>
                                )}
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenImportModal(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImportSubmit}
                        variant="contained"
                        color="primary"
                        disabled={processing || !importData.csvFile}
                        startIcon={processing ? <CircularProgress size={20} /> : null}
                    >
                        {processing ? 'Processing...' : 'Import Users'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={snackbarMessage}
            />
        </Container>
    );
};

export default MemberList; 