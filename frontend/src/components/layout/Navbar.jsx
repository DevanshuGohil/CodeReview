// components/layout/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    AppBar,
    Box,
    Toolbar,
    IconButton,
    Typography,
    Menu,
    Container,
    Avatar,
    Button,
    Tooltip,
    MenuItem,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Group as GroupIcon,
    Code as CodeIcon,
    AdminPanelSettings as AdminIcon,
    AccountCircle,
    Logout as LogoutIcon,
    People as PeopleIcon
} from '@mui/icons-material';

const Navbar = () => {
    const { isAuthenticated, currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorElUser, setAnchorElUser] = useState(null);
    const [anchorElAdmin, setAnchorElAdmin] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setAnchorElUser(null);
        setMobileOpen(false);
        navigate('/login');
    };

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleOpenAdminMenu = (event) => {
        setAnchorElAdmin(event.currentTarget);
    };

    const handleCloseAdminMenu = () => {
        setAnchorElAdmin(null);
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleDrawerItemClick = (path) => {
        setMobileOpen(false);
        navigate(path);
    };

    const drawer = (
        <Box sx={{ width: 250 }}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ my: 2 }}>
                    CodeReview
                </Typography>
            </Box>
            <Divider />
            {isAuthenticated ? (
                <List>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleDrawerItemClick('/dashboard')}>
                            <ListItemIcon>
                                <DashboardIcon />
                            </ListItemIcon>
                            <ListItemText primary="Dashboard" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleDrawerItemClick('/projects')}>
                            <ListItemIcon>
                                <CodeIcon />
                            </ListItemIcon>
                            <ListItemText primary="Projects" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleDrawerItemClick('/teams')}>
                            <ListItemIcon>
                                <GroupIcon />
                            </ListItemIcon>
                            <ListItemText primary="Teams" />
                        </ListItemButton>
                    </ListItem>

                    {currentUser && currentUser.role === 'admin' && (
                        <>
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => handleDrawerItemClick('/admin/members')}>
                                    <ListItemIcon>
                                        <PeopleIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Members" />
                                </ListItemButton>
                            </ListItem>
                        </>
                    )}

                    <Divider sx={{ my: 1 }} />

                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleDrawerItemClick('/profile')}>
                            <ListItemIcon>
                                <AccountCircle />
                            </ListItemIcon>
                            <ListItemText primary="Profile" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon />
                            </ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItemButton>
                    </ListItem>
                </List>
            ) : (
                <List>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleDrawerItemClick('/login')}>
                            <ListItemIcon>
                                <AccountCircle />
                            </ListItemIcon>
                            <ListItemText primary="Login" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleDrawerItemClick('/register')}>
                            <ListItemIcon>
                                <AccountCircle />
                            </ListItemIcon>
                            <ListItemText primary="Register" />
                        </ListItemButton>
                    </ListItem>
                </List>
            )}
        </Box>
    );

    return (
        <AppBar position="static" sx={{ bgcolor: 'background.paper' }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    {/* Mobile menu icon */}
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Logo */}
                    <Typography
                        variant="h6"
                        noWrap
                        component={Link}
                        to="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontWeight: 700,
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        CodeReview
                    </Typography>

                    {/* Logo for mobile */}
                    <Typography
                        variant="h6"
                        noWrap
                        component={Link}
                        to="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'flex', md: 'none' },
                            flexGrow: 1,
                            fontWeight: 700,
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        CodeReview
                    </Typography>

                    {/* Menu items - desktop */}
                    {isAuthenticated && (
                        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                            <Button
                                component={Link}
                                to="/dashboard"
                                sx={{
                                    my: 2,
                                    color: 'text.primary',
                                    display: 'block',
                                    '&:hover': {
                                        color: 'primary.main'
                                    }
                                }}
                            >
                                Dashboard
                            </Button>
                            <Button
                                component={Link}
                                to="/projects"
                                sx={{
                                    my: 2,
                                    color: 'text.primary',
                                    display: 'block',
                                    '&:hover': {
                                        color: 'primary.main'
                                    }
                                }}
                            >
                                Projects
                            </Button>
                            <Button
                                component={Link}
                                to="/teams"
                                sx={{
                                    my: 2,
                                    color: 'text.primary',
                                    display: 'block',
                                    '&:hover': {
                                        color: 'primary.main'
                                    }
                                }}
                            >
                                Teams
                            </Button>
                            {currentUser?.role === 'admin' && (
                                <Button
                                    component={Link}
                                    to="/admin/members"
                                    sx={{
                                        my: 2,
                                        color: 'text.primary',
                                        display: 'block',
                                        '&:hover': {
                                            color: 'primary.main'
                                        }
                                    }}
                                >
                                    Members
                                </Button>
                            )}
                        </Box>
                    )}

                    {/* User menu */}
                    {isAuthenticated ? (
                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip title="Open settings">
                                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                    <Avatar alt={currentUser?.firstName || currentUser?.username}>
                                        {currentUser?.firstName ? currentUser.firstName.charAt(0) : currentUser?.username?.charAt(0)}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>
                            <Menu
                                sx={{ mt: '45px' }}
                                id="menu-appbar"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                <MenuItem
                                    onClick={() => {
                                        handleCloseUserMenu();
                                        navigate('/profile');
                                    }}
                                >
                                    <ListItemIcon>
                                        <AccountCircle fontSize="small" />
                                    </ListItemIcon>
                                    <Typography textAlign="center">Profile</Typography>
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon>
                                        <LogoutIcon fontSize="small" />
                                    </ListItemIcon>
                                    <Typography textAlign="center">Logout</Typography>
                                </MenuItem>
                            </Menu>
                        </Box>
                    ) : (
                        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                            <Button
                                component={Link}
                                to="/login"
                                color="inherit"
                            >
                                Login
                            </Button>
                            <Button
                                component={Link}
                                to="/register"
                                color="inherit"
                            >
                                Register
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </Container>

            {/* Mobile drawer */}
            <Drawer
                anchor="left"
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile
                }}
                sx={{
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
                }}
            >
                {drawer}
            </Drawer>
        </AppBar>
    );
};

export default Navbar;
