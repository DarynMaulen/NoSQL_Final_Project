const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set in .env');

    await mongoose.connect(uri)
        .then(() => console.log('Connected to MongoDB Atlas'))
        .catch((err) => console.error('Could not connect to MongoDB', err));
};

module.exports = connectDB;
