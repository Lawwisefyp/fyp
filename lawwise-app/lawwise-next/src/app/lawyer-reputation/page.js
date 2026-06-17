'use client';

import React, { useState, useEffect } from 'react';
import LawyerSidebar from '@/components/LawyerSidebar';
import { Star, ShieldCheck, MessageSquare, Award, Clock } from 'lucide-react';
import { reviewService } from '@/lib/services/api';

export default function LawyerReputationPage() {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const info = JSON.parse(localStorage.getItem('lawyerInfo'));
            if (info && info._id) {
                const res = await reviewService.getLawyerReviews(info._id);
                setReviews(res.reviews || []);
                setStats(res.stats || null);
            }
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitReply = async (reviewId) => {
        if (!replyText.trim()) return;
        try {
            await reviewService.replyToReview(reviewId, replyText);
            alert('Reply posted successfully!');
            setReplyingTo(null);
            setReplyText('');
            fetchReviews(); // refresh
        } catch (error) {
            console.error('Failed to post reply:', error);
            alert('Failed to post reply.');
        }
    };

    const renderStars = (rating) => {
        return (
            <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                        key={star}
                        size={16}
                        fill={star <= rating ? "#c19651" : "transparent"}
                        color={star <= rating ? "#c19651" : "#cbd5e1"}
                    />
                ))}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <LawyerSidebar />
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                <header style={{ marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Award size={32} color="#c19651" />
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: '0 0 5px 0' }}>Client Reviews</h1>
                            <p style={{ color: '#64748b', margin: 0 }}>Manage your reputation and respond to client feedback.</p>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading reputation data...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
                        <div className="reviews-list">
                            {reviews.length === 0 ? (
                                <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                                    <h3>No Reviews Yet</h3>
                                    <p style={{ color: '#64748b' }}>When clients review your services, they will appear here.</p>
                                </div>
                            ) : (
                                reviews.map(review => (
                                    <div key={review._id} style={{ background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.1rem' }}>
                                                    {review.isAnonymous ? 'Verified Client (Anonymous)' : review.clientId?.fullName}
                                                </h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {renderStars(review.overallRating)}
                                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#166534', background: '#f0fdf4', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', height: 'fit-content' }}>
                                                <ShieldCheck size={14} /> Verified Case
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', marginBottom: '15px' }}>
                                            <span>Communication: {review.communicationRating}/5</span>
                                            <span>Expertise: {review.expertiseRating}/5</span>
                                            <span>Professionalism: {review.professionalismRating}/5</span>
                                            <span>Value: {review.valueRating}/5</span>
                                        </div>

                                        <p style={{ color: '#334155', fontStyle: 'italic', marginBottom: '20px', lineHeight: '1.6' }}>"{review.reviewText}"</p>

                                        {review.lawyerReply ? (
                                            <div style={{ background: '#f1f5f9', borderLeft: '3px solid #0f172a', padding: '15px', borderRadius: '0 8px 8px 0' }}>
                                                <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#0f172a' }}>Your Public Reply:</h5>
                                                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>{review.lawyerReply}</p>
                                            </div>
                                        ) : replyingTo === review._id ? (
                                            <div style={{ marginTop: '15px' }}>
                                                <textarea 
                                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', fontFamily: 'inherit' }}
                                                    rows="3"
                                                    placeholder="Write a professional, public reply to this client..."
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                />
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button 
                                                        style={{ background: '#0f172a', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                                        onClick={() => submitReply(review._id)}
                                                    >
                                                        Post Reply
                                                    </button>
                                                    <button 
                                                        style={{ background: 'transparent', color: '#64748b', padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                style={{ background: 'transparent', color: '#c19651', border: '1px solid #c19651', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                onClick={() => setReplyingTo(review._id)}
                                            >
                                                <MessageSquare size={16} /> Reply to Client
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="reputation-sidebar">
                            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', position: 'sticky', top: '20px' }}>
                                <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '1.2rem', fontWeight: '800' }}>Overall Reputation</h3>
                                
                                {stats ? (
                                    <>
                                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                                            <div style={{ fontSize: '3rem', fontWeight: '800', color: '#0f172a', lineHeight: '1' }}>{stats.overall}</div>
                                            <div style={{ color: '#c19651', margin: '5px 0' }}>{'★'.repeat(Math.round(stats.overall))}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Based on {stats.totalReviews} reviews</div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '5px', fontWeight: '600' }}>
                                                    <span>Communication</span>
                                                    <span>{stats.communication}</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${(stats.communication / 5) * 100}%`, height: '100%', background: '#c19651' }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '5px', fontWeight: '600' }}>
                                                    <span>Expertise</span>
                                                    <span>{stats.expertise}</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${(stats.expertise / 5) * 100}%`, height: '100%', background: '#c19651' }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '5px', fontWeight: '600' }}>
                                                    <span>Professionalism</span>
                                                    <span>{stats.professionalism}</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${(stats.professionalism / 5) * 100}%`, height: '100%', background: '#c19651' }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '5px', fontWeight: '600' }}>
                                                    <span>Value for Money</span>
                                                    <span>{stats.value}</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${(stats.value / 5) * 100}%`, height: '100%', background: '#c19651' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>Not enough data to calculate stats yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
