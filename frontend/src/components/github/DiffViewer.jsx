import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CustomDiffViewer from './CustomDiffViewer';
import PlainTextDiff from './PlainTextDiff';
import '../../styles/custom-diff.css';

/**
 * Main DiffViewer component that uses the CustomDiffViewer for better display
 * of added and deleted lines
 */
const DiffViewer = ({ file }) => {
    // Option to switch between viewers
    const [viewerType, setViewerType] = useState('custom'); // 'custom' or 'plain'

    if (!file) {
        return (
            <div className="diff-viewer">
                <h3>Select a file</h3>
                <div>No file selected</div>
            </div>
        );
    }

    if (!file.patch) {
        return (
            <div className="diff-viewer">
                <h3>{file.filename}</h3>
                <div>No changes in this file or binary file</div>
                <div className="debug-info">
                    <p>File Status: {file.status}</p>
                    <p>Changes: +{file.additions || 0} -{file.deletions || 0}</p>
                    <p>This might be a binary file or a file with no text changes.</p>
                </div>
            </div>
        );
    }

    // Header component showing file information
    const FileHeader = () => (
        <div className="file-header">
            <h3>{file.filename}</h3>
            <div className="file-stats">
                <span className={`file-status status-${file.status}`}>
                    {file.status === 'added' && '+ Added'}
                    {file.status === 'modified' && '~ Modified'}
                    {file.status === 'removed' && '- Removed'}
                    {file.status === 'renamed' && '⟳ Renamed'}
                </span>
                <span className="file-changes">
                    Changes:
                    <span className="additions">{file.additions > 0 ? ` +${file.additions}` : ''}</span>
                    <span className="deletions">{file.deletions > 0 ? ` -${file.deletions}` : ''}</span>
                </span>
            </div>
        </div>
    );

    // View toggle buttons
    const ViewToggle = () => (
        <div className="view-toggle mb-3">
            <button
                className={`btn btn-sm ${viewerType === 'custom' ? 'btn-primary' : 'btn-outline-secondary'} me-2`}
                onClick={() => setViewerType('custom')}
            >
                GitHub Style View
            </button>
            <button
                className={`btn btn-sm ${viewerType === 'plain' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setViewerType('plain')}
            >
                Plain Text View
            </button>
        </div>
    );

    return (
        <div className="diff-viewer">
            {/* <FileHeader /> */}
            <ViewToggle />

            {viewerType === 'custom' ? (
                <CustomDiffViewer file={file} />
            ) : (
                <PlainTextDiff patch={file.patch} />
            )}
        </div>
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
