import React from 'react';
import PropTypes from 'prop-types';

const FileChangesList = ({ files, selectedFile, onFileSelect }) => {
    if (!Array.isArray(files) || files.length === 0) {
        return (
            <div className="file-changes-list">
                <h3>Changed Files</h3>
                <div className="alert alert-info">No files found in this pull request.</div>
            </div>
        );
    }

    // Group files by directory
    const filesByDirectory = files.reduce((acc, file) => {
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

    return (
        <div className="file-changes-list">
            <h3>Changed Files ({files.length})</h3>
            <div className="file-search mb-2">
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Filter files..."
                    onChange={(e) => {
                        // Implement file filtering if needed
                        console.log('Filter:', e.target.value);
                    }}
                />
            </div>
            <div className="file-list">
                {sortedDirectories.map(directory => (
                    <div key={directory || 'root'} className="directory-group">
                        {directory && (
                            <div className="directory-name">{directory}/</div>
                        )}
                        <ul className="files">
                            {filesByDirectory[directory].map((file, index) => (
                                <li
                                    key={file.filename || index}
                                    className={`file-item ${selectedFile && selectedFile.filename === file.filename ? 'selected' : ''}`}
                                    onClick={() => onFileSelect(file)}
                                >
                                    <span className={`file-status status-${file.status}`}>
                                        {file.status === 'added' && 'A'}
                                        {file.status === 'modified' && 'M'}
                                        {file.status === 'removed' && 'D'}
                                        {file.status === 'renamed' && 'R'}
                                    </span>
                                    <span className="file-name">
                                        {directory ? file.filename.substring(directory.length + 1) : file.filename}
                                    </span>
                                    <span className="file-changes">
                                        {file.additions > 0 && <span className="additions">+{file.additions}</span>}
                                        {file.deletions > 0 && <span className="deletions">-{file.deletions}</span>}
                                    </span>
                                    {!file.patch && <span className="binary-indicator" title="Binary file">B</span>}
                                </li>
                            ))}
                        </ul>
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
