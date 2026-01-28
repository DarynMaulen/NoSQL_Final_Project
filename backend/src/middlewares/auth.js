const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'No token provided' });

        const parts = authHeader.split(' ');
        if (parts.length !== 2) return res.status(401).json({ message: 'Token error' });

        const [scheme, token] = parts;
        if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ message: 'Token malformatted' });

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) return res.status(401).json({ message: 'Invalid token' });

        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (!user) return res.status(401).json({ message: 'User not found' });

        req.user = user; // attach user
        next();
    } catch (err) {
        console.error('authMiddleware error', err);
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = authMiddleware;
