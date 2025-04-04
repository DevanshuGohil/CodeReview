import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    Chip
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoveToInbox as RenameIcon
} from '@mui/icons-material';

const FileChangesList = ({ files, selectedFile, onFileSelect }) => {
    const [filterText, setFilterText] = useState('');

    if (!Array.isArray(files) || files.length === 0) {
        return (
            <div className="file-changes-list">
                <h3>Changed Files</h3>
                <Box sx={{ p: 2, color: 'rgba(255,255,255,0.7)' }}>
                    No files found in this pull request.
                </Box>
            </div>
        );
    }

    // Filter files based on filter text
    const filteredFiles = filterText
        ? files.filter(file => file.filename.toLowerCase().includes(filterText.toLowerCase()))
        : files;

    // Group files by directory
    const filesByDirectory = filteredFiles.reduce((acc, file) => {
        const parts = file.filename.split('/');
        const directory = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

        if (!acc[directory]) {
            acc[directory] = [];
        }

        acc[directory].push(file);
        return acc;
    }, {});

    // Sort directories alphabetically
    const sortedDirectories = Object.keys(filesByDirectory).sort((a, b) => {
        if (a === '' && b !== '') return -1;
        if (a !== '' && b === '') return 1;
        return a.localeCompare(b);
    });

    // Get status icon based on file status
    const getStatusIcon = (status) => {
        switch (status) {
            case 'added': return <AddIcon fontSize="small" sx={{ color: '#2ecc71' }} />;
            case 'modified': return <EditIcon fontSize="small" sx={{ color: '#f1c40f' }} />;
            case 'removed': return <DeleteIcon fontSize="small" sx={{ color: '#e74c3c' }} />;
            case 'renamed': return <RenameIcon fontSize="small" sx={{ color: '#3498db' }} />;
            default: return null;
        }
    };

    return (
        <div className="file-changes-list">
            <h3>Changed Files ({filteredFiles.length})</h3>
            <Box sx={{ p: 2, pb: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Filter files..."
                    variant="outlined"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                            </InputAdornment>
                        ),
                        sx: {
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.2)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.3)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main'
                            }
                        }
                    }}
                />
            </Box>
            <div className="file-list">
                {sortedDirectories.map(directory => (
                    <div key={directory || 'root'} className="directory-group">
                        {directory && (
                            <div className="directory-name">
                                <Typography variant="body2" fontWeight="500">
                                    {directory}/
                                </Typography>
                            </div>
                        )}
                        <List disablePadding>
                            {filesByDirectory[directory].map((file, index) => (
                                <ListItem
                                    key={file.filename || index}
                                    className={`file-item ${selectedFile && selectedFile.filename === file.filename ? 'selected' : ''}`}
                                    onClick={() => onFileSelect(file)}
                                    dense
                                    sx={{ pl: 2 }}
                                >
                                    {getStatusIcon(file.status)}
                                    <ListItemText
                                        primary={directory ? file.filename.substring(directory.length + 1) : file.filename}
                                        sx={{ ml: 1.5, overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                        {file.additions > 0 && (
                                            <Chip
                                                size="small"
                                                label={`+${file.additions}`}
                                                sx={{
                                                    bgcolor: 'rgba(46, 204, 113, 0.15)',
                                                    color: '#2ecc71',
                                                    height: '20px',
                                                    fontSize: '0.7rem',
                                                    mr: 0.5
                                                }}
                                            />
                                        )}
                                        {file.deletions > 0 && (
                                            <Chip
                                                size="small"
                                                label={`-${file.deletions}`}
                                                sx={{
                                                    bgcolor: 'rgba(231, 76, 60, 0.15)',
                                                    color: '#e74c3c',
                                                    height: '20px',
                                                    fontSize: '0.7rem'
                                                }}
                                            />
                                        )}
                                        {!file.patch && (
                                            <Chip
                                                size="small"
                                                label="B"
                                                sx={{
                                                    bgcolor: 'rgba(155, 89, 182, 0.3)',
                                                    color: '#9b59b6',
                                                    height: '20px',
                                                    width: '20px',
                                                    fontSize: '0.7rem',
                                                    ml: file.additions > 0 || file.deletions > 0 ? 0.5 : 0
                                                }}
                                                title="Binary file"
                                            />
                                        )}
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    </div>
                ))}
            </div>
        </div>
    );
};

FileChangesList.propTypes = {
    files: PropTypes.arrayOf(
        PropTypes.shape({
            status: PropTypes.string,
            filename: PropTypes.string.isRequired,
            additions: PropTypes.number,
            deletions: PropTypes.number
        })
    ).isRequired,
    selectedFile: PropTypes.object,
    onFileSelect: PropTypes.func.isRequired
};

export default FileChangesList;
