# CodeReview Project Setup

This directory contains scripts to automatically set up the CodeReview project on various platforms using MongoDB Atlas cloud database.

## Prerequisites

- [Node.js](https://nodejs.org/) (v12 or higher)
- MongoDB Atlas account (free tier is sufficient)
- Email account for sending notifications (Gmail recommended)

## MongoDB Atlas Setup

Before running the setup script, you'll need a MongoDB Atlas connection string:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up or log in
2. Create a new cluster (the free tier is sufficient)
3. Click "Connect" on your cluster
4. Choose "Connect your application"
5. Create a database user if you haven't already
6. Copy the connection string (it will look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
7. Replace `<username>` and `<password>` with your database user credentials

You'll need this connection string during the setup process.

## Email Notification Setup

The application includes email notification features for:
- Welcoming new users
- Notifying team members when they're added to a team
- Notifying team members when their team is added to a project

To configure email notifications, you'll need:

### For Gmail users:
1. A Gmail account
2. An "App Password" (not your regular Gmail password)
   - Go to your Google Account > Security > 2-Step Verification
   - At the bottom, click on "App passwords"
   - Select "Mail" and your device, then generate
   - Use this generated password during setup

### For other email providers:
- SMTP server details (host, port)
- Your email credentials

The setup script will prompt you for these details.

## Setup Instructions

### For macOS/Linux:

1. Open Terminal
2. Navigate to the project root directory
3. Run the setup script:
   ```bash
   ./setup.sh
   ```

If you encounter a permission error, make the script executable:
```bash
chmod +x setup.sh
```

### For Windows:

1. Open Command Prompt or PowerShell
2. Navigate to the project root directory
3. Run the setup script:
   ```
   setup.bat
   ```

### Manual Setup (Alternative):

If the scripts don't work for your environment, you can run the setup directly:

```bash
node setup.js
```

## What the Setup Script Does

The setup script:

1. Checks prerequisites (Node.js)
2. Prompts for your MongoDB Atlas connection string
3. Prompts for email notification configuration
4. Updates configuration files to use the MongoDB Atlas database
5. Installs frontend dependencies
6. Installs backend dependencies
7. Creates an admin user in your cloud database

## After Setup

After the setup completes:

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```
2. In a new terminal, start the frontend:
   ```bash
   cd frontend
   npm start
   ```
3. Open your browser and navigate to:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - API Documentation: http://localhost:4000/api-docs

## Admin Credentials

The setup script creates an admin user with the following credentials:
- Username: admin
- Password: Admin@123
- Email: admin@example.com

You should change these credentials after the first login for security reasons.

## MongoDB Atlas Benefits

Using MongoDB Atlas instead of a local MongoDB installation provides:

1. **No local installation**: No need to install and manage MongoDB locally
2. **Cross-platform compatibility**: Works seamlessly on any device
3. **Data persistence**: Your data remains in the cloud, accessible from anywhere
4. **Free tier available**: MongoDB Atlas offers a free tier sufficient for development
5. **Automatic backups**: Your data is automatically backed up
6. **Scaling options**: Easy to scale as your needs grow

## Email Notification Benefits

The email notification system:
1. **Keeps users informed**: Users receive timely updates about their team and project assignments
2. **Improves onboarding**: New users receive welcome emails with their credentials
3. **Enhances collaboration**: Team members are notified when they're added to a project

## Troubleshooting

If you encounter issues during setup:

1. Ensure your MongoDB Atlas connection string is correct
2. Check that you have proper network access in MongoDB Atlas (whitelist your IP address)
3. Verify your email SMTP settings and credentials
4. Check that you have the proper Node.js version installed
5. If you see "permission denied" errors, try running the scripts with elevated privileges
6. For further issues, check the project documentation or contact the maintainers 