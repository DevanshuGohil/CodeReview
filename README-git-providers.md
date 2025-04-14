# Git Provider Integration Documentation

This document explains the changes made to fix CORS and network errors when accessing raw content from Git providers (GitHub, GitLab, Bitbucket).

## Problem

The application was encountering network errors when trying to directly access URLs like:
```
https://raw.githubusercontent.com/angular/angular/main/modules/benchmarks/src/README.md
```

This was due to CORS (Cross-Origin Resource Sharing) restrictions that prevent client-side JavaScript from directly accessing resources from different domains.

## Solution

We implemented the following changes to resolve the issue:

1. **Backend API Proxies**:
   - Created proxy endpoints in our backend API server for each Git provider
   - The proxy routes forward requests to the Git provider's API and handle authentication
   - Routes created: 
     - `/api/github/proxy/raw-content`
     - `/api/gitlab/proxy/raw-content`
     - `/api/bitbucket/proxy/raw-content`

2. **Frontend Integration**:
   - Updated the axios config to include a `fetchRawFile` utility
   - Modified the `RepositoryFiles` component to use the proxy endpoints instead of direct requests
   - Added provider detection to use the correct endpoint based on the project's Git provider

3. **Authentication Handling**:
   - Added support for different authentication methods for each provider
   - GitHub: OAuth token via `GITHUB_TOKEN` environment variable
   - GitLab: Private token via `GITLAB_TOKEN` environment variable
   - Bitbucket: App password via `BITBUCKET_USERNAME` and `BITBUCKET_APP_PASSWORD` environment variables

## Files Modified

1. **Backend**:
   - `backend/routes/github.routes.js` - Added proxy endpoint for GitHub
   - `backend/routes/gitlab.routes.js` - Created new file for GitLab routes
   - `backend/routes/bitbucket.routes.js` - Created new file for Bitbucket routes
   - `backend/server.js` - Updated to include new routes

2. **Frontend**:
   - `frontend/src/axiosConfig.js` - Added utility functions for fetching raw content
   - `frontend/src/components/github/RepositoryFiles.jsx` - Updated to use proxied requests
   - `frontend/src/components/providers/ProviderSelector.jsx` - Created provider selection component
   - `frontend/public/assets/` - Added SVG icons for GitLab and Bitbucket

## How to Use

To fetch raw file content from any Git provider:

```javascript
// Using the utility function
const response = await api.fetchRawFile(fileUrl);
const content = response.data;

// Or using the specific provider endpoint
const response = await api.get(`/github/proxy/raw-content`, {
    params: { url: fileUrl }
});
const content = response.data;
```

## Configuration

Add the following environment variables to your `.env` file:

```
# GitHub Authentication
GITHUB_TOKEN=your_github_token

# GitLab Authentication
GITLAB_TOKEN=your_gitlab_token

# Bitbucket Authentication
BITBUCKET_USERNAME=your_bitbucket_username
BITBUCKET_APP_PASSWORD=your_bitbucket_app_password
```

## Important Notes

1. For security reasons, the proxy validates that URLs being requested are from legitimate Git provider domains (github.com, gitlab.com, bitbucket.org).
2. The proxy automatically sets appropriate content types based on file extensions.
3. Error handling has been improved to provide more detailed diagnostics when a file cannot be loaded.
4. Authorization headers are properly managed to avoid sending GitHub tokens to GitLab or Bitbucket, and vice versa. 