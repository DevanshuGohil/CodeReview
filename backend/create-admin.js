// create-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user.model');

// Admin user details - you can change these
const adminUser = {
    username: 'admin',
    email: 'admin@example.com',
    password: 'Admin@123', // You should change this to a secure password
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
};

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atlassian-clone');
        console.log('Connected to MongoDB');
        return true;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        return false;
    }
};

// Create admin user
const createAdminUser = async () => {
    try {
        // Check if admin user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: adminUser.email },
                { username: adminUser.username }
            ]
        });

        if (existingUser) {
            if (existingUser.role === 'admin') {
                console.log('Admin user already exists');
                return;
            } else {
                // Update existing user to admin
                existingUser.role = 'admin';
                await existingUser.save();
                console.log('Existing user updated to admin role');
                return;
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminUser.password, salt);

        // Create new admin user
        const newAdmin = new User({
            ...adminUser,
            password: hashedPassword
        });

        await newAdmin.save();
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Failed to create admin user:', error);
    }
};

// Main function
const main = async () => {
    const connected = await connectDB();
    if (connected) {
        await createAdminUser();
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the script
main(); 