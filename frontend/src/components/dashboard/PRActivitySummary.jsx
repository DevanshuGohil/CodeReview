import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Stack,
    Button,
    MenuItem,
    Select,
    FormControl,
    Alert,
    Grid
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
        averageReviewTime: 7.3
    };
};

const PRActivitySummary = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [timeframe, setTimeframe] = useState('week');

    const fetchSummary = async () => {
        try {
            setLoading(true);
            setError(null);

            // Simulate API call with mock data
            setTimeout(() => {
                setSummary(getMockSummary(timeframe));
                setLoading(false);
            }, 500);
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
                    p: 2,
                    borderRadius: 2,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularProgress size={30} />
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper
                sx={{
                    p: 2,
                    borderRadius: 2,
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
            }}
        >
            <Box
                sx={{
                    p: 1.5,
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

            <Box sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    {formatTimeframeLabel(timeframe)}
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.5,
                                bgcolor: 'background.default',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <ThumbUpIcon color="success" fontSize="small" />
                                <Typography variant="body2" color="textSecondary">
                                    Approvals
                                </Typography>
                            </Stack>
                            <Typography variant="h5">
                                {summary?.userStats?.approvals || 0}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.5,
                                bgcolor: 'background.default',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <PersonIcon color="primary" fontSize="small" />
                                <Typography variant="body2" color="textSecondary">
                                    Reviews
                                </Typography>
                            </Stack>
                            <Typography variant="h5">
                                {summary?.userStats?.totalReviews || 0}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.5,
                                bgcolor: 'background.default',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <TimerIcon color="info" fontSize="small" />
                                <Typography variant="body2" color="textSecondary">
                                    Avg. Time
                                </Typography>
                            </Stack>
                            <Typography variant="h5">
                                {summary?.averageReviewTime || 0}h
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 1.5,
                                bgcolor: 'background.default',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <ThumbDownIcon color="error" fontSize="small" />
                                <Typography variant="body2" color="textSecondary">
                                    Rejections
                                </Typography>
                            </Stack>
                            <Typography variant="h5">
                                {summary?.userStats?.rejections || 0}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};

export default PRActivitySummary; 