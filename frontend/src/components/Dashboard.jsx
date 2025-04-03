// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return; // Only fetch if user is authenticated

            try {
                setLoading(true);
                console.log('Fetching dashboard data for user:', user);

                // Fetch projects and teams in parallel
                const [projectsRes, teamsRes] = await Promise.all([
                    api.get('/projects'),
                    api.get('/teams')
                ]);

                console.log('Teams API response:', teamsRes.data);
                setProjects(projectsRes.data);
                setTeams(teamsRes.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err.message || 'Failed to load dashboard data');
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (!user) return <div>Please log in to view your dashboard.</div>;
    if (loading) return <div>Loading dashboard...</div>;
    if (error) return <div>Error: {error}</div>;

    // Find teams where the user is a member
    // This is a simpler approach with explicit logging for debugging
    const userTeams = [];

    if (teams.length > 0) {
        console.log('Filtering teams for user:', user._id);

        for (const team of teams) {
            console.log(`Checking team "${team.name}" (${team._id})`, team);

            // Check if team has members array
            if (!team.members || !Array.isArray(team.members)) {
                console.log(`- Team has no members array or it's not an array`);
                continue;
            }

            let isUserInTeam = false;

            // Check each member
            for (const member of team.members) {
                console.log('- Checking member:', member);

                let memberId = null;

                // Handle different formats of user reference
                if (member.user && typeof member.user === 'object' && member.user._id) {
                    memberId = member.user._id;
                } else if (member.user && typeof member.user === 'string') {
                    memberId = member.user;
                }

                console.log(`  - Member ID: ${memberId}, User ID: ${user._id}`);

                if (memberId === user._id) {
                    console.log(`  - MATCH FOUND: User is a member of team "${team.name}"`);
                    isUserInTeam = true;
                    break;
                }
            }

            if (isUserInTeam) {
                userTeams.push(team);
            }
        }
    }

    console.log('User teams:', userTeams);

    return (
        <div className="dashboard">
            <div className="row mb-4">
                <div className="col-md-8">
                    <h1>Welcome, {user?.firstName || user?.username}!</h1>
                </div>
                <div className="col-md-4 text-end">
                    {user?.role === 'admin' && (
                        <div className="btn-group">
                            <Link to="/projects/new" className="btn btn-primary me-2">New Project</Link>
                            <Link to="/teams/new" className="btn btn-success">New Team</Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="row">
                <div className="col-md-8">
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h3 className="mb-0">Recent Projects</h3>
                            <Link to="/projects" className="btn btn-sm btn-outline-primary">View All</Link>
                        </div>
                        <div className="card-body">
                            {projects.length === 0 ? (
                                <p>No projects found. {user?.role === 'admin' && <Link to="/projects/new">Create one</Link>}</p>
                            ) : (
                                <div className="list-group">
                                    {projects.slice(0, 5).map(project => (
                                        <Link
                                            key={project._id}
                                            to={`/projects/${project._id}`}
                                            className="list-group-item list-group-item-action"
                                        >
                                            <div className="d-flex w-100 justify-content-between">
                                                <h5 className="mb-1">{project.name} <span className="badge bg-secondary">{project.key}</span></h5>
                                                <small>{new Date(project.updatedAt).toLocaleDateString()}</small>
                                            </div>
                                            <p className="mb-1">{project.description}</p>
                                            <small>Teams: {project.teams ? project.teams.length : 0}</small>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h3 className="mb-0">My Teams</h3>
                            <Link to="/teams" className="btn btn-sm btn-outline-primary">View All</Link>
                        </div>
                        <div className="card-body">
                            {/* Debug info */}
                            <div className="mb-3 text-muted">
                                <small>Total teams: {teams.length}, User teams: {userTeams.length}</small>
                            </div>

                            {teams.length === 0 ? (
                                <p>No teams found. {user?.role === 'admin' && <Link to="/teams/new">Create one</Link>}</p>
                            ) : userTeams.length === 0 ? (
                                <p>You're not a member of any team. {user?.role === 'admin' && <Link to="/teams/new">Create one</Link>}</p>
                            ) : (
                                <div className="list-group">
                                    {userTeams.map(team => (
                                        <Link
                                            key={team._id}
                                            to={`/teams/${team._id}`}
                                            className="list-group-item list-group-item-action"
                                        >
                                            {team.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="mb-0">Quick Links</h3>
                        </div>
                        <div className="card-body">
                            <div className="list-group">
                                <Link to="/projects" className="list-group-item list-group-item-action">
                                    All Projects
                                </Link>
                                <Link to="/teams" className="list-group-item list-group-item-action">
                                    All Teams
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
