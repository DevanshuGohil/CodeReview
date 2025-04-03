import React from 'react';
import PropTypes from 'prop-types';

/**
 * A simple plain text diff renderer that doesn't rely on react-diff-view
 * This is a fallback for when more sophisticated diff viewing doesn't work
 */
const PlainTextDiff = ({ patch }) => {
    if (!patch) {
        return <div>No changes to display</div>;
    }

    // Split the patch into lines
    const lines = patch.split('\n');

    // Track statistics for a summary
    let additions = 0;
    let deletions = 0;

    // Prepare lines with styling
    const formattedLines = lines.map((line, index) => {
        let lineClass = 'diff-line';
        let prefix = line.charAt(0);

        if (prefix === '+') {
            lineClass += ' addition-line';
            additions++;
        } else if (prefix === '-') {
            lineClass += ' deletion-line';
            deletions++;
        } else if (line.startsWith('@@')) {
            lineClass += ' hunk-header-line';
        } else if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) {
            lineClass += ' meta-line';
        }

        return (
            <div key={index} className={lineClass}>
                <span className="line-number">{index + 1}</span>
                <span className="line-content">{line}</span>
            </div>
        );
    });

    return (
        <div className="plain-text-diff">
            <div className="diff-stats">
                <div className="stats-label">Changes:</div>
                <div className="stats-value">
                    {additions > 0 && (
                        <span className="additions-count">+{additions} </span>
                    )}
                    {deletions > 0 && (
                        <span className="deletions-count">-{deletions}</span>
                    )}
                </div>
            </div>
            <div className="diff-legend">
                <div className="legend-item">
                    <span className="legend-sample addition-sample"></span>
                    <span>Added lines</span>
                </div>
                <div className="legend-item">
                    <span className="legend-sample deletion-sample"></span>
                    <span>Removed lines</span>
                </div>
            </div>
            <pre className="diff-content">
                {formattedLines}
            </pre>
        </div>
    );
};

PlainTextDiff.propTypes = {
    patch: PropTypes.string
};

export default PlainTextDiff; 