'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/api';
import '@/styles/StudentLibrary.css';

const YEAR_SUBJECTS = {
    "1st Year LLB": ["Political Science", "English", "Islamiyat", "Sociology", "Philosophy of Law", "Introduction to World Legal System"],
    "2nd Year LLB": ["Law of Contract", "Jurisprudence-II", "Constitutional Law", "Law of Torts", "Islamic Jurisprudence"],
    "3rd Year LLB": ["Criminal Law", "Public International Law", "Property Law", "Administrative Law", "Business Law"],
    "4th Year LLB": ["Civil Procedure Code", "Criminal Procedure Code", "Law of Evidence", "Taxation Law", "Minor Acts"],
    "5th Year LLB": ["Research Project", "Legal Drafting", "Professional Ethics", "Labour Law", "Environment Law"],
};

const CURATED_RESOURCES = {
    "Political Science": [
        { title: "Political Science-I (N Series) - M.A. Chaudhary", url: "https://cbpbook.com/product/political-science-i-n-series-for-llb-part-1-paper-3-by-m-a-chaudhary/", description: "A comprehensive textbook designed for LLB Part 1 students covering political ideologies and government structures.", source: "CBP Book", type: "Book" },
        { title: "Political Science Part-II Paper III - Syed M. Ali -Kausar", url: "https://newbooksnbooks.pk/product/political-science-part-ii-paper-iii-llb-5-years-by-syed-m-ali-kausar/", description: "A detailed guide and textbook specifically for the 5-year LLB program requirements in Pakistan.", source: "BooksNBooks", type: "Book" },
        { title: "LLB Part 1 Political Science - Dogar Publishers", url: "https://dogarpublishers.com.pk/product/llb-part-1-political-science-5-years-program/", description: "Standard textbook focusing on the foundations of political science and state administration.", source: "Dogar Publishers", type: "Book" },
        { title: "Political Science-I (LISALS) Lecture Notes", url: "https://petiwalaeducation.com/product/political-science-i-lisals-1/", description: "Comprehensive lecture notes covering the core concepts of political theory and practice.", source: "Petiwala", type: "Notes" },
        { title: "BA-LLB (Year-1) Political Science Solved Papers", url: "https://petiwalaeducation.com/product/ba-llb-year-1-political-science-solved-papers/", description: "Exam-oriented resource with solved past papers to help students understand question patterns.", source: "Petiwala", type: "Notes" },
        { title: "Introduction to Political Science - Crash Course", url: "https://www.youtube.com/playlist?list=PL8dPuuaLjXtN0jG9gSqsSjS6x078O3_Yj", description: "Engaging video playlist explaining fundamental political concepts for law students.", source: "YouTube", type: "Course" },
        { title: "Political Theory and Concepts for Law Students", url: "https://www.lawctopus.com/academike/political-science-notes/", description: "Academic articles and notes exploring the intersection of law and political theory.", source: "Lawctopus", type: "Notes" },
        { title: "Political Science Lecture Series - Alvi Academy", url: "https://www.youtube.com/@AlviLawAcademy/search?query=political%20science", description: "Local video lectures tailored for Pakistani LLB curriculum and exam preparation.", source: "YouTube", type: "Course" },
        { title: "Western Political Thought - Study Notes", url: "https://www.scribd.com/document/Western-Political-Thought-Notes", description: "Exploration of major political thinkers from Plato to Marx relevant to legal studies.", source: "Scribd", type: "Notes" },
        { title: "Comparative Politics - Open Yale Course", url: "https://oyc.yale.edu/political-science/plsc-116", description: "High-level academic course providing a global perspective on political systems.", source: "Yale OYC", type: "Course" }
    ],
    "English": [
        { title: "English-I (N Series) - M.A. Chaudhary", url: "https://newbooksnbooks.pk/product/english-i-for-llb-part-i-by-m-a-chaudhary-ajwa-eman-n-series/", description: "Essential textbook for legal English, grammar, and comprehension skills.", source: "BooksNBooks", type: "Book" },
        { title: "English Part-II Paper I - Syed M. Ali -Kausar", url: "https://newbooksnbooks.pk/product/english-part-ii-paper-i-llb-5-years-by-syed-m-ali-kausar/", description: "Tailored English language resource for the 5-year LLB program in Pakistan.", source: "BooksNBooks", type: "Book" },
        { title: "LLB Part 1 English - Dogar Publishers", url: "https://dogarpublishers.com.pk/product/llb-part-1-english-5-years-program/", description: "Focused textbook for mastering English proficiency required for law degree Part 1.", source: "Dogar Publishers", type: "Book" },
        { title: "English Syllabus Notes for LLB Students", url: "https://www.scribd.com/document/LLB-Part-I-English-Notes", description: "Handwritten and typed notes covering the entire English-I syllabus for law.", source: "Scribd", type: "Notes" },
        { title: "Legal English Vocabulary and Terminology", url: "https://www.lawctopus.com/academike/legal-english-key-terms/", description: "Glossary and guide for essential legal terms every law student must know.", source: "Lawctopus", type: "Notes" },
        { title: "Grammar and Composition for Law Students", url: "https://allamaiqballawcollege.edu.pk/notes/", description: "Study material and past papers for English-I preparation at Allama Iqbal Law College.", source: "AILC", type: "Notes" },
        { title: "Precise Writing and Comprehension Guide", url: "https://www.scribd.com/document/Precise-Writing-Notes-Law", description: "Techniques and examples for law students to improve drafting and summary skills.", source: "Scribd", type: "Notes" },
        { title: "English Literature for Law Students Guide", url: "https://www.scribd.com/document/English-Literature-Notes-LLB", description: "An introductory guide to literary analysis relevant to the LLB curriculum.", source: "Scribd", type: "Notes" },
        { title: "Legal Writing Skills for Law Students", url: "https://www.youtube.com/playlist?list=PL_XAnAn3C2A9-4hD8oHshj0zP_S9V9S-F", description: "Video tutorials on professional legal writing and communication.", source: "YouTube", type: "Course" },
        { title: "English Proficiency for LLB Part 1", url: "http://pu.edu.pk/images/syllabus/LLB-5-Years-Annual/Part-I/English-I.pdf", description: "Official syllabus and reading list for English-I from Punjab University.", source: "PU", type: "Course" }
    ],
    "Islamiyat": [
        { title: "Islamiyat Book for LLB - Qari Hafeez Ur Rahman", url: "https://mkg.com.pk/product/islamiyat-book-for-llb-5-years-part-1-by-qari-hafeez-ur-rahman/", description: "A comprehensive guide for law students preparing for compulsory Islamiyat exams.", source: "MKG", type: "Book" },
        { title: "N Series Islamiat Lazmi - Abdul Azeem Janbaz", url: "https://mkg.com.pk/product/n-series-islamiat-lazmi-book-for-llb-by-abdul-azeem-janbaz/", description: "Well-structured textbook with clear explanations of Islamic concepts and history.", source: "MKG", type: "Book" },
        { title: "Kausar Islamiyat Part-I - Mushtaq Ahmad", url: "https://newbooksnbooks.pk/product/kausar-llb-5-years-islamiyat-part-i-paper-ii-llb-5-years-by-mushtaq-ahmad-kausar/", description: "In-depth exploration of Islamic principles relevant to the legal profession.", source: "BooksNBooks", type: "Book" },
        { title: "Islamiat Lazmi for LLB - Muneer Ahmad Khokhar", url: "https://newbooksnbooks.pk/product/islamiat-lazmi-for-bs-llb-by-muneer-ahmad-khokhar/", description: "Compulsory Islamiyat guide designed for university-level LLB students.", source: "BooksNBooks", type: "Book" },
        { title: "LLB Part 1 Islamic Studies - Dogar Publishers", url: "https://dogarpublishers.com.pk/product/llb-part-1-islamic-studies-5-years-program/", description: "Subject-specific textbook for Islamic Studies in the LLB Part 1 curriculum.", source: "Dogar Publishers", type: "Book" },
        { title: "Islamic Jurisprudence Notes - Scribd", url: "https://www.scribd.com/document/Islamic-Jurisprudence-Notes-LLB", description: "Electronic notes on the sources and development of Islamic legal thought.", source: "Scribd", type: "Notes" },
        { title: "Outlines of Islamic Jurisprudence - Imran Nyazee", url: "https://petiwalabooks.com/product/outlines-of-islamic-jurisprudence-by-imran-ahsan-khan-nyazee/", description: "High-quality academic book on the principles of Islamic law and legal methods.", source: "Petiwala", type: "Book" },
        { title: "Sources of Shariah - Balochistan Law Forum", url: "http://balochistanlawforum.blogspot.com/p/islamic-jurisprudence.html", description: "In-depth articles explaining the primary and secondary sources of Shariah.", source: "BLF", type: "Notes" },
        { title: "History of Islamic Law - VU Lectures", url: "https://ocw.vu.edu.pk/CourseDetails.aspx?cat=Management&course=MGT201", description: "Video lectures covering the evolution and codification of Islamic law.", source: "VU", type: "Course" },
        { title: "Islamic Ethics and Law for LLB Students", url: "https://www.youtube.com/playlist?list=PL_XAnAn3C2A9-4hD8oHshj0zP_S9V9S-F", description: "Detailed video series exploring Islamic morality and its legal applications.", source: "YouTube", type: "Course" }
    ],
    "Sociology": [
        { title: "Introduction to Sociology - Ayesha Khan", url: "https://mkg.com.pk/product/introduction-to-sociology-book-for-llb-5-year-with-notes-by-ayesha-khan/", description: "Comprehensive guide with notes tailored for the LLB sociology syllabus.", source: "MKG", type: "Book" },
        { title: "Sociology-I for LLB - Faiza Chaudhary", url: "https://newbooksnbooks.pk/product/sociology-i-for-llb-5-year-program-by-faiza-chaudhary/", description: "Focuses on the relevance of sociological theory to the law in Pakistan.", source: "BooksNBooks", type: "Book" },
        { title: "Sociology Part 1 (LLB 5 Years) - Honey Books", url: "https://honeybookspublishers.com/product/sociology-part-1-llb-5-years-program/", description: "Standard textbook with fundamental sociological concepts for Part 1 students.", source: "Honey Books", type: "Book" },
        { title: "Sociology LLB (5 Years) Part 1 - Ilmi House", url: "https://ilmibookhouse.com/product/sociology-part-1llb-5-years-program/", description: "Highly utilized textbook in major law colleges across Pakistan.", source: "Ilmi Books", type: "Book" },
        { title: "Baba Law Series Sociology Notes", url: "https://mkg.com.pk/product/baba-law-series-notes-on-sociology-i-for-ll-b-5-year-program-part/", description: "Exam-focused summary notes for quick revision and deep understanding.", source: "MKG", type: "Notes" },
        { title: "BA LLB Part-I Sociology Notes - Scribd", url: "https://www.scribd.com/document/Sociology-Notes-LLB-1st-Semester", description: "Extensive student notes and summaries available for online reading.", source: "Scribd", type: "Notes" },
        { title: "Social Institutions and the Legal Process", url: "https://www.lawctopus.com/academike/sociology-legal-institutions/", description: "Essays exploring the connection between society and legal systems.", source: "Lawctopus", type: "Notes" },
        { title: "Sociology of Law - Video Course", url: "https://www.youtube.com/playlist?list=PL8dPuuaLjXtN0jG9gSqsSjS6x078O3_Yj", description: "Lectures clarifying social structures and how they impact legal frameworks.", source: "YouTube", type: "Course" },
        { title: "Research Methods in Sociology for Law", url: "https://www.scribd.com/document/Sociology-Research-Methods-LLB", description: "Notes on how to conduct and understand sociological research in law.", source: "Scribd", type: "Notes" },
        { title: "Culture and Society in Pakistan Study Hub", url: "http://pu.edu.pk/syllabus/LLB-Part-I/Sociology-I.pdf", description: "Official syllabus and curriculum for Sociology from Punjab University.", source: "PU", type: "Course" }
    ],
    "Philosophy of Law": [
        { title: "Philosophy of Law - Baba Waqar", url: "https://mkg.com.pk/product/philosophy-of-law-book-for-llb-5-years-program-by-baba-waqar/", description: "Simplifies complex jurisprudence topics for 1st-year LLB students.", source: "MKG", type: "Book" },
        { title: "Philosophy of Law (N Series) - M.A. Chaudhary", url: "https://cbpbook.com/product/philosophy-of-law-llb-part-1-paper-5-by-ma-chaudhry-n-series/", description: "Detailed introduction to legal theories, natural law, and positivism.", source: "CBP Book", type: "Book" },
        { title: "Philosophy of Law (Paper 5) - Dogar Publishers", url: "https://onlinebookshop.pk/product/llb-philosophy-of-law-part-1-paper-iv-for-law-books-by-prof-dr-abdul-khaliq-dogar-publishers/", description: "Classical textbook on legal philosophy by Prof. Dr. Abdul Khaliq.", source: "Dogar Publishers", type: "Book" },
        { title: "Introduction to Jurisprudence - Nafeer Ahmad Malik", url: "https://punjablawbookhouse.com/product/philosophy-of-law-llb-part-1-paper-5-by-nafeer-ahmad-malik-plbh/", description: "Legal textbook covering analytical and historical jurisprudence.", source: "PLBH", type: "Book" },
        { title: "Philosophy of Law Study Guide - Honey Books", url: "https://newbooksnbooks.pk/product/honey-philosophy-of-law-llb-i-with-solved-papers-urdu-translation/", description: "Includes Urdu translation and solved past papers for better understanding.", source: "BooksNBooks", type: "Book" },
        { title: "Introduction to Philosophy of Law Lectures", url: "https://thelawacademy.com.pk/courses/jurisprudence/", description: "Comprehensive video course for 1st-year students at The Law Academy.", source: "YouTube", type: "Course" },
        { title: "Natural Law vs Legal Positivism Guide", url: "https://www.lawctopus.com/academike/natural-law-vs-legal-positivism/", description: "Clear comparison of the two main schools of thought in legal philosophy.", source: "Lawctopus", type: "Notes" },
        { title: "Historical School and Legal Realism Notes", url: "https://www.scribd.com/document/Philosophy-of-Law-Notes-LLB-Part-1", description: "Handwritten notes explaining major legal thinkers and their schools.", source: "Scribd", type: "Notes" },
        { title: "Philosophy of Law Solved Papers - PU", url: "https://pu.edu.pk/pastpapers/LLB-Part-I/", description: "Past examination papers covering philosophical questions in law.", source: "PU", type: "Notes" },
        { title: "Philosophy of Law High Yield Study Pack", url: "https://www.youtube.com/@AlviLawAcademy/search?query=philosophy%20of%20law", description: "Exam preparation series from Alvi Law Academy for Philosophy of Law.", source: "YouTube", type: "Course" }
    ],
    "Introduction to World Legal System": [
        { title: "N Series World Legal System - M.A. Chaudhary", url: "https://newbooksnbooks.pk/product/n-series-introduction-to-world-legal-system/", description: "Overview of major legal systems: Romano-Germanic, Common Law, and Shariah.", source: "BooksNBooks", type: "Book" },
        { title: "World Legal System Part 1 - Shahid Naeem", url: "https://onlinebookshop.pk/product/llb-world-legal-system-part-1-5-years-program-by-shahid-naeem-kings-law-college-sheikhupura-dogar-publishers/", description: "Highly recommended book for understanding comparative legal systems.", source: "Dogar Publishers", type: "Book" },
        { title: "Introduction to Law & Legal Systems (Q&A)", url: "https://linkshop.pk/product/introduction-to-law-legal-systems-questions-answers-writer-shahid-naeem/", description: "Focused Q&A textbook for exam-based preparation on legal systems.", source: "LinkShop", type: "Book" },
        { title: "World Legal System Study Material - Sultan Books", url: "https://sultanislamicbook.com/product/introduction-to-legal-systems-llb-part-1-5-years-program/", description: "Resource focusing on the evolution of world legal systems over centuries.", source: "Sultan Books", type: "Book" },
        { title: "Legal Systems of the World - King's Law College", url: "https://www.scribd.com/document/Introduction-to-World-Legal-Systems-Shahid-Naeem", description: "PDF notes and slides by Shahid Naeem from King's Law College.", source: "Scribd", type: "Notes" },
        { title: "Introduction to Major Legal Systems Curriculum", url: "https://pu.edu.pk/images/syllabus/LLB-5-Years-Annual/Part-I/World-Legal-System.pdf", description: "Course description and reading list for World Legal System - I.", source: "PU", type: "Course" },
        { title: "Comparative Legal Systems Video Series", url: "https://www.youtube.com/playlist?list=PL_XAnAn3C2A9-4hD8oHshj0zP_S9V9S-F", description: "Lectures explaining differences between Civil Law and Common Law.", source: "YouTube", type: "Course" },
        { title: "Evolution of Legal Traditions of the World", url: "https://www.scribd.com/document/Legal-Traditions-Notes-LLB", description: "Summary of major legal traditions and their historical backgrounds.", source: "Scribd", type: "Notes" },
        { title: "Roman Law and Modern Legal Frameworks", url: "https://www.scribd.com/document/Roman-Law-Notes-for-LLB", description: "Detailed look at Roman law's foundation for modern world systems.", source: "Scribd", type: "Notes" },
        { title: "World Legal Systems Exam Prep Package", url: "https://www.nearpeer.org/llb/llb-part-1-world-legal-system", description: "Pre-stored video lectures and notes for competitive exam prep.", source: "Nearpeer", type: "Course" }
    ]
};

const StudentLibraryPage = () => {
    const [onlineResults, setOnlineResults] = useState([]);
    const [savedMaterials, setSavedMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchMode, setSearchMode] = useState('online');
    const [selectedYear, setSelectedYear] = useState("1st Year LLB");
    const [selectedSubject, setSelectedSubject] = useState("Political Science");
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDone, setSearchDone] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        if (searchMode === 'saved') {
            fetchSavedLibrary();
        }
    }, [searchMode]);

    const fetchSavedLibrary = async () => {
        setLoading(true);
        try {
            const result = await authService.getSavedLibrary();
            if (result.success) {
                setSavedMaterials(result.savedLibrary);
            }
        } catch (error) {
            console.error('Error fetching saved library:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchAuthenticLibrary = async (query = '') => {
        setOnlineResults([]);
        setError(null);
        setLoading(true);
        try {
            const finalQuery = query ? `${query} for ${selectedSubject} ${selectedYear}` : `${selectedSubject} ${selectedYear} law notes`;
            const mode = 'web';
            const result = await authService.searchOnlineLaw(finalQuery, mode);
            if (result.success) {
                setOnlineResults(result.laws || []);
                setSearchDone(true);
                if (!result.laws || result.laws.length === 0) {
                    setError('No results found. Try broader keywords.');
                }
            } else {
                setError(result.error || 'Search failed. Please try again.');
                setSearchDone(true);
            }
        } catch (error) {
            console.error('Error fetching authentic library:', error);
            setError('Connection error. Please check your internet or try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToLibrary = async (item) => {
        try {
            const result = await authService.saveToLibrary({
                title: item.title,
                fileUrl: item.fileUrl,
                description: item.description,
                source: item.source,
                category: item.category || item.type
            });
            if (result.success) {
                alert('Saved to your library successfully!');
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to save to library');
        }
    };

    const handleRemoveFromLibrary = async (id) => {
        if (!window.confirm('Are you sure you want to remove this item?')) return;
        try {
            const result = await authService.removeFromLibrary(id);
            if (result.success) {
                setSavedMaterials(prev => prev.filter(m => m._id !== id));
            }
        } catch (error) {
            console.error('Error removing from library:', error);
        }
    };

    useEffect(() => {
        setError(null);
        if (CURATED_RESOURCES[selectedSubject]) {
            setOnlineResults(CURATED_RESOURCES[selectedSubject].map(res => ({
                ...res,
                fileUrl: res.url || res.fileUrl,
                category: res.type || res.category
            })));
            setSearchDone(true);
        } else {
            setOnlineResults([]);
            setSearchDone(false);
        }
    }, [selectedSubject]);

    const getIconForType = (type) => {
        switch (type?.toLowerCase()) {
            case 'book': return 'fa-book-open';
            case 'notes': return 'fa-file-alt';
            case 'course': return 'fa-video';
            default: return 'fa-link';
        }
    };

    return (
        <div className="library-hub-root">
            <div className="library-hub-container">
                <nav className="library-nav-bar">
                    <button className="premium-back-btn" onClick={() => router.push('/student-dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                        Dashboard
                    </button>
                    <div className="nav-brand-group">
                        <span className="premium-logo-text">LEX LIBRARY</span>
                        <div className="premium-badge">CURATED HUB</div>
                    </div>
                </nav>

                <header className="library-hub-header">
                    <h1>Curated LLB Master Resources</h1>
                    <p>Verified academic materials & Global Search for Law Students</p>
                </header>

                <div className="hub-tabs-container">
                    <div className="hub-mode-tabs">
                        <button
                            className={`hub-tab-btn ${searchMode === 'online' ? 'active' : ''}`}
                            onClick={() => setSearchMode('online')}
                        >
                            Resource Hub
                        </button>
                        <button
                            className={`hub-tab-btn ${searchMode === 'saved' ? 'active' : ''}`}
                            onClick={() => setSearchMode('saved')}
                        >
                            My Library
                        </button>
                        <button
                            className="hub-tab-btn"
                            onClick={() => router.push('/student-notes')}
                        >
                            Notes & Community
                        </button>
                    </div>
                </div>

                {searchMode === 'online' && (
                    <div className="hub-global-search-container">
                        <div className="premium-search-box">
                            <input
                                type="text"
                                style={{ color: '#333' }}
                                placeholder="Search anything from Google (Notes, Books, Case Laws...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleFetchAuthenticLibrary(searchQuery)}
                            />
                            <button className="global-search-trigger" onClick={() => handleFetchAuthenticLibrary(searchQuery)}>
                                {loading ? 'Loading...' : 'Global Search'}
                            </button>
                        </div>
                        <p className="search-hint">Search for specific topics, authors, or university past papers</p>
                    </div>
                )}

                {searchMode === 'online' && (
                    <section className="hub-navigation-section">
                        <div className="year-pill-group">
                            {Object.keys(YEAR_SUBJECTS).map(year => (
                                <button
                                    key={year}
                                    className={`year-pill ${selectedYear === year ? 'active' : ''}`}
                                    onClick={() => { setSelectedYear(year); setSelectedSubject(YEAR_SUBJECTS[year][0]); }}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                        <div className="subject-pill-group">
                            {YEAR_SUBJECTS[selectedYear].map(subj => (
                                <button
                                    key={subj}
                                    className={`subj-pill ${selectedSubject === subj ? 'active' : ''}`}
                                    onClick={() => setSelectedSubject(subj)}
                                >
                                    {subj}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                <main className="hub-content-area">
                    {error && (
                        <div className="hub-error-box">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="hub-loading-state">
                            <p>Fetching curated materials...</p>
                        </div>
                    ) : (
                        <div className="resource-grid-container">
                            {searchMode === 'online' ? (
                                <>
                                    <div className="curated-grid-header">
                                        <h2 style={{ color: '#1a1a1a' }}>
                                            {searchQuery && searchDone ? `Search Results for "${searchQuery}"` : `${selectedSubject} Master Materials`}
                                        </h2>
                                        <span style={{ color: '#666' }}>{onlineResults.length} {searchQuery && searchDone ? 'Items Found' : 'High-Quality Resources Available'}</span>
                                    </div>
                                    <div className="resource-block-grid">
                                        {onlineResults.map((item, index) => (
                                            <div key={index} className={`resource-card-block type-${(item.category || item.type || 'link').toLowerCase()}`} style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                                                <div className="card-inner-content">
                                                    <div className="type-badge" style={{ color: '#1a73e8', fontWeight: 'bold', marginBottom: '10px' }}>
                                                        {item.category || item.type || 'Resource'}
                                                    </div>
                                                    <h3 className="card-resource-title" style={{ color: '#202124', marginTop: '10px' }}>{item.title}</h3>
                                                    <p className="card-resource-desc" style={{ color: '#5f6368', fontSize: '0.9rem', lineHeight: '1.5' }}>{item.description}</p>
                                                    <div className="card-resource-meta" style={{ marginTop: '15px', display: 'flex', alignItems: 'center' }}>
                                                        <span className="source-label" style={{ backgroundColor: '#f1f3f4', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#5f6368' }}>{item.source}</span>
                                                    </div>
                                                    <div className="card-resource-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-open-resource" style={{ backgroundColor: '#1a73e8', color: '#fff', padding: '8px 16px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
                                                            View Resource
                                                        </a>
                                                        <button
                                                            className="btn-save-resource"
                                                            onClick={() => handleSaveToLibrary(item)}
                                                            style={{ border: '1px solid #dadce0', background: '#fff', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {(!searchQuery || !searchDone) && (
                                        <div className="bottom-curation-notice" style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
                                            Showing pre-selected materials for your LLB program. Use Global Search above for more specific needs.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="saved-library-area">
                                    <div className="curated-grid-header">
                                        <h2 style={{ color: '#1a1a1a' }}>My Personal Collection</h2>
                                        <span style={{ color: '#666' }}>{savedMaterials.length} Items Saved</span>
                                    </div>
                                    {savedMaterials.length > 0 ? (
                                        <div className="resource-block-grid">
                                            {savedMaterials.map((item) => (
                                                <div key={item._id} className="resource-card-block saved-state" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                                                    <div className="card-inner-content">
                                                        <div className="type-badge saved" style={{ color: '#34a853', fontWeight: 'bold' }}>Saved</div>
                                                        <h3 className="card-resource-title" style={{ color: '#202124', marginTop: '10px' }}>{item.title}</h3>
                                                        <p className="card-resource-desc" style={{ color: '#5f6368', fontSize: '0.9rem' }}>{item.description}</p>
                                                        <div className="card-resource-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-open-resource" style={{ backgroundColor: '#1a73e8', color: '#fff', padding: '8px 16px', borderRadius: '4px', textDecoration: 'none' }}>
                                                                Open Original
                                                            </a>
                                                            <button
                                                                className="btn-remove-resource"
                                                                onClick={() => handleRemoveFromLibrary(item._id)}
                                                                style={{ border: '1px solid #ea4335', background: '#fff', color: '#ea4335', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="hub-empty-state" style={{ textAlign: 'center', padding: '80px 20px' }}>
                                            <h3 style={{ color: '#333' }}>Your library is empty</h3>
                                            <p style={{ color: '#666' }}>Resources you save from the Global Library will appear here.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default StudentLibraryPage;
