const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middlewares/auth.middleware');

// Helper to get Bitbucket credentials
const getBitbucketCredentials = (req) => {
    // Try to get from project settings first
    if (req.project && req.project.bitbucketCredentials) {
        return req.project.bitbucketCredentials;
    }

    // Then try environment variables
    if (process.env.BITBUCKET_USERNAME && process.env.BITBUCKET_APP_PASSWORD) {
        return {
            username: process.env.BITBUCKET_USERNAME,
            password: process.env.BITBUCKET_APP_PASSWORD
        };
    }

    return null;
};

// Proxy for raw Bitbucket content
router.get('/proxy/raw-content', auth, async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ message: 'URL parameter is required' });
        }

        // Validate that this is a Bitbucket URL
        if (!url.startsWith('https://bitbucket.org/') &&
            !url.includes('bitbucket')) {
            return res.status(400).json({
                message: 'Invalid URL. Only Bitbucket URLs are supported.'
            });
        }

        console.log(`Proxying Bitbucket request to: ${url}`);

        // Get Bitbucket credentials if available
        const credentials = getBitbucketCredentials(req);

        // Set up auth for Bitbucket API
        const authConfig = {};
        if (credentials) {
            authConfig.auth = {
                username: credentials.username,
                password: credentials.password
            };
        }

        const response = await axios.get(url, {
            responseType: 'text',
            ...authConfig,
            headers: {
                // Set user agent to avoid rate limiting
                'User-Agent': 'CodeReviewApp'
            }
        });

        // Set the appropriate content type based on the file extension
        const fileExtension = url.split('.').pop().toLowerCase();
        const contentTypeMap = {
            'js': 'application/javascript',
            'jsx': 'application/javascript',
            'ts': 'application/typescript',
            'tsx': 'application/typescript',
            'json': 'application/json',
            'html': 'text/html',
            'css': 'text/css',
            'md': 'text/markdown',
            'txt': 'text/plain'
        };

        const contentType = contentTypeMap[fileExtension] || 'text/plain';
        res.setHeader('Content-Type', contentType);
        res.send(response.data);

    } catch (error) {
        console.error('Bitbucket Raw Content Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || 'Error fetching Bitbucket raw content',
            url: req.query.url
        });
    }
});

module.exports = router; 