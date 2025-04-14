import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import api from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../common/SnackbarProvider';
import {
    Box,
    Typography,
    Paper,
    Avatar,
    IconButton,
    TextField,
    Button,
    Collapse,
    Stack,
    Tooltip,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert
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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [replyToDelete, setReplyToDelete] = useState(null);
    const [replyDeleteDialogOpen, setReplyDeleteDialogOpen] = useState(false);

    const { currentUser } = useAuth();
    const { showSuccess, showError } = useSnackbar();
    const isOwner = currentUser && comment.user && currentUser._id === comment.user._id;

    // Load all replies - this function needs to be defined before it's used in useEffects
    const loadReplies = useCallback(async () => {
        try {
            setLoadingReplies(true);
            console.log(`Loading replies for comment ${comment._id}...`);
            const response = await api.get(`/comments/${comment._id}/replies`);
            console.log(`Received ${response.data.length} replies for comment ${comment._id}:`, response.data);
            setReplies(response.data);
            setHasReplies(response.data.length > 0);
            setLoadingReplies(false);
        } catch (err) {
            console.error('Error loading replies:', err);
            setError(err.response?.data?.message || err.message);
            setLoadingReplies(false);
        }
    }, [comment._id]);

    // Utility function to check if a reply is a duplicate
    const isDuplicateReply = useCallback((replyId) => {
        // Check in the current replies state
        const existsInState = replies.some(r => r._id === replyId);
        if (existsInState) return true;

        // Check in the global tracker
        if (window._replyTracker && window._replyTracker[replyId]) {
            const trackedReply = window._replyTracker[replyId];
            // Only consider it a duplicate if it's recent (within 5 seconds) and for this comment
            if (trackedReply.parentId === comment._id &&
                Date.now() - trackedReply.timestamp < 5000) {
                return true;
            }
        }

        return false;
    }, [replies, comment._id]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        addReply: (reply) => {
            console.log(`Adding reply directly to comment ${comment._id}:`, reply);

            // Track this reply to avoid duplicates from socket events
            if (!window._replyTracker) {
                window._replyTracker = {};
            }
            window._replyTracker[reply._id] = {
                timestamp: Date.now(),
                parentId: comment._id
            };

            // Always add the reply and show replies section
            setReplies(prevReplies => {
                // Check if reply already exists to avoid duplicates
                const exists = prevReplies.some(r => r._id === reply._id);
                console.log(`Reply ${reply._id} already exists in comment ${comment._id}:`, exists);

                if (!exists) {
                    console.log(`Adding new reply ${reply._id} to comment ${comment._id}`);
                    return [...prevReplies, reply];
                }
                return prevReplies;
            });
            setHasReplies(true);
            // Always show replies when a new reply is added
            setShowReplies(true);
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
    }, [showReplies, loadReplies]);

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

                // Skip if this is a duplicate reply
                if (e.detail.reply && e.detail.reply._id && isDuplicateReply(e.detail.reply._id)) {
                    console.log(`Skipping duplicate reply ${e.detail.reply._id} for comment ${comment._id}`);
                    return;
                }

                // Check if this specific reply is already in our list
                if (e.detail.reply && e.detail.reply._id) {
                    // Add the new reply directly to our state if it's not already there
                    setReplies(prevReplies => [...prevReplies, e.detail.reply]);
                } else {
                    // If we don't have the reply details, fall back to loading all replies
                    loadReplies();
                }

                // Always make sure the reply section is expanded so the user sees the new reply
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
    }, [comment._id, isDuplicateReply, loadReplies, showReplies]);

    // Handle editing a comment
    const handleSaveEdit = async () => {
        if (!editContent.trim()) return;

        try {
            await api.put(`/comments/${comment._id}`, {
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

            showSuccess('Comment deleted successfully');
            setDeleteDialogOpen(false);
        } catch (err) {
            console.error('Error deleting comment:', err);
            showError(err.response?.data?.message || err.message);
            setDeleteDialogOpen(false);
        }
    };

    // Handle deleting a reply
    const handleDeleteReply = async (replyId) => {
        try {
            await api.delete(`/comments/${replyId}`);

            // Remove the deleted reply from local state
            setReplies(prevReplies => prevReplies.filter(r => r._id !== replyId));

            // Send event with parent ID for real-time updates
            const event = new CustomEvent('comment-reply-deleted', {
                detail: {
                    replyId: replyId,
                    parentId: comment._id
                }
            });
            window.dispatchEvent(event);

            showSuccess('Reply deleted successfully');
            setReplyDeleteDialogOpen(false);
            setReplyToDelete(null);
        } catch (err) {
            console.error('Error deleting reply:', err);
            showError(err.response?.data?.message || err.message);
            setReplyDeleteDialogOpen(false);
            setReplyToDelete(null);
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
        const [replyError, setReplyError] = useState(null);

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
                showSuccess('Reply updated successfully');
            } catch (err) {
                console.error('Error updating reply:', err);
                setReplyError(err.response?.data?.message || err.message);
                showError(err.response?.data?.message || err.message);
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
                                            setReplyToDelete(reply);
                                            setReplyDeleteDialogOpen(true);
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

                {replyError && (
                    <Typography variant="caption" color="error" sx={{ pl: 4 }}>
                        {replyError}
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
                                <IconButton size="small" onClick={() => setDeleteDialogOpen(true)}>
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

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
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
                                        height: 20,
                                        fontSize: '0.75rem',
                                        backgroundColor: 'rgba(25, 118, 210, 0.5)',
                                        color: '#ffffff',
                                        fontWeight: 'bold',
                                        borderRadius: '10px',
                                        minWidth: 20,
                                        padding: '0 4px',
                                        ml: 0.5,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
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

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: { bgcolor: '#2d2d2d', color: 'white', borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    Confirm Comment Deletion
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        Are you sure you want to delete this comment? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 1 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reply Delete Confirmation Dialog */}
            <Dialog
                open={replyDeleteDialogOpen}
                onClose={() => setReplyDeleteDialogOpen(false)}
                PaperProps={{
                    sx: { bgcolor: '#2d2d2d', color: 'white', borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    Confirm Reply Deletion
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        Are you sure you want to delete this reply? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={() => setReplyDeleteDialogOpen(false)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleDeleteReply(replyToDelete?._id)}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 1 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
});

export default PRComment; 