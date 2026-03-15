import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/LawyerProfile.css';

const LawyerProfilePage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [personalInfo, setPersonalInfo] = useState({
        firstName: '', lastName: '', phone: '', bio: '', city: '', state: ''
    });
    const [professionalInfo, setProfessionalInfo] = useState({
        yearsOfExperience: 0, hourlyRate: 0, practiceAreas: [], barRegistrationNumber: '', isAvailable: true
    });
    const [qualifications, setQualifications] = useState([{ degree: '', institution: '', year: '' }]);
    const [experience, setExperience] = useState([{ title: '', organization: '', startDate: '', endDate: '', isCurrent: false, description: '' }]);
    const [profilePicture, setProfilePicture] = useState(null);

    const practiceAreasList = ["Criminal Law", "Family Law", "Corporate Law", "Civil Law", "Immigration Law", "Tax Law", "Property Law", "Labor Law"];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await authService.getLawyerProfile();
                if (data.success && data.lawyer) {
                    const l = data.lawyer;
                    if (l.personalInfo) setPersonalInfo(l.personalInfo);
                    if (l.professionalInfo) setProfessionalInfo(l.professionalInfo);
                    if (l.qualifications?.length > 0) setQualifications(l.qualifications);
                    if (l.experience?.length > 0) setExperience(l.experience);
                }
            } catch (error) {
                console.error('Failed to load profile', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        setPersonalInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleProfessionalInfoChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProfessionalInfo(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handlePracticeAreaToggle = (area) => {
        setProfessionalInfo(prev => {
            const current = prev.practiceAreas || [];
            if (current.includes(area)) {
                return { ...prev, practiceAreas: current.filter(a => a !== area) };
            } else {
                return { ...prev, practiceAreas: [...current, area] };
            }
        });
    };

    const handleDynamicChange = (setter, index, field, value) => {
        setter(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addDynamicItem = (setter, template) => {
        setter(prev => [...prev, template]);
    };

    const removeDynamicItem = (setter, index) => {
        setter(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();

        const profileData = {
            personalInfo,
            professionalInfo,
            qualifications: qualifications.filter(q => q.degree && q.institution),
            experience: experience.filter(exp => exp.title && exp.organization)
        };

        formData.append('profileData', JSON.stringify(profileData));
        if (profilePicture) formData.append('profilePicture', profilePicture);

        try {
            const data = await authService.updateLawyerProfile(formData);
            if (data.success) {
                alert('Profile saved successfully!');
                localStorage.setItem('lawyerInfo', JSON.stringify(data.lawyer));
                navigate('/lawyer-dashboard');
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Save failed', error);
            alert('Server error saving profile');
        }
    };

    if (loading) return <div className="profile-page-body">Loading...</div>;

    return (
        <div className="profile-page-body">
            <div className="profile-main-container">
                <div className="profile-top-bar">
                    <div>
                        <h1 className="profile-hero-title">Lawyer Profile</h1>
                        <p className="profile-subtitle">Update your professional details to attract more clients.</p>
                    </div>
                    <Link to="/lawyer-dashboard" className="btn btn-secondary">← Back to Dashboard</Link>
                </div>

                <form onSubmit={handleSubmit}>
                    <section className="profile-form-section">
                        <h3>Personal Information</h3>
                        <div className="profile-form-grid">
                            <div className="profile-form-group">
                                <label>First Name *</label>
                                <input name="firstName" value={personalInfo.firstName} onChange={handlePersonalInfoChange} className="profile-input" required />
                            </div>
                            <div className="profile-form-group">
                                <label>Last Name *</label>
                                <input name="lastName" value={personalInfo.lastName} onChange={handlePersonalInfoChange} className="profile-input" required />
                            </div>
                            <div className="profile-form-group">
                                <label>Phone</label>
                                <input name="phone" value={personalInfo.phone} onChange={handlePersonalInfoChange} className="profile-input" />
                            </div>
                            <div className="profile-form-group">
                                <label>Profile Picture</label>
                                <input type="file" onChange={(e) => setProfilePicture(e.target.files[0])} className="profile-input" accept="image/*" />
                            </div>
                        </div>
                        <div className="profile-form-group">
                            <label>Bio</label>
                            <textarea name="bio" value={personalInfo.bio} onChange={handlePersonalInfoChange} className="profile-textarea" placeholder="Tell clients about your expertise..." />
                        </div>
                        <div className="profile-form-grid">
                            <div className="profile-form-group">
                                <label>City *</label>
                                <input name="city" value={personalInfo.city} onChange={handlePersonalInfoChange} className="profile-input" required />
                            </div>
                            <div className="profile-form-group">
                                <label>State</label>
                                <input name="state" value={personalInfo.state} onChange={handlePersonalInfoChange} className="profile-input" />
                            </div>
                        </div>
                    </section>

                    <section className="profile-form-section">
                        <h3>Professional Details</h3>
                        <div className="profile-form-grid">
                            <div className="profile-form-group">
                                <label>Years of Experience</label>
                                <input type="number" name="yearsOfExperience" value={professionalInfo.yearsOfExperience} onChange={handleProfessionalInfoChange} className="profile-input" />
                            </div>
                            <div className="profile-form-group">
                                <label>Hourly Rate ($)</label>
                                <input type="number" name="hourlyRate" value={professionalInfo.hourlyRate} onChange={handleProfessionalInfoChange} className="profile-input" />
                            </div>
                            <div className="profile-form-group">
                                <label>Bar Registration #</label>
                                <input name="barRegistrationNumber" value={professionalInfo.barRegistrationNumber} onChange={handleProfessionalInfoChange} className="profile-input" />
                            </div>
                        </div>
                        <div className="profile-form-group">
                            <label>Practice Areas</label>
                            <div className="profile-checkbox-grid">
                                {practiceAreasList.map(area => (
                                    <label key={area} className="profile-checkbox-item">
                                        <input type="checkbox" checked={professionalInfo.practiceAreas?.includes(area)} onChange={() => handlePracticeAreaToggle(area)} />
                                        {area}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <label className="profile-checkbox-item" style={{ marginTop: '10px' }}>
                            <input type="checkbox" name="isAvailable" checked={professionalInfo.isAvailable} onChange={handleProfessionalInfoChange} />
                            Available for new clients
                        </label>
                    </section>

                    <section className="profile-form-section">
                        <h3>Qualifications</h3>
                        {qualifications.map((q, idx) => (
                            <div key={idx} className="dynamic-item-card">
                                {qualifications.length > 1 && <button type="button" className="btn-remove-item" onClick={() => removeDynamicItem(setQualifications, idx)}>Remove</button>}
                                <div className="profile-form-grid">
                                    <div className="profile-form-group">
                                        <label>Degree *</label>
                                        <input value={q.degree} onChange={(e) => handleDynamicChange(setQualifications, idx, 'degree', e.target.value)} className="profile-input" placeholder="e.g. LL.B" />
                                    </div>
                                    <div className="profile-form-group">
                                        <label>Institution *</label>
                                        <input value={q.institution} onChange={(e) => handleDynamicChange(setQualifications, idx, 'institution', e.target.value)} className="profile-input" placeholder="e.g. Harvard Law" />
                                    </div>
                                    <div className="profile-form-group">
                                        <label>Year</label>
                                        <input type="number" value={q.year} onChange={(e) => handleDynamicChange(setQualifications, idx, 'year', e.target.value)} className="profile-input" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" className="btn-add-item" onClick={() => addDynamicItem(setQualifications, { degree: '', institution: '', year: '' })}>+ Add Qualification</button>
                    </section>

                    <section className="profile-form-section">
                        <h3>Experience</h3>
                        {experience.map((exp, idx) => (
                            <div key={idx} className="dynamic-item-card">
                                <button type="button" className="btn-remove-item" onClick={() => removeDynamicItem(setExperience, idx)}>Remove</button>
                                <div className="profile-form-grid">
                                    <div className="profile-form-group">
                                        <label>Title *</label>
                                        <input value={exp.title} onChange={(e) => handleDynamicChange(setExperience, idx, 'title', e.target.value)} className="profile-input" placeholder="e.g. Senior Advocate" />
                                    </div>
                                    <div className="profile-form-group">
                                        <label>Organization *</label>
                                        <input value={exp.organization} onChange={(e) => handleDynamicChange(setExperience, idx, 'organization', e.target.value)} className="profile-input" placeholder="e.g. Legal Chambers" />
                                    </div>
                                </div>
                                <div className="profile-form-grid">
                                    <div className="profile-form-group">
                                        <label>Start Date</label>
                                        <input type="date" value={exp.startDate} onChange={(e) => handleDynamicChange(setExperience, idx, 'startDate', e.target.value)} className="profile-input" />
                                    </div>
                                    <div className="profile-form-group">
                                        <label>End Date</label>
                                        <input type="date" value={exp.endDate} onChange={(e) => handleDynamicChange(setExperience, idx, 'endDate', e.target.value)} className="profile-input" disabled={exp.isCurrent} />
                                    </div>
                                </div>
                                <label className="profile-checkbox-item">
                                    <input type="checkbox" checked={exp.isCurrent} onChange={(e) => handleDynamicChange(setExperience, idx, 'isCurrent', e.target.checked)} />
                                    Currently working here
                                </label>
                            </div>
                        ))}
                        <button type="button" className="btn-add-item" onClick={() => addDynamicItem(setExperience, { title: '', organization: '', startDate: '', endDate: '', isCurrent: false, description: '' })}>+ Add Experience</button>
                    </section>

                    <button type="submit" className="btn-profile-save">💾 Save All Changes</button>
                </form>
            </div>
        </div>
    );
};

export default LawyerProfilePage;
