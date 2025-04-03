import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../axiosConfig';
import PullRequestDetails from './PullRequestDetails';
import FileChangesList from './FileChangesList';
import DiffViewer from './DiffViewer';
import '../../styles/pull-request.css';

const PullRequestView = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [prData, setPrData] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const { owner, repo, pullNumber } = useParams();

    useEffect(() => {
        let mounted = true;

        const fetchPullRequestData = async () => {
            try {
                setLoading(true);
                const url = `/github/${owner}/${repo}/pulls/${pullNumber}/complete`;
                console.log('Fetching PR data from:', url);

                const response = await api.get(url);
                console.log('PR Response received:', response.status);

                if (mounted) {
                    console.log('Files count:', response.data.files?.length || 0);

                    // Process and sort files by name for easier navigation
                    const files = response.data.files || [];
                    files.sort((a, b) => a.filename.localeCompare(b.filename));

                    const processedData = {
                        ...response.data,
                        files,
                    };

                    setPrData(processedData);

                    // Select the first file that has a patch if available
                    if (files.length > 0) {
                        const fileWithPatch = files.find(f => f.patch) || files[0];
                        setSelectedFile(fileWithPatch);
                    }
                }
            } catch (err) {
                if (mounted) {
                    console.error("Error fetching PR data:", err);
                    console.error("Full error:", err.response?.data || err.message);
                    setError(err.response?.data?.message || err.message || "Failed to fetch pull request data");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchPullRequestData();

        return () => {
            mounted = false;
        };
    }, [owner, repo, pullNumber]);

    const handleFileSelect = (file) => {
        setSelectedFile(file);
    };

    if (loading) return (
        <div className="loading">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading pull request data...</p>
        </div>
    );

    if (error) return (
        <div className="error alert alert-danger">
            <h4>Error Loading Pull Request</h4>
            <p>{error}</p>
            <p>Repository: {owner}/{repo}, PR #{pullNumber}</p>
        </div>
    );

    if (!prData) return <div className="alert alert-warning">No data available for this pull request.</div>;

    return (
        <div className="pull-request-view">
            <PullRequestDetails pullRequest={prData.pull_request} />

            <div className="pr-content">
                <div className="sidebar">
                    <FileChangesList
                        files={prData.files}
                        selectedFile={selectedFile}
                        onFileSelect={handleFileSelect}
                    />
                </div>

                <div className="main-content">
                    <DiffViewer file={selectedFile} />
                </div>
            </div>
        </div>
    );
};

export default PullRequestView;
