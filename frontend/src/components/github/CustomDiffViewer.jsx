import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * A robust diff viewer that shows added and deleted lines
 * with options for unified or side-by-side views
 */
const CustomDiffViewer = ({ file }) => {
    const [showFullContext, setShowFullContext] = useState(false);
    const [showHunkHeaders, setShowHunkHeaders] = useState(true);
    const [viewMode, setViewMode] = useState('sideBySide'); // 'unified' or 'sideBySide'

    if (!file || !file.patch) {
        return (
            <div className="custom-diff-viewer">
                <div className="diff-header">
                    <h3>{file ? file.filename : 'No file selected'}</h3>
                </div>
                <div className="diff-body empty">
                    <p>No changes available to display</p>
                </div>
            </div>
        );
    }

    // Process the diff patch
    const lines = file.patch.split('\n');

    // Count additions and deletions
    const additions = lines.filter(line => line.startsWith('+')).length;
    const deletions = lines.filter(line => line.startsWith('-')).length;

    // Process lines for display
    const processedLines = lines.map((line, index) => {
        const firstChar = line.charAt(0);
        let lineType = 'normal';

        if (firstChar === '+') {
            lineType = 'addition';
        } else if (firstChar === '-') {
            lineType = 'deletion';
        } else if (line.startsWith('@@')) {
            lineType = 'hunk-header';
        } else if (
            line.startsWith('diff --git') ||
            line.startsWith('index ') ||
            line.startsWith('--- ') ||
            line.startsWith('+++ ') ||
            line.startsWith('Binary files') ||
            line.startsWith('new file mode') ||
            line.startsWith('deleted file mode')
        ) {
            lineType = 'meta';
        }

        return {
            text: line,
            content: line.substring(firstChar === '+' || firstChar === '-' ? 1 : 0),
            type: lineType,
            id: index,
            lineNumber: null // Will be set during processing
        };
    });

    // Filter meta lines if not showing full context
    const displayLines = showFullContext
        ? processedLines
        : processedLines.filter(line => {
            if (line.type === 'meta') return false;
            if (line.type === 'hunk-header' && !showHunkHeaders) return false;
            return true;
        });

    // For debugging
    console.log("Show Full Context:", showFullContext);
    console.log("Total lines:", processedLines.length);
    console.log("Displayed lines:", displayLines.length);
    console.log("Meta lines:", processedLines.filter(line => line.type === 'meta').length);

    // Track actual line numbers based on hunk headers
    const updateLineNumbers = (lines) => {
        let oldLineNumber = 0;
        let newLineNumber = 0;
        let currentOldStart = 0;
        let currentNewStart = 0;

        return lines.map(line => {
            const updatedLine = { ...line };

            if (line.type === 'hunk-header') {
                // Parse the line numbers from hunk header like @@ -1,7 +1,6 @@
                const match = line.text.match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
                if (match) {
                    currentOldStart = parseInt(match[1], 10);
                    currentNewStart = parseInt(match[2], 10);
                    oldLineNumber = currentOldStart - 1;
                    newLineNumber = currentNewStart - 1;
                }
                updatedLine.oldLineNumber = null;
                updatedLine.newLineNumber = null;
            } else if (line.type === 'normal') {
                oldLineNumber++;
                newLineNumber++;
                updatedLine.oldLineNumber = oldLineNumber;
                updatedLine.newLineNumber = newLineNumber;
            } else if (line.type === 'deletion') {
                oldLineNumber++;
                updatedLine.oldLineNumber = oldLineNumber;
                updatedLine.newLineNumber = null;
            } else if (line.type === 'addition') {
                newLineNumber++;
                updatedLine.oldLineNumber = null;
                updatedLine.newLineNumber = newLineNumber;
            } else {
                updatedLine.oldLineNumber = null;
                updatedLine.newLineNumber = null;
            }

            return updatedLine;
        });
    };

    // Apply line numbers
    const numberedLines = updateLineNumbers(displayLines);

    // For side-by-side view, pair up the deletion and addition lines
    const buildSideBySideView = () => {
        const result = [];
        let i = 0;

        // First pass: try to match deletions with additions based on content similarity
        const linesWithNumbering = [...numberedLines];

        while (i < linesWithNumbering.length) {
            const current = linesWithNumbering[i];

            // Handle hunk headers, meta info, and normal lines
            if (current.type === 'hunk-header' || current.type === 'meta' || current.type === 'normal') {
                result.push({
                    left: current,
                    right: current,
                    type: current.type
                });
                i++;
                continue;
            }

            // Check if we have a deletion followed by additions
            if (current.type === 'deletion') {
                let nextAdditionIndex = -1;
                let bestMatch = null;
                let maxSimilarity = 0;

                // Look ahead for additions to pair with this deletion
                for (let j = i + 1; j < linesWithNumbering.length && j < i + 5; j++) {
                    if (linesWithNumbering[j].type === 'addition') {
                        // Simple similarity check - could be enhanced with more sophisticated diff algorithm
                        const similarity = calculateSimilarity(current.content, linesWithNumbering[j].content);
                        if (similarity > maxSimilarity) {
                            maxSimilarity = similarity;
                            bestMatch = j;
                        }
                    } else if (linesWithNumbering[j].type !== 'addition' && linesWithNumbering[j].type !== 'deletion') {
                        break; // Stop looking ahead if we hit a non-change line
                    }
                }

                // If we found a good match, pair them
                if (maxSimilarity > 0.5 && bestMatch !== null) {
                    result.push({
                        left: current,
                        right: linesWithNumbering[bestMatch],
                        type: 'change'
                    });
                    // Remove the matched addition so it's not used again
                    linesWithNumbering.splice(bestMatch, 1);
                } else {
                    // No good match found, just add the deletion by itself
                    result.push({
                        left: current,
                        right: null,
                        type: 'deletion'
                    });
                }
                i++;
            }
            // Handle additions without a paired deletion
            else if (current.type === 'addition') {
                result.push({
                    left: null,
                    right: current,
                    type: 'addition'
                });
                i++;
            }
            // Any other line type
            else {
                result.push({
                    left: current,
                    right: current,
                    type: current.type
                });
                i++;
            }
        }

        return result;
    };

    // Simple content similarity function
    const calculateSimilarity = (a, b) => {
        if (!a || !b) return 0;

        // Remove whitespace for comparison
        const trimA = a.trim();
        const trimB = b.trim();

        if (trimA === trimB) return 1.0; // Exact match

        // Minimum edit distance would be better but this is a simple approximation
        // Count common characters
        const shorter = trimA.length < trimB.length ? trimA : trimB;
        const longer = trimA.length >= trimB.length ? trimA : trimB;

        let commonChars = 0;
        for (let i = 0; i < shorter.length; i++) {
            if (longer.includes(shorter[i])) {
                commonChars++;
            }
        }

        return commonChars / longer.length;
    };

    const sideBySidePairs = viewMode === 'sideBySide' ? buildSideBySideView() : [];

    return (
        <div className="custom-diff-viewer">
            <div className="diff-header">
                <h3>{file.filename}</h3>
                <div className="diff-stats">
                    <span className="file-status">{file.status}</span>
                    <span className="changes">
                        {additions > 0 && <span className="additions">+{additions}</span>}
                        {deletions > 0 && <span className="deletions">-{deletions}</span>}
                    </span>
                </div>
            </div>

            <div className="diff-controls">
                <div className="view-toggles">
                    <button
                        className={`view-mode-toggle ${viewMode === 'sideBySide' ? 'active' : ''}`}
                        onClick={() => setViewMode('sideBySide')}
                    >
                        Side by Side
                    </button>
                    <button
                        className={`view-mode-toggle ${viewMode === 'unified' ? 'active' : ''}`}
                        onClick={() => setViewMode('unified')}
                    >
                        Unified View
                    </button>
                </div>

                <div className="view-options">
                    {/* <button
                        className={`toggle-context ${showFullContext ? 'active' : ''}`}
                        onClick={() => {
                            console.log('Toggling context from', showFullContext, 'to', !showFullContext);
                            setShowFullContext(!showFullContext);
                        }}
                    >
                        {showFullContext ? 'Hide' : 'Show'} Full Context
                    </button> */}

                    <button
                        className={`toggle-hunk-headers ${showHunkHeaders ? 'active' : ''}`}
                        onClick={() => setShowHunkHeaders(!showHunkHeaders)}
                    >
                        {showHunkHeaders ? 'Hide' : 'Show'} Hunk Headers
                    </button>
                </div>
            </div>

            <div className="diff-legend">
                <div className="legend-item">
                    <span className="legend-color addition-color"></span>
                    <span>Added</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color deletion-color"></span>
                    <span>Removed</span>
                </div>
            </div>

            <div className="diff-body">
                {viewMode === 'unified' ? (
                    // Unified view (single column)
                    <div className="table-container">
                        <table className="diff-table unified">
                            <tbody>
                                {numberedLines.map((line) => (
                                    <tr key={line.id} className={`diff-line ${line.type}-line`}>
                                        <td className="line-number">
                                            {line.type === 'addition' ? line.newLineNumber :
                                                line.type === 'deletion' ? line.oldLineNumber :
                                                    line.type === 'normal' ? line.oldLineNumber : ''}
                                        </td>
                                        <td className={`line-content ${line.type}-content`}>
                                            <pre>{line.text}</pre>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // Side-by-side view (two columns)
                    <div className="table-container">
                        <table className="diff-table side-by-side">
                            <thead>
                                <tr>
                                    <th className="line-number-header">Old</th>
                                    <th className="content-header">Removed</th>
                                    <th className="line-number-header">New</th>
                                    <th className="content-header">Added</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sideBySidePairs.map((pair, index) => {
                                    // Generate a more stable key
                                    const key = `pair-${pair.left?.id || 'null'}-${pair.right?.id || 'null'}-${index}`;

                                    return (
                                        <tr key={key} className={`diff-line ${pair.type}-line`}>
                                            {/* Left side (old version) */}
                                            {pair.left ? (
                                                <>
                                                    <td className="line-number left">{pair.left.oldLineNumber || ''}</td>
                                                    <td className={`line-content ${pair.left.type}-content`}>
                                                        <pre>{pair.type === 'hunk-header' || pair.type === 'meta' ? pair.left.text : pair.left.content}</pre>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="line-number left empty"></td>
                                                    <td className="line-content empty"></td>
                                                </>
                                            )}

                                            {/* Right side (new version) */}
                                            {pair.right ? (
                                                <>
                                                    <td className="line-number right">{pair.right.newLineNumber || ''}</td>
                                                    <td className={`line-content ${pair.right.type}-content`}>
                                                        <pre>{pair.type === 'hunk-header' || pair.type === 'meta' ? pair.right.text : pair.right.content}</pre>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="line-number right empty"></td>
                                                    <td className="line-content empty"></td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

CustomDiffViewer.propTypes = {
    file: PropTypes.shape({
        filename: PropTypes.string,
        status: PropTypes.string,
        patch: PropTypes.string,
        additions: PropTypes.number,
        deletions: PropTypes.number
    })
};

export default CustomDiffViewer; 