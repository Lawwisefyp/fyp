const mongoose = require('mongoose');
const Lawyer = require('./backend/models/Lawyer');

const MONGODB_URI = 'mongodb://localhost:27017/lawwise'; // Adjusted based on common local setups

async function checkLawyer() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const targetId = '683af4200798b28a8b174629';
        const lawyer = await Lawyer.findById(targetId);

        if (lawyer) {
            console.log('Lawyer found:');
            console.log(JSON.stringify(lawyer, null, 2));
        } else {
            console.log('Lawyer NOT found with ID:', targetId);
            const allLawyers = await Lawyer.find({}).limit(5);
            console.log('Sample lawyers in DB:');
            allLawyers.forEach(l => console.log(`- ${l.fullName} (${l._id})`));
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkLawyer();
