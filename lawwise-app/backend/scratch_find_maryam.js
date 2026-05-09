const mongoose = require('mongoose');
const Lawyer = require('./models/Lawyer');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function findMaryam() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to Atlas');

        const targetId = '683af4200798b28a8b174629';
        const lawyerById = await Lawyer.findById(targetId);
        
        if (lawyerById) {
            console.log('Lawyer found by ID:', lawyerById.fullName);
        } else {
            console.log('Lawyer NOT found by ID:', targetId);
            const maryamByName = await Lawyer.findOne({ fullName: /Maryam/i });
            if (maryamByName) {
                console.log('Found Maryam by name:', maryamByName.fullName, 'ID:', maryamByName._id);
            } else {
                console.log('No Maryam found by name either.');
                const all = await Lawyer.find({}).limit(5);
                console.log('All Lawyers:', all.map(l => `${l.fullName} (${l._id})`));
            }
        }

        await mongoose.disconnect();
    } catch (err) { console.error(err); }
}
findMaryam();
