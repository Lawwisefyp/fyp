'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentSidebar from '@/components/StudentSidebar';
import '@/styles/StudentNotes.css';
import '@/styles/StudentInsights.css';

const StudentInsightsPage = () => {
    const router = useRouter();
    const [selectedArticle, setSelectedArticle] = useState(null);

    const articles = [
        {
            id: 'lat',
            icon: '📋',
            category: 'LAT Prep',
            title: 'Complete Guide: How to Prepare for LAT 2025',
            desc: 'A step-by-step study plan for the Law Admissions Test — from subject breakdowns to time management strategies used by top scorers.',
            readTime: '5 min read',
            content: (
                <div className="article-content">
                    <h2>Mastering the Law Admission Test (LAT) 2025</h2>
                    <p>The Law Admission Test (LAT) is a mandatory requirement for any student seeking admission to a 5-year LL.B program in Pakistan, as per HEC and Supreme Court guidelines.</p>
                    
                    <h4>Subject Breakdown (100 Marks Total)</h4>
                    <ul className="merit-table">
                        <li style={{ display: 'flex', justifyContent: 'space-between' }}><strong>English (MCQs)</strong> <span>20 Marks</span></li>
                        <li style={{ display: 'flex', justifyContent: 'space-between' }}><strong>General Knowledge (MCQs)</strong> <span>20 Marks</span></li>
                        <li style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Islamic Studies (MCQs)</strong> <span>10 Marks</span></li>
                        <li style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Pakistan Studies (MCQs)</strong> <span>10 Marks</span></li>
                        <li style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Urdu (MCQs)</strong> <span>10 Marks</span></li>
                        <li style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Mathematics (MCQs)</strong> <span>05 Marks</span></li>
                        <li style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Essay (English or Urdu)</strong> <span>15 Marks</span></li>
                        <li style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Personal Statement</strong> <span>10 Marks</span></li>
                    </ul>

                    <h4>Top Scorer Strategy</h4>
                    <ul>
                        <li><strong>The 140-Minute Rule:</strong> You have 2 hours and 20 minutes. Spend exactly 40 minutes on the Essay and Personal Statement, and use the rest for MCQs and review.</li>
                        <li><strong>Vocabulary Focus:</strong> English and General Knowledge make up 40% of the test. Read newspapers like Dawn to improve your vocabulary and stay updated on current affairs.</li>
                        <li><strong>Practice Subjective:</strong> Many students fail to finish their essay. Practice writing 200-word essays within 20 minutes to build speed.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'uni',
            icon: '🏛️',
            category: 'Universities',
            title: 'Ultimate Guide: Best Law Universities in Pakistan — 2025',
            desc: 'Every detail you need: Admission criteria, exact merit formulas, fee structures, and campus facilities for top-tier law schools.',
            readTime: '12 min read',
            content: (
                <div className="article-content">
                    <h2>Top-Tier Law Schools in Pakistan: The 2025 Deep-Dive</h2>
                    <p>Applying for a 5-year LL.B (Hons) requires careful planning. Here is the definitive breakdown of the most sought-after law institutions in the country.</p>

                    <div style={{ marginTop: '30px' }}>
                        <img 
                            src="/images/pulc.png" 
                            alt="Punjab University Law College" 
                            style={{ width: '100%', borderRadius: '20px', marginBottom: '15px' }}
                        />
                        <h3 style={{ color: '#1e3a8a' }}>1. Punjab University Law College (PULC), Lahore</h3>
                        <p>The oldest and most prestigious institution for litigation and judiciary-bound students in Pakistan.</p>
                        
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #1e3a8a' }}>
                            <h4>Admission Criteria (2025 Cycle)</h4>
                            <ul>
                                <li><strong>Academic:</strong> Minimum 55% in Intermediate (F.A/F.Sc/A-Levels).</li>
                                <li><strong>Age:</strong> Maximum 24 years at time of application.</li>
                                <li><strong>Tests:</strong> Must pass HEC LAT (min 50) AND the PU Entry Test.</li>
                            </ul>
                            
                            <h4>Exact Merit Formula</h4>
                            <table className="merit-table">
                                <thead>
                                    <tr><th>Component</th><th>Weightage</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>Academic Record (Matric + Inter)</td><td>75%</td></tr>
                                    <tr><td>PU Admission Test Score</td><td>25%</td></tr>
                                    <tr><td>Hafiz-e-Quran / Elective Civics</td><td>+20/25 Marks</td></tr>
                                </tbody>
                            </table>
                            
                            <p><strong>Fees:</strong> Approx. Rs. 75,000 - 85,000 for the first semester (Regular Morning).</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px' }}>
                        <img 
                            src="/images/lums.png" 
                            alt="LUMS SAHSOL" 
                            style={{ width: '100%', borderRadius: '20px', marginBottom: '15px' }}
                        />
                        <h3 style={{ color: '#1e3a8a' }}>2. LUMS (SAHSOL), Lahore</h3>
                        <p>The premier private law school for Corporate Law, international practice, and policy-making.</p>
                        
                        <div style={{ background: '#fdf4ff', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #a21caf' }}>
                            <h4>Admission Components</h4>
                            <ul>
                                <li><strong>Academic:</strong> High O/A Level grades or 80%+ in F.Sc.</li>
                                <li><strong>Tests:</strong> SAT/ACT OR LUMS Common Admission Test (LCAT) + Mandatory HEC LAT.</li>
                                <li><strong>Subjective:</strong> A compelling Personal Statement is 30% of the selection impact.</li>
                            </ul>
                            
                            <p><strong>Merit Calculation:</strong> Holistic. No fixed formula is disclosed, but LCAT/SAT scores and high-school grades are the primary filters before the interview phase.</p>
                            <p><strong>Fees:</strong> Approx. Rs. 450,000 - 550,000 per semester (Subject to credit hours).</p>
                            <p><strong>Financial Aid:</strong> 1 in 3 students at LUMS receives some form of financial support (NOP program available).</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px' }}>
                        <h3 style={{ color: '#1e3a8a' }}>3. Quaid-i-Azam University (QAU), Islamabad</h3>
                        <p>High merit standards in the capital city, known for a diverse student body from all provinces.</p>
                        
                        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #166534' }}>
                            <h4>Exact Merit Formula</h4>
                            <table className="merit-table">
                                <thead>
                                    <tr><th>Component</th><th>Weightage</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>Intermediate (Part-I)</td><td>50%</td></tr>
                                    <tr><td>HEC Law Admission Test (LAT)</td><td>30%</td></tr>
                                    <tr><td>Matriculation (SSC)</td><td>20%</td></tr>
                                </tbody>
                            </table>
                            <p><strong>Hostel:</strong> Merit-based allocation. Very limited for the 5-year LL.B program; apply on day one!</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', padding: '20px', background: '#fffbeb', borderRadius: '15px', border: '1px solid #fcd34d' }}>
                        <p>💡 <strong>Final Tip:</strong> Always verify recognition status on the Pakistan Bar Council (PBC) website before depositing your fee. Accreditation status can change annually!</p>
                    </div>
                </div>
            )
        },
        {
            id: 'research',
            icon: '🔍',
            category: 'Research',
            title: 'Legal Research Guide for Pakistani Law Students',
            desc: 'Master legal research — from navigating Pakistan Law Site and court databases to writing compelling case briefs and moot court arguments.',
            readTime: '6 min read',
            content: (
                <div className="article-content">
                    <h2>Mastering Legal Research in Pakistan</h2>
                    <p>In law school, your research skills are just as important as your memorization skills. Here is how to find the law in Pakistan.</p>

                    <h4>Key Resources</h4>
                    <ul>
                        <li><strong>Pakistan Law Site:</strong> The most comprehensive database for Pakistani statutes and case law. Essential for every practicing lawyer.</li>
                        <li><strong>PLD (Pakistan Legal Decisions):</strong> The gold standard for case law. If a case is reported in PLD, it holds high persuasive value.</li>
                        <li><strong>SCMR (Supreme Court Monthly Review):</strong> Essential for tracking the latest decisions from the Supreme Court of Pakistan.</li>
                    </ul>

                    <h4>Research Methodology</h4>
                    <ul>
                        <li><strong>Check Current Statutes:</strong> Always check if an Act or Ordinance has been amended recently. The Gazette of Pakistan is the primary source for this.</li>
                        <li><strong>The Hierarchy of Precedents:</strong> Supreme Court decisions are binding on all other courts. High Court decisions are binding on sub-ordinate courts within their province.</li>
                        <li><strong>Drafting Case Briefs:</strong> Focus on the "Ratio Decidendi" (the legal reason for the decision) rather than the "Obiter Dicta" (passing remarks).</li>
                    </ul>
                </div>
            )
        }
    ];

    return (
        <div className="notes-page-container" style={{ display: 'flex', background: '#f8fafc' }}>
            <StudentSidebar />
            <div className="notes-sidebar" style={{ borderLeft: '1px solid #e2e8f0', marginLeft: '0' }}>
                <div className="sidebar-section">
                    <h3>Explore Guides</h3>
                    <div className="folder-list">
                        <div className="folder-item active">📚 All Insights</div>
                        <div className="folder-item">⚖️ Exam Strategies</div>
                        <div className="folder-item">📂 Career Paths</div>
                        <div className="folder-item">🏫 Campus News</div>
                    </div>
                </div>

                <div className="sidebar-section" style={{ marginTop: 'auto' }}>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', fontSize: '0.8rem', color: '#64748b' }}>
                        📖 <strong>Daily Quote:</strong> "Ignorance of the law excuses no one." — Legal Maxim
                    </div>
                </div>
            </div>

            <div className="notes-main-content">
                <div className="notes-header">
                    <div className="notes-title-sec">
                        <h1 style={{ fontSize: '2.5rem', color: '#1e293b', fontWeight: '800', margin: '0 0 10px 0' }}>Insights & Legal Guides</h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Expert-curated articles to help you navigate law school, exams, and the Pakistani legal system.</p>
                    </div>
                </div>

                <div className="insights-grid">
                    {articles.map((article) => (
                        <div key={article.id} className="insight-card">
                            <div className="insight-banner">
                                {article.icon}
                            </div>
                            <div className="insight-content">
                                <div className="insight-category">
                                    {article.category}
                                </div>
                                <h3>{article.title}</h3>
                                <p>{article.desc}</p>
                                <div className="insight-footer">
                                    <div className="read-time">
                                        📖 {article.readTime}
                                    </div>
                                    <div className="read-more-btn" onClick={() => setSelectedArticle(article)}>
                                        Read More →
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Article Modal */}
                {selectedArticle && (
                    <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
                        <div className="insight-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="close-modal" onClick={() => setSelectedArticle(null)}>×</button>
                            <div className="insight-category">
                                {selectedArticle.icon} {selectedArticle.category}
                            </div>
                            <h1 style={{ fontSize: '2.5rem', color: '#1e293b', margin: '10px 0 20px 0' }}>{selectedArticle.title}</h1>
                            <div style={{ display: 'flex', gap: '20px', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '30px' }}>
                                <span>Published: April 2025</span>
                                <span>•</span>
                                <span>{selectedArticle.readTime}</span>
                            </div>
                            {selectedArticle.content}
                            <div style={{ marginTop: '40px', padding: '30px', background: '#f8fafc', borderRadius: '20px', textAlign: 'center' }}>
                                <h4 style={{ margin: '0 0 10px 0' }}>Was this guide helpful?</h4>
                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                    <button style={{ padding: '10px 25px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>👍 Yes</button>
                                    <button style={{ padding: '10px 25px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>👎 No</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentInsightsPage;
