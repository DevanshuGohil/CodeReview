// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/Dashboard';
import TeamList from './components/teams/TeamList';
import TeamForm from './components/teams/TeamForm';
import TeamDetail from './components/teams/TeamDetail';
import ProjectList from './components/projects/ProjectList';
import ProjectForm from './components/projects/ProjectForm';
import ProjectDetail from './components/projects/ProjectDetail';
import PullRequestView from './components/github/PullRequestView';
import RepositoryFiles from './components/github/RepositoryFiles';
import PullRequestList from './components/github/PullRequestList';
import MemberList from './components/admin/MemberList';
import './styles/App.css';
import './styles/custom-diff.css';
import './styles/pull-request.css';
import { Box, Alert, Button } from '@mui/material';

// Create Material UI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
      light: '#4dabf5',
      dark: '#1769aa',
    },
    secondary: {
      main: '#f50057',
      light: '#f73378',
      dark: '#ab003c',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '2.2rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '1.8rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, requirePasswordChange } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requirePasswordChange) {
    return <Navigate to="/reset-password" replace />;
  }

  return children;
};

// Public route component - redirects to dashboard if user is already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, requirePasswordChange } = useAuth();

  if (isAuthenticated) {
    if (requirePasswordChange) {
      return <Navigate to="/reset-password" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Admin route component - Admin can only manage users
const AdminRoute = ({ children }) => {
  const { isAuthenticated, currentUser, requirePasswordChange } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requirePasswordChange) {
    return <Navigate to="/reset-password" replace />;
  }

  if (currentUser?.role !== 'admin') {
    return (
      <Box sx={{ mt: 4, p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Admin Access Required</strong><br />
          You need admin privileges to access this user management page.
        </Alert>
        <Button component={Link} to="/dashboard" variant="contained" color="primary">
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return children;
};

// Manager route component - Manager can create teams and projects
const ManagerRoute = ({ children }) => {
  const { isAuthenticated, currentUser, requirePasswordChange } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requirePasswordChange) {
    return <Navigate to="/reset-password" replace />;
  }

  if (currentUser?.role !== 'manager' && currentUser?.role !== 'admin') {
    return (
      <Box sx={{ mt: 4, p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Manager Access Required</strong><br />
          Only managers can create or modify teams and projects.
        </Alert>
        <Button component={Link} to="/dashboard" variant="contained" color="primary">
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div className="app">
            <Navbar />
            <div className="container mt-4">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />
                <Route path="/register" element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } />

                {/* Password Reset Route */}
                <Route path="/reset-password" element={
                  <ResetPassword />
                } />

                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* Admin routes - only for user management */}
                <Route path="/admin/members" element={
                  <AdminRoute>
                    <MemberList />
                  </AdminRoute>
                } />

                {/* Team routes */}
                <Route path="/teams" element={
                  <ProtectedRoute>
                    <TeamList />
                  </ProtectedRoute>
                } />
                <Route path="/teams/new" element={
                  <ManagerRoute>
                    <TeamForm />
                  </ManagerRoute>
                } />
                <Route path="/teams/:id" element={
                  <ProtectedRoute>
                    <TeamDetail />
                  </ProtectedRoute>
                } />

                {/* Project routes */}
                <Route path="/projects" element={
                  <ProtectedRoute>
                    <ProjectList />
                  </ProtectedRoute>
                } />
                <Route path="/projects/new" element={
                  <ManagerRoute>
                    <ProjectForm />
                  </ManagerRoute>
                } />
                <Route path="/projects/:id" element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                } />

                {/* GitHub integration routes */}
                <Route path="/projects/:projectId/repository/*" element={
                  <ProtectedRoute>
                    <RepositoryFiles />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:projectId/pulls" element={
                  <ProtectedRoute>
                    <PullRequestList />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:projectId/pulls/:pullNumber" element={
                  <ProtectedRoute>
                    <PullRequestView />
                  </ProtectedRoute>
                } />

                {/* Redirect root to dashboard or login */}
                <Route path="/" element={
                  <Navigate to="/dashboard" replace />
                } />

                {/* Catch-all route - redirect to login if not authenticated, dashboard if authenticated */}
                <Route path="*" element={
                  <AuthRedirect />
                } />
              </Routes>
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

// Auth redirect component - decides where to redirect based on auth status
const AuthRedirect = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

export default App;
