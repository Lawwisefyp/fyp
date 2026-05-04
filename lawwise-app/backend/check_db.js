require('dotenv').config();
const mongoose = require('mongoose');
const PastPaper = require('./models/PastPaper');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lawwise');
        console.log('Connected to:', mongoose.connection.name);
        const count = await PastPaper.countDocuments();
        console.log('Past papers in DB:', count);
        const samples = await PastPaper.find().limit(2);
        console.log('Samples:', samples);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
