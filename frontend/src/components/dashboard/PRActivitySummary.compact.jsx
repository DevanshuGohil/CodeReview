import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Chip,
    Stack,
    Button,
    MenuItem,
    Select,
    FormControl,
    Alert,
    Tabs,
    Tab,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar
} from '@mui/material';
import {
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
    Timer as TimerIcon,
    Person as PersonIcon,
    Loop as RefreshIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// Mock data for the PR Activity Summary
const getMockSummary = (timeframe) => {
    const now = new Date();
    const days = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    const factor = days / 7; // Scaling factor based on timeframe

    return {
        timeframe,
        userStats: {
            totalReviews: Math.round(18 * factor),
            approvals: Math.round(14 * factor),
            rejections: Math.round(4 * factor),
            averageResponseTime: 6.5
        },
        teamStats: {
            totalReviews: Math.round(56 * factor),
            averageReviewTime: 9.2
        },
        recentActivity: [
            {
                type: 'approval',
                prNumber: 145,
                title: 'Add dashboard insights',
                project: 'Code Review App',
                timestamp: new Date(now - 1000 * 60 * 60 * 3)
            },
            {
                type: 'comment',
                prNumber: 142,
                title: 'Fix authentication bugs',
                project: 'Code Review App',
                timestamp: new Date(now - 1000 * 60 * 60 * 12)
            },
            {
                type: 'rejection',
                prNumber: 140,
                title: 'Refactor API endpoints',
                project: 'Code Review App',
                timestamp: new Date(now - 1000 * 60 * 60 * 24)
            }
        ],
        topContributors: [
            { username: 'sarah_dev', reviews: Math.round(24 * factor) },
            { username: 'john_smith', reviews: Math.round(18 * factor) },
            { username: 'alex_coder', reviews: Math.round(14 * factor) }
        ],
        averageReviewTime: 7.3
    };
};

const PRActivitySummary = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [timeframe, setTimeframe] = useState('week');
    const [tabValue, setTabValue] = useState(0);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            setError(null);

            // Simulate API call with mock data
            setTimeout(() => {
                setSummary(getMockSummary(timeframe));
                setLoading(false);
            }, 1000);
        } catch (err) {
            setError(err.message || 'Failed to load PR activity data');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [timeframe]);

    const handleRefresh = () => {
        fetchSummary();
    };

    const handleTimeframeChange = (event) => {
        setTimeframe(event.target.value);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const formatTimeframeLabel = (tf) => {
        switch (tf) {
            case 'day': return 'Last 24 Hours';
            case 'week': return 'Last 7 Days';
            case 'month': return 'Last 30 Days';
            default: return 'Last 7 Days';
        }
    };

    if (loading) {
        return (
            <Paper
                sx={{
                    p: 3,
                    borderRadius: 2,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 300
                }}
            >
                <CircularProgress />
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper
                sx={{
                    p: 3,
                    borderRadius: 2,
                    minHeight: 300
                }}
            >
                <Alert severity="error">{error}</Alert>
            </Paper>
        );
    }

    return (
        <Paper
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box
                sx={{
                    p: 2,
                    bgcolor: 'primary.dark',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Typography variant="h6">PR Activity Summary</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                            value={timeframe}
                            onChange={handleTimeframeChange}
                            sx={{
                                color: 'white',
                                '.MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.8)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'white'
                                },
                                '.MuiSvgIcon-root': {
                                    color: 'white'
                                }
                            }}
                        >
                            <MenuItem value="day">Last 24 Hours</MenuItem>
                            <MenuItem value="week">Last 7 Days</MenuItem>
                            <MenuItem value="month">Last 30 Days</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        size="small"
                        onClick={handleRefresh}
                        sx={{
                            minWidth: 0,
                            p: 1,
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.1)'
                            }
                        }}
                    >
                        <RefreshIcon />
                    </Button>
                </Box>
            </Box>

            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    {formatTimeframeLabel(timeframe)}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                bgcolor: 'background.default',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <ThumbUpIcon color="success" fontSize="small" />
                                <Typography variant="subtitle2" color="textSecondary">
                                    Approvals
                                </Typography>
                            </Stack>
                            <Typography variant="h4">
                                {summary?.userStats?.approvals || 0}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                bgcolor: 'background.default',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <PersonIcon color="primary" fontSize="small" />
                                <Typography variant="subtitle2" color="textSecondary">
                                    Your Total Reviews
                                </Typography>
                            </Stack>
                            <Typography variant="h4">
                                {summary?.userStats?.totalReviews || 0}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                bgcolor: 'background.default',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <TimerIcon color="info" fontSize="small" />
                                <Typography variant="subtitle2" color="textSecondary">
                                    Avg. Review Time
                                </Typography>
                            </Stack>
                            <Typography variant="h4">
                                {summary?.averageReviewTime || 0}h
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                bgcolor: 'background.default',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <ThumbDownIcon color="error" fontSize="small" />
                                <Typography variant="subtitle2" color="textSecondary">
                                    Rejections
                                </Typography>
                            </Stack>
                            <Typography variant="h4">
                                {summary?.userStats?.rejections || 0}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="PR activity tabs">
                        <Tab label="Recent Activity" />
                        <Tab label="Top Contributors" />
                    </Tabs>
                </Box>

                {tabValue === 0 && (
                    <Box>
                        <List disablePadding>
                            {summary?.recentActivity?.map((activity, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && <Divider />}
                                    <ListItem disablePadding sx={{ py: 1.5 }}>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle2">
                                                        PR #{activity.prNumber}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        label={activity.type}
                                                        color={
                                                            activity.type === 'approval' ? 'success' :
                                                                activity.type === 'rejection' ? 'error' : 'primary'
                                                        }
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary">
                                                    {activity.title} in {activity.project}
                                                </Typography>
                                            }
                                        />
                                        <Box sx={{ minWidth: 100, textAlign: 'right' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                            </Typography>
                                        </Box>
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box>
                        <List disablePadding>
                            {summary?.topContributors?.map((contributor, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && <Divider />}
                                    <ListItem disablePadding sx={{ py: 1.5 }}>
                                        <ListItemAvatar>
                                            <Avatar>
                                                {contributor.username.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={contributor.username}
                                            secondary={`${contributor.reviews} reviews`}
                                        />
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default PRActivitySummary; 