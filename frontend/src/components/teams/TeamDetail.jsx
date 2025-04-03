// components/teams/TeamDetail.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';
import { useParams, Link } from 'react-router-dom';
import UserSelector from '../users/UserSelector';

const TeamDetail = () => {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedRole, setSelectedRole] = useState('member');
    const { id } = useParams();

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/teams/${id}`);
                setTeam(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchTeam();
    }, [id]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await api.post(`/teams/${id}/members`, {
                userId: selectedUser,
                role: selectedRole
            });

            setTeam(response.data);
            setSelectedUser('');
            setSuccessMessage('User successfully added to the team!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleRemoveMember = async (userId, userName) => {
        setError(null);
        setSuccessMessage(null);

        // Show confirmation dialog
        if (!window.confirm(`Are you sure you want to remove ${userName} from the team?`)) {
            return;
        }

        try {
            const response = await api.delete(`/teams/${id}/members/${userId}`);
            setTeam(response.data);
            setSuccessMessage('User successfully removed from the team!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    if (loading) return <div>Loading team details...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!team) return <div>Team not found</div>;

    return (
        <div className="team-detail">
            <h2>{team.name}</h2>
            <p>{team.description}</p>

            {error && <div className="alert alert-danger">{error}</div>}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}

            <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h3>Team Members</h3>
                    <span className="badge bg-primary">{team.members.length} {team.members.length === 1 ? 'Member' : 'Members'}</span>
                </div>
                <div className="card-body">
                    {team.members.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {team.members.map(member => (
                                    <tr key={member.user._id}>
                                        <td>
                                            {member.user.firstName} {member.user.lastName} ({member.user.email})
                                        </td>
                                        <td>{member.role}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleRemoveMember(
                                                    member.user._id,
                                                    `${member.user.firstName} ${member.user.lastName}`
                                                )}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="alert alert-info">
                            This team has no members yet. Add members using the form below.
                        </div>
                    )}

                    <form onSubmit={handleAddMember} className="mt-4">
                        <h4>Add Member</h4>
                        <div className="row">
                            <div className="col-md-6">
                                <UserSelector
                                    value={selectedUser}
                                    onChange={setSelectedUser}
                                    excludeUsers={team.members.map(member => member.user._id)}
                                />
                            </div>
                            <div className="col-md-3">
                                <select
                                    className="form-control"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    <option value="member">Member</option>
                                    <option value="leader">Team Leader</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!selectedUser}
                                >
                                    Add to Team
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <Link to="/teams" className="btn btn-secondary">Back to Teams</Link>
        </div>
    );
};

export default TeamDetail;
