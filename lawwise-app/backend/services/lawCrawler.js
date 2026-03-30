const axios = require('axios');
const cheerio = require('cheerio');


const lawCrawler = {
 
    searchOnline: async (query) => {
        const results = [];

        try {
            
            const commonLaws = lawCrawler.getCommonLawResults(query);

            
            const pakOrgResults = await lawCrawler.searchPakistaniOrg(query);

            
            const allResults = [...commonLaws, ...pakOrgResults];

            
            const uniqueResults = [];
            const titles = new Set();
            for (const law of allResults) {
                const normalizedTitle = law.title.toLowerCase().trim();
                if (!titles.has(normalizedTitle)) {
                    uniqueResults.push(law);
                    titles.add(normalizedTitle);
                }
            }

            return {
                success: true,
                count: uniqueResults.length,
                laws: uniqueResults
            };
        } catch (error) {
            console.error('Crawler Error:', error.message);
            return {
                success: false,
                error: 'Encountered an issue fetching online data.'
            };
        }
    },


    searchPakistaniOrg: async (query) => {
        if (!query) return [];
        try {
            const baseUrl = 'https://www.pakistani.org';
            const response = await axios.get(`${baseUrl}/pakistan/constitution/`, { timeout: 5000 });
            const $ = cheerio.load(response.data);
            const laws = [];

            $('a').each((i, el) => {
                const text = $(el).text();
                const href = $(el).attr('href');

                if (text.toLowerCase().includes(query.toLowerCase()) && href) {
                    laws.push({
                        title: text.trim(),
                        fileUrl: new URL(href, 'https://www.pakistani.org/pakistan/constitution/').href,
                        description: `Official text of ${text} from the Constitution of Pakistan database.`,
                        category: 'Constitution/Statutes',
                        year: text.match(/\d{4}/) ? text.match(/\d{4}/)[0] : 'N/A',
                        source: 'Pakistani.org'
                    });
                }
            });

            return laws;
        } catch (e) {
            return [];
        }
    },

  
    getCommonLawResults: (query) => {
        const q = query ? query.toLowerCase() : '';
        const lawLibrary = [
            {
                title: 'Constitution of Pakistan, 1973',
                fileUrl: 'https://pakistani.org/pakistan/constitution/',
                description: 'The supreme law of Pakistan, providing the framework for the state and fundamental rights. (Official HTML)',
                category: 'Constitutional',
                year: '1973',
                source: 'Pakistani.org'
            },
            {
                title: 'Pakistan Penal Code (PPC), 1860',
                fileUrl: 'https://pakistani.org/pakistan/legislation/1860/actXLVof1860.html',
                description: 'The primary criminal code of Pakistan, identifying various offenses and punishments. (Official HTML)',
                category: 'Criminal Law',
                year: '1860',
                source: 'Pakistani.org'
            },
            {
                title: 'Law of Pakistan (Overview)',
                fileUrl: 'https://en.wikipedia.org/wiki/Law_of_Pakistan',
                description: 'A comprehensive overview of the legal system and laws of Pakistan. (Wikipedia)',
                category: 'General Law',
                year: 'N/A',
                source: 'Wikipedia'
            },
            {
                title: 'Code of Civil Procedure, 1908 (MA-Law Archive)',
                fileUrl: 'https://www.ma-law.org.pk/pdflaw/CODE%20OF%20CIVIL%20PROCEDURE%201908.pdf',
                description: 'Official PDF text of the Code of Civil Procedure, 1908.',
                category: 'Civil Procedure',
                year: '1908',
                source: 'MA-Law'
            },
            {
                title: 'Code of Civil Procedure, 1908 (Punjab Code)',
                fileUrl: 'https://punjabcode.punjab.gov.pk/uploads/articles/code-of-civil-procedure-1908-pdf.pdf',
                description: 'Authorized text of the Code of Civil Procedure, 1908 from Punjab Code.',
                category: 'Civil Procedure',
                year: '1908',
                source: 'Punjab Code'
            },
            {
                title: 'Pakistan Code - Primary Statutes',
                fileUrl: 'https://pakistancode.gov.pk/english/LGu0xVD-apaUY2Fqa-aw%3D%3D&action=primary&catid=2',
                description: 'Official repository of federal laws of Pakistan.',
                category: 'Federal Statutes',
                year: 'N/A',
                source: 'Pakistan Code'
            },
            {
                title: 'Punjab Laws Online',
                fileUrl: 'https://www.punjablaws.gov.pk/',
                description: 'Official portal for the laws and statutes of the Punjab province.',
                category: 'Provincial Laws',
                year: 'N/A',
                source: 'Punjab Laws'
            },
            {
                title: 'Pakistan Legal Research Guide',
                fileUrl: 'https://www.nyulawglobal.org/globalex/Pakistan1.html',
                description: 'A detailed guide to the legal system and research in Pakistan. (NYU Law Global)',
                category: 'Legal Research',
                year: 'N/A',
                source: 'NYU Law'
            },
            {
                title: 'Lahore High Court Archives',
                fileUrl: 'https://lhc.gov.pk/',
                description: 'Official website of the Lahore High Court with legal resources.',
                category: 'Judiciary',
                year: 'N/A',
                source: 'LHC'
            },
            {
                title: 'Constitution of Pakistan (Interactive)',
                fileUrl: 'https://www.pakistani.org/pakistan/constitution/#gsc.tab=0',
                description: 'Searchable and interactive text of the Constitution of Pakistan.',
                category: 'Constitutional',
                year: '1973',
                source: 'Pakistani.org'
            },
            {
                title: 'Family Law & Attestation Services',
                fileUrl: 'https://www.pakattestation.pk/family-matters',
                description: 'Resources and information on family law matters in Pakistan.',
                category: 'Family Law',
                year: 'N/A',
                source: 'Pak Attestation'
            },
            {
                title: 'Home Truths: Pakistan Report',
                fileUrl: 'https://arabic.musawah.org/sites/default/files/Pakistan-report%20for%20Home%20Truths.pdf',
                description: 'A detailed report on family laws and human rights in Pakistan. (Musawah)',
                category: 'Human Rights/Family Law',
                year: 'N/A',
                source: 'Musawah'
            },
            {
                title: 'The West Pakistan Family Courts Act, 1964',
                fileUrl: 'https://molaw.gov.pk/SiteImage/Misc/files/THE%20WEST%20PAKISTAN%20FAMILY%20COURTS%20ACT%2C%201964.pdf',
                description: 'Official text of the West Pakistan Family Courts Act, 1964 from Ministry of Law.',
                category: 'Family Law',
                year: '1964',
                source: 'Ministry of Law'
            },
            {
                title: 'SSRN: Pakistani Legal Studies',
                fileUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5702650',
                description: 'Academic papers and research on the legal system of Pakistan.',
                category: 'Legal Academia',
                year: 'N/A',
                source: 'SSRN'
            },
            {
                title: 'Muslim Family Laws Ordinance, 1961',
                fileUrl: 'https://punjabcode.punjab.gov.pk/uploads/articles/54-muslim-family-laws-ordinance-1961-viii-of-1961-pdf.pdf',
                description: 'Official text of the Muslim Family Laws Ordinance, 1961 from Punjab Code.',
                category: 'Family Law',
                year: '1961',
                source: 'Punjab Code'
            },
            {
                title: 'ISSR Papers: Criminal Justice',
                fileUrl: 'https://issrapapers.ndu.edu.pk/index.php/site/article/view/148',
                description: 'Research papers on the criminal justice system from NDU.',
                category: 'Criminal Justice',
                year: 'N/A',
                source: 'NDU'
            },
            {
                title: 'Pakistan Code - Secondary Statutes',
                fileUrl: 'https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5lo-sg-jjjjjjjjjjjjj',
                description: 'Access to secondary and amended federal laws of Pakistan.',
                category: 'Federal Statutes',
                year: 'N/A',
                source: 'Pakistan Code'
            },
            {
                title: 'Criminal Justice System Overview',
                fileUrl: 'https://rsilpak.org/resource-bank-pakistans-criminal-justice-system/overview-of-criminal-justice-system-cjs-in-pakistan/',
                description: 'Resource bank and overview of the Criminal Justice System (CJS) in Pakistan. (RSIL)',
                category: 'Criminal Law',
                year: 'N/A',
                source: 'RSIL'
            },
            {
                title: 'Pakistan Penal Code (Wikipedia Overview)',
                fileUrl: 'https://en.wikipedia.org/wiki/Pakistan_Penal_Code',
                description: 'Detailed overview of the Pakistan Penal Code (PPC).',
                category: 'Criminal Law',
                year: '1860',
                source: 'Wikipedia'
            },
            {
                title: 'The Pakistan Criminal Law Amendment Act, 1958',
                fileUrl: 'https://ace.punjab.gov.pk/system/files/THE_PAKISTAN_CRIMINAL_LAW_AMENDMENT_ACT_1958.pdf',
                description: 'Official text of the Pakistan Criminal Law Amendment Act, 1958.',
                category: 'Criminal Law',
                year: '1958',
                source: 'ACE Punjab'
            },
            {
                title: 'Pakistan Code - Federal Laws Index',
                fileUrl: 'https://pakistancode.gov.pk/english/index.php',
                description: 'The official index and searchable database of all federal laws of Pakistan.',
                category: 'Federal Statutes',
                year: 'N/A',
                source: 'Pakistan Code'
            }
        ];

        if (!q) return lawLibrary;

        return lawLibrary.filter(law =>
            law.title.toLowerCase().includes(q) ||
            law.description.toLowerCase().includes(q) ||
            law.category.toLowerCase().includes(q)
        );
    },

 
    searchWebForNotes: async (query, studentInfo = {}) => {
        if (!query) return { success: true, count: 0, laws: [] };

        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.warn('GEMINI_API_KEY not found in environment');
                return { success: false, error: 'Search engine not configured.' };
            }

            const prompt = `Act as an advanced Google Search crawler for LLB (Bachelor of Laws) students. 
            Context: The student is in their ${query.includes('Year') ? query.split('for')[1].trim() : 'LLB Course'}.
            Query: "${query}".
            
            Find 8-10 high-quality, real, and direct web links specifically related to the legal subject and year mentioned in the query. 
            Prioritize authoritative academic sources: scribd.com, academia.edu, researchgate.net, lawteacher.net, britannica.com, and university law portals.
            
            Return ONLY a raw JSON array of objects with this exact structure:
            [
              {
                "title": "Actual Page Title",
                "fileUrl": "https://actual-url-to-page-or-pdf",
                "description": "2-sentence preview of content",
                "source": "Website Name",
                "category": "Notes/Theory/Article",
                "year": "Publication Year (or N/A)"
              }
            ]
            No markdown, no backticks, no introduction. Just the JSON.`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    contents: [{ parts: [{ text: prompt }] }]
                },
                { headers: { 'Content-Type': 'application/json' } }
            );

            let contentText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!contentText) throw new Error('Empty response from Gemini');

            
            const jsonMatch = contentText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('Could not find JSON in response');

            const webResults = JSON.parse(jsonMatch[0]);

            return {
                success: true,
                count: webResults.length,
                laws: webResults
            };
        } catch (error) {
            console.error('Gemini Search Error:', error.response?.data || error.message);

          
            const q = query.toLowerCase();

            
            let fallbackResults = [];

            if (q.includes('political science')) {
                fallbackResults = [
                    {
                        title: "Introduction to Political Science - Open Textbook Library",
                        fileUrl: "https://open.umn.edu/opentextbooks/textbooks/1361",
                        description: "A comprehensive introductory textbook covering the scope, methods, and core concepts of political science.",
                        source: "University of Minnesota",
                        category: "Academic Textbook",
                        year: "2023"
                    },
                    {
                        title: "What is Political Science? - Definition and Scope",
                        fileUrl: "https://www.britannica.com/topic/political-science",
                        description: "Detailed entry explaining the nature of political science, its history, and its various branches.",
                        source: "Encyclopedia Britannica",
                        category: "Reference Article",
                        year: "2024"
                    },
                    {
                        title: "Political Science Notes (PDF) - Academia.edu",
                        fileUrl: "https://www.academia.edu/38562725/Introduction_to_Political_Science_Lecture_Notes",
                        description: "Shared lecture notes covering the evolution of political systems and theory.",
                        source: "Academia.edu",
                        category: "Study Notes",
                        year: "N/A"
                    }
                ];
            } else if (q.includes('contract law')) {
                fallbackResults = [
                    {
                        title: "Contract Law Basics - LawTeacher.net",
                        fileUrl: "https://www.lawteacher.net/modules/contract-law/",
                        description: "A complete guide to the formation, performance, and breach of contracts with case law examples.",
                        source: "LawTeacher",
                        category: "Study Guide",
                        year: "2024"
                    },
                    {
                        title: "Principles of Contract Law - ResearchGate",
                        fileUrl: "https://www.researchgate.net/publication/340058921_Principles_of_Contract_Law",
                        description: "Academic paper detailing the essential elements of a valid contract and legal remedies.",
                        source: "ResearchGate",
                        category: "Academic Paper",
                        year: "2020"
                    }
                ];
            } else if (q.includes('constitution') || q.includes('pakistan')) {
                fallbackResults = [
                    {
                        title: "Constitution of Pakistan, 1973 (Official)",
                        fileUrl: "https://pakistancode.gov.pk/english/LGu0xVD-apaUY2Fqa-aw%3D%3D&action=primary&catid=2",
                        description: "The official text of the Constitution of the Islamic Republic of Pakistan via Pakistan Code.",
                        source: "Pakistan Code",
                        category: "Official Statute",
                        year: "1973"
                    },
                    {
                        title: "Constitutional Law of Pakistan - Detailed Guide",
                        fileUrl: "https://pakistani.org/pakistan/constitution/",
                        description: "Searchable online version of the 1973 Constitution with all amendments.",
                        source: "Pakistani.org",
                        category: "Legal Database",
                        year: "2024"
                    }
                ];
            }

            if (fallbackResults.length > 0) {
                return { success: true, count: fallbackResults.length, laws: fallbackResults };
            }

            return {
                success: false,
                error: 'Our search engine is currently under high load. Please try again with different keywords or check back later.'
            };
        }
    }
};

module.exports = lawCrawler;
