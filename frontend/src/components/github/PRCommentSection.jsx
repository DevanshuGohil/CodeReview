import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../axiosConfig';
import { useSocket } from '../../context/SocketContext';
import {
    Box,
    Typography,
    Paper,
    Divider,
    TextField,
    Button,
    CircularProgress,
    Alert,
    IconButton,
    Stack
} from '@mui/material';
import {
    Send as SendIcon,
    Cancel as CancelIcon,
    Comment as CommentIcon
} from '@mui/icons-material';
import PRComment from './PRComment';

const PRCommentSection = ({ projectId, pullRequest }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const commentInputRef = useRef(null);
    const commentRefs = useRef({});

    const { socket } = useSocket();

    const pullNumber = pullRequest?.number;

    // Define fetchComments as a useCallback function
    const fetchComments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/projects/${projectId}/pulls/${pullNumber}/comments`);
            // Filter out replies to show only top-level comments
            const topLevelComments = response.data.filter(comment => !comment.parentComment);
            setComments(topLevelComments);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError(err.response?.data?.message || err.message);
            setLoading(false);
        }
    }, [projectId, pullNumber]);

    // Create a function at the component level to refresh all comments
    const refreshAllComments = useCallback(async () => {
        console.log("Refreshing all comments...");
        try {
            const response = await api.get(`/projects/${projectId}/pulls/${pullNumber}/comments`);
            // Filter out replies to show only top-level comments
            const topLevelComments = response.data.filter(comment => !comment.parentComment);
            setComments(topLevelComments);
        } catch (err) {
            console.error('Error refreshing comments:', err);
        }
    }, [projectId, pullNumber]);

    // Prepare refs for each comment component
    useEffect(() => {
        comments.forEach(comment => {
            if (!commentRefs.current[comment._id]) {
                commentRefs.current[comment._id] = React.createRef();
            }
        });
    }, [comments]);

    // Fetch comments when component mounts
    useEffect(() => {
        if (!projectId || !pullNumber) return;
        fetchComments();
    }, [projectId, pullNumber, fetchComments]);

    // Subscribe to real-time comment updates
    useEffect(() => {
        if (socket && projectId && pullNumber) {
            // Join the PR-specific room when component mounts or when socket reconnects
            socket.emit('join-pr', { projectId, pullNumber });
            console.log(`Joined PR room: ${projectId}/${pullNumber}`);

            // Set up listeners
            socket.on('connect', () => {
                socket.emit('join-pr', { projectId, pullNumber });
                console.log(`Reconnected to PR room: ${projectId}/${pullNumber}`);
            });

            socket.on('new-comment', (data) => {
                console.log('Received new comment event:', data);
                if (data.projectId === projectId && data.pullNumber === parseInt(pullNumber)) {
                    // Check if it's a reply to an existing comment
                    if (data.comment && data.comment.parentComment) {
                        console.log('New comment is a reply to:', data.comment.parentComment);

                        // Check if we have already handled this reply locally
                        const isTrackedReply = window._replyTracker &&
                            window._replyTracker[data.comment._id] &&
                            (Date.now() - window._replyTracker[data.comment._id].timestamp < 5000);

                        if (isTrackedReply) {
                            console.log('Skipping already tracked reply:', data.comment._id);
                            return;
                        }

                        // Find the parent comment reference
                        const parentCommentRef = commentRefs.current[data.comment.parentComment];

                        if (parentCommentRef && parentCommentRef.current) {
                            console.log('Found parent comment ref, adding reply directly');
                            // Add reply directly to the parent comment
                            parentCommentRef.current.addReply(data.comment);
                        } else {
                            console.log('Parent comment ref not found, refreshing all comments');
                            fetchComments(); // Fall back to refreshing all
                        }
                    } else {
                        console.log('Top-level comment added, refreshing all comments');
                        fetchComments(); // Refresh for top-level comments
                    }
                }
            });

            // Clean up listeners on unmount
            return () => {
                socket.off('connect');
                socket.off('connect_error');
                socket.off('disconnect');
                socket.off('reconnect');
                socket.off('new-comment');

                // Leave the room when component unmounts
                socket.emit('leave-pr', { projectId, pullNumber });
                console.log(`Left PR room: ${projectId}/${pullNumber}`);
            };
        }
    }, [socket, projectId, pullNumber, fetchComments]);

    // Listen for local comment deletion events
    useEffect(() => {
        const handleLocalCommentDeleted = (e) => {
            const { commentId } = e.detail;

            // Remove the comment from our state immediately
            setComments(prevComments =>
                prevComments.filter(comment => comment._id !== commentId)
            );
        };

        // Add event listener
        window.addEventListener('comment-deleted-locally', handleLocalCommentDeleted);

        // Cleanup
        return () => {
            window.removeEventListener('comment-deleted-locally', handleLocalCommentDeleted);
        };
    }, []);

    // Submit a new comment
    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        try {
            setSubmitting(true);
            setError(null);

            const payload = {
                content: newComment,
                parentComment: replyTo
            };

            // Submit comment via API
            const response = await api.post(`/projects/${projectId}/pulls/${pullNumber}/comments`, payload);

            // If this was a reply to an existing comment
            if (replyTo) {
                // Track this reply to avoid duplicates from socket events
                if (!window._replyTracker) {
                    window._replyTracker = {};
                }
                window._replyTracker[response.data._id] = {
                    timestamp: Date.now(),
                    parentId: replyTo
                };

                // Find the parent comment reference
                const parentCommentRef = commentRefs.current[replyTo];

                if (parentCommentRef && parentCommentRef.current) {
                    // Use the ref method to add the reply directly to the parent comment
                    parentCommentRef.current.addReply(response.data);

                    // Dispatch an event to notify other components about the new reply
                    const event = new CustomEvent('comment-reply-added', {
                        detail: {
                            reply: response.data,
                            parentId: replyTo
                        }
                    });
                    window.dispatchEvent(event);
                }

                // Clear reply state
                setReplyTo(null);
            } else {
                // For top-level comments, refresh the comment list
                await refreshAllComments();
            }

            // Clear input
            setNewComment('');
            setSubmitting(false);
        } catch (err) {
            console.error('Error submitting comment:', err);
            setError(err.response?.data?.message || err.message);
            setSubmitting(false);
        }
    };

    // Start replying to a comment
    const handleReply = (commentId) => {
        setReplyTo(commentId);
        // Focus the comment input
        if (commentInputRef.current) {
            commentInputRef.current.focus();
        }
    };

    // Cancel replying
    const handleCancelReply = () => {
        setReplyTo(null);
    };

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
                    <CommentIcon color="primary" />
                    Comments
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Comment Input */}
            <Box sx={{ mb: 4 }}>
                <TextField
                    inputRef={commentInputRef}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={submitting}
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
                    sx={{ mb: 1 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {replyTo && (
                        <Typography color="primary" variant="body2">
                            Replying to comment
                            <IconButton size="small" onClick={handleCancelReply}>
                                <CancelIcon fontSize="small" />
                            </IconButton>
                        </Typography>
                    )}
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            endIcon={<SendIcon />}
                            onClick={handleSubmitComment}
                            disabled={submitting || !newComment.trim()}
                        >
                            {submitting ? 'Submitting...' : 'Comment'}
                        </Button>
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Comments List */}
            <Box>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : comments.length === 0 ? (
                    <Typography color="rgba(255,255,255,0.7)" sx={{ textAlign: 'center', py: 4 }}>
                        No comments yet. Be the first to comment!
                    </Typography>
                ) : (
                    <Stack spacing={2}>
                        {comments.map(comment => (
                            <PRComment
                                key={comment._id}
                                ref={commentRefs.current[comment._id]}
                                comment={comment}
                                projectId={projectId}
                                pullNumber={pullNumber}
                                onReply={() => handleReply(comment._id)}
                            />
                        ))}
                    </Stack>
                )}
            </Box>
        </Paper>
    );
};

export default PRCommentSection; 