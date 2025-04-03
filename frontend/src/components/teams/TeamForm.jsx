// components/teams/TeamForm.jsx
import React, { useState } from 'react';
import api from '../../axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TeamForm = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.post('/teams', { name, description });
            navigate('/teams');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="team-form">
            <h2>Create New Team</h2>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                    <label htmlFor="name">Team Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
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

                <button type="submit" className="btn btn-primary">Create Team</button>
            </form>
        </div>
    );
};

export default TeamForm;
