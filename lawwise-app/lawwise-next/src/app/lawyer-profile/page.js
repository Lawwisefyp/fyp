'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';
import { 
    User, 
    Briefcase, 
    GraduationCap, 
    CheckCircle, 
    ChevronRight, 
    ChevronLeft, 
    Save, 
    Camera,
    Plus,
    Trash2,
    X
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import '@/styles/LawyerProfile.css';
import '@/styles/Dashboard.css';

const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => resolve(img);
        img.onerror = (error) => reject(error);
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg');
    });
};

const LawyerProfilePage = () => {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    
    // Cropping states
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [tempImage, setTempImage] = useState(null);

    const [personalInfo, setPersonalInfo] = useState({
        firstName: '', lastName: '', phone: '', bio: '', city: '', state: 'Punjab'
    });
    const [professionalInfo, setProfessionalInfo] = useState({
        yearsOfExperience: 0, hourlyRate: 0, practiceAreas: [], barRegistrationNumber: '', isAvailable: true
    });
    const [qualifications, setQualifications] = useState([{ degree: '', institution: '', year: '' }]);
    const [experience, setExperience] = useState([{ title: '', organization: '', startDate: '', endDate: '', isCurrent: false, description: '' }]);
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const practiceAreasList = ["Criminal Law", "Family Law", "Corporate Law", "Civil Law", "Immigration Law", "Tax Law", "Property Law", "Labor Law"];
    const provinces = ["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad Capital Territory", "Gilgit-Baltistan", "Azad Kashmir"];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await authService.getLawyerProfile();
                if (data.success && data.lawyer) {
                    const l = data.lawyer;
                    if (l.personalInfo) setPersonalInfo(prev => ({ ...prev, ...l.personalInfo }));
                    if (l.professionalInfo) setProfessionalInfo(prev => ({ ...prev, ...l.professionalInfo }));
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setTempImage(reader.result);
                setIsCropping(true);
            };
        }
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const showCroppedImage = async () => {
        try {
            const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels);
            const croppedFile = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });
            setProfilePicture(croppedFile);
            setPreviewUrl(URL.createObjectURL(croppedBlob));
            setIsCropping(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async () => {
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
            setLoading(true);
            const data = await authService.updateLawyerProfile(formData);
            if (data.success) {
                alert('✅ Profile updated successfully!');
                localStorage.setItem('lawyerInfo', JSON.stringify(data.lawyer));
                router.push('/lawyer-dashboard');
            }
        } catch (error) {
            console.error('Save failed', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    if (loading) return (
        <div className="dashboard-body">
            <LawyerSidebar />
            <div className="dashboard-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loader">Updating Profile...</div>
            </div>
        </div>
    );

    const steps = [
        { id: 1, title: 'Personal information', icon: User },
        { id: 2, title: 'Professional profile', icon: Briefcase },
        { id: 3, title: 'Qualifications', icon: GraduationCap },
        { id: 4, title: 'Final Review', icon: CheckCircle },
    ];

    return (
        <div className="dashboard-body">
            <LawyerSidebar />
            <div className="dashboard-main" style={{ background: '#fff' }}>
                <div className="profile-wizard-container">
                    
                    {/* Header */}
                    <div className="wizard-header">
                        <div className="header-left">
                            <div className="header-icon-box">
                                <User size={20} />
                            </div>
                            <h1>Complete Your Profile</h1>
                        </div>
                        <button className="close-btn" onClick={() => router.push('/lawyer-dashboard')}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="wizard-progress-bar">
                        {steps.map((step) => (
                            <div key={step.id} className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}>
                                <div className="step-number">
                                    {currentStep > step.id ? <CheckCircle size={16} /> : step.id}
                                </div>
                                <div className="step-label">
                                    <span>STEP {step.id}</span>
                                    <p>{step.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="wizard-content-card">
                        
                        {currentStep === 1 && (
                            <div className="step-content animate-fade-in">
                                <span className="step-tag">STEP 1</span>
                                <h2 className="step-title">Where should we place your workspace?</h2>
                                <p className="step-desc">We use your location to localize courts, filings, and the right regional context from the first session.</p>

                                <div className="profile-form-grid">
                                    <div className="form-group-modern full-width">
                                        <label>Profile Picture</label>
                                        <div className="avatar-upload-box">
                                            <div className="avatar-preview">
                                                {previewUrl ? <img src={previewUrl} alt="Preview" /> : <User size={40} />}
                                            </div>
                                            <div className="upload-controls">
                                                <label htmlFor="pfp-upload" className="btn-upload">
                                                    <Camera size={16} /> Choose Image
                                                </label>
                                                <input id="pfp-upload" type="file" onChange={handleFileChange} accept="image/*" hidden />
                                                <p>Supported: JPG, PNG. Max 2MB.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group-modern">
                                        <label>First Name *</label>
                                        <input name="firstName" value={personalInfo.firstName} onChange={handlePersonalInfoChange} placeholder="Enter first name" />
                                    </div>
                                    <div className="form-group-modern">
                                        <label>Last Name *</label>
                                        <input name="lastName" value={personalInfo.lastName} onChange={handlePersonalInfoChange} placeholder="Enter last name" />
                                    </div>

                                    <div className="form-group-modern">
                                        <label>Phone Number *</label>
                                        <p className="input-hint">Use the number you want tied to your account and recovery flow.</p>
                                        <div className="phone-input-wrapper">
                                            <span className="country-prefix">🇵🇰 +92</span>
                                            <input name="phone" value={personalInfo.phone} onChange={handlePersonalInfoChange} placeholder="3XX XXXXXXX" />
                                        </div>
                                    </div>

                                    <div className="form-group-modern">
                                        <label>City *</label>
                                        <p className="input-hint">This helps tailor jurisdiction-specific workflows.</p>
                                        <input name="city" value={personalInfo.city} onChange={handlePersonalInfoChange} placeholder="e.g. Okara" />
                                    </div>

                                    <div className="form-group-modern">
                                        <label>Province *</label>
                                        <p className="input-hint">Choose the province you primarily work or study in.</p>
                                        <select name="state" value={personalInfo.state} onChange={handlePersonalInfoChange} className="modern-select">
                                            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group-modern full-width" style={{ marginTop: '20px' }}>
                                    <label>Professional Bio</label>
                                    <p className="input-hint">A brief overview of your expertise for potential clients.</p>
                                    <textarea name="bio" value={personalInfo.bio} onChange={handlePersonalInfoChange} placeholder="Tell clients about your legal journey..." rows={4} />
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="step-content animate-fade-in">
                                <span className="step-tag">STEP 2</span>
                                <h2 className="step-title">Your Professional Identity</h2>
                                <p className="step-desc">Help us verify your credentials and categorize your expertise.</p>

                                <div className="profile-form-grid">
                                    <div className="form-group-modern">
                                        <label>Bar Registration Number</label>
                                        <p className="input-hint">Official license number for verification.</p>
                                        <input name="barRegistrationNumber" value={professionalInfo.barRegistrationNumber} onChange={handleProfessionalInfoChange} placeholder="e.g. PB-12345" />
                                    </div>
                                    <div className="form-group-modern">
                                        <label>Years of Experience</label>
                                        <p className="input-hint">Total years practicing law.</p>
                                        <input type="number" name="yearsOfExperience" value={professionalInfo.yearsOfExperience} onChange={handleProfessionalInfoChange} />
                                    </div>
                                    <div className="form-group-modern">
                                        <label>Hourly Rate ($)</label>
                                        <p className="input-hint">Your standard consultation fee.</p>
                                        <input type="number" name="hourlyRate" value={professionalInfo.hourlyRate} onChange={handleProfessionalInfoChange} />
                                    </div>
                                </div>

                                <div className="form-group-modern full-width" style={{ marginTop: '20px' }}>
                                    <label>Practice Areas</label>
                                    <p className="input-hint">Select the fields of law you specialize in.</p>
                                    <div className="modern-checkbox-grid">
                                        {practiceAreasList.map(area => (
                                            <label key={area} className={`checkbox-card ${professionalInfo.practiceAreas?.includes(area) ? 'checked' : ''}`}>
                                                <input type="checkbox" checked={professionalInfo.practiceAreas?.includes(area)} onChange={() => handlePracticeAreaToggle(area)} hidden />
                                                <div className="checkbox-content">
                                                    <CheckCircle size={14} className="check-icon" />
                                                    <span>{area}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="step-content animate-fade-in">
                                <span className="step-tag">STEP 3</span>
                                <h2 className="step-title">Education & Career Path</h2>
                                <p className="step-desc">Showcase your academic background and professional history.</p>

                                <div className="dynamic-sections-container">
                                    <div className="dynamic-section">
                                        <div className="section-header-mini">
                                            <h3>Educational Qualifications</h3>
                                            <button className="btn-add-mini" onClick={() => addDynamicItem(setQualifications, { degree: '', institution: '', year: '' })}>
                                                <Plus size={14} /> Add Education
                                            </button>
                                        </div>
                                        {qualifications.map((q, idx) => (
                                            <div key={idx} className="dynamic-row">
                                                <div className="input-wrapper">
                                                    <input placeholder="Degree (e.g. LLB)" value={q.degree} onChange={(e) => handleDynamicChange(setQualifications, idx, 'degree', e.target.value)} />
                                                </div>
                                                <div className="input-wrapper">
                                                    <input placeholder="Institution" value={q.institution} onChange={(e) => handleDynamicChange(setQualifications, idx, 'institution', e.target.value)} />
                                                </div>
                                                <div className="input-wrapper year">
                                                    <input placeholder="Year" value={q.year} type="number" onChange={(e) => handleDynamicChange(setQualifications, idx, 'year', e.target.value)} />
                                                </div>
                                                <button className="btn-remove-mini" onClick={() => removeDynamicItem(setQualifications, idx)}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="dynamic-section" style={{ marginTop: '40px' }}>
                                        <div className="section-header-mini">
                                            <h3>Work Experience</h3>
                                            <button className="btn-add-mini" onClick={() => addDynamicItem(setExperience, { title: '', organization: '', startDate: '', endDate: '', isCurrent: false })}>
                                                <Plus size={14} /> Add Experience
                                            </button>
                                        </div>
                                        {experience.map((exp, idx) => (
                                            <div key={idx} className="dynamic-row-complex">
                                                <div className="row-top">
                                                    <input placeholder="Job Title" value={exp.title} onChange={(e) => handleDynamicChange(setExperience, idx, 'title', e.target.value)} />
                                                    <input placeholder="Organization" value={exp.organization} onChange={(e) => handleDynamicChange(setExperience, idx, 'organization', e.target.value)} />
                                                    <button className="btn-remove-mini" onClick={() => removeDynamicItem(setExperience, idx)}><Trash2 size={16} /></button>
                                                </div>
                                                <div className="row-bottom">
                                                    <div className="date-group">
                                                        <label>Start</label>
                                                        <input type="date" value={exp.startDate} onChange={(e) => handleDynamicChange(setExperience, idx, 'startDate', e.target.value)} />
                                                    </div>
                                                    <div className="date-group">
                                                        <label>End</label>
                                                        <input type="date" value={exp.endDate} onChange={(e) => handleDynamicChange(setExperience, idx, 'endDate', e.target.value)} disabled={exp.isCurrent} />
                                                    </div>
                                                    <label className="checkbox-inline">
                                                        <input type="checkbox" checked={exp.isCurrent} onChange={(e) => handleDynamicChange(setExperience, idx, 'isCurrent', e.target.checked)} />
                                                        Current
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="step-content animate-fade-in">
                                <span className="step-tag">STEP 4</span>
                                <h2 className="step-title">Review & Submit</h2>
                                <p className="step-desc">Please ensure all details are correct. You can edit them anytime later.</p>

                                <div className="review-container">
                                    <div className="review-grid">
                                        <div className="review-card">
                                            <h4><User size={16} /> Personal Details</h4>
                                            <div className="review-item"><span>Name:</span> {personalInfo.firstName} {personalInfo.lastName}</div>
                                            <div className="review-item"><span>Phone:</span> +92 {personalInfo.phone}</div>
                                            <div className="review-item"><span>Location:</span> {personalInfo.city}, {personalInfo.state}</div>
                                        </div>
                                        <div className="review-card">
                                            <h4><Briefcase size={16} /> Professional Info</h4>
                                            <div className="review-item"><span>Experience:</span> {professionalInfo.yearsOfExperience} Years</div>
                                            <div className="review-item"><span>Rate:</span> ${professionalInfo.hourlyRate}/hr</div>
                                            <div className="review-item"><span>Bar #:</span> {professionalInfo.barRegistrationNumber}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="final-consent-box">
                                    <label className="checkbox-inline-large">
                                        <input type="checkbox" required />
                                        <div className="consent-text">
                                            <strong>Terms & Consent</strong>
                                            <p>I confirm that the information provided is accurate and I agree to the Lawwise professional terms of service.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Navigation Footer */}
                    <div className="wizard-footer">
                        <button className="remind-later-btn" onClick={() => router.push('/lawyer-dashboard')}>
                            Remind me later
                        </button>
                        
                        <div className="footer-actions">
                            {currentStep > 1 && (
                                <button className="btn-nav btn-prev" onClick={prevStep}>
                                    <ChevronLeft size={18} /> Previous
                                </button>
                            )}
                            
                            {currentStep < 4 ? (
                                <button className="btn-nav btn-next" onClick={nextStep}>
                                    Next step <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button className="btn-nav btn-submit" onClick={handleSubmit}>
                                    Complete Setup <Save size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cropper Modal */}
                    {isCropping && (
                        <div className="cropper-modal-overlay">
                            <div className="cropper-modal-container">
                                <h3>Adjust Profile Picture</h3>
                                <div className="cropper-wrapper">
                                    <Cropper
                                        image={tempImage}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        cropShape="round"
                                        showGrid={false}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                </div>
                                <div className="cropper-controls">
                                    <div className="zoom-slider">
                                        <label>Zoom</label>
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            onChange={(e) => setZoom(e.target.value)}
                                        />
                                    </div>
                                    <div className="cropper-actions">
                                        <button className="btn-cancel" onClick={() => setIsCropping(false)}>Cancel</button>
                                        <button className="btn-save-crop" onClick={showCroppedImage}>Save & Use</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default LawyerProfilePage;
