/**
 * Middleware to restrict routes to manager users only.
 * Managers in the system are responsible for team and project management.
 * Admins are restricted to user management only.
 */
module.exports = (req, res, next) => {
    if (req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Manager access required. Only managers can create and modify teams and projects.' });
    }

    next();
};
