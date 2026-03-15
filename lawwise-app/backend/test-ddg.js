const axios = require('axios');
const cheerio = require('cheerio');

async function testDuckDuckGo() {
    const query = 'scope of political science notes scribd';
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    console.log('Searching DuckDuckGo for:', query);

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const results = [];

        $('.result').each((i, el) => {
            if (i >= 8) return;
            const title = $(el).find('.result__title').text().trim();
            const url = $(el).find('.result__url').text().trim();
            const snippet = $(el).find('.result__snippet').text().trim();

            results.push({
                title,
                fileUrl: 'https://' + url,
                description: snippet,
                source: url.split('/')[0],
                category: 'Web Resource',
                year: 'N/A'
            });
        });

        console.log('Results Found:', results.length);
        if (results.length > 0) {
            console.log('First Result:', JSON.stringify(results[0], null, 2));
        } else {
            console.log('No results found. HTML sample:', data.substring(0, 500));
        }

    } catch (error) {
        console.error('DuckDuckGo Error:', error.message);
    }
}

testDuckDuckGo();
