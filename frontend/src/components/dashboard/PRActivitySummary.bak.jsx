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
    Divider
} from '@mui/material';
import {
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
    Timer as TimerIcon,
    Person as PersonIcon,
    Loop as RefreshIcon
} from '@mui/icons-material';
import api from '../../axiosConfig';

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

            const response = await api.get(`/api/reviews/activity-summary?timeframe=${timeframe}`);
            setSummary(response.data);
            setLoading(false);
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
                                    Change Requests
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
                        <Tab label="Project Summary" />
                        <Tab label="Team Activity" />
                    </Tabs>
                </Box>

                {tabValue === 0 && (
                    <Box>
                        {summary?.projectSummary?.length > 0 ? (
                            <Stack spacing={2}>
                                {summary.projectSummary.map((project) => (
                                    <Paper
                                        key={project.projectId}
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            bgcolor: 'background.default',
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                        }}
                                    >
                                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                            {project.projectName}
                                        </Typography>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} sm={6}>
                                                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                                    <Chip
                                                        size="small"
                                                        label={`${project.approvals} Approvals`}
                                                        color="success"
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={`${project.rejections} Changes Requested`}
                                                        color="error"
                                                        variant="outlined"
                                                    />
                                                </Stack>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Approval Rate: <strong>{project.approvalRate}%</strong>
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    Total Reviews: {project.total}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                ))}
                            </Stack>
                        ) : (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <Typography color="textSecondary">
                                    No project activity found for this time period.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box>
                        {summary?.teamActivity?.length > 0 ? (
                            <Stack spacing={2}>
                                {summary.teamActivity.map((team) => (
                                    <Paper
                                        key={team.teamId}
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            bgcolor: 'background.default',
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                        }}
                                    >
                                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                            {team.teamName}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="textSecondary">
                                                Total Reviews: <strong>{team.totalReviews}</strong>
                                            </Typography>
                                            <Chip
                                                size="small"
                                                label={`${team.totalReviews} reviews`}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        ) : (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <Typography color="textSecondary">
                                    No team activity found for this time period.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default PRActivitySummary; 