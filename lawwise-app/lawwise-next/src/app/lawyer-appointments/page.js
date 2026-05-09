'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LawyerSidebar from '@/components/LawyerSidebar';
import { appointmentService } from '@/lib/services/api';
import { 
    CalendarCheck, 
    Clock, 
    User, 
    CheckCircle, 
    XCircle, 
    Video, 
    ChevronLeft,
    ExternalLink,
    Briefcase
} from 'lucide-react';
import '@/styles/Dashboard.css';

const LawyerAppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await appointmentService.getMyAppointments();
            if (res.success) {
                setAppointments(res.appointments);
            }
        } catch (err) {
            console.error('Failed to fetch appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'confirmed': return { bg: '#ecfdf5', color: '#10b981', label: 'Confirmed' };
            case 'pending': return { bg: '#fffbeb', color: '#f59e0b', label: 'Pending' };
            case 'cancelled': return { bg: '#fef2f2', color: '#ef4444', label: 'Cancelled' };
            default: return { bg: '#f8fafc', color: '#64748b', label: status };
        }
    };

    if (loading) return <div className="dashboard-body"><div className="dashboard-container">Loading appointments...</div></div>;

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
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Consultation Bookings</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Manage your scheduled meetings with clients</p>
                        </div>
                    </div>
                </header>

                <div className="dashboard-container" style={{ padding: '32px' }}>
                    {appointments.length === 0 ? (
                        <div style={{ padding: '80px 40px', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                            <CalendarCheck size={64} color="#cbd5e1" style={{ marginBottom: '20px' }} />
                            <h3 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '10px' }}>No Appointments Yet</h3>
                            <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>Once clients book consultations through your marketplace, they will appear here for you to manage.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {appointments.map((apt, idx) => {
                                const style = getStatusStyle(apt.status);
                                return (
                                    <div key={idx} style={{ background: '#fff', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{ width: '60px', height: '60px', background: '#eff6ff', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase' }}>{new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e40af' }}>{new Date(apt.date).getDate()}</span>
                                            </div>
                                            
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{apt.clientId?.fullName}</h3>
                                                    <span style={{ background: style.bg, color: style.color, padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>{style.label}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '15px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#64748b' }}>
                                                        <Clock size={14} /> {apt.timeSlot}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#64748b' }}>
                                                        <Briefcase size={14} /> Case Consultation
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button 
                                                onClick={() => router.push(`/communication?userId=${apt.clientId?._id}`)}
                                                style={{ background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                Message Client
                                            </button>
                                            <button 
                                                onClick={() => router.push(`/video-consultation/${apt._id}`)}
                                                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <Video size={16} /> Start Meeting
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LawyerAppointmentsPage;
