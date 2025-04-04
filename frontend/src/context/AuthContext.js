import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../axiosConfig';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [requirePasswordChange, setRequirePasswordChange] = useState(false);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            if (token) {
                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await api.get('/users/me');
                    setCurrentUser(response.data);
                } catch (error) {
                    console.error('Error fetching current user:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        fetchCurrentUser();
    }, [token]);

    const login = async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        const { token: newToken, user, requirePasswordChange: needsPasswordChange } = response.data;

        setToken(newToken);
        setCurrentUser(user);
        setRequirePasswordChange(needsPasswordChange || false);

        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        return { user, requirePasswordChange: needsPasswordChange };
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);
        const { token: newToken, user } = response.data;

        setToken(newToken);
        setCurrentUser(user);

        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        return user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
        setRequirePasswordChange(false);
        delete api.defaults.headers.common['Authorization'];
    };

    const value = {
        currentUser,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        loading,
        requirePasswordChange
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}; 