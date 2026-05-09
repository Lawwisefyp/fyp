'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LawyerSidebar from '@/components/LawyerSidebar';
import { authService } from '@/lib/services/api';
import { 
    CalendarDays, 
    Plus, 
    Trash2, 
    Save, 
    CheckCircle, 
    Clock, 
    ChevronLeft,
    AlertCircle
} from 'lucide-react';
import '@/styles/Dashboard.css';

const LawyerSchedulePage = () => {
    const [lawyer, setLawyer] = useState(null);
    const [availability, setAvailability] = useState([
        { day: 'Monday', slots: [] },
        { day: 'Tuesday', slots: [] },
        { day: 'Wednesday', slots: [] },
        { day: 'Thursday', slots: [] },
        { day: 'Friday', slots: [] }
    ]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    useEffect(() => {
        const info = localStorage.getItem('lawyerInfo');
        if (!info) {
            router.push('/lawyer-portal');
            return;
        }
        setLawyer(JSON.parse(info));
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await authService.getLawyerProfile();
            if (res.success && res.lawyer.professionalInfo?.availability) {
                if (res.lawyer.professionalInfo.availability.length > 0) {
                    setAvailability(res.lawyer.professionalInfo.availability);
                }
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const addSlot = (dayIndex) => {
        const newAvailability = [...availability];
        const time = prompt("Enter time (e.g., 10:00 AM):", "10:00 AM");
        if (time) {
            newAvailability[dayIndex].slots.push({ time, isBooked: false });
            setAvailability(newAvailability);
        }
    };

    const removeSlot = (dayIndex, slotIndex) => {
        const newAvailability = [...availability];
        newAvailability[dayIndex].slots.splice(slotIndex, 1);
        setAvailability(newAvailability);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const res = await authService.updateAvailability(availability);
            if (res.success) {
                setMessage('Schedule saved successfully!');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            setMessage('Failed to save schedule.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="dashboard-body"><div className="dashboard-container">Loading...</div></div>;

    return (
        <div className="dashboard-body">
            <LawyerSidebar />

            <div className="dashboard-main">
                <header className="top-header" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '20px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={() => router.back()} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                            <ChevronLeft size={20} color="#64748b" />
                        </button>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Manage Schedule</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Set your weekly consultation availability</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
                    >
                        {saving ? 'SAVING...' : <><Save size={18} /> SAVE SCHEDULE</>}
                    </button>
                </header>

                <div className="dashboard-container" style={{ padding: '32px' }}>
                    {message && (
                        <div style={{ padding: '15px', background: message.includes('success') ? '#ecfdf5' : '#fef2f2', color: message.includes('success') ? '#059669' : '#ef4444', borderRadius: '12px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', border: '1px solid' }}>
                            {message.includes('success') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            {message}
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '20px' }}>
                        {availability.map((day, dIdx) => (
                            <div key={dIdx} style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '40px', height: '40px', background: '#eff6ff', color: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CalendarDays size={20} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{day.day}</h3>
                                    </div>
                                    <button 
                                        onClick={() => addSlot(dIdx)}
                                        style={{ background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                                    >
                                        <Plus size={16} /> ADD SLOT
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                                    {day.slots.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', gridColumn: '1 / -1', border: '1px dashed #e2e8f0', fontSize: '0.85rem' }}>
                                            No slots added for this day.
                                        </div>
                                    ) : (
                                        day.slots.map((slot, sIdx) => (
                                            <div key={sIdx} style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '600', fontSize: '0.9rem' }}>
                                                    <Clock size={14} color="#94a3b8" /> {slot.time}
                                                </div>
                                                <button 
                                                    onClick={() => removeSlot(dIdx, sIdx)}
                                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                                    onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LawyerSchedulePage;
