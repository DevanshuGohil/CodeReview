// components/teams/TeamList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { Link } from 'react-router-dom';

const TeamList = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setLoading(true);
                const response = await api.get('/teams');
                setTeams(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    if (loading) return <div>Loading teams...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="team-list">
            <h2>Teams</h2>
            <Link to="/teams/new" className="btn btn-primary mb-3">Create New Team</Link>

            <div className="row">
                {teams.map(team => (
                    <div key={team._id} className="col-md-4 mb-4">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">{team.name}</h5>
                                <p className="card-text">{team.description}</p>
                                <p className="card-text"><small className="text-muted">Members: {team.members.length}</small></p>
                                <Link to={`/teams/${team._id}`} className="btn btn-info">View Details</Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamList;
