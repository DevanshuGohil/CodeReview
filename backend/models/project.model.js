// models/project.model.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    description: { type: String },
    teams: [{
        team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        accessLevel: { type: String, enum: ['read', 'write', 'admin'], default: 'read' }
    }],
    githubRepo: {
        owner: { type: String },
        repo: { type: String },
        url: { type: String }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);
