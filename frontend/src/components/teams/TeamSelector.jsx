// components/teams/TeamSelector.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';

const TeamSelector = ({ value, onChange, excludeTeams = [] }) => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setLoading(true);
                const response = await api.get('/teams');

                // Filter out excluded teams
                const filteredTeams = response.data.filter(
                    team => !excludeTeams.includes(team._id)
                );

                setTeams(filteredTeams);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchTeams();
    }, [excludeTeams]);

    if (loading) return <div className="form-control">Loading teams...</div>;
    if (error) return <div className="form-control text-danger">Error: {error}</div>;
    if (teams.length === 0) return <div className="form-control">No teams available</div>;

    return (
        <select
            className="form-control"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">Select a team</option>
            {teams.map(team => (
                <option key={team._id} value={team._id}>
                    {team.name}
                </option>
            ))}
        </select>
    );
};

export default TeamSelector;
