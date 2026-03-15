const { checkAuthenticEmail } = require('./utils/emailService');
require('dotenv').config();

const testEmails = [
    { email: 'valid-user@gmail.com', expected: true, label: 'Valid Gmail' },
    { email: 'user@gmal.com', expected: false, label: 'Typo Gmail (gmal.com)' },
    { email: 'user@gnail.com', expected: false, label: 'Typo Gmail (gnail.com)' },
    { email: 'user@temp-mail.com', expected: false, label: 'Disposable (temp-mail.com)' },
    { email: 'test@gmail.com', expected: false, label: 'Generic Prefix (test@)' },
    { email: 'abc@gmail.com', expected: false, label: 'Short Prefix (abc@)' },
    { email: 'spam@gmail.com', expected: false, label: 'Generic Prefix (spam@)' }
];

async function runTests() {
    console.log('--- Starting Advanced Email Validation Tests ---');
    let passed = 0;

    for (const test of testEmails) {
        try {
            const result = await checkAuthenticEmail(test.email);
            const isMatch = result.success === test.expected;
            console.log(`[${isMatch ? 'PASS' : 'FAIL'}] ${test.label}: ${test.email}`);
            if (!result.success) {
                console.log(`      Error: ${result.error}`);
            }
            if (isMatch) passed++;
        } catch (error) {
            console.log(`[ERROR] ${test.label}: ${test.email}`);
            console.error(error);
        }
    }

    console.log(`--- Tests Complete: ${passed}/${testEmails.length} Passed ---`);
}

runTests();
