const mongoose = require('mongoose');

const connectDB = async (uri = process.env.MONGODB_URI) => {
    if (!uri) throw new Error('MONGODB_URI not set');
    await mongoose.connect(uri, {});
    console.log('MongoDB connected:', mongoose.connection.host || uri);
};

module.exports = connectDB;