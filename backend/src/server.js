// src/server.js
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4000;

async function start() {
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`Server listening at http://localhost:${PORT}`));
    } catch (err) {
        console.error('Failed to start:', err);
        process.exit(1);
    }
}

start();
