const { checkAuthenticEmail } = require('./utils/emailService');
require('dotenv').config();

const testEmails = [
    { email: 'valid-test@gmail.com', expected: true, label: 'Valid Gmail' },
    { email: 'invalid-format', expected: false, label: 'Invalid Format' },
    { email: 'test@mailinator.com', expected: false, label: 'Disposable (Mailinator)' },
    { email: 'test@yopmail.com', expected: false, label: 'Disposable (Yopmail)' },
    { email: 'user@nonexistent-domain-1234567890.com', expected: false, label: 'Non-existent Domain' },
    { email: 'user@example.abc', expected: false, label: 'Domain with no MX record' }
];

async function runTests() {
    console.log('--- Starting Email Validation Tests ---');
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
