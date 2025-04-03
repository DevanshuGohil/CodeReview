// components/users/UserSelector.jsx
import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';

const UserSelector = ({ value, onChange, excludeUsers = [] }) => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await api.get('/users');

                // Filter out excluded users
                const filteredUsers = response.data.filter(
                    user => !excludeUsers.includes(user._id)
                );

                setUsers(filteredUsers);
                setFilteredUsers(filteredUsers);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchUsers();
    }, [excludeUsers]);

    // Filter users based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredUsers(users);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = users.filter(user =>
                (user.firstName && user.firstName.toLowerCase().includes(term)) ||
                (user.lastName && user.lastName.toLowerCase().includes(term)) ||
                (user.email && user.email.toLowerCase().includes(term)) ||
                (user.username && user.username.toLowerCase().includes(term))
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, users]);

    if (loading) return <div className="form-control">Loading users...</div>;
    if (error) return <div className="form-control text-danger">Error: {error}</div>;
    if (users.length === 0) return <div className="form-control">No users available</div>;

    return (
        <div>
            <div className="input-group mb-2">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setSearchTerm('')}
                    >
                        Clear
                    </button>
                )}
            </div>
            <select
                className="form-control"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">Select a user</option>
                {filteredUsers.map(user => (
                    <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.email})
                    </option>
                ))}
            </select>
            {filteredUsers.length === 0 && searchTerm && (
                <small className="text-muted">No users match your search</small>
            )}
        </div>
    );
};

export default UserSelector;
