import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Alert,
    IconButton,
    FormControl,
    Select,
    MenuItem
} from '@mui/material';
import {
    Comment as CommentIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
    Add as AddIcon,
    Group as GroupIcon,
    Person as PersonIcon,
    Refresh as RefreshIcon,
    Login as LoginIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// Example activity data (placeholder until API is ready)
const mockActivities = [
    {
        _id: '1',
        type: 'pr_approval',
        details: {
            prNumber: 123,
            title: 'Add user activity tracking',
            projectName: 'Code Review App'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
        _id: '2',
        type: 'pr_comment',
        details: {
            prNumber: 120,
            title: 'Fix dashboard layout issues',
            projectName: 'Code Review App'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8) // 8 hours ago
    },
    {
        _id: '3',
        type: 'login',
        details: {},
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    },
    {
        _id: '4',
        type: 'team_join',
        details: {
            teamName: 'Frontend Team'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
    },
    {
        _id: '5',
        type: 'project_creation',
        details: {
            projectName: 'New Dashboard Features'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
    }
];

const PersonalActivityFeed = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activities, setActivities] = useState([]);
    const [timeframe, setTimeframe] = useState('week');

    const fetchActivities = async () => {
        setLoading(true);
        setError(null);

        // Simulate network request
        setTimeout(() => {
            // Filter mock activities based on timeframe
            let filteredActivities = [...mockActivities];
            const now = new Date();

            if (timeframe !== 'all') {
                let cutoffDate = new Date();

                switch (timeframe) {
                    case 'day':
                        cutoffDate.setDate(now.getDate() - 1);
                        break;
                    case 'week':
                        cutoffDate.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        cutoffDate.setMonth(now.getMonth() - 1);
                        break;
                    default:
                        // No filtering for 'all'
                        break;
                }

                filteredActivities = mockActivities.filter(
                    activity => new Date(activity.createdAt) >= cutoffDate
                );
            }

            setActivities(filteredActivities);
            setLoading(false);
        }, 1000);
    };

    useEffect(() => {
        fetchActivities();
    }, [timeframe]);

    const handleRefresh = () => {
        fetchActivities();
    };

    const handleTimeframeChange = (event) => {
        setTimeframe(event.target.value);
    };

    // Helper function to convert activity type to display text
    const getActivityTypeText = (type) => {
        switch (type) {
            case 'pr_approval':
                return 'approved a pull request';
            case 'pr_rejection':
                return 'requested changes on a pull request';
            case 'pr_comment':
                return 'commented on a pull request';
            case 'project_creation':
                return 'created a new project';
            case 'team_join':
                return 'joined a team';
            case 'login':
                return 'logged in';
            default:
                return 'performed an action';
        }
    };

    // Helper function to get icon for activity type
    const getActivityIcon = (type) => {
        switch (type) {
            case 'pr_approval':
                return <ThumbUpIcon color="success" />;
            case 'pr_rejection':
                return <ThumbDownIcon color="error" />;
            case 'pr_comment':
                return <CommentIcon color="info" />;
            case 'project_creation':
                return <AddIcon color="primary" />;
            case 'team_join':
                return <GroupIcon color="secondary" />;
            case 'login':
                return <LoginIcon color="action" />;
            default:
                return <PersonIcon />;
        }
    };

    // Helper function to format activity details
    const formatActivityDetails = (activity) => {
        const { type, details } = activity;

        if (type === 'pr_approval' || type === 'pr_rejection' || type === 'pr_comment') {
            return `PR #${details.prNumber}: ${details.title || 'No title'} in ${details.projectName || 'a project'}`;
        }

        if (type === 'project_creation') {
            return `${details.projectName || 'Unnamed project'}`;
        }

        if (type === 'team_join') {
            return `${details.teamName || 'Unnamed team'}`;
        }

        return '';
    };

    return (
        <Paper sx={{ height: '100%', overflow: 'auto' }}>
            <Box
                sx={{
                    p: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h6">Your Activity</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                        <Select
                            value={timeframe}
                            onChange={handleTimeframeChange}
                            sx={{
                                color: 'white',
                                '.MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.8)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'white',
                                },
                                '.MuiSvgIcon-root': {
                                    color: 'white',
                                },
                            }}
                        >
                            <MenuItem value="day">Last 24 Hours</MenuItem>
                            <MenuItem value="week">Last 7 Days</MenuItem>
                            <MenuItem value="month">Last 30 Days</MenuItem>
                            <MenuItem value="all">All Time</MenuItem>
                        </Select>
                    </FormControl>
                    <IconButton
                        onClick={handleRefresh}
                        size="small"
                        sx={{ color: 'white' }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {error}
                    </Alert>
                ) : activities.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            No activities found in this timeframe
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {activities.map((activity, index) => (
                            <React.Fragment key={activity._id || index}>
                                {index > 0 && <Divider component="li" />}
                                <ListItem alignItems="flex-start">
                                    <ListItemIcon>{getActivityIcon(activity.type)}</ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body1">
                                                You {getActivityTypeText(activity.type)}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography component="span" variant="body2" color="text.primary">
                                                    {formatActivityDetails(activity)}
                                                </Typography>
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Box>
        </Paper>
    );
};

export default PersonalActivityFeed;
