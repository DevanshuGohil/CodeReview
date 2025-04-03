import axios from 'axios';

// Create and configure the axios instance
const api = axios.create({
    baseURL: 'http://localhost:4000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        // Add auth token to requests if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // Handle 401 Unauthorized errors (token expired or invalid)
        if (error.response && error.response.status === 401) {
            console.log('Unauthorized request. Clearing token.');
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];

            // If you have access to the router, you could redirect to login
            // window.location.href = '/login';
        }

        // Handle rate limiting
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 1;
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return api(error.config);
        }

        return Promise.reject(error);
    }
);

export default api; 