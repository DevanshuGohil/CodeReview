const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middlewares/auth.middleware');

// Get pull request details with files
router.get('/:owner/:repo/pulls/:pullNumber/complete', auth, async (req, res) => {
    try {
        const { owner, repo, pullNumber } = req.params;
        const githubToken = process.env.GITHUB_TOKEN;

        // Headers for GitHub API requests
        const headers = {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        // Fetch PR details and files in parallel
        const [prResponse, filesResponse] = await Promise.all([
            axios.get(
                `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
                { headers }
            ),
            axios.get(
                `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
                { headers, params: { per_page: 100 } } // Increase the items per page
            )
        ]);

        // Process the files to ensure patch data is available and properly formatted
        const files = filesResponse.data.map(file => {
            // Check if patch is available (might be missing for binary files or large changes)
            const patch = file.patch || '';

            // Ensure the status is standardized
            const status = file.status ? file.status.toLowerCase() : 'modified';

            return {
                ...file,
                patch,
                status
            };
        });

        // Log information about the files
        console.log(`Processing ${files.length} files for PR #${pullNumber} in ${owner}/${repo}`);
        files.forEach(file => {
            console.log(`- ${file.filename} (${file.status}): ${file.additions} additions, ${file.deletions} deletions, has patch: ${!!file.patch}`);
        });

        res.json({
            pull_request: prResponse.data,
            files
        });
    } catch (error) {
        console.error('GitHub API Error:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Response data:', JSON.stringify(error.response.data));
        }
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || 'Error fetching pull request data'
        });
    }
});

// List pull requests
router.get('/:owner/:repo/pulls', auth, async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { state = 'open' } = req.query;
        const githubToken = process.env.GITHUB_TOKEN;

        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/pulls`,
            {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                params: { state, per_page: 100 } // Increase items per page
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('GitHub API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || 'Error fetching pull requests'
        });
    }
});

// Get repository contents
router.get('/:owner/:repo/contents', auth, async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { path } = req.query; // Get path from query param
        const githubToken = process.env.GITHUB_TOKEN;

        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path || ''}`,
            {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // If response is an array, it's a directory listing
        const files = Array.isArray(response.data) ? response.data : [response.data];

        // Return a consistent response format
        res.json({
            files,
            path: path || '',
            repo: { owner, repo }
        });
    } catch (error) {
        console.error('GitHub API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || 'Error fetching repository contents'
        });
    }
});

// Get a specific file's raw content
router.get('/:owner/:repo/raw/:branch/*', auth, async (req, res) => {
    try {
        const { owner, repo, branch } = req.params;
        const path = req.params[0] || '';
        const githubToken = process.env.GITHUB_TOKEN;

        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
            {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3.raw'
                }
            }
        );

        // If the response is text, send it directly
        if (typeof response.data === 'string') {
            res.send(response.data);
        } else {
            // For binary or other types of files, send the JSON response
            res.json(response.data);
        }
    } catch (error) {
        console.error('GitHub API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            message: error.response?.data?.message || 'Error fetching file content'
        });
    }
});

module.exports = router; 