const mongoose = require('mongoose');
const Template = require('../models/Template');
require('dotenv').config();

const templates = [
    {
        name: 'Universal Legal Notice Master Template',
        type: 'Legal Notice',
        jurisdiction: 'General',
        description: 'Universal adaptable syntax for any legal notice including recovery, breach, defamation, tenancy, employment, consumer disputes, etc.',
        sections: [
            {
                title: 'Header',
                content: `LEGAL NOTICE\nDate: [DATE]\nTo,\n[RECIPIENT_FULL_DETAILS]\nSubject: [SUBJECT_OF_NOTICE]`,
                type: 'header'
            },
            {
                title: 'Authority',
                content: `Under instructions from and on behalf of my client [CLIENT_NAME], I hereby serve upon you the following legal notice:`,
                type: 'static'
            },
            {
                title: 'Background Facts',
                content: `1. That [BRIEF_BACKGROUND_OF_RELATIONSHIP_OR_TRANSACTION].\n2. That on [IMPORTANT_DATE], [KEY_EVENT_OR_TRANSACTION].\n3. That despite repeated requests and reminders, you have failed to [DEFAULT_OR_WRONGFUL_ACT].`,
                type: 'body'
            },
            {
                title: 'Cause of Action',
                content: `4. That your above-mentioned acts and omissions constitute a clear breach of legal and contractual obligations and have caused serious loss and damage to my client.`,
                type: 'static'
            },
            {
                title: 'Demand',
                content: `5. Therefore, through this legal notice, you are hereby called upon to:\na) [PRIMARY_DEMAND]\nb) [ALTERNATIVE_OR_ADDITIONAL_DEMAND]\nwithin [NUMBER_OF_DAYS] days from the receipt of this notice.`,
                type: 'body'
            },
            {
                title: 'Consequences',
                content: `6. In case of failure to comply within the stipulated period, my client shall be constrained to initiate appropriate civil and/or criminal proceedings against you at your risk as to cost and consequences.`,
                type: 'footer'
            },
            {
                title: 'Closing',
                content: `This notice is issued without prejudice to any other legal rights and remedies available to my client under the law.\nSincerely,\n[ADVOCATE_NAME]\nAdvocate for the Client`,
                type: 'footer'
            }
        ],
        fields: []
    }
];

const seedTemplates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lawwise');
        console.log('Connected to MongoDB for seeding Master Template...');

        await Template.deleteMany({});
        console.log('Old templates cleared.');

        await Template.insertMany(templates);
        console.log('Universal Legal Notice Master Library seeded successfully.');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding templates:', error);
        process.exit(1);
    }
};

seedTemplates();
