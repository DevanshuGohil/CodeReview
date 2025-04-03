// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../axiosConfig'; // Import our configured axios instance

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Start with loading true
    const [error, setError] = useState(null);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Set the token in axios default headers
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    const response = await api.get('/auth/me');
                    console.log('User data from /auth/me:', response.data);
                    setUser(response.data);
                } catch (err) {
                    console.error('Auth verification failed:', err);
                    localStorage.removeItem('token');
                    delete api.defaults.headers.common['Authorization'];
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const register = async (userData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post('/auth/register', userData);

            // Store the token in localStorage
            localStorage.setItem('token', response.data.token);

            // Set the token in axios default headers
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

            setUser(response.data.user);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post('/auth/login', { email, password });

            // Store the token in localStorage
            localStorage.setItem('token', response.data.token);

            // Set the token in axios default headers
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

            setUser(response.data.user);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        // Remove the token from localStorage
        localStorage.removeItem('token');

        // Remove the token from axios default headers
        delete api.defaults.headers.common['Authorization'];

        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            loading,
            error,
            isAuthenticated: !!user,
            register,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
