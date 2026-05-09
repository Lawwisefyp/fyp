const mongoose = require('mongoose');
const Lawyer = require('./backend/models/Lawyer');
const Client = require('./backend/models/Client');
const Student = require('./backend/models/Student');

const MONGODB_URI = 'mongodb://localhost:27017/lawwise';

async function globalSearch() {
    try {
        await mongoose.connect(MONGODB_URI);
        const targetId = '683af4200798b28a8b174629';
        
        const lawyer = await Lawyer.findById(targetId);
        const client = await Client.findById(targetId);
        const student = await Student.findById(targetId);

        if (lawyer) console.log('Found in LAWYER collection');
        if (client) console.log('Found in CLIENT collection');
        if (student) console.log('Found in STUDENT collection');

        if (!lawyer && !client && !student) {
            console.log('ID not found in any collection');
            const allL = await Lawyer.find({}).limit(3);
            console.log('Sample Lawyers:', allL.map(l => l.fullName));
        }

        await mongoose.disconnect();
    } catch (err) { console.error(err); }
}
globalSearch();
