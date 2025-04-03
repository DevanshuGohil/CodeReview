// components/github/PullRequestList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { Link, useParams } from 'react-router-dom';

const PullRequestList = () => {
    const [pullRequests, setPullRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { owner, repo } = useParams();

    useEffect(() => {
        const fetchPullRequests = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/github/${owner}/${repo}/pulls`);
                setPullRequests(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchPullRequests();
    }, [owner, repo]);

    if (loading) return <div>Loading pull requests...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="pull-request-list">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Pull Requests for {owner}/{repo}</h2>
                <Link to={`/github/${owner}/${repo}/contents`} className="btn btn-outline-primary">
                    View Repository Files
                </Link>
            </div>

            {pullRequests.length === 0 ? (
                <div className="alert alert-info">No pull requests found for this repository.</div>
            ) : (
                <div className="list-group">
                    {pullRequests.map(pr => (
                        <Link
                            key={pr.id}
                            to={`/github/${owner}/${repo}/pulls/${pr.number}`}
                            className="list-group-item list-group-item-action"
                        >
                            <div className="d-flex w-100 justify-content-between">
                                <h5 className="mb-1">#{pr.number}: {pr.title}</h5>
                                <small>
                                    <span className={`badge ${pr.state === 'open' ? 'bg-success' : 'bg-danger'}`}>
                                        {pr.state}
                                    </span>
                                </small>
                            </div>
                            <p className="mb-1">{pr.body?.substring(0, 150)}...</p>
                            <small>
                                Opened by {pr.user.login} on {new Date(pr.created_at).toLocaleDateString()}
                            </small>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PullRequestList;
