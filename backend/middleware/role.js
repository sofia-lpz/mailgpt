import { getUser } from '../service.js';

export const checkAdminRole = async (req, res, next) => {
    try {
        const username = req.username; // Assuming `verifyToken` middleware sets `req.username`
        const user = await getUser(username); // Fetch user details from the database

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Roles: Internal server error.' });
    }
};
