const mongoose = require('mongoose');
const Case = require('./models/Case');
require('dotenv').config();

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lawwise');
        console.log('Connected to DB');
        const cases = await Case.find();
        console.log(`Total cases in DB: ${cases.length}`);
        cases.forEach(c => {
            console.log(`ID: ${c.id}, Title: ${c.title}, LawyerId: ${c.lawyerId}, Client: ${c.client}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();
