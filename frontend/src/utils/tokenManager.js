/**
 * Utility for managing authentication tokens
 */

// Get the token from localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

// Set token in localStorage
const setToken = (token) => {
    localStorage.setItem('token', token);
};

// Remove token from localStorage
const removeToken = () => {
    localStorage.removeItem('token');
};

// Check if a token exists
const hasToken = () => {
    return !!getToken();
};

// Get the authentication header for API requests
const getAuthHeader = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get user ID from token (if using JWT)
const getUserId = () => {
    const token = getToken();
    if (!token) return null;

    try {
        // Parse JWT token payload (assumes JWT format)
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || null;
    } catch (error) {
        console.error('Error parsing token:', error);
        return null;
    }
};

// Export all functions
export default {
    getToken,
    setToken,
    removeToken,
    hasToken,
    getAuthHeader,
    getUserId
}; 