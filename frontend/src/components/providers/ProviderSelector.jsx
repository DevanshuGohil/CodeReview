import React from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import Icon from '@mui/material/Icon';

// Custom icons for GitLab and Bitbucket
const GitLabIcon = () => (
    <Icon>
        <img
            src="/assets/gitlab-icon.svg"
            alt="GitLab"
            style={{ width: '24px', height: '24px' }}
        />
    </Icon>
);

const BitbucketIcon = () => (
    <Icon>
        <img
            src="/assets/bitbucket-icon.svg"
            alt="Bitbucket"
            style={{ width: '24px', height: '24px' }}
        />
    </Icon>
);

const providers = [
    { id: 'github', name: 'GitHub', icon: <GitHubIcon /> },
    { id: 'gitlab', name: 'GitLab', icon: <GitLabIcon /> },
    { id: 'bitbucket', name: 'Bitbucket', icon: <BitbucketIcon /> }
];

const ProviderSelector = ({
    value,
    onChange,
    label = "Git Provider",
    size = "medium",
    fullWidth = true,
    disabled = false
}) => {
    return (
        <FormControl variant="outlined" size={size} fullWidth={fullWidth} disabled={disabled}>
            <InputLabel id="provider-select-label">{label}</InputLabel>
            <Select
                labelId="provider-select-label"
                id="provider-select"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                label={label}
            >
                <MenuItem value="">
                    <em>Select a provider</em>
                </MenuItem>
                {providers.map(provider => (
                    <MenuItem key={provider.id} value={provider.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {provider.icon}
                            <Typography sx={{ ml: 1 }}>{provider.name}</Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default ProviderSelector; 