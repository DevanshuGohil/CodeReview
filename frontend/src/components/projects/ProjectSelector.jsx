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

const ProjectSelector = ({ value, onChange, excludeProjects = [], label = "Project", size = "medium", fullWidth = true }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await api.get('/projects');

                // Filter out excluded projects
                const filteredProjects = response.data.filter(
                    project => !excludeProjects.includes(project._id)
                );

                setProjects(filteredProjects);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProjects();
    }, [excludeProjects]);

    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">Loading projects...</Typography>
        </Box>
    );

    if (error) return (
        <Alert severity="error" sx={{ my: 1 }}>Error: {error}</Alert>
    );

    if (projects.length === 0) return (
        <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>No projects available</Typography>
    );

    return (
        <FormControl variant="outlined" size={size} fullWidth={fullWidth}>
            <InputLabel id="project-select-label">{label}</InputLabel>
            <Select
                labelId="project-select-label"
                id="project-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                label={label}
            >
                <MenuItem value="">
                    <em>Select a project</em>
                </MenuItem>
                {projects.map(project => (
                    <MenuItem key={project._id} value={project._id}>
                        {project.name} {project.key && `(${project.key})`}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default ProjectSelector; 