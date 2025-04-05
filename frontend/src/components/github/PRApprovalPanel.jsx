import React, { useState, useEffect, useCallback } from 'react';
import api from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import {
    Box,
    Typography,
    Button,
    Paper,
    Divider,
    Alert,
    CircularProgress,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Grid,
    IconButton
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
    Merge as MergeIcon,
    Group as GroupIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';

const PRApprovalPanel = ({ projectId, pullRequest }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [approvalStatus, setApprovalStatus] = useState(null);
    const [userReview, setUserReview] = useState(null);
    const [userTeams, setUserTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [comment, setComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [mergeLoading, setMergeLoading] = useState(false);
    const [mergeMessage, setMergeMessage] = useState('');
    const [reviews, setReviews] = useState([]);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [isLoadingTooLong, setIsLoadingTooLong] = useState(false);

    const { currentUser } = useAuth();

    // Function to fetch approval data - wrapped in useCallback to prevent infinite loops
    const fetchApprovalData = useCallback(async () => {
        try {
            if (!pullRequest || !projectId || !currentUser) return;

            // Don't use loading state in the function
            setLoading(true);
            setIsLoadingTooLong(false);

            // Set a timeout to show a message if loading takes too long
            const timeoutId = setTimeout(() => {
                if (loading) {
                    setIsLoadingTooLong(true);
                }
            }, 5000);

            const pullNumber = pullRequest.number;

            // Fetch in parallel: approval status, user review, and user's teams
            const [statusResponse, userReviewResponse, reviewsResponse, teamsResponse, projectResponse] = await Promise.all([
                api.get(`/projects/${projectId}/pulls/${pullNumber}/status`),
                api.get(`/projects/${projectId}/pulls/${pullNumber}/reviews/user`),
                api.get(`/projects/${projectId}/pulls/${pullNumber}/reviews`),
                api.get('/teams'),
                api.get(`/projects/${projectId}`)
            ]);

            // Clear the timeout since loading finished
            clearTimeout(timeoutId);
            setApprovalStatus(statusResponse.data);
            setUserReview(userReviewResponse.data);
            setReviews(reviewsResponse.data);

            // Get project teams
            const projectTeams = projectResponse.data.teams.map(t => t.team._id);

            // Filter teams the user belongs to that are also assigned to the project
            const filteredTeams = teamsResponse.data.filter(team =>
                team.members.some(member => member.user._id === currentUser._id) &&
                projectTeams.includes(team._id)
            );

            setUserTeams(filteredTeams);

            // If user has an existing review, set the team and comment
            if (userReviewResponse.data.exists) {
                setSelectedTeam(userReviewResponse.data.review.team);
                setComment(userReviewResponse.data.review.comment || '');
            } else if (filteredTeams.length === 1) {
                // If user only belongs to one team, select it by default
                setSelectedTeam(filteredTeams[0]._id);
            }

            setLastRefresh(new Date());
            setLoading(false);
        } catch (err) {
            console.error('Error fetching PR approval data:', err);
            setError(err.response?.data?.message || err.message);
            setLoading(false);
        }
    }, [projectId, pullRequest, currentUser]); // Remove loading from dependencies

    // Set up one-time fetch and refresh interval
    useEffect(() => {
        // Do nothing if we don't have the required data
        if (!pullRequest || !projectId || !currentUser) return;

        let interval = null;

        try {
            // Initial fetch
            fetchApprovalData();

            // Set up refresh interval - refresh every 30 seconds
            // Only set up the interval if the PR is open
            if (pullRequest.state === 'open') {
                interval = setInterval(() => {
                    fetchApprovalData().catch(err => {
                        console.error('Error in auto-refresh:', err);
                    });
                }, 30000);
            }
        } catch (err) {
            console.error('Error setting up PR approval data:', err);
            setError('Failed to load approval data. Please try refreshing.');
            setLoading(false);
        }

        // Clean up interval on unmount
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [fetchApprovalData, pullRequest, projectId, currentUser]);

    // Add debug function to inspect approval data
    const logApprovalData = () => {
        if (approvalStatus) {
            console.log('Approval Status:', approvalStatus);
            console.log('Team Approvals:', approvalStatus.teamApprovals);
            approvalStatus.teamApprovals.forEach((team, index) => {
                console.log(`Team ${index + 1}: ${team.teamName}`);
                console.log(`  - Approved: ${team.approved}`);
                console.log(`  - Approvers: ${team.approvers.length}`);
                team.approvers.forEach(approver => {
                    console.log(`    - ${approver.name}`);
                });
            });
        }
    };

    // Debug: Log approval data whenever it changes
    useEffect(() => {
        if (approvalStatus) {
            logApprovalData();
        }
    }, [approvalStatus]);

    // Handle submitting a review
    const handleSubmitReview = async (approved) => {
        if (!selectedTeam) {
            setError('Please select a team to review on behalf of');
            return;
        }

        try {
            setReviewLoading(true);
            setError(null);

            const pullNumber = pullRequest.number;

            await api.post(`/projects/${projectId}/pulls/${pullNumber}/reviews`, {
                approved,
                comment,
                teamId: selectedTeam
            });

            // Refetch approval status and user review
            const [statusResponse, userReviewResponse, reviewsResponse] = await Promise.all([
                api.get(`/projects/${projectId}/pulls/${pullNumber}/status`),
                api.get(`/projects/${projectId}/pulls/${pullNumber}/reviews/user`),
                api.get(`/projects/${projectId}/pulls/${pullNumber}/reviews`)
            ]);

            setApprovalStatus(statusResponse.data);
            setUserReview(userReviewResponse.data);
            setReviews(reviewsResponse.data);

            setReviewLoading(false);
        } catch (err) {
            console.error('Error submitting review:', err);
            setError(err.response?.data?.message || err.message);
            setReviewLoading(false);
        }
    };

    // Handle merging a PR
    const handleMergePR = async () => {
        try {
            setMergeLoading(true);
            setError(null);

            const pullNumber = pullRequest.number;

            const response = await api.post(`/projects/${projectId}/pulls/${pullNumber}/merge`, {
                commitMessage: mergeMessage || undefined
            });

            // Show success message or redirect
            window.alert(`Pull request #${pullNumber} successfully merged!`);
            window.location.reload();

            setMergeLoading(false);
        } catch (err) {
            console.error('Error merging PR:', err);
            setError(err.response?.data?.message || err.message);
            setMergeLoading(false);
        }
    };

    // Enhanced loading state handler - only show full loading on initial load
    if (loading && !approvalStatus) {
        return (
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    mb: 3,
                    bgcolor: 'rgba(18, 18, 18, 0.9)',
                    border: '1px solid rgba(255,255,255,0.12)'
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="white" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MergeIcon color="primary" />
                        Pull Request Approval Status
                    </Typography>

                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                            setError(null);
                            fetchApprovalData();
                        }}
                        startIcon={<RefreshIcon />}
                    >
                        Retry
                    </Button>
                </Box>

                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body1" sx={{ mt: 2, color: 'rgba(255,255,255,0.7)' }}>
                        Loading pull request approval status...
                    </Typography>

                    {isLoadingTooLong && (
                        <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.5)' }}>
                            This is taking longer than expected. The server might be busy.
                            <br />
                            You can try refreshing or come back later.
                        </Typography>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mt: 2, mx: 'auto', maxWidth: '80%' }}>
                            {error}
                        </Alert>
                    )}
                </Box>
            </Paper>
        );
    }

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 3,
                mb: 3,
                bgcolor: 'rgba(18, 18, 18, 0.9)',
                border: '1px solid rgba(255,255,255,0.12)'
            }}
        >
            <Typography variant="h6" color="white" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MergeIcon color="primary" />
                Pull Request Approval Status
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                        Last updated: {lastRefresh.toLocaleTimeString()}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={fetchApprovalData}
                        title="Refresh approval status"
                        sx={{ color: 'primary.main' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <CircularProgress size={16} color="primary" />
                        ) : (
                            <RefreshIcon fontSize="small" />
                        )}
                    </IconButton>
                </Box>
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Team Approval Status */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="white" gutterBottom>
                    Team Approvals
                </Typography>
                <Grid container spacing={2} sx={{ display: 'flex', alignItems: 'stretch' }}>
                    {approvalStatus?.teamApprovals.map((team) => (
                        <Grid item xs={12} lg={8} key={team.teamId} sx={{ display: 'flex' }}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    bgcolor: team.approved
                                        ? 'rgba(46, 125, 50, 0.1)'
                                        : 'rgba(211, 47, 47, 0.1)',
                                    border: '1px solid',
                                    borderColor: team.approved
                                        ? 'rgba(46, 125, 50, 0.5)'
                                        : 'rgba(211, 47, 47, 0.5)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {/* Status badge in the corner */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        bgcolor: team.approved ? 'success.main' : 'error.main',
                                        color: 'white',
                                        px: 1,
                                        py: 0.5,
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        borderBottomLeftRadius: 4
                                    }}
                                >
                                    {team.approved ? 'APPROVED' : 'PENDING'}
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <GroupIcon sx={{ mr: 1, color: team.approved ? 'success.main' : 'error.main' }} />
                                    <Typography variant="subtitle2" color="white">
                                        {team.teamName}
                                    </Typography>
                                </Box>

                                {team.approved ? (
                                    <Box>
                                        <Typography variant="body2" color="rgba(255,255,255,0.7)" fontSize="0.85rem">
                                            <strong>Approved by ({team.approvers.length}):</strong>
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, minHeight: '30px' }}>
                                            {team.approvers.map((approver, index) => (
                                                <Chip
                                                    key={approver.userId}
                                                    label={approver.name}
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                    sx={{
                                                        fontSize: '0.7rem',
                                                        height: '20px'
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                        <Typography variant="body2" color="rgba(255,255,255,0.7)" fontSize="0.8rem" sx={{ mt: 1 }}>
                                            ✓ This team has approved the pull request and is ready for merging.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box>
                                        <Typography variant="body2" color="rgba(255,255,255,0.7)" fontSize="0.85rem">
                                            <strong>Status:</strong>
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, minHeight: '30px' }}>
                                            <CancelIcon sx={{ color: 'error.main', mr: 1, fontSize: '1rem' }} />
                                            <Typography variant="body2" color="rgba(255,255,255,0.7)" fontSize="0.8rem">
                                                Waiting for approval from at least one team member
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <Alert
                    severity={approvalStatus?.canMerge ? "success" : "warning"}
                    sx={{
                        mt: 2,
                        bgcolor: approvalStatus?.canMerge ? 'rgba(46, 125, 50, 0.1)' : 'rgba(237, 108, 2, 0.1)',
                        border: '1px solid',
                        borderColor: approvalStatus?.canMerge ? 'rgba(46, 125, 50, 0.5)' : 'rgba(237, 108, 2, 0.5)',
                        '& .MuiAlert-icon': {
                            color: approvalStatus?.canMerge ? 'success.main' : 'warning.main'
                        }
                    }}
                    icon={approvalStatus?.canMerge ? <CheckCircleIcon /> : <CancelIcon />}
                >
                    <Typography variant="h6" color="white" sx={{ mb: 1 }}>
                        {approvalStatus?.canMerge
                            ? "Ready to Merge"
                            : `Approval Required (${approvalStatus?.teamApprovals.filter(t => t.approved).length}/${approvalStatus?.teamApprovals.length} teams)`}
                    </Typography>
                    <Typography variant="body1" color="white">
                        {approvalStatus?.message}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.7)' }}>
                        {approvalStatus?.canMerge
                            ? "All required approvals have been received. This PR can now be merged."
                            : "This PR requires at least one approval from each team assigned to the project before it can be merged."}
                    </Typography>

                    {!approvalStatus?.canMerge && approvalStatus?.teamApprovals.some(t => !t.approved) && (
                        <Box sx={{ mt: 1.5 }}>
                            <Typography variant="body2" color="white">
                                <strong>Pending approvals from:</strong>
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {approvalStatus?.teamApprovals
                                    .filter(t => !t.approved)
                                    .map(team => (
                                        <Chip
                                            key={team.teamId}
                                            label={team.teamName}
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                            sx={{ fontSize: '0.8rem' }}
                                        />
                                    ))
                                }
                            </Box>
                        </Box>
                    )}
                </Alert>

                {/* Debug info about user's available teams */}
                {process.env.NODE_ENV === 'development' && userTeams.length > 0 && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
                        <Typography variant="caption" color="rgba(255,255,255,0.5)">
                            <strong>Your teams available for review:</strong>{' '}
                            {userTeams.map(team => team.name).join(', ')}
                        </Typography>
                    </Box>
                )}
            </Box>

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* User Review Form */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="white" gutterBottom>
                    {userReview?.exists ? 'Edit Your Review' : 'Submit Your Review'}
                </Typography>

                {userTeams.length === 0 ? (
                    <Alert severity="info">
                        You are not a member of any team assigned to this project, or none of your teams are assigned to this project.
                    </Alert>
                ) : (
                    <>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="team-select-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                Review as Team Member
                            </InputLabel>
                            <Select
                                labelId="team-select-label"
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                label="Review as Team Member"
                                disabled={reviewLoading}
                                sx={{
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.23)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.5)'
                                    }
                                }}
                            >
                                <MenuItem value="">
                                    <em>Select a team</em>
                                </MenuItem>
                                {userTeams.map((team) => (
                                    <MenuItem key={team._id} value={team._id}>
                                        {team.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ mt: 0.5, ml: 1.5 }}>
                                Only showing teams you are a member of that are assigned to this project
                            </Typography>
                        </FormControl>

                        <TextField
                            label="Review Comment (Optional)"
                            multiline
                            rows={2}
                            fullWidth
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            disabled={reviewLoading}
                            sx={{ mb: 2 }}
                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                            InputProps={{
                                sx: {
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.23)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.5)'
                                    }
                                }
                            }}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<ThumbUpIcon />}
                                onClick={() => handleSubmitReview(true)}
                                disabled={reviewLoading || !selectedTeam}
                            >
                                {userReview?.exists && userReview.review.approved ? 'Update Approval' : 'Approve'}
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<ThumbDownIcon />}
                                onClick={() => handleSubmitReview(false)}
                                disabled={reviewLoading || !selectedTeam}
                            >
                                {userReview?.exists && !userReview.review.approved ? 'Update Rejection' : 'Reject'}
                            </Button>

                            {reviewLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
                        </Box>

                        {userReview?.exists && (
                            <Alert severity={userReview.review.approved ? "success" : "error"} sx={{ mt: 2 }}>
                                You have {userReview.review.approved ? 'approved' : 'rejected'} this pull request
                                as a member of {userTeams.find(t => t._id === userReview.review.team)?.name || 'your team'}.
                            </Alert>
                        )}
                    </>
                )}
            </Box>

            {/* Merge Option (only if approved and PR is still open) */}
            {approvalStatus?.canMerge && pullRequest.state === 'open' && (
                <>
                    <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />
                    <Box>
                        <Typography variant="subtitle1" color="white" gutterBottom>
                            Merge Pull Request
                        </Typography>

                        <TextField
                            label="Merge Commit Message (Optional)"
                            multiline
                            rows={2}
                            fullWidth
                            value={mergeMessage}
                            onChange={(e) => setMergeMessage(e.target.value)}
                            disabled={mergeLoading}
                            sx={{ mb: 2 }}
                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                            InputProps={{
                                sx: {
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.23)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.5)'
                                    }
                                }
                            }}
                        />

                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<MergeIcon />}
                            onClick={handleMergePR}
                            disabled={mergeLoading}
                        >
                            Merge Pull Request
                        </Button>

                        {mergeLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
                    </Box>
                </>
            )}

            {/* Review List */}
            {reviews.length > 0 && (
                <>
                    <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />
                    <Typography variant="subtitle1" color="white" gutterBottom>
                        All Reviews ({reviews.length})
                    </Typography>

                    {/* Team filter buttons */}
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {Array.from(new Set(reviews.map(review => review.team._id))).map(teamId => {
                            const team = reviews.find(r => r.team._id === teamId)?.team;
                            if (!team) return null;

                            return (
                                <Chip
                                    key={teamId}
                                    label={team.name}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ mb: 1 }}
                                    onClick={() => {
                                        // Filter feature could be added here in the future
                                    }}
                                />
                            );
                        })}
                    </Box>

                    <List sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1 }}>
                        {/* Group reviews by team */}
                        {Array.from(new Set(reviews.map(review => review.team._id))).map(teamId => {
                            const teamReviews = reviews.filter(review => review.team._id === teamId);
                            const teamName = teamReviews[0]?.team.name || 'Unknown Team';

                            return (
                                <Box key={teamId} sx={{ mb: 2 }}>
                                    <Typography
                                        variant="subtitle2"
                                        color="white"
                                        sx={{
                                            pl: 2,
                                            py: 1,
                                            bgcolor: 'rgba(25, 118, 210, 0.1)',
                                            borderTopLeftRadius: 4,
                                            borderTopRightRadius: 4,
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <GroupIcon fontSize="small" sx={{ mr: 1 }} />
                                        {teamName} Team Reviews
                                    </Typography>

                                    {teamReviews.map((review) => (
                                        <ListItem
                                            key={review._id}
                                            sx={{
                                                borderLeft: '4px solid',
                                                borderColor: review.approved ? 'success.main' : 'error.main',
                                                mb: 1,
                                                bgcolor: 'rgba(255,255,255,0.02)'
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={review.user.avatar}
                                                    alt={review.user.username}
                                                >
                                                    {review.user.firstName?.charAt(0) || review.user.username?.charAt(0)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography color="white">
                                                            {review.user.firstName} {review.user.lastName}
                                                        </Typography>
                                                        {review.approved ? (
                                                            <Chip
                                                                size="small"
                                                                label="Approved"
                                                                color="success"
                                                                icon={<CheckCircleIcon />}
                                                            />
                                                        ) : (
                                                            <Chip
                                                                size="small"
                                                                label="Rejected"
                                                                color="error"
                                                                icon={<CancelIcon />}
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="rgba(255,255,255,0.7)">
                                                            {review.comment || 'No comment provided'}
                                                        </Typography>
                                                        <Typography variant="caption" color="rgba(255,255,255,0.5)" display="block">
                                                            {new Date(review.updatedAt).toLocaleString()}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </Box>
                            );
                        })}
                    </List>
                </>
            )}
        </Paper>
    );
};

export default PRApprovalPanel;
