// components/projects/ProjectForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import TeamSelector from '../teams/TeamSelector';
import { useAuth } from '../../context/AuthContext';

const ProjectForm = () => {
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [description, setDescription] = useState('');
    const [teams, setTeams] = useState([]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [githubOwner, setGithubOwner] = useState('');
    const [githubRepo, setGithubRepo] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await api.get('/teams');
                setTeams(response.data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchTeams();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Format teams for API
            const formattedTeams = selectedTeams.map(teamId => ({
                team: teamId,
                accessLevel: 'read'
            }));

            // Format GitHub repo data
            const githubRepoData = {};
            if (githubOwner && githubRepo) {
                githubRepoData.owner = githubOwner;
                githubRepoData.repo = githubRepo;
                githubRepoData.url = `https://github.com/${githubOwner}/${githubRepo}`;
            }

            await api.post('/projects', {
                name,
                key,
                description,
                teams: formattedTeams,
                githubRepo: githubRepoData
            });

            navigate('/projects');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleTeamSelect = (teamId) => {
        if (selectedTeams.includes(teamId)) {
            setSelectedTeams(selectedTeams.filter(id => id !== teamId));
        } else {
            setSelectedTeams([...selectedTeams, teamId]);
        }
    };

    // Auto-generate key from project name
    const handleNameChange = (e) => {
        const newName = e.target.value;
        setName(newName);

        // Generate key from name (uppercase, no spaces)
        if (!key || key === name.toUpperCase().replace(/\s+/g, '')) {
            setKey(newName.toUpperCase().replace(/\s+/g, ''));
        }
    };

    return (
        <div className="project-form">
            <h2>Create New Project</h2>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                    <label htmlFor="name">Project Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        value={name}
                        onChange={handleNameChange}
                        required
                    />
                </div>

                <div className="form-group mb-3">
                    <label htmlFor="key">Project Key</label>
                    <input
                        type="text"
                        className="form-control"
                        id="key"
                        value={key}
                        onChange={(e) => setKey(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                        required
                        maxLength="10"
                    />
                    <small className="form-text text-muted">
                        A short, unique identifier for this project (e.g., PROJ, TEST)
                    </small>
                </div>

                <div className="form-group mb-3">
                    <label htmlFor="description">Description</label>
                    <textarea
                        className="form-control"
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="3"
                    ></textarea>
                </div>

                <div className="form-group mb-3">
                    <label>Teams</label>
                    <div className="card">
                        <div className="card-body">
                            {teams.length === 0 ? (
                                <p>No teams available. <a href="/teams/new">Create a team</a> first.</p>
                            ) : (
                                <div className="row">
                                    {teams.map(team => (
                                        <div key={team._id} className="col-md-4 mb-2">
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id={`team-${team._id}`}
                                                    checked={selectedTeams.includes(team._id)}
                                                    onChange={() => handleTeamSelect(team._id)}
                                                />
                                                <label className="form-check-label" htmlFor={`team-${team._id}`}>
                                                    {team.name}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card mb-3">
                    <div className="card-header">
                        GitHub Repository
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
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
                            <div className="col-md-6">
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
                        </div>
                        <small className="form-text text-muted mt-2">
                            Optional: Link a GitHub repository to this project for PR reviews and code integration
                        </small>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary">Create Project</button>
            </form>
        </div>
    );
};

export default ProjectForm;
