const mongoose = require('mongoose');

const ownerOnly = (getOwnerIdFromReq) => async (req, res, next) => {
    try {
        const ownerId = await getOwnerIdFromReq(req);
        if (!ownerId) return res.status(404).json({ message: 'Resource not found' });

        const userId = req.user && req.user._id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        if (ownerId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Forbidden: not owner' });
        }
        next();
    } catch (err) {
        console.error('ownerOnly error', err);
        next(err);
    }
};

module.exports = ownerOnly;
