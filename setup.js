#!/usr/bin/env node

/**
 * CodeReview Project Setup Script
 * 
 * This script automates the setup of the CodeReview project
 * Works on both Windows and Unix-based systems (Mac/Linux)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Configuration
const config = {
    dbName: 'codereview',
    frontendPort: 3000,
    backendPort: 4000,
    adminUser: {
        username: 'admin',
        email: 'admin@example.com',
        password: 'Admin@123',
        firstName: 'Admin',
        lastName: 'User'
    },
    // Default Atlas connection string (will be replaced with user input)
    mongoAtlasUri: '',
    // Email configuration (will be updated with user input)
    email: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        user: '',
        password: ''
    }
};

// Helper function to execute commands
function runCommand(command, options = {}) {
    console.log(`\n📋 Executing: ${command}\n`);
    try {
        return execSync(command, {
            stdio: 'inherit',
            ...options
        });
    } catch (error) {
        console.error(`\n❌ Error executing command: ${command}`);
        console.error(error.message);
        if (options.fatal !== false) {
            process.exit(1);
        }
        return null;
    }
}

// Check if MongoDB is installed
function checkMongoDB() {
    try {
        execSync('mongod --version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

// Check if Node.js is installed
function checkNodeJS() {
    try {
        execSync('node --version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

// Check prerequisites
function checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    const nodeInstalled = checkNodeJS();
    if (!nodeInstalled) {
        console.error('❌ Node.js is not installed. Please install Node.js and try again.');
        console.log('📝 Download from: https://nodejs.org/');
        process.exit(1);
    }
    console.log('✅ Node.js is installed');

    const mongoInstalled = checkMongoDB();
    if (!mongoInstalled) {
        console.log('⚠️ MongoDB is not detected. You will need to install MongoDB separately.');
        console.log('📝 Instructions: https://www.mongodb.com/docs/manual/installation/');

        return new Promise((resolve) => {
            rl.question('Do you want to continue without MongoDB? (yes/no): ', (answer) => {
                if (answer.toLowerCase() !== 'yes') {
                    console.log('Setup aborted. Please install MongoDB and try again.');
                    process.exit(0);
                }
                resolve(false);
            });
        });
    }

    console.log('✅ MongoDB is installed');
    return Promise.resolve(true);
}

// Prompt for email configuration
function promptEmailConfig() {
    return new Promise((resolve) => {
        console.log('\n🔧 Email Configuration');
        console.log('---------------------------------------------------------');
        console.log('Setting up email notifications for the application.');
        console.log('If you\'re using Gmail, you\'ll need to create an app password:');
        console.log('1. Go to your Google Account > Security > 2-Step Verification');
        console.log('2. At the bottom, click on "App passwords"');
        console.log('3. Select "Mail" and your device, then generate');
        console.log('4. Use this generated password here (not your regular Gmail password)');
        console.log('---------------------------------------------------------');

        rl.question('\nDo you want to configure email notifications? (yes/no): ', (answer) => {
            if (answer.toLowerCase() !== 'yes') {
                console.log('⚠️ Email notifications will be disabled. You can configure them later in the .env file.');
                resolve(false);
                return;
            }

            rl.question('Email Host (default: smtp.gmail.com): ', (host) => {
                if (host) config.email.host = host;

                rl.question('Email Port (default: 587): ', (port) => {
                    if (port) config.email.port = parseInt(port);

                    rl.question('Email Secure (true/false) (default: false): ', (secure) => {
                        if (secure === 'true') config.email.secure = true;

                        rl.question('Email User (your email address): ', (user) => {
                            config.email.user = user;

                            rl.question('Email Password (your app password): ', (password) => {
                                config.email.password = password;
                                console.log('✅ Email configuration completed');
                                resolve(true);
                            });
                        });
                    });
                });
            });
        });
    });
}

// Update .env file
function updateEnvFile() {
    console.log('🔧 Updating backend .env file...');

    const envPath = path.join(__dirname, 'backend', '.env');
    const envContent = `GITHUB_TOKEN=your_github_token_here
PORT=${config.backendPort}
MONGODB_URI=${config.mongoAtlasUri}
JWT_SECRET=${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}

# Email Configuration
EMAIL_HOST=${config.email.host}
EMAIL_PORT=${config.email.port}
EMAIL_SECURE=${config.email.secure}
EMAIL_USER=${config.email.user}
EMAIL_PASSWORD=${config.email.password}
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated successfully');
}

// Update database name in server.js
function updateDatabaseName() {
    console.log('🔧 Updating database name in server.js...');

    const serverPath = path.join(__dirname, 'backend', 'server.js');
    let serverContent = fs.readFileSync(serverPath, 'utf8');

    // Replace the database name
    serverContent = serverContent.replace(
        /mongodb:\/\/localhost:27017\/atlassian-clone/g,
        `mongodb://localhost:27017/${config.dbName}`
    );

    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Database name updated in server.js');
}

// Update database name in create-admin.js
function updateCreateAdminScript() {
    console.log('🔧 Updating database name in create-admin.js...');

    const adminScriptPath = path.join(__dirname, 'backend', 'create-admin.js');
    let adminScriptContent = fs.readFileSync(adminScriptPath, 'utf8');

    // Replace the database name
    adminScriptContent = adminScriptContent.replace(
        /mongodb:\/\/localhost:27017\/atlassian-clone/g,
        `mongodb://localhost:27017/${config.dbName}`
    );

    fs.writeFileSync(adminScriptPath, adminScriptContent);
    console.log('✅ Database name updated in create-admin.js');
}

// Install backend dependencies
function setupBackend() {
    console.log('\n🔧 Setting up backend...');
    process.chdir(path.join(__dirname, 'backend'));
    runCommand('npm install');
    console.log('✅ Backend setup completed');
}

// Install frontend dependencies
function setupFrontend() {
    console.log('\n🔧 Setting up frontend...');
    process.chdir(path.join(__dirname, 'frontend'));
    runCommand('npm install');
    console.log('✅ Frontend setup completed');
}

// Create admin user
function createAdminUser() {
    console.log('\n👤 Creating admin user...');
    process.chdir(path.join(__dirname, 'backend'));
    runCommand('node create-admin.js');
    console.log(`✅ Admin user created with credentials:
  - Username: ${config.adminUser.username}
  - Password: ${config.adminUser.password}
  - Email: ${config.adminUser.email}`);
}

// Main function
async function main() {
    console.log('🚀 Starting CodeReview project setup with MongoDB Atlas...');

    await checkPrerequisites();

    // Configure email
    await promptEmailConfig();

    // Update configuration files
    updateEnvFile();
    updateDatabaseName();
    updateCreateAdminScript();

    // Install dependencies
    setupBackend();
    setupFrontend();

    // Create admin user if MongoDB is available
    if (checkMongoDB()) {
        createAdminUser();
    }

    console.log(`\n🎉 Setup completed successfully!

To start the application:

1. Start MongoDB (if not already running):
   - On macOS/Linux: mongod
   - On Windows: Start MongoDB service

2. Start the backend:
   cd backend
   npm run dev

3. In a new terminal, start the frontend:
   cd frontend
   npm start

4. Open your browser and navigate to:
   - Frontend: http://localhost:${config.frontendPort}
   - Backend API: http://localhost:${config.backendPort}
   - API Documentation: http://localhost:${config.backendPort}/api-docs

Admin credentials:
   - Username: ${config.adminUser.username}
   - Password: ${config.adminUser.password}
   - Email: ${config.adminUser.email}
`);

    rl.close();
}

// Run the main function
main().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
}); 