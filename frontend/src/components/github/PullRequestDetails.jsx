import React from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Typography,
    Avatar,
    Chip,
    Divider,
    Paper,
    Stack
} from '@mui/material';
import {
    Merge as MergeIcon,
    Code as CodeIcon,
    GitHub as GitHubIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    Commit as CommitIcon,
    Person as PersonIcon
} from '@mui/icons-material';

const PullRequestDetails = ({ pullRequest }) => {
    // Handle the case when pullRequest is undefined
    if (!pullRequest) {
        return (
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    bgcolor: 'rgba(18, 18, 18, 0.9)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.7)'
                }}
            >
                <Typography>Loading pull request details...</Typography>
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
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <GitHubIcon sx={{ color: '#2196f3', fontSize: 28 }} />
                <Box sx={{ width: '100%' }}>
                    <Typography
                        variant="h5"
                        component="h2"
                        color="white"
                        sx={{ fontWeight: 500, mb: 1 }}
                    >
                        #{pullRequest.number}: {pullRequest.title}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                    src={pullRequest.user.avatar_url}
                                    alt={pullRequest.user.login}
                                    sx={{ width: 32, height: 32 }}
                                />
                                <Typography color="rgba(255,255,255,0.7)" fontSize="0.9rem">
                                    {pullRequest.user.login}
                                </Typography>
                            </Box>

                            <Chip
                                label={pullRequest.state}
                                size="small"
                                color={pullRequest.state === 'open' ? 'success' : 'error'}
                                sx={{ textTransform: 'capitalize' }}
                            />
                        </Box>

                        <Stack direction="row" spacing={2} mt={{ xs: 2, sm: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CommitIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                <Typography color="rgba(255,255,255,0.7)" fontSize="0.9rem">
                                    {pullRequest.commits} commits
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CodeIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                <Typography color="rgba(255,255,255,0.7)" fontSize="0.9rem">
                                    {pullRequest.changed_files} files
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AddIcon fontSize="small" sx={{ color: '#2ecc71' }} />
                                <Typography color="#2ecc71" fontSize="0.9rem">
                                    {pullRequest.additions}
                                </Typography>
                                <RemoveIcon fontSize="small" sx={{ color: '#e74c3c', ml: 0.5 }} />
                                <Typography color="#e74c3c" fontSize="0.9rem">
                                    {pullRequest.deletions}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {pullRequest.body && (
                        <>
                            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />
                            <Typography
                                color="rgba(255,255,255,0.9)"
                                sx={{
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: "'Roboto', sans-serif"
                                }}
                            >
                                {pullRequest.body || 'No description provided.'}
                            </Typography>
                        </>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};

PullRequestDetails.propTypes = {
    pullRequest: PropTypes.shape({
        number: PropTypes.number,
        title: PropTypes.string,
        state: PropTypes.string,
        user: PropTypes.shape({
            login: PropTypes.string,
            avatar_url: PropTypes.string
        }),
        commits: PropTypes.number,
        changed_files: PropTypes.number,
        additions: PropTypes.number,
        deletions: PropTypes.number,
        body: PropTypes.string
    })
};

export default PullRequestDetails;
