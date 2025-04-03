// components/projects/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { useParams, Link } from 'react-router-dom';
import TeamSelector from '../teams/TeamSelector';

const ProjectDetail = () => {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedAccessLevel, setSelectedAccessLevel] = useState('read');
    const [githubOwner, setGithubOwner] = useState('');
    const [githubRepo, setGithubRepo] = useState('');
    const { id } = useParams();

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/projects/${id}`);
                setProject(response.data);

                // Set GitHub repo values if they exist
                if (response.data.githubRepo) {
                    setGithubOwner(response.data.githubRepo.owner || '');
                    setGithubRepo(response.data.githubRepo.repo || '');
                }

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    const handleAddTeam = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post(`/projects/${id}/teams`, {
                teamId: selectedTeam,
                accessLevel: selectedAccessLevel
            });

            setProject(response.data);
            setSelectedTeam('');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleRemoveTeam = async (teamId) => {
        try {
            const response = await api.delete(`/projects/${id}/teams/${teamId}`);
            setProject(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleUpdateGithubRepo = async (e) => {
        e.preventDefault();

        try {
            const response = await api.put(`/projects/${id}/github`, {
                owner: githubOwner,
                repo: githubRepo,
                url: `https://github.com/${githubOwner}/${githubRepo}`
            });

            setProject(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    if (loading) return <div>Loading project details...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!project) return <div>Project not found</div>;

    return (
        <div className="project-detail">
            <h2>{project.name} <span className="badge bg-secondary">{project.key}</span></h2>
            <p>{project.description}</p>

            <div className="card mb-4">
                <div className="card-header">
                    <h3>Teams</h3>
                </div>
                <div className="card-body">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Team</th>
                                <th>Access Level</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {project.teams.map(teamData => (
                                <tr key={teamData.team._id}>
                                    <td>
                                        <Link to={`/teams/${teamData.team._id}`}>{teamData.team.name}</Link>
                                    </td>
                                    <td>{teamData.accessLevel}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleRemoveTeam(teamData.team._id)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <form onSubmit={handleAddTeam} className="mt-4">
                        <h4>Add Team</h4>
                        <div className="row">
                            <div className="col-md-6">
                                <TeamSelector
                                    value={selectedTeam}
                                    onChange={setSelectedTeam}
                                    excludeTeams={project.teams.map(t => t.team._id)}
                                />
                            </div>
                            <div className="col-md-3">
                                <select
                                    className="form-control"
                                    value={selectedAccessLevel}
                                    onChange={(e) => setSelectedAccessLevel(e.target.value)}
                                >
                                    <option value="read">Read</option>
                                    <option value="write">Write</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!selectedTeam}
                                >
                                    Add Team
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-header">
                    <h3>GitHub Repository</h3>
                </div>
                <div className="card-body">
                    {project.githubRepo && project.githubRepo.url ? (
                        <div className="mb-3">
                            <p>
                                Current repository:
                                <a href={project.githubRepo.url} target="_blank" rel="noopener noreferrer" className="ms-2">
                                    {project.githubRepo.owner}/{project.githubRepo.repo}
                                </a>
                            </p>
                        </div>
                    ) : (
                        <p>No GitHub repository linked to this project.</p>
                    )}

                    <form onSubmit={handleUpdateGithubRepo}>
                        <h4>Update GitHub Repository</h4>
                        <div className="row">
                            <div className="col-md-5">
                                <div className="form-group">
                                    <label htmlFor="githubOwner">Repository Owner</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="githubOwner"
                                        value={githubOwner}
                                        onChange={(e) => setGithubOwner(e.target.value)}
                                        placeholder="e.g., octocat"
                                    />
                                </div>
                            </div>
                            <div className="col-md-5">
                                <div className="form-group">
                                    <label htmlFor="githubRepo">Repository Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="githubRepo"
                                        value={githubRepo}
                                        onChange={(e) => setGithubRepo(e.target.value)}
                                        placeholder="e.g., hello-world"
                                    />
                                </div>
                            </div>
                            <div className="col-md-2 d-flex align-items-end">
                                <button
                                    type="submit"
                                    className="btn btn-primary mb-3"
                                    disabled={!githubOwner || !githubRepo}
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </form>

                    {project.githubRepo && project.githubRepo.url && (
                        <div className="mt-3">
                            <h4>GitHub Integration</h4>
                            <div className="list-group">
                                <Link
                                    to={`/github/${project.githubRepo.owner}/${project.githubRepo.repo}/pulls`}
                                    className="list-group-item list-group-item-action"
                                >
                                    View Pull Requests
                                </Link>
                                <Link
                                    to={`/github/${project.githubRepo.owner}/${project.githubRepo.repo}/contents`}
                                    className="list-group-item list-group-item-action"
                                >
                                    Browse Repository Files
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Link to="/projects" className="btn btn-secondary">Back to Projects</Link>
        </div>
    );
};

export default ProjectDetail;

