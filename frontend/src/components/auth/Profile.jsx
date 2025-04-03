import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../axiosConfig';

const Profile = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const [nameErrors, setNameErrors] = useState({
        firstName: '',
        lastName: ''
    });

    // Password validation regex patterns
    const passwordValidations = {
        minLength: /.{8,}/,
        hasUpperCase: /[A-Z]/,
        hasNumber: /\d/,
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
    };

    // Load user data into form when component mounts
    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { id, value } = e.target;

        // Name field validation (alphabets only)
        if (id === 'firstName' || id === 'lastName') {
            // Allow letters, spaces, hyphens, and apostrophes
            if (value && !/^[A-Za-z\s\-']+$/.test(value)) {
                setNameErrors({
                    ...nameErrors,
                    [id]: 'Only alphabetic characters, spaces, hyphens, and apostrophes are allowed'
                });
            } else {
                setNameErrors({
                    ...nameErrors,
                    [id]: ''
                });
            }
        }

        setFormData({
            ...formData,
            [id]: value
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.id]: e.target.value
        });
    };

    const validatePassword = (password) => {
        const errors = [];

        if (!passwordValidations.minLength.test(password)) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!passwordValidations.hasUpperCase.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!passwordValidations.hasNumber.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!passwordValidations.hasSpecialChar.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check for name validation errors
        if (nameErrors.firstName || nameErrors.lastName) {
            setError('Please fix the validation errors before submitting');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Only send fields that can be updated (username is read-only)
            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email
            };

            const response = await api.put('/users/me', updateData);

            // Update the user in context
            setUser(response.data);

            setSuccess(true);
            setLoading(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordError(null);
        setPasswordSuccess(false);

        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            setPasswordLoading(false);
            return;
        }

        // Validate password complexity
        const passwordErrors = validatePassword(passwordData.newPassword);
        if (passwordErrors.length > 0) {
            setPasswordError(passwordErrors.join('. '));
            setPasswordLoading(false);
            return;
        }

        try {
            await api.put('/users/me/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            // Clear password fields
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            setPasswordSuccess(true);
            setPasswordLoading(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setPasswordSuccess(false);
            }, 3000);
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to update password');
            setPasswordLoading(false);
        }
    };

    if (!user) return <div>Loading user data...</div>;

    return (
        <div className="row justify-content-center">
            <div className="col-md-8">
                <div className="card mb-4">
                    <div className="card-header">
                        <h2>Profile Settings</h2>
                    </div>
                    <div className="card-body">
                        {error && <div className="alert alert-danger">{error}</div>}
                        {success && <div className="alert alert-success">Profile updated successfully!</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group mb-3">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="username"
                                    value={formData.username}
                                    disabled
                                    readOnly
                                />
                                <small className="form-text text-muted">Username cannot be changed</small>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="firstName">First Name</label>
                                        <input
                                            type="text"
                                            className={`form-control ${nameErrors.firstName ? 'is-invalid' : ''}`}
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                        />
                                        {nameErrors.firstName && (
                                            <div className="invalid-feedback">{nameErrors.firstName}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="lastName">Last Name</label>
                                        <input
                                            type="text"
                                            className={`form-control ${nameErrors.lastName ? 'is-invalid' : ''}`}
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                        />
                                        {nameErrors.lastName && (
                                            <div className="invalid-feedback">{nameErrors.lastName}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group mb-3">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || nameErrors.firstName || nameErrors.lastName}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>Change Password</h3>
                    </div>
                    <div className="card-body">
                        {passwordError && <div className="alert alert-danger">{passwordError}</div>}
                        {passwordSuccess && <div className="alert alert-success">Password changed successfully!</div>}

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="form-group mb-3">
                                <label htmlFor="currentPassword">Current Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>

                            <div className="form-group mb-3">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    minLength="8"
                                />
                                <small className="form-text text-muted">
                                    Password must be at least 8 characters, include one uppercase letter,
                                    one number, and one special character.
                                </small>
                            </div>

                            <div className="form-group mb-3">
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    minLength="8"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-danger"
                                disabled={passwordLoading}
                            >
                                {passwordLoading ? 'Changing Password...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile; 