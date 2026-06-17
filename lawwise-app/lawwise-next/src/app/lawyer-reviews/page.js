'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, User, MessageSquare, Award, Clock } from 'lucide-react';
import ClientSidebar from '@/components/ClientSidebar';
import { reviewService } from '@/lib/services/api';
import axios from 'axios';
import './LawyerReviews.css';

export default function LawyerReviewsPage() {
    const [myReviews, setMyReviews] = useState([]);
    const [lawyers, setLawyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('write'); // 'write' or 'my-reviews'
    
    // Form State
    const [selectedLawyer, setSelectedLawyer] = useState('');
    const [ratings, setRatings] = useState({
        overall: 0,
        communication: 0,
        expertise: 0,
        professionalism: 0,
        value: 0
    });
    const [reviewText, setReviewText] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [tag, setTag] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch client's reviews
            const reviewsRes = await reviewService.getClientReviews();
            setMyReviews(reviewsRes || []);

            // Fetch all lawyers to populate dropdown
            const lawyersRes = await axios.get('http://localhost:5001/api/lawyers');
            if (lawyersRes.data && lawyersRes.data.success) {
                setLawyers(lawyersRes.data.lawyers);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRatingClick = (category, value) => {
        setRatings(prev => ({ ...prev, [category]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedLawyer) return alert("Please select a lawyer to review.");
        if (!ratings.overall || !ratings.communication || !ratings.expertise || !ratings.professionalism || !ratings.value) {
            return alert("Please provide ratings for all categories.");
        }
        if (!reviewText.trim()) return alert("Please write your review feedback.");

        setSubmitting(true);
        try {
            const payload = {
                lawyerId: selectedLawyer,
                overallRating: ratings.overall,
                communicationRating: ratings.communication,
                expertiseRating: ratings.expertise,
                professionalismRating: ratings.professionalism,
                valueRating: ratings.value,
                reviewText,
                tags: tag ? [tag] : [],
                isAnonymous
            };

            await reviewService.submitReview(payload);
            alert("Review submitted successfully! Thank you for your feedback.");
            
            // Reset form
            setSelectedLawyer('');
            setRatings({ overall: 0, communication: 0, expertise: 0, professionalism: 0, value: 0 });
            setReviewText('');
            setTag('');
            setIsAnonymous(false);
            
            // Refresh reviews
            fetchData();
            setActiveTab('my-reviews');
        } catch (error) {
            console.error("Submission error:", error);
            alert("Failed to submit review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (category, currentRating, interactive = false) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                        key={star}
                        size={interactive ? 24 : 16}
                        fill={star <= currentRating ? "#c19651" : "transparent"}
                        color={star <= currentRating ? "#c19651" : "#cbd5e1"}
                        className={interactive ? "interactive-star" : ""}
                        onClick={() => interactive && handleRatingClick(category, star)}
                        style={{ cursor: interactive ? 'pointer' : 'default', transition: 'all 0.2s' }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="dashboard-body">
            <ClientSidebar />
            <div className="reviews-container">
                <header className="reviews-header">
                    <div className="header-title-box">
                        <Award size={32} color="#c19651" />
                        <div>
                            <h1>Lawyer Reviews</h1>
                            <p>Share your experience and help others find the right legal representation.</p>
                        </div>
                    </div>
                    <div className="reviews-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'write' ? 'active' : ''}`}
                            onClick={() => setActiveTab('write')}
                        >
                            Write a Review
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'my-reviews' ? 'active' : ''}`}
                            onClick={() => setActiveTab('my-reviews')}
                        >
                            My Reviews ({myReviews.length})
                        </button>
                    </div>
                </header>

                <div className="reviews-content">
                    {loading ? (
                        <div className="loading-state">Loading your data...</div>
                    ) : activeTab === 'write' ? (
                        <div className="write-review-card">
                            <div className="card-header">
                                <h3><MessageSquare size={20} /> Submit Verified Feedback</h3>
                                <div className="trust-badge">
                                    <ShieldCheck size={16} color="#22c55e" />
                                    <span>Your review helps maintain our high standards.</span>
                                </div>
                            </div>
                            
                            <form className="review-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Select Lawyer</label>
                                    <select 
                                        value={selectedLawyer} 
                                        onChange={(e) => setSelectedLawyer(e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="">-- Choose a lawyer you have consulted --</option>
                                        {lawyers.map(l => (
                                            <option key={l._id} value={l._id}>{l.fullName} ({l.specialization})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="ratings-grid">
                                    <div className="rating-item">
                                        <label>Overall Rating</label>
                                        {renderStars('overall', ratings.overall, true)}
                                    </div>
                                    <div className="rating-item">
                                        <label>Communication</label>
                                        {renderStars('communication', ratings.communication, true)}
                                    </div>
                                    <div className="rating-item">
                                        <label>Legal Expertise</label>
                                        {renderStars('expertise', ratings.expertise, true)}
                                    </div>
                                    <div className="rating-item">
                                        <label>Professionalism</label>
                                        {renderStars('professionalism', ratings.professionalism, true)}
                                    </div>
                                    <div className="rating-item">
                                        <label>Value for Money</label>
                                        {renderStars('value', ratings.value, true)}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Case Outcome / Context Tag (Optional)</label>
                                    <select 
                                        value={tag} 
                                        onChange={(e) => setTag(e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="">None</option>
                                        <option value="Consultation Only">Consultation Only</option>
                                        <option value="Case Won">Case Won</option>
                                        <option value="Settled out of Court">Settled out of Court</option>
                                        <option value="Legal Drafting">Legal Drafting</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Detailed Feedback</label>
                                    <textarea 
                                        rows="5"
                                        placeholder="Describe your experience working with this lawyer. Was their advice helpful? Were they responsive?"
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        className="form-control"
                                    ></textarea>
                                </div>

                                <div className="form-options">
                                    <label className="checkbox-label">
                                        <input 
                                            type="checkbox" 
                                            checked={isAnonymous} 
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                        />
                                        <span>Post as Anonymous (Keep my identity hidden from public profiles)</span>
                                    </label>
                                </div>

                                <button type="submit" className="btn-submit-review" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Verified Review'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="my-reviews-list">
                            {myReviews.length === 0 ? (
                                <div className="empty-state">
                                    <MessageSquare size={48} color="#cbd5e1" />
                                    <h3>No Reviews Yet</h3>
                                    <p>You haven't submitted any lawyer reviews. Your feedback helps the Lawwise community!</p>
                                    <button className="btn-outline" onClick={() => setActiveTab('write')}>Write a Review</button>
                                </div>
                            ) : (
                                <div className="reviews-grid">
                                    {myReviews.map(review => (
                                        <div key={review._id} className="review-card">
                                            <div className="review-card-header">
                                                <div className="lawyer-info">
                                                    <div className="lawyer-avatar">
                                                        {review.lawyerId?.fullName?.charAt(0) || 'L'}
                                                    </div>
                                                    <div>
                                                        <h4>Adv. {review.lawyerId?.fullName || 'Unknown'}</h4>
                                                        <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="review-overall">
                                                    {renderStars('display', review.overallRating)}
                                                </div>
                                            </div>

                                            <div className="review-metrics-mini">
                                                <span>Comm: {review.communicationRating}/5</span>
                                                <span>Expertise: {review.expertiseRating}/5</span>
                                            </div>

                                            {review.tags && review.tags.length > 0 && (
                                                <div className="review-tags">
                                                    {review.tags.map(t => <span key={t} className="tag">{t}</span>)}
                                                </div>
                                            )}

                                            <p className="review-text">"{review.reviewText}"</p>

                                            <div className="review-footer">
                                                <div className="anon-status">
                                                    {review.isAnonymous ? 'Posted Anonymously' : 'Posted Publicly'}
                                                </div>
                                                <div className="verified-badge">
                                                    <ShieldCheck size={14} /> Verified
                                                </div>
                                            </div>

                                            {review.lawyerReply && (
                                                <div className="lawyer-reply-box">
                                                    <h5>Lawyer's Reply</h5>
                                                    <p>{review.lawyerReply}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
