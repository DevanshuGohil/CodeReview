const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// GitHub API constants
const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Middleware
app.use(express.json());

// Helper function for GitHub API requests
async function githubRequest(endpoint) {
    return axios.get(`${GITHUB_API_URL}${endpoint}`, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Node.js GitHub Integration'
        }
    });
}

// Index route
app.get('/', (req, res) => {
    res.json({
        message: 'GitHub PR Service API',
        endpoints: [
            '/api/github/:owner/:repo/contents - List files in a repository',
            '/api/github/:owner/:repo/pulls - List all pull requests',
            '/api/github/:owner/:repo/pulls/:pull_number - Get PR details',
            '/api/github/:owner/:repo/pulls/:pull_number/files - Get PR file changes',
            '/api/github/:owner/:repo/pulls/:pull_number/complete - Get complete PR data'
        ]
    });
});

// Route to list files in a repository (at the root or a specific path)
app.get('/api/github/:owner/:repo/contents', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { path = '' } = req.query; // Optional path parameter

        const response = await githubRequest(`/repos/${owner}/${repo}/contents/${path}`);

        // Process the response to make it more readable
        const files = response.data.map(item => ({
            name: item.name,
            path: item.path,
            type: item.type, // 'file' or 'dir'
            size: item.size,
            url: item.html_url,
            download_url: item.download_url
        }));

        res.json({
            repository: `${owner}/${repo}`,
            path: path || 'root',
            files
        });
    } catch (error) {
        console.error('Error fetching repository contents:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.message || 'Something went wrong!'
        });
    }
});

// Route to fetch all pull requests for a repository
app.get('/api/github/:owner/:repo/pulls', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { state = 'open' } = req.query; // Default to open PRs, can be 'all', 'open', or 'closed'

        const response = await githubRequest(`/repos/${owner}/${repo}/pulls?state=${state}`);

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching pull requests:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.message || 'Something went wrong!'
        });
    }
});

// Route to fetch a specific pull request with details
app.get('/api/github/:owner/:repo/pulls/:pull_number', async (req, res) => {
    try {
        const { owner, repo, pull_number } = req.params;

        const prResponse = await githubRequest(`/repos/${owner}/${repo}/pulls/${pull_number}`);

        res.json(prResponse.data);
    } catch (error) {
        console.error('Error fetching pull request details:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.message || 'Something went wrong!'
        });
    }
});

// Route to fetch file changes for a specific pull request
app.get('/api/github/:owner/:repo/pulls/:pull_number/files', async (req, res) => {
    try {
        const { owner, repo, pull_number } = req.params;

        const filesResponse = await githubRequest(`/repos/${owner}/${repo}/pulls/${pull_number}/files`);

        // Process the files to extract relevant information
        const processedFiles = filesResponse.data.map(file => ({
            filename: file.filename,
            status: file.status, // 'added', 'removed', 'modified', 'renamed', 'copied', 'changed', or 'unchanged'
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
            blob_url: file.blob_url,
            raw_url: file.raw_url,
            contents_url: file.contents_url,
            patch: file.patch // The actual diff content showing changes
        }));

        res.json(processedFiles);
    } catch (error) {
        console.error('Error fetching pull request files:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.message || 'Something went wrong!'
        });
    }
});

// Route to fetch both PR details and file changes in one request
app.get('/api/github/:owner/:repo/pulls/:pull_number/complete', async (req, res) => {
    try {
        const { owner, repo, pull_number } = req.params;

        // Make parallel requests for PR details and files
        const [prResponse, filesResponse] = await Promise.all([
            githubRequest(`/repos/${owner}/${repo}/pulls/${pull_number}`),
            githubRequest(`/repos/${owner}/${repo}/pulls/${pull_number}/files`)
        ]);

        // Process the files to extract relevant information
        const processedFiles = filesResponse.data.map(file => ({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
            blob_url: file.blob_url,
            raw_url: file.raw_url,
            patch: file.patch
        }));

        // Combine PR details with file changes
        const completeData = {
            pull_request: prResponse.data,
            files: processedFiles
        };

        res.json(completeData);
    } catch (error) {
        console.error('Error fetching complete pull request data:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.message || 'Something went wrong!'
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`GitHub PR Service running on port ${port}`);
    console.log(`Visit http://localhost:${port} to see available endpoints`);
});
