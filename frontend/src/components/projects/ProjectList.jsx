// components/projects/ProjectList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { Link } from 'react-router-dom';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await api.get('/projects');
                setProjects(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) return <div>Loading projects...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="project-list">
            <h2>Projects</h2>
            <Link to="/projects/new" className="btn btn-primary mb-3">Create New Project</Link>

            <div className="row">
                {projects.map(project => (
                    <div key={project._id} className="col-md-4 mb-4">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">{project.name} <span className="badge bg-secondary">{project.key}</span></h5>
                                <p className="card-text">{project.description}</p>
                                <p className="card-text">
                                    <small className="text-muted">
                                        Teams: {project.teams.length}
                                        {project.githubRepo?.url && (
                                            <span> | <a href={project.githubRepo.url} target="_blank" rel="noopener noreferrer">GitHub</a></span>
                                        )}
                                    </small>
                                </p>
                                <Link to={`/projects/${project._id}`} className="btn btn-info">View Details</Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectList;
