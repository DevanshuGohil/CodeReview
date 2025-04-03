// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
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
import './styles/App.css';
import './styles/custom-diff.css';
import './styles/pull-request.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Public route component - redirects to dashboard if user is already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Admin route component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    // Show access denied message instead of redirecting
    return (
      <div className="alert alert-warning">
        <h4>Admin Access Required</h4>
        <p>You need admin privileges to access this page.</p>
        <Link to="/projects" className="btn btn-primary">Back to Projects</Link>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
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

              {/* Team routes */}
              <Route path="/teams" element={
                <ProtectedRoute>
                  <TeamList />
                </ProtectedRoute>
              } />
              <Route path="/teams/new" element={
                <AdminRoute>
                  <TeamForm />
                </AdminRoute>
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
                <AdminRoute>
                  <ProjectForm />
                </AdminRoute>
              } />
              <Route path="/projects/:id" element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              } />

              {/* GitHub integration routes */}
              <Route path="/github/:owner/:repo/pulls" element={
                <ProtectedRoute>
                  <PullRequestList />
                </ProtectedRoute>
              } />
              <Route path="/github/:owner/:repo/pulls/:pullNumber" element={
                <ProtectedRoute>
                  <PullRequestView />
                </ProtectedRoute>
              } />
              <Route path="/github/:owner/:repo/contents" element={
                <ProtectedRoute>
                  <RepositoryFiles />
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
    </AuthProvider>
  );
}

// Auth redirect component - decides where to redirect based on auth status
const AuthRedirect = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};

export default App;
