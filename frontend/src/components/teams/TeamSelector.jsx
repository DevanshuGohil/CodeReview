// components/teams/TeamSelector.jsx
import React, { useState, useEffect } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Typography,
    Box,
    Alert
} from '@mui/material';
import api from '../../axiosConfig';

const TeamSelector = ({
    value,
    onChange,
    selectedTeam,
    setSelectedTeam,
    currentTeams = [],
    excludeTeams = [],
    label = "Team",
    size = "medium",
    fullWidth = true,
    sx = {} // Add sx prop with default empty object
}) => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Support both value/onChange and selectedTeam/setSelectedTeam interfaces
    const actualValue = selectedTeam !== undefined ? selectedTeam : value;
    const handleChange = (newValue) => {
        if (setSelectedTeam) {
            setSelectedTeam(newValue);
        }
        if (onChange) {
            onChange(newValue);
        }
    };

    // Extract complex dependencies into memoized values
    const currentTeamsString = JSON.stringify(currentTeams);
    const excludeTeamsString = JSON.stringify(excludeTeams);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setLoading(true);
                const response = await api.get('/teams');

                // Filter out excluded teams and current teams
                // Use the original arrays here as they are guaranteed to be stable
                // due to the dependency array relying on stringified values.
                const teamsToExclude = [...excludeTeams, ...(currentTeams || [])];
                const filteredTeams = response.data.filter(
                    team => !teamsToExclude.includes(team._id)
                );

                setTeams(filteredTeams);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchTeams();
        // Only depend on the stringified versions to prevent infinite loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTeamsString, excludeTeamsString]);

    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">Loading teams...</Typography>
        </Box>
    );

    if (error) return (
        <Alert severity="error" sx={{ my: 1 }}>Error: {error}</Alert>
    );

    if (teams.length === 0) return (
        <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>No teams available</Typography>
    );

    return (
        <FormControl
            variant="outlined"
            size={size}
            fullWidth={fullWidth}
            sx={{
                minWidth: '250px',
                ...sx // Spread custom sx props
            }}
        >
            <InputLabel
                id="team-select-label"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
                {label}
            </InputLabel>
            <Select
                labelId="team-select-label"
                id="team-select"
                value={actualValue}
                onChange={(e) => handleChange(e.target.value)}
                label={label}
                sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.23)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                    }
                }}
            >
                <MenuItem value="">
                    <em>Select a team</em>
                </MenuItem>
                {teams.map(team => (
                    <MenuItem key={team._id} value={team._id}>
                        {team.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default TeamSelector;
