// controllers/user.controller.js
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCurrentUser = async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;

        user.updatedAt = Date.now();

        await user.save();

        // Return user without password
        const updatedUser = await User.findById(req.user.id).select('-password');

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { firstName, lastName, email, role } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;
        if (role) user.role = role;

        user.updatedAt = Date.now();

        await user.save();

        // Return user without password
        const updatedUser = await User.findById(req.params.id).select('-password');

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        // Check if role is valid
        if (!['admin', 'manager', 'developer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be admin, manager, or developer' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update role
        user.role = role;
        user.updatedAt = Date.now();

        await user.save();

        // Return user without password
        const updatedUser = await User.findById(req.params.id).select('-password');

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.remove();

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate inputs
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        // Find user by ID
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.updatedAt = Date.now();

        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.importUsersFromCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No CSV file uploaded' });
        }

        const { adminPassword, managerPassword, developerPassword } = req.body;

        if (!adminPassword || !managerPassword || !developerPassword) {
            return res.status(400).json({ message: 'Passwords for all roles are required' });
        }

        console.log('Processing CSV import with file:', req.file.originalname);

        const results = [];
        const errors = [];
        let successCount = 0;

        // Create a readable stream from the buffer
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        const processCSV = () => {
            return new Promise((resolve, reject) => {
                bufferStream
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve())
                    .on('error', (error) => reject(error));
            });
        };

        await processCSV();

        console.log(`Parsed ${results.length} rows from CSV`);

        // Process each row
        for (const row of results) {
            try {
                // Validate required fields
                if (!row.firstName || !row.lastName || !row.username || !row.email || !row.role) {
                    errors.push(`Missing required fields for ${row.email || 'unknown user'}`);
                    continue;
                }

                // Check if role is valid
                if (!['admin', 'manager', 'developer'].includes(row.role)) {
                    errors.push(`Invalid role '${row.role}' for ${row.email}`);
                    continue;
                }

                // Check if user already exists
                const existingUser = await User.findOne({
                    $or: [
                        { email: row.email },
                        { username: row.username }
                    ]
                });

                if (existingUser) {
                    errors.push(`User with email ${row.email} or username ${row.username} already exists`);
                    continue;
                }

                // Determine password based on role
                let password;
                switch (row.role) {
                    case 'admin':
                        password = adminPassword;
                        break;
                    case 'manager':
                        password = managerPassword;
                        break;
                    default:
                        password = developerPassword;
                }

                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Create new user
                const newUser = new User({
                    firstName: row.firstName,
                    lastName: row.lastName,
                    username: row.username,
                    email: row.email,
                    role: row.role,
                    password: hashedPassword,
                    requirePasswordChange: true // Flag to indicate password change on first login
                });

                await newUser.save();
                successCount++;
                console.log(`Created user: ${row.username} (${row.role})`);
            } catch (err) {
                console.error(`Error processing user ${row.email}:`, err);
                errors.push(`Error processing user ${row.email}: ${err.message}`);
            }
        }

        res.json({
            success: successCount,
            total: results.length,
            errors
        });
    } catch (error) {
        console.error('CSV import error:', error);
        res.status(500).json({ message: error.message });
    }
};
