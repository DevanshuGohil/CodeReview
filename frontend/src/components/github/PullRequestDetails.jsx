import React from 'react';

const PullRequestDetails = ({ pullRequest }) => {
    // Handle the case when pullRequest is undefined
    if (!pullRequest) {
        return <div className="pr-details">Loading pull request details...</div>;
    }

    return (
        <div className="pr-details">
            <h2>#{pullRequest.number}: {pullRequest.title}</h2>

            <div className="pr-meta">
                <div className="pr-author">
                    <img src={pullRequest.user.avatar_url} alt={pullRequest.user.login} width="40" />
                    <span>{pullRequest.user.login}</span>
                </div>

                <div className="pr-stats">
                    <span className="pr-state" style={{
                        backgroundColor: pullRequest.state === 'open' ? '#2cbe4e' : '#cb2431'
                    }}>
                        {pullRequest.state}
                    </span>
                    <span>{pullRequest.commits} commits</span>
                    <span>{pullRequest.changed_files} files changed</span>
                    <span>+{pullRequest.additions} -{pullRequest.deletions}</span>
                </div>
            </div>

            {/* <div className="pr-description">
                {pullRequest.body || 'No description provided.'}
            </div> */}
        </div>
    );
};

export default PullRequestDetails;
