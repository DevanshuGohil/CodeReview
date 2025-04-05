import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import api from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import {
    Box,
    Typography,
    Paper,
    Avatar,
    IconButton,
    TextField,
    Button,
    Divider,
    Collapse,
    Stack,
    Tooltip,
    Chip
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Reply as ReplyIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Save as SaveIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const PRComment = forwardRef(({ comment, projectId, pullNumber, onReply }, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [showReplies, setShowReplies] = useState(false);
    const [replies, setReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [error, setError] = useState(null);
    const [hasReplies, setHasReplies] = useState(false);

    const { currentUser } = useAuth();
    const isOwner = currentUser && comment.user && currentUser._id === comment.user._id;

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        addReply: (reply) => {
            // Add the reply to our list if we're showing replies
            if (showReplies) {
                setReplies(prevReplies => [...prevReplies, reply]);
            } else {
                // If replies aren't shown, just update the flag and count
                setHasReplies(true);
                // Fetch the replies to update count
                const fetchReplyCount = async () => {
                    try {
                        const response = await api.get(`/comments/${comment._id}/replies`);
                        setReplies(response.data);
                    } catch (err) {
                        console.error('Error fetching replies count:', err);
                    }
                };
                fetchReplyCount();
            }
        }
    }));

    // Initialize edit content when starting to edit
    useEffect(() => {
        if (isEditing) {
            setEditContent(comment.content);
        }
    }, [isEditing, comment.content]);

    // Load replies when expanded
    useEffect(() => {
        if (showReplies) {
            loadReplies();
        }
    }, [showReplies]);

    // Load replies to check if there are any
    useEffect(() => {
        const checkReplies = async () => {
            try {
                const response = await api.get(`/comments/${comment._id}/replies`);
                setHasReplies(response.data.length > 0);
            } catch (err) {
                console.error('Error checking replies:', err);
            }
        };

        checkReplies();
    }, [comment._id]);

    // Listen for custom events for real-time updates to replies
    useEffect(() => {
        // Handler for when a reply is added to this comment
        const handleReplyAdded = (e) => {
            if (e.detail.parentId === comment._id) {
                console.log("Reply added event for comment:", comment._id);
                // Always refresh the replies to ensure we have the latest data
                loadReplies();
                // Also make sure the reply section is expanded so the user sees the new reply
                setShowReplies(true);
                setHasReplies(true);
            }
        };

        // Handler for when a reply is updated
        const handleReplyUpdated = (e) => {
            if (e.detail.parentId === comment._id) {
                console.log("Reply updated event for comment:", comment._id);
                loadReplies();
            }
        };

        // Handler for when a reply is deleted
        const handleReplyDeleted = (e) => {
            // Check if this is a reply to the current comment
            if (e.detail.parentId === comment._id) {
                console.log("Reply deleted event for specific comment:", comment._id);
                loadReplies();
            }
            // We can't know which parent this belongs to from the old type of event
            else if (!e.detail.parentId && showReplies) {
                console.log("Generic reply deleted event, checking if it affects comment:", comment._id);
                loadReplies();
            }
        };

        // Add event listeners
        window.addEventListener('comment-reply-added', handleReplyAdded);
        window.addEventListener('comment-reply-updated', handleReplyUpdated);
        window.addEventListener('comment-reply-deleted', handleReplyDeleted);

        console.log("Set up reply event listeners for comment:", comment._id);

        // Clean up
        return () => {
            window.removeEventListener('comment-reply-added', handleReplyAdded);
            window.removeEventListener('comment-reply-updated', handleReplyUpdated);
            window.removeEventListener('comment-reply-deleted', handleReplyDeleted);
            console.log("Removed reply event listeners for comment:", comment._id);
        };
    }, [comment._id]);

    // Load all replies
    const loadReplies = async () => {
        try {
            setLoadingReplies(true);
            const response = await api.get(`/comments/${comment._id}/replies`);
            setReplies(response.data);
            setHasReplies(response.data.length > 0);
            setLoadingReplies(false);
        } catch (err) {
            console.error('Error loading replies:', err);
            setError(err.response?.data?.message || err.message);
            setLoadingReplies(false);
        }
    };

    // Handle editing a comment
    const handleSaveEdit = async () => {
        if (!editContent.trim()) return;

        try {
            const response = await api.put(`/comments/${comment._id}`, {
                content: editContent
            });

            // Immediately update the local state with the edited content
            comment.content = editContent;
            comment.isEdited = true;

            // Force a re-render
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating comment:', err);
            setError(err.response?.data?.message || err.message);
        }
    };

    // Handle deleting a comment
    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            await api.delete(`/comments/${comment._id}`);

            // Handle parent-child relationship for this comment
            if (comment.parentComment) {
                // This is a reply - notify the parent comment
                const event = new CustomEvent('comment-reply-deleted', {
                    detail: {
                        replyId: comment._id,
                        parentId: comment.parentComment._id || comment.parentComment
                    }
                });
                window.dispatchEvent(event);
            } else {
                // This is a top-level comment - notify the comment list
                const event = new CustomEvent('comment-deleted-locally', {
                    detail: { commentId: comment._id }
                });
                window.dispatchEvent(event);
            }
        } catch (err) {
            console.error('Error deleting comment:', err);
            setError(err.response?.data?.message || err.message);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch (err) {
            console.error('Error formatting date:', err);
            return dateString;
        }
    };

    // Check for replies count when hasReplies changes
    useEffect(() => {
        if (hasReplies && replies.length === 0) {
            // If we know there are replies but don't have the count yet,
            // fetch just the count for the badge display
            const fetchReplyCount = async () => {
                try {
                    const response = await api.get(`/comments/${comment._id}/replies`);
                    setReplies(response.data); // Store the replies for badge display
                } catch (err) {
                    console.error('Error fetching replies count:', err);
                }
            };

            fetchReplyCount();
        }
    }, [hasReplies, comment._id, replies.length]);

    // Separate Reply component to handle individual replies
    const ReplyItem = ({ reply, parentId, onDelete }) => {
        const [isEditingReply, setIsEditingReply] = useState(false);
        const [editReplyContent, setEditReplyContent] = useState('');
        const [error, setError] = useState(null);

        const { currentUser } = useAuth();
        const isOwner = currentUser && reply.user && currentUser._id === reply.user._id;

        // Handle editing a reply
        const handleEditReply = () => {
            setEditReplyContent(reply.content);
            setIsEditingReply(true);
        };

        // Handle saving reply edits
        const handleSaveReplyEdit = async () => {
            if (!editReplyContent.trim()) return;

            try {
                await api.put(`/comments/${reply._id}`, {
                    content: editReplyContent
                });

                // Update the reply in local state
                reply.content = editReplyContent;
                reply.isEdited = true;

                // Force re-render
                setIsEditingReply(false);

                // Notify other components about the update
                const event = new CustomEvent('comment-reply-updated', {
                    detail: {
                        replyId: reply._id,
                        parentId: parentId
                    }
                });
                window.dispatchEvent(event);
            } catch (err) {
                console.error('Error updating reply:', err);
                setError(err.response?.data?.message || err.message);
            }
        };

        // Format date
        const formatDate = (dateString) => {
            try {
                return formatDistanceToNow(new Date(dateString), { addSuffix: true });
            } catch (err) {
                console.error('Error formatting date:', err);
                return dateString;
            }
        };

        return (
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar
                        src={reply.user?.avatar}
                        alt={reply.user?.firstName || 'User'}
                        sx={{ width: 24, height: 24, mr: 1 }}
                    >
                        {reply.user?.firstName?.charAt(0) || reply.user?.username?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography variant="body2" color="white">
                        {`${reply.user?.firstName || ''} ${reply.user?.lastName || ''}`}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="rgba(255,255,255,0.5)"
                        sx={{ ml: 1 }}
                    >
                        {formatDate(reply.createdAt)}
                        {reply.isEdited && ' (edited)'}
                    </Typography>

                    {/* Reply actions */}
                    {isOwner && (
                        <Box sx={{ ml: 'auto', display: 'flex' }}>
                            {!isEditingReply && (
                                <Tooltip title="Edit Reply">
                                    <IconButton
                                        size="small"
                                        onClick={handleEditReply}
                                    >
                                        <EditIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.6)' }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {!isEditingReply && (
                                <Tooltip title="Delete Reply">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            if (window.confirm('Delete this reply?')) {
                                                api.delete(`/comments/${reply._id}`)
                                                    .then(() => {
                                                        // Call the onDelete callback to update parent state
                                                        if (onDelete) onDelete(reply._id);

                                                        // Send event with parent ID for real-time updates
                                                        const event = new CustomEvent('comment-reply-deleted', {
                                                            detail: {
                                                                replyId: reply._id,
                                                                parentId: parentId
                                                            }
                                                        });
                                                        window.dispatchEvent(event);
                                                    })
                                                    .catch(err => {
                                                        console.error('Error deleting reply:', err);
                                                        setError(err.response?.data?.message || err.message);
                                                    });
                                            }
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.6)' }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {isEditingReply && (
                                <>
                                    <Tooltip title="Save Changes">
                                        <IconButton
                                            size="small"
                                            onClick={handleSaveReplyEdit}
                                            disabled={!editReplyContent.trim() || editReplyContent === reply.content}
                                        >
                                            <SaveIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.6)' }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Cancel">
                                        <IconButton
                                            size="small"
                                            onClick={() => setIsEditingReply(false)}
                                        >
                                            <CancelIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.6)' }} />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}
                        </Box>
                    )}
                </Box>

                {isEditingReply ? (
                    <Box sx={{ pl: 4, mb: 1 }}>
                        <TextField
                            fullWidth
                            multiline
                            size="small"
                            value={editReplyContent}
                            onChange={(e) => setEditReplyContent(e.target.value)}
                            InputProps={{
                                sx: {
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.23)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255,255,255,0.5)'
                                    }
                                }
                            }}
                        />
                    </Box>
                ) : (
                    <Typography
                        variant="body2"
                        color="white"
                        sx={{ whiteSpace: 'pre-wrap', pl: 4 }}
                    >
                        {reply.content}
                    </Typography>
                )}

                {error && (
                    <Typography variant="caption" color="error" sx={{ pl: 4 }}>
                        {error}
                    </Typography>
                )}
            </Box>
        );
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2,
                bgcolor: 'rgba(25, 25, 25, 0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                position: 'relative'
            }}
        >
            {/* Comment header with user info */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Avatar
                    src={comment.user?.avatar}
                    alt={comment.user?.firstName || 'User'}
                    sx={{ width: 32, height: 32, mr: 1.5 }}
                >
                    {comment.user?.firstName?.charAt(0) || comment.user?.username?.charAt(0) || 'U'}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" color="white">
                        {`${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`}
                        {comment.user?.username && (
                            <Typography
                                component="span"
                                variant="body2"
                                color="rgba(255,255,255,0.6)"
                                sx={{ ml: 0.5 }}
                            >
                                @{comment.user.username}
                            </Typography>
                        )}
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                        {formatDate(comment.createdAt)}
                        {comment.isEdited && ' (edited)'}
                    </Typography>
                </Box>

                {/* Comment actions */}
                <Box>
                    {isOwner && !isEditing && (
                        <>
                            <Tooltip title="Edit Comment">
                                <IconButton size="small" onClick={() => setIsEditing(true)}>
                                    <EditIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.6)' }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Comment">
                                <IconButton size="small" onClick={handleDelete}>
                                    <DeleteIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.6)' }} />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    {!isEditing && (
                        <Tooltip title="Reply">
                            <IconButton size="small" onClick={() => onReply(comment._id)}>
                                <ReplyIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.6)' }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Comment content */}
            {isEditing ? (
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={() => setIsEditing(false)}
                            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveEdit}
                            disabled={!editContent.trim() || editContent === comment.content}
                        >
                            Save
                        </Button>
                    </Box>
                </Box>
            ) : (
                <Typography
                    variant="body2"
                    color="white"
                    sx={{
                        whiteSpace: 'pre-wrap',
                        mb: 1,
                        wordBreak: 'break-word'
                    }}
                >
                    {comment.content}
                </Typography>
            )}

            {/* File location if available */}
            {comment.fileLocation && (
                <Chip
                    label={`${comment.fileLocation.path}${comment.fileLocation.line ? `:${comment.fileLocation.line}` : ''}`}
                    size="small"
                    sx={{
                        mb: 1,
                        bgcolor: 'rgba(25, 118, 210, 0.1)',
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.7rem'
                    }}
                />
            )}

            {/* Replies toggle */}
            {hasReplies && (
                <Box sx={{ mt: 1 }}>
                    <Button
                        size="small"
                        startIcon={showReplies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => setShowReplies(!showReplies)}
                        sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'none', fontSize: '0.75rem' }}
                        endIcon={
                            !showReplies && (
                                <Chip
                                    label={replies.length > 0 ? replies.length : '?'}
                                    size="small"
                                    sx={{
                                        height: 18,
                                        fontSize: '0.7rem',
                                        backgroundColor: 'rgba(25, 118, 210, 0.25)',
                                        ml: -0.5,
                                        minWidth: 18,
                                        padding: '0 2px'
                                    }}
                                />
                            )
                        }
                    >
                        {showReplies ? 'Hide Replies' : 'Show Replies'}
                    </Button>
                </Box>
            )}

            {/* Replies */}
            <Collapse in={showReplies}>
                <Box sx={{ pl: 4, mt: 2, borderLeft: '1px solid rgba(255,255,255,0.12)' }}>
                    {loadingReplies ? (
                        <Typography variant="body2" color="rgba(255,255,255,0.5)">
                            Loading replies...
                        </Typography>
                    ) : replies.length > 0 ? (
                        <Stack spacing={2}>
                            {replies.map(reply => (
                                <ReplyItem
                                    key={reply._id}
                                    reply={reply}
                                    parentId={comment._id}
                                    onDelete={(replyId) => {
                                        setReplies(prev => prev.filter(r => r._id !== replyId));
                                    }}
                                />
                            ))}
                        </Stack>
                    ) : (
                        <Typography variant="body2" color="rgba(255,255,255,0.5)">
                            No replies yet.
                        </Typography>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
});

export default PRComment; 