// components/github/RepositoryFiles.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';

const RepositoryFiles = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { owner, repo } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Get the current path from query params or default to empty string
    const queryParams = new URLSearchParams(location.search);
    const currentPath = queryParams.get('path') || '';

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/github/${owner}/${repo}/contents`, {
                    params: { path: currentPath }
                });
                setFiles(response.data.files);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchFiles();
    }, [owner, repo, currentPath]);

    const navigateToFolder = (path) => {
        navigate(`/github/${owner}/${repo}/contents?path=${path}`);
    };

    const navigateUp = () => {
        if (!currentPath) return;

        const parts = currentPath.split('/');
        parts.pop();
        const newPath = parts.join('/');

        navigate(`/github/${owner}/${repo}/contents${newPath ? `?path=${newPath}` : ''}`);
    };

    if (loading) return <div>Loading repository files...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="repository-files">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Repository: {owner}/{repo}</h2>
                <Link to={`/github/${owner}/${repo}/pulls`} className="btn btn-outline-primary">
                    View Pull Requests
                </Link>
            </div>

            <div className="card">
                <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center">
                        <h3 className="mb-0">
                            {currentPath ? currentPath : 'Root'}
                        </h3>
                        {currentPath && (
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={navigateUp}
                            >
                                ↑ Up
                            </button>
                        )}
                    </div>
                </div>
                <div className="card-body">
                    <div className="list-group">
                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="list-group-item list-group-item-action"
                            >
                                {file.type === 'dir' ? (
                                    <div
                                        className="d-flex align-items-center cursor-pointer"
                                        onClick={() => navigateToFolder(file.path)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className="bi bi-folder me-2"></i>
                                        <span>{file.name}</span>
                                    </div>
                                ) : (
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <i className="bi bi-file-text me-2"></i>
                                            <span>{file.name}</span>
                                        </div>
                                        {file.download_url && (
                                            <a
                                                href={file.download_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-outline-info"
                                            >
                                                View
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepositoryFiles;
