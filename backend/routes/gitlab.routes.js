const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middlewares/auth.middleware');

// Helper to get GitLab token
const getGitLabToken = (req) => {
    // Try to get from project settings first
    if (req.project && req.project.gitlabToken) {
        return req.project.gitlabToken;
    }

    // Then try environment variable
    return process.env.GITLAB_TOKEN;
};

// Proxy for raw GitLab content
router.get('/proxy/raw-content', auth, async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ message: 'URL parameter is required' });
        }

        // Validate that this is a GitLab URL
        if (!url.startsWith('https://gitlab.com/') &&
            !url.includes('gitlab')) {
            return res.status(400).json({
                message: 'Invalid URL. Only GitLab URLs are supported.'
            });
        }

        console.log(`Proxying GitLab request to: ${url}`);

        // Get GitLab token - private GitLab repos need authentication
        const gitlabToken = getGitLabToken(req);

        const response = await axios.get(url, {
            responseType: 'text',
            headers: {
                // Add GitLab token if available
                ...(gitlabToken && { 'PRIVATE-TOKEN': gitlabToken }),
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
        console.error('GitLab Raw Content Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || 'Error fetching GitLab raw content',
            url: req.query.url
        });
    }
});

module.exports = router; 