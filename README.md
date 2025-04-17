# CodeReview

A modern application for viewing and interacting with code changes and pull requests. This project provides a user-friendly interface for reviewing code, with a focus on a clear and intuitive diff viewing experience.

## Features

### Enhanced Diff Viewer

The application includes a custom diff viewer with the following features:

- **Side-by-Side View**: See old and new code side by side for easy comparison
- **Unified View**: Traditional inline diff display with added and deleted lines
- **Smart Line Pairing**: Intelligently matches deleted and added lines for better context
- **Real Line Numbers**: Shows actual file line numbers based on the diff chunk headers
- **Customizable Display**: Toggle between view modes and show/hide hunk headers
- **Responsive Design**: Works well on both desktop and mobile devices

## Project Analysis

### Overview
This is a comprehensive code review platform that integrates with Git providers (primarily GitHub, with support for GitLab and Bitbucket). It allows teams to manage, review, and comment on pull requests in a collaborative environment.

### Technologies Used

#### Frontend
- **Framework**: React 18
- **State Management**: Redux/Redux Toolkit
- **Routing**: React Router v6
- **UI Library**: Material UI v7 with a custom dark theme
- **API Communication**: Axios for HTTP requests
- **Real-time Updates**: Socket.io client
- **Code Visualization**: 
  - react-diff-view for code diff display
  - react-syntax-highlighter for code syntax highlighting
- **Charts/Visualizations**: Recharts for data visualization
- **Date Handling**: date-fns for date manipulation
- **Build Tools**: Create React App (react-scripts)

#### Backend
- **Server**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: JWT (jsonwebtoken) with bcryptjs for password hashing
- **Real-time Communication**: Socket.IO
- **API Documentation**: Swagger UI (swagger-jsdoc, swagger-ui-express)
- **Email Functionality**: Nodemailer
- **File Upload**: Multer
- **Environment Variables**: dotenv for configuration
- **Development**: Nodemon for auto-reloading during development

### Deployment
- **Hosting**: Configured for Netlify (frontend) with netlify.toml configuration
- **API Proxying**: http-proxy-middleware for development proxying

### Key Features

#### User Management
- **Authentication**: Login, registration, and password reset
- **Role-based Access Control**: Three user roles:
  - Admin: Can manage users
  - Manager: Can create teams and projects
  - Developer: Standard user
- **User Profiles**: Personal profile management

#### Team Management
- Creation and management of development teams
- Team member assignment with roles (leader, member)
- Team-based access control

#### Project Management
- Project creation with unique project keys
- Association with GitHub repositories
- Team-based access levels (read, write, admin)

#### GitHub Integration
- Connection to GitHub repositories
- Pull request listing and viewing
- Repository file browsing
- Code diff visualization

#### Pull Request Review System
- **PR Reviews**: Ability to approve or reject pull requests
- **Commenting System**:
  - Line-specific comments on code
  - General PR comments
  - Nested comment replies
  - Edit/delete functionality
- **Real-time Updates**: Socket.IO integration for live notifications and updates

#### Activity Tracking
- User activity monitoring and history
- Review statistics and metrics

#### Additional Integrations
- Support for multiple Git providers (GitHub, GitLab, Bitbucket)
- API documentation with Swagger

### Architecture
- **Frontend-Backend Separation**: Clear separation of concerns with dedicated frontend/backend folders
- **Component-Based Structure**: Well-organized React components
- **Model-View-Controller Pattern**: Backend follows MVC pattern with models, controllers, and routes
- **Socket-Based Real-time Communication**: For instant updates across clients
- **RESTful API Design**: Well-structured API endpoints
- **Responsive Design**: Material UI components for responsive interfaces

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Secure password storage with bcrypt
- **Password Requirements**: Enforced password complexity
- **Role-Based Access Control**: Protected routes and features based on user roles
- **Request Logging**: IP and user agent tracking

## Screenshots

### Dashboard
The dashboard provides an overview of your activity and recent changes.

![Dashboard Overview](Screen%20Shots/Dashboard-1.png)
*Dashboard overview showing recent activity and statistics*

![Dashboard Details](Screen%20Shots/Dashboard-2.png)
*Additional dashboard metrics and project status*

### Projects
Manage and organize your codebase with projects.

![Project List](Screen%20Shots/ProjectList.png)
*View all projects with filtering and sorting options*

![Create Project](Screen%20Shots/Create%20Project.png)
*Create new projects with customizable settings*

![Project Overview](Screen%20Shots/Project%20Overview.png)
*Project overview with key metrics and activity*

![Project Detail](Screen%20Shots/Project%20Detail.png)
*Detailed project view with files and contributors*

### Teams
Collaborate effectively with team management.

![Team List](Screen%20Shots/Team%20List.png)
*View and manage teams across your organization*

![Create Team](Screen%20Shots/Create%20Team.png)
*Create new teams and assign members*

![Team Overview](Screen%20Shots/Team%20Overview.png)
*Team dashboard with performance metrics*

![Team Detail](Screen%20Shots/Team%20Detail.png)
*Detailed team view with member activity*

### Pull Requests
Review and manage code changes with an intuitive interface.

![Pull Request List](Screen%20Shots/Pull%20Request%20List.png)
*View all pull requests with filtering options*

![Create PR Button](Screen%20Shots/Create%20PR%20Button.png)
*Create new pull requests from your branches*

![PR Detail](Screen%20Shots/PR%20Detail.png)
*Pull request overview with description and changes*

![PR Detail - 2](Screen%20Shots/PR%20Detail%20-%202.png)
*Additional pull request information and status*

![PR Code Diff](Screen%20Shots/PR%20Code%20Diff.png)
*Side-by-side code diff with syntax highlighting*

![PR Comment](Screen%20Shots/PR%20Comment.png)
*Add inline comments to specific lines of code*

### User Management
Admin features for managing users and permissions.

![Members List](Screen%20Shots/Members%20List.png)
*View and manage all users in the system*

![Admin - Change in User Role](Screen%20Shots/Admin%20-%20Change%20in%20User%20Role.png)
*Modify user roles and permissions*

![Import Bulk Users](Screen%20Shots/Import%20Bulk%20Users.png)
*Import multiple users via CSV upload*

### API Documentation
Access comprehensive API documentation.

![API Documentation](Screen%20Shots/API%20Doc.png)
*Interactive API documentation with Swagger UI*

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
