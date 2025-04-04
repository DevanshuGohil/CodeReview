// middlewares/admin.middleware.js
/**
 * Middleware to restrict routes to admin users only.
 * Admins in the system are primarily responsible for user management.
 */
module.exports = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required. Only administrators can manage users.' });
    }

    next();
};
