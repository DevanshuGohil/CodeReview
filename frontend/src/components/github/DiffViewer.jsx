import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CustomDiffViewer from './CustomDiffViewer';
import PlainTextDiff from './PlainTextDiff';
import '../../styles/custom-diff.css';
import {
    Box,
    Typography,
    Chip,
    Paper,
    ToggleButtonGroup,
    ToggleButton,
    Divider,
    Alert,
    Stack
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoveToInbox as RenameIcon,
    Code as CodeIcon
} from '@mui/icons-material';

/**
 * Main DiffViewer component that uses the CustomDiffViewer for better display
 * of added and deleted lines
 */
const DiffViewer = ({ file }) => {
    // Option to switch between viewers
    const [viewerType, setViewerType] = useState('custom'); // 'custom' or 'plain'

    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setViewerType(newView);
        }
    };

    // Get status icon based on file status
    const getStatusIcon = (status) => {
        switch (status) {
            case 'added': return <AddIcon fontSize="small" sx={{ color: '#2ecc71' }} />;
            case 'modified': return <EditIcon fontSize="small" sx={{ color: '#f1c40f' }} />;
            case 'removed': return <DeleteIcon fontSize="small" sx={{ color: '#e74c3c' }} />;
            case 'renamed': return <RenameIcon fontSize="small" sx={{ color: '#3498db' }} />;
            default: return <CodeIcon fontSize="small" sx={{ color: 'grey.500' }} />;
        }
    };

    // Get status label
    const getStatusLabel = (status) => {
        switch (status) {
            case 'added': return 'Added';
            case 'modified': return 'Modified';
            case 'removed': return 'Removed';
            case 'renamed': return 'Renamed';
            default: return status;
        }
    };

    if (!file) {
        return (
            <Paper sx={{ p: 3, bgcolor: 'rgba(18, 18, 18, 0.9)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Typography variant="h6" color="white" sx={{ mb: 1 }}>
                    Select a file
                </Typography>
                <Typography color="rgba(255,255,255,0.7)">
                    No file selected
                </Typography>
            </Paper>
        );
    }

    if (!file.patch) {
        return (
            <Paper sx={{ p: 3, bgcolor: 'rgba(18, 18, 18, 0.9)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Typography variant="h6" color="white" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(file.status)}
                    {file.filename}
                </Typography>

                <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(41, 98, 255, 0.1)', color: 'white' }}>
                    No changes in this file or binary file
                </Alert>

                <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(0,0,0,0.2)',
                    borderRadius: 1,
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace'
                }}>
                    <Typography component="div" variant="body2" sx={{ mb: 1 }}>
                        File Status: {getStatusLabel(file.status)}
                    </Typography>
                    <Typography component="div" variant="body2" sx={{ mb: 1 }}>
                        Changes:
                        <Box component="span" sx={{ color: '#2ecc71', ml: 1 }}>
                            +{file.additions || 0}
                        </Box>
                        <Box component="span" sx={{ color: '#e74c3c', ml: 1 }}>
                            -{file.deletions || 0}
                        </Box>
                    </Typography>
                    <Typography component="div" variant="body2">
                        This might be a binary file or a file with no text changes.
                    </Typography>
                </Box>
            </Paper>
        );
    }

    // Header component showing file information
    const FileHeader = () => (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h6" color="white" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon(file.status)}
                {file.filename}
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                    label={getStatusLabel(file.status)}
                    size="small"
                    icon={getStatusIcon(file.status)}
                    sx={{
                        bgcolor: 'rgba(18, 18, 18, 0.9)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.12)',
                        '& .MuiChip-icon': {
                            color: 'inherit'
                        }
                    }}
                />

                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    Changes:
                    {file.additions > 0 && (
                        <Box component="span" sx={{ color: '#2ecc71', ml: 1 }}>
                            +{file.additions}
                        </Box>
                    )}
                    {file.deletions > 0 && (
                        <Box component="span" sx={{ color: '#e74c3c', ml: 1 }}>
                            -{file.deletions}
                        </Box>
                    )}
                </Typography>
            </Stack>
        </Box>
    );

    // View toggle buttons
    const ViewToggle = () => (
        <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
                value={viewerType}
                exclusive
                onChange={handleViewChange}
                aria-label="diff view type"
                size="small"
                sx={{
                    backgroundColor: 'rgba(18, 18, 18, 0.9)',
                    '& .MuiToggleButtonGroup-grouped': {
                        border: '1px solid rgba(255,255,255,0.12) !important',
                        borderRadius: '4px !important',
                        mx: 0.5,
                        color: 'rgba(255,255,255,0.7)',
                        '&.Mui-selected': {
                            color: 'white',
                            backgroundColor: 'rgba(33, 150, 243, 0.2)'
                        },
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.05)'
                        }
                    }
                }}
            >
                <ToggleButton value="custom">
                    GitHub Style View
                </ToggleButton>
                <ToggleButton value="plain">
                    Plain Text View
                </ToggleButton>
            </ToggleButtonGroup>
        </Box>
    );

    return (
        <Paper sx={{ p: 3, bgcolor: 'rgba(18, 18, 18, 0.9)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <FileHeader />
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />
            <ViewToggle />

            {viewerType === 'custom' ? (
                <CustomDiffViewer file={file} />
            ) : (
                <PlainTextDiff patch={file.patch} />
            )}
        </Paper>
    );
};

DiffViewer.propTypes = {
    file: PropTypes.shape({
        filename: PropTypes.string,
        status: PropTypes.string,
        patch: PropTypes.string,
        additions: PropTypes.number,
        deletions: PropTypes.number
    })
};

export default DiffViewer;
