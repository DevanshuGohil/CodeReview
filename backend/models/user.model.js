// models/user.model.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: true,
        // Password requirements enforced in auth.controller.js:
        // - At least 8 characters long
        // - Contains at least one special character
        // - Contains at least one number
        // - Contains at least one alphabet character
    },
    firstName: { type: String },
    lastName: { type: String },
    role: { type: String, enum: ['admin', 'manager', 'developer'], default: 'developer' },
    avatar: { type: String },
    requirePasswordChange: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to ensure email is always stored in lowercase
UserSchema.pre('save', function (next) {
    if (this.email) {
        this.email = this.email.toLowerCase();
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);
