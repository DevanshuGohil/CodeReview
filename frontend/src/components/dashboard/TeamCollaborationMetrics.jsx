import React, { useState, useEffect } from 'react';
import {
    Card, CardContent, Typography, Box, Divider,
    CircularProgress, Alert, ButtonGroup, Button,
    List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, Sector } from 'recharts';
import axios from 'axios';
import TokenManager from '../../utils/tokenManager';
import { formatDistanceToNow } from 'date-fns';

const TeamCollaborationMetrics = ({ team, timeframeFilter }) => {
    const theme = useTheme();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState(timeframeFilter || 'month');
    const [activePieIndex, setActivePieIndex] = useState(0);

    const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.info.main,
        theme.palette.warning.main
    ];

    useEffect(() => {
        const fetchMetrics = async () => {
            setLoading(true);
            setError(null);

            try {
                if (!team || !team._id) {
                    throw new Error('No team selected');
                }

                // Using mock data instead of API call
                setTimeout(() => {
                    const mockMetrics = {
                        teamStats: {
                            collaborationScore: 78,
                            totalReviews: 42,
                            avgReviewsPerMember: 4.2,
                            approvalRate: 85
                        },
                        memberStats: [
                            { username: 'john_doe', approvals: 12, rejections: 3, totalReviews: 15, approvalRate: 80, avgResponseTimeHours: 4 },
                            { username: 'jane_smith', approvals: 9, rejections: 1, totalReviews: 10, approvalRate: 90, avgResponseTimeHours: 3 },
                            { username: 'alex_wilson', approvals: 7, rejections: 2, totalReviews: 9, approvalRate: 78, avgResponseTimeHours: 5 },
                            { username: 'sarah_adams', approvals: 6, rejections: 2, totalReviews: 8, approvalRate: 75, avgResponseTimeHours: 6 }
                        ],
                        reviewDistribution: 'Balanced',
                        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) // 30 days ago
                    };

                    setMetrics(mockMetrics);
                    setLoading(false);
                }, 1000);
            } catch (err) {
                console.error('Error fetching team collaboration metrics:', err);
                setError(err.message || 'Failed to load team metrics');
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [team, timeframe]);

    const handleTimeframeChange = (newTimeframe) => {
        setTimeframe(newTimeframe);
    };

    const onPieEnter = (_, index) => {
        setActivePieIndex(index);
    };

    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

        return (
            <g>
                <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={theme.palette.text.primary} style={{ fontWeight: 'bold' }}>
                    {payload.name}
                </text>
                <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill={theme.palette.text.primary}>
                    {value} ({(percent * 100).toFixed(0)}%)
                </text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 5}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
            </g>
        );
    };

    // Prepare data for review distribution chart
    const prepareReviewData = (memberStats) => {
        if (!memberStats || memberStats.length === 0) return [];

        return memberStats.map((member, idx) => ({
            name: member.username,
            approvals: member.approvals,
            rejections: member.rejections,
            color: colors[idx % colors.length]
        }));
    };

    // Prepare data for review distribution pie chart
    const prepareReviewPieData = (memberStats) => {
        if (!memberStats || memberStats.length === 0) return [];

        return memberStats
            .filter(member => member.totalReviews > 0)
            .map(member => ({
                name: member.username,
                value: member.totalReviews
            }));
    };

    if (loading) {
        return (
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <CardContent>
                    <CircularProgress size={40} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading team collaboration metrics...
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card sx={{ height: '100%', width: '100%' }}>
                <CardContent>
                    <Alert severity="error">
                        {error}
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (!metrics) {
        return (
            <Card sx={{ height: '100%', width: '100%' }}>
                <CardContent>
                    <Alert severity="info">
                        Select a team to view collaboration metrics
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    const { teamStats, memberStats, reviewDistribution, startDate } = metrics;
    const reviewData = prepareReviewData(memberStats);
    const reviewPieData = prepareReviewPieData(memberStats);

    return (
        <Card sx={{ height: '100%', overflow: 'auto', width: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="div">
                        Team Collaboration Metrics
                    </Typography>
                    <ButtonGroup size="small" variant="outlined">
                        <Button
                            onClick={() => handleTimeframeChange('week')}
                            variant={timeframe === 'week' ? 'contained' : 'outlined'}
                        >
                            Week
                        </Button>
                        <Button
                            onClick={() => handleTimeframeChange('month')}
                            variant={timeframe === 'month' ? 'contained' : 'outlined'}
                        >
                            Month
                        </Button>
                        <Button
                            onClick={() => handleTimeframeChange('year')}
                            variant={timeframe === 'year' ? 'contained' : 'outlined'}
                        >
                            Year
                        </Button>
                    </ButtonGroup>
                </Box>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Data since {formatDistanceToNow(new Date(startDate), { addSuffix: true })}
                </Typography>

                {/* Team collaboration score */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
                    <Box
                        sx={{
                            position: 'relative',
                            display: 'inline-flex',
                            mx: 2
                        }}
                    >
                        <CircularProgress
                            variant="determinate"
                            value={teamStats.collaborationScore}
                            size={80}
                            thickness={5}
                            sx={{
                                color: theme.palette.primary.main,
                                circle: {
                                    strokeLinecap: 'round',
                                }
                            }}
                        />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography variant="h4" component="div" color="text.primary">
                                {teamStats.collaborationScore}
                            </Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="h6">Collaboration Score</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Based on review distribution, volume, and responsiveness
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Team stats summary */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography variant="h6">{teamStats.totalReviews}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Reviews</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography variant="h6">{teamStats.avgReviewsPerMember.toFixed(1)}</Typography>
                        <Typography variant="body2" color="text.secondary">Avg per Member</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography variant="h6">{teamStats.approvalRate}%</Typography>
                        <Typography variant="body2" color="text.secondary">Approval Rate</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography variant="h6">{reviewDistribution}</Typography>
                        <Typography variant="body2" color="text.secondary">Distribution</Typography>
                    </Box>
                </Box>

                {/* Review Distribution Chart */}
                {reviewData.length > 0 ? (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>Review Distribution</Typography>
                        <Box sx={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={reviewData}
                                    margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="approvals" name="Approvals" stackId="a" fill={theme.palette.success.main} />
                                    <Bar dataKey="rejections" name="Change Requests" stackId="a" fill={theme.palette.warning.main} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Box>
                ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        No review data available in this timeframe
                    </Alert>
                )}

                {/* Team Member Stats */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>Top Contributors</Typography>
                    <List>
                        {memberStats.slice(0, 5).map((member) => (
                            <ListItem
                                key={member.userId}
                                divider
                                secondaryAction={
                                    <Chip
                                        label={`${member.totalReviews} reviews`}
                                        size="small"
                                        color={member.totalReviews > teamStats.avgReviewsPerMember ? "primary" : "default"}
                                    />
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar
                                        src={member.avatar}
                                        alt={member.username}
                                    >
                                        {member.username.charAt(0).toUpperCase()}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={member.username}
                                    secondary={`${member.approvalRate || 0}% approval rate · ${member.avgResponseTimeHours || 0}h avg response`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>

                {/* Reviewer Share Pie Chart */}
                {reviewPieData.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>Review Share</Typography>
                        <Box sx={{ height: 400, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <Pie
                                        activeIndex={activePieIndex}
                                        activeShape={renderActiveShape}
                                        data={reviewPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={130}
                                        dataKey="value"
                                        onMouseEnter={onPieEnter}
                                        paddingAngle={2}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        labelLine={{ stroke: theme.palette.text.primary, strokeWidth: 1 }}
                                    >
                                        {reviewPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} reviews`, name]} />
                                    <Legend
                                        verticalAlign="bottom"
                                        align="center"
                                        layout="horizontal"
                                        formatter={(value, entry) => (
                                            <span style={{ color: theme.palette.mode === 'dark' ? '#fff' : '#000', fontSize: '0.9rem' }}>
                                                {value}
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default TeamCollaborationMetrics; 