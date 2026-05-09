const mongoose = require('mongoose');
const Lawyer = require('./models/Lawyer');
require('dotenv').config();

async function checkLawyers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lawwise');
        console.log('Connected to DB');
        const lawyers = await Lawyer.find();
        console.log(`Total lawyers in DB: ${lawyers.length}`);
        lawyers.forEach(l => {
            console.log(`ID: ${l._id}, Name: ${l.fullName}, Email: ${l.email}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkLawyers();
