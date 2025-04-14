// controllers/auth.controller.js
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');

// Password validation function
const validatePassword = (password) => {
    const errors = [];

    // Check length
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    // Check for number
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Check for alphabet
    if (!/[a-zA-Z]/.test(password)) {
        errors.push('Password must contain at least one letter');
    }

    return errors;
};

exports.register = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
            console.log(`[${new Date().toISOString()}] Registration failed - Email already exists: ${email} from IP: ${ip}`);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Check if username is taken
        user = await User.findOne({ username });

        if (user) {
            console.log(`[${new Date().toISOString()}] Registration failed - Username already taken: ${username} from IP: ${ip}`);
            return res.status(400).json({ message: 'Username is already taken' });
        }

        // Validate password
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            console.log(`[${new Date().toISOString()}] Registration failed - Password validation failed for ${email} from IP: ${ip}`);
            return res.status(400).json({
                message: 'Password does not meet requirements',
                errors: passwordErrors
            });
        }

        // Create new user
        user = new User({
            username,
            email,
            password,
            firstName,
            lastName,
            role: 'developer' // Default role
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Create JWT token
        const payload = {
            id: user.id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );

        // Return user without password
        const userResponse = await User.findById(user.id).select('-password');

        // Log successful registration
        console.log(`[${new Date().toISOString()}] New user registered: ${username} (${email}), ID: ${user.id}, IP: ${ip}`);

        // Send welcome email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
            try {
                await emailService.sendWelcomeEmail(user);
                console.log(`Welcome email sent to ${email}`);
            } catch (err) {
                console.error(`Failed to send welcome email to ${email}:`, err);
                // Don't fail registration if email fails
            }
        }

        res.status(201).json({
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Get IP address from request
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Check if user exists
        const user = await User.findOne({
            $or: [
                { username },
                { email: username }
            ]
        });

        if (!user) {
            console.log(`[${new Date().toISOString()}] Failed login attempt for username: ${username} from IP: ${ip}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log(`[${new Date().toISOString()}] Failed login attempt for user: ${user.username} (${user.email}) from IP: ${ip}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const payload = {
            id: user.id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );

        // Return user without password
        const userResponse = await User.findById(user.id).select('-password');

        // Log successful login
        console.log(`[${new Date().toISOString()}] User logged in: ${user.username} (${user.email}), Role: ${user.role}, IP: ${ip}`);

        res.json({
            token,
            user: userResponse,
            requirePasswordChange: user.requirePasswordChange
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('username email');
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Log logout
        if (user) {
            console.log(`[${new Date().toISOString()}] User logged out: ${user.username} (${user.email}), IP: ${ip}`);
        } else {
            console.log(`[${new Date().toISOString()}] User logged out: ID ${req.user.id}, IP: ${ip}`);
        }

        // JWT tokens are stateless, so we can't invalidate them on the server
        // The client should remove the token from local storage
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Find user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Validate new password
        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            return res.status(400).json({
                message: 'Password does not meet requirements',
                errors: passwordErrors
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Reset the requirePasswordChange flag
        if (user.requirePasswordChange) {
            user.requirePasswordChange = false;
        }

        user.updatedAt = Date.now();

        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
