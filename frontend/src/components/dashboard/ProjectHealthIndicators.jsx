import React, { useState, useEffect } from 'react';
import {
    Card, CardContent, Typography, Box, Divider,
    CircularProgress, Alert, ButtonGroup, Button,
    List, ListItem, ListItemText, ListItemIcon, Chip, Grid,
    Paper, MenuItem, Select, FormControl, InputLabel,
    Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
    CheckCircleOutline, WarningAmber, ErrorOutline,
    ExpandMore, Check, Close, TrendingUp, TrendingDown, TrendingFlat
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts';
import axios from 'axios';
import TokenManager from '../../utils/tokenManager';
import { formatDistanceToNow } from 'date-fns';

const ProjectHealthIndicators = ({ userProjects, timeframeFilter }) => {
    const theme = useTheme();
    const [selectedProject, setSelectedProject] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState(timeframeFilter || 'month');

    // Set initial project if userProjects is available
    useEffect(() => {
        if (userProjects && userProjects.length > 0 && !selectedProject) {
            setSelectedProject(userProjects[0]);
        }
    }, [userProjects, selectedProject]);

    // Fetch metrics when project or timeframe changes
    useEffect(() => {
        const fetchMetrics = async () => {
            if (!selectedProject || !selectedProject._id) return;

            setLoading(true);
            setError(null);

            try {
                // Mock data instead of API call
                setTimeout(() => {
                    const mockMetrics = {
                        projectId: selectedProject._id,
                        projectName: selectedProject.name,
                        timeframe,
                        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
                        healthScore: 82,
                        prMetrics: {
                            totalPRs: 48,
                            mergedPRs: 36,
                            openPRs: 8,
                            closedPRs: 4,
                            medianCycleTimeHours: 18.5,
                            prThroughput: 1.6,
                            sizeDistribution: {
                                small: 28,
                                medium: 15,
                                large: 4,
                                xlarge: 1
                            }
                        },
                        reviewMetrics: {
                            totalReviews: 72,
                            medianReviewTimeHours: 4.2,
                            approvalRate: 88.5,
                            approvedReviews: 64
                        },
                        insights: [
                            {
                                type: 'positive',
                                message: 'Project is in excellent health',
                                recommendation: 'Maintain current practices and share them with other teams'
                            },
                            {
                                type: 'positive',
                                message: 'Most PRs are small and focused',
                                recommendation: 'Small PRs help maintain review quality and speed'
                            },
                            {
                                type: 'warning',
                                message: 'PRs take more than a day to get first reviews',
                                recommendation: 'Consider adding automated initial reviews or set team expectations for review times'
                            }
                        ]
                    };

                    setMetrics(mockMetrics);
                    setLoading(false);
                }, 1000);
            } catch (err) {
                console.error('Error fetching project health metrics:', err);
                setError(err.message || 'Failed to load project metrics');
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [selectedProject, timeframe]);

    const handleProjectChange = (event) => {
        const projectId = event.target.value;
        const project = userProjects.find(p => p._id === projectId);
        setSelectedProject(project);
    };

    const handleTimeframeChange = (newTimeframe) => {
        setTimeframe(newTimeframe);
    };

    // Prepare data for PR size distribution chart
    const prepareSizeData = (sizeDistribution) => {
        if (!sizeDistribution) return [];

        return [
            { name: 'Small', value: sizeDistribution.small, fill: theme.palette.success.main },
            { name: 'Medium', value: sizeDistribution.medium, fill: theme.palette.info.main },
            { name: 'Large', value: sizeDistribution.large, fill: theme.palette.warning.main },
            { name: 'X-Large', value: sizeDistribution.xlarge, fill: theme.palette.error.main }
        ].filter(item => item.value > 0);
    };

    // Prepare data for PR status distribution chart
    const prepareStatusData = (prMetrics) => {
        if (!prMetrics) return [];

        return [
            { name: 'Open', value: prMetrics.openPRs, fill: theme.palette.info.main },
            { name: 'Merged', value: prMetrics.mergedPRs, fill: theme.palette.success.main },
            { name: 'Closed', value: prMetrics.closedPRs, fill: theme.palette.error.main }
        ].filter(item => item.value > 0);
    };

    const getInsightIcon = (type) => {
        switch (type) {
            case 'positive':
                return <CheckCircleOutline color="success" />;
            case 'warning':
                return <WarningAmber color="warning" />;
            case 'critical':
                return <ErrorOutline color="error" />;
            default:
                return <TrendingFlat color="info" />;
        }
    };

    if (!userProjects || userProjects.length === 0) {
        return (
            <Card sx={{ height: '100%' }}>
                <CardContent>
                    <Alert severity="info">
                        No projects available. Add a project to see health metrics.
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height: '100%', overflow: 'auto' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="div">
                        Project Health Indicators
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

                {/* Project Selection */}
                <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 3 }}>
                    <InputLabel id="project-select-label">Project</InputLabel>
                    <Select
                        labelId="project-select-label"
                        id="project-select"
                        value={selectedProject ? selectedProject._id : ''}
                        onChange={handleProjectChange}
                        label="Project"
                    >
                        {userProjects.map((project) => (
                            <MenuItem key={project._id} value={project._id}>
                                {project.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                            Loading project health metrics...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                ) : metrics ? (
                    <>
                        {metrics.startDate && (
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Data since {formatDistanceToNow(new Date(metrics.startDate), { addSuffix: true })}
                            </Typography>
                        )}

                        {/* Health Score */}
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
                                    value={metrics.healthScore}
                                    size={80}
                                    thickness={5}
                                    sx={{
                                        color: metrics.healthScore >= 80
                                            ? theme.palette.success.main
                                            : metrics.healthScore >= 50
                                                ? theme.palette.warning.main
                                                : theme.palette.error.main,
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
                                        {metrics.healthScore}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="h6">Project Health Score</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Based on PR flow, review efficiency, and code quality
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* PR Metrics Summary */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6} md={3}>
                                <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h5">{metrics.prMetrics.totalPRs}</Typography>
                                    <Typography variant="body2" color="text.secondary">Total PRs</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h5">{metrics.prMetrics.prThroughput.toFixed(2)}</Typography>
                                    <Typography variant="body2" color="text.secondary">PRs per Day</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h5">{metrics.prMetrics.medianCycleTimeHours}h</Typography>
                                    <Typography variant="body2" color="text.secondary">Median Cycle Time</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="h5">{metrics.reviewMetrics.medianReviewTimeHours}h</Typography>
                                    <Typography variant="body2" color="text.secondary">First Review Time</Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* PR Distribution Charts */}
                        <Grid spacing={2} sx={{ mb: 3 }}>
                            {/* PR Size Distribution */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom>PR Size Distribution</Typography>
                                <Box sx={{ height: 350, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                            <Pie
                                                data={prepareSizeData(metrics.prMetrics.sizeDistribution)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={120}
                                                paddingAngle={2}
                                                dataKey="value"
                                                nameKey="name"
                                                label={(entry) => `${entry.name}: ${entry.value}`}
                                                labelLine={{ stroke: theme.palette.text.primary, strokeWidth: 1 }}
                                            >
                                                {prepareSizeData(metrics.prMetrics.sizeDistribution).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value, name) => [`${value} PRs (${Math.round(value / metrics.prMetrics.totalPRs * 100)}%)`, name]} />
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
                            </Grid>

                            {/* PR Status Distribution */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom>PR Status Distribution</Typography>
                                <Box sx={{ height: 350, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                            <Pie
                                                data={prepareStatusData(metrics.prMetrics)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={120}
                                                paddingAngle={2}
                                                dataKey="value"
                                                nameKey="name"
                                                label={(entry) => `${entry.name}: ${entry.value}`}
                                                labelLine={{ stroke: theme.palette.text.primary, strokeWidth: 1 }}
                                            >
                                                {prepareStatusData(metrics.prMetrics).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value, name) => [`${value} PRs (${Math.round(value / metrics.prMetrics.totalPRs * 100)}%)`, name]} />
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
                            </Grid>
                        </Grid>

                        {/* AI Insights */}
                        <Typography variant="subtitle1" gutterBottom>Insights & Recommendations</Typography>
                        <List>
                            {metrics.insights.map((insight, index) => (
                                <ListItem
                                    key={index}
                                    alignItems="flex-start"
                                    sx={{
                                        mb: 1,
                                        p: 2,
                                        borderRadius: 1,
                                        backgroundColor:
                                            insight.type === 'positive' ? 'success.light' :
                                                insight.type === 'warning' ? 'warning.light' :
                                                    insight.type === 'critical' ? 'error.light' : 'info.light',
                                        '&:before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: 4,
                                            backgroundColor:
                                                insight.type === 'positive' ? 'success.main' :
                                                    insight.type === 'warning' ? 'warning.main' :
                                                        insight.type === 'critical' ? 'error.main' : 'info.main',
                                            borderTopLeftRadius: 4,
                                            borderBottomLeftRadius: 4,
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        {getInsightIcon(insight.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={insight.message}
                                        secondary={insight.recommendation}
                                        primaryTypographyProps={{ fontWeight: 'medium' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </>
                ) : (
                    <Alert severity="info" sx={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Select a project to view health metrics
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default ProjectHealthIndicators; 