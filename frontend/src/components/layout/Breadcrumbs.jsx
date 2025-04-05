import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Box, Link as MuiLink, Chip } from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Group as TeamIcon,
    Category as ProjectIcon,
    GitHub as GitHubIcon,
    MergeType as PRIcon,
    Code as CodeIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../axiosConfig';

const Breadcrumbs = () => {
    const location = useLocation();
    const params = useParams();
    const { currentUser } = useAuth();
    const [projectName, setProjectName] = useState('');
    const [teamName, setTeamName] = useState('');

    // Extract current entity IDs from the URL
    const projectId = params.id || params.projectId;
    const teamId = params.id && location.pathname.includes('/teams/') ? params.id : null;

    // Fetch project or team details if on a detail page
    useEffect(() => {
        // Reset state when route changes
        setProjectName('');
        setTeamName('');

        const fetchEntityDetails = async () => {
            try {
                // Fetch project details if on a project page
                if (projectId && (location.pathname.includes('/projects/') && !location.pathname.includes('/new'))) {
                    const response = await api.get(`/projects/${projectId}`);
                    if (response.data && response.data.name) {
                        setProjectName(response.data.name);
                    }
                }

                // Fetch team details if on a team page
                if (teamId && location.pathname.includes('/teams/')) {
                    const response = await api.get(`/teams/${teamId}`);
                    if (response.data && response.data.name) {
                        setTeamName(response.data.name);
                    }
                }
            } catch (error) {
                console.error('Error fetching entity details for breadcrumbs:', error);
            }
        };

        fetchEntityDetails();
    }, [location.pathname, projectId, teamId]);

    // Generate breadcrumbs based on current path
    const breadcrumbs = useMemo(() => {
        const pathParts = location.pathname.split('/').filter(Boolean);
        if (pathParts.length === 0) return [];

        const breadcrumbItems = [];

        // Always add home/dashboard as first item
        breadcrumbItems.push({
            label: 'Dashboard',
            icon: <DashboardIcon fontSize="small" sx={{ mr: 0.5 }} />,
            href: '/dashboard'
        });

        // Add breadcrumb items based on path
        let currentPath = '';

        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            currentPath += `/${part}`;

            // Skip dashboard since it's already added
            if (part === 'dashboard') continue;

            // Handle different sections
            switch (part) {
                case 'teams':
                    if (i === pathParts.length - 1) {
                        // Teams list
                        breadcrumbItems.push({
                            label: 'Teams',
                            icon: <TeamIcon fontSize="small" sx={{ mr: 0.5 }} />,
                            href: '/teams'
                        });
                    } else if (pathParts[i + 1] === 'new') {
                        // New team form
                        breadcrumbItems.push({
                            label: 'Teams',
                            icon: <TeamIcon fontSize="small" sx={{ mr: 0.5 }} />,
                            href: '/teams'
                        });
                        breadcrumbItems.push({
                            label: 'New Team',
                            href: '/teams/new'
                        });
                        i++; // Skip the next part since we've handled it
                    } else {
                        // Team detail
                        breadcrumbItems.push({
                            label: 'Teams',
                            icon: <TeamIcon fontSize="small" sx={{ mr: 0.5 }} />,
                            href: '/teams'
                        });
                        breadcrumbItems.push({
                            label: teamName || 'Team Details',
                            href: currentPath,
                            entityId: pathParts[i + 1]
                        });
                        i++; // Skip the ID
                    }
                    break;

                case 'projects':
                    if (i === pathParts.length - 1) {
                        // Projects list
                        breadcrumbItems.push({
                            label: 'Projects',
                            icon: <ProjectIcon fontSize="small" sx={{ mr: 0.5 }} />,
                            href: '/projects'
                        });
                    } else if (pathParts[i + 1] === 'new') {
                        // New project form
                        breadcrumbItems.push({
                            label: 'Projects',
                            icon: <ProjectIcon fontSize="small" sx={{ mr: 0.5 }} />,
                            href: '/projects'
                        });
                        breadcrumbItems.push({
                            label: 'New Project',
                            href: '/projects/new'
                        });
                        i++; // Skip the next part since we've handled it
                    } else {
                        // Project detail or sub-pages
                        breadcrumbItems.push({
                            label: 'Projects',
                            icon: <ProjectIcon fontSize="small" sx={{ mr: 0.5 }} />,
                            href: '/projects'
                        });
                        breadcrumbItems.push({
                            label: projectName || 'Project Details',
                            href: `/projects/${pathParts[i + 1]}`,
                            entityId: pathParts[i + 1]
                        });

                        // Handle project sub-pages
                        if (i + 2 < pathParts.length) {
                            const subPage = pathParts[i + 2];
                            i += 2; // Skip the ID and subpage since we're handling them here

                            switch (subPage) {
                                case 'pulls':
                                    if (i + 1 < pathParts.length) {
                                        // Specific pull request
                                        breadcrumbItems.push({
                                            label: 'Pull Requests',
                                            icon: <PRIcon fontSize="small" sx={{ mr: 0.5 }} />,
                                            href: `/projects/${pathParts[i - 1]}/pulls`
                                        });
                                        breadcrumbItems.push({
                                            label: `PR #${pathParts[i + 1]}`,
                                            href: `/projects/${pathParts[i - 1]}/pulls/${pathParts[i + 1]}`
                                        });
                                        i++; // Skip the PR number
                                    } else {
                                        // Pull requests list
                                        breadcrumbItems.push({
                                            label: 'Pull Requests',
                                            icon: <PRIcon fontSize="small" sx={{ mr: 0.5 }} />,
                                            href: currentPath
                                        });
                                    }
                                    break;

                                case 'repository':
                                    breadcrumbItems.push({
                                        label: 'Repository Files',
                                        icon: <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />,
                                        href: currentPath
                                    });
                                    break;

                                default:
                                    // Unknown subpage
                                    breadcrumbItems.push({
                                        label: subPage.charAt(0).toUpperCase() + subPage.slice(1),
                                        href: currentPath
                                    });
                            }
                        } else {
                            // Skip the ID since we've handled it in the project details
                            i++;
                        }
                    }
                    break;

                case 'profile':
                    breadcrumbItems.push({
                        label: 'Profile',
                        icon: <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />,
                        href: '/profile'
                    });
                    break;

                case 'admin':
                    breadcrumbItems.push({
                        label: 'Admin',
                        href: '/admin'
                    });
                    if (i + 1 < pathParts.length) {
                        const subPage = pathParts[i + 1];
                        breadcrumbItems.push({
                            label: subPage.charAt(0).toUpperCase() + subPage.slice(1),
                            href: `${currentPath}/${subPage}`
                        });
                        i++; // Skip the subpage
                    }
                    break;

                default:
                    // For any other page
                    breadcrumbItems.push({
                        label: part.charAt(0).toUpperCase() + part.slice(1),
                        href: currentPath
                    });
            }
        }

        return breadcrumbItems;
    }, [location.pathname, projectName, teamName]);

    // If the path is just '/' or '/dashboard', don't show breadcrumbs
    if (breadcrumbs.length <= 1 || location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    return (
        <Box
            sx={{
                py: 1.5,
                px: 3,
                bgcolor: 'rgba(10, 10, 10, 0.6)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center'
            }}
        >
            <MuiBreadcrumbs
                separator="›"
                aria-label="breadcrumb"
                sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    '& .MuiBreadcrumbs-separator': {
                        mx: 1,
                        color: 'rgba(255, 255, 255, 0.4)'
                    }
                }}
            >
                {breadcrumbs.map((breadcrumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return isLast ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }} key={index}>
                            {breadcrumb.icon}
                            <Typography
                                color="primary"
                                sx={{
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {breadcrumb.label}
                            </Typography>
                        </Box>
                    ) : (
                        <MuiLink
                            key={index}
                            component={Link}
                            to={breadcrumb.href}
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': {
                                    color: 'primary.main',
                                    textDecoration: 'underline'
                                }
                            }}
                        >
                            {breadcrumb.icon}
                            {breadcrumb.label}
                        </MuiLink>
                    );
                })}
            </MuiBreadcrumbs>
        </Box>
    );
};

export default Breadcrumbs; 