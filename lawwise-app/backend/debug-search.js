require('dotenv').config();
const lawCrawler = require('./services/lawCrawler');

async function testSearch() {
    console.log('Testing search for: scope of political science');
    const result = await lawCrawler.searchWebForNotes('scope of political science', {
        year: '1st Year',
        university: 'Punjab University'
    });
    console.log('Result Success:', result.success);
    if (result.success) {
        console.log('Count:', result.count);
        console.log('First Result:', JSON.stringify(result.laws[0], null, 2));
    } else {
        console.log('Error:', result.error);
    }
}

testSearch();
