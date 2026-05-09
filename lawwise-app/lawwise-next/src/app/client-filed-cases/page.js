'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { authService, appointmentService } from '@/lib/services/api';
import { 
    FileText, 
    Search, 
    ChevronRight, 
    Clock, 
    CheckCircle, 
    XCircle, 
    Calendar,
    MapPin,
    AlertCircle,
    BrainCircuit,
    Paperclip,
    Upload,
    CalendarCheck,
    ChevronLeft,
    Video
} from 'lucide-react';

const FiledCasesPage = () => {
    const [requests, setRequests] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const router = useRouter();

    // Booking State
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [availability, setAvailability] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    useEffect(() => {
        fetchRequests();
        fetchAppointments();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await authService.getMyCaseRequests();
            if (res.success) {
                setRequests(res.requests);
            }
        } catch (err) {
            console.error('Error fetching filed cases:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            const res = await appointmentService.getMyAppointments();
            if (res.success) {
                setAppointments(res.appointments);
            }
        } catch (err) {
            console.error('Error fetching appointments:', err);
        }
    };

    const handleBookClick = async () => {
        if (!selectedRequest?.assignedLawyerId?._id) return;
        setShowBookingModal(true);
        try {
            const res = await appointmentService.getLawyerSlots(selectedRequest.assignedLawyerId._id);
            if (res.success) {
                setAvailability(res.availability);
                setSelectedDay(res.availability[0]);
            }
        } catch (err) {
            console.error('Failed to load slots:', err);
        }
    };

    const handleConfirmBooking = async () => {
        if (!selectedDay || !selectedSlot) {
            alert("Please select a time slot first!");
            return;
        }
        setBookingLoading(true);
        try {
            const res = await appointmentService.bookAppointment({
                lawyerId: selectedRequest.assignedLawyerId._id,
                caseId: selectedRequest._id, // Fixed: using _id
                date: new Date(), 
                timeSlot: selectedSlot.time,
                notes: `Consultation regarding: ${selectedRequest.title}`
            });
            if (res.success) {
                setBookingSuccess(true);
                alert("Consultation booked successfully! Maryam has been notified.");
                setTimeout(() => {
                    setShowBookingModal(false);
                    setBookingSuccess(false);
                    setSelectedSlot(null);
                }, 2000);
            } else {
                alert("Failed to book: " + (res.message || "Unknown error"));
            }
        } catch (err) {
            console.error('Booking failed:', err);
            alert("Connection error. Please check your internet and try again.");
        } finally {
            setBookingLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'accepted': return { color: '#10b981', bg: '#ecfdf5', label: 'Accepted', icon: CheckCircle };
            case 'rejected': return { color: '#ef4444', bg: '#fef2f2', label: 'Rejected', icon: XCircle };
            case 'pending_review': return { color: '#f59e0b', bg: '#fffbeb', label: 'Pending Review', icon: Clock };
            default: return { color: '#64748b', bg: '#f8fafc', label: status, icon: AlertCircle };
        }
    };

    const filteredRequests = requests.filter(req => 
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.caseId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-body">
            <ClientSidebar />
            <div className="dashboard-main" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                <header style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: '#3b82f6', color: '#fff', padding: '12px', borderRadius: '12px' }}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', color: '#0f172a', margin: 0 }}>My Filed Cases</h1>
                            <p style={{ color: '#64748b', margin: '5px 0 0' }}>Track and manage all your submitted legal requests</p>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: selectedRequest ? '400px 1fr' : '1fr', gap: '30px', transition: 'all 0.3s' }}>
                    {/* List Section */}
                    <div className="cases-list-container" style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                            <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Search by Case ID or Title..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>

                        <div className="requests-list" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading cases...</div>
                            ) : filteredRequests.length === 0 ? (
                                <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                                    <FileText size={48} color="#cbd5e1" style={{ marginBottom: '15px' }} />
                                    <p style={{ color: '#64748b', fontWeight: '600' }}>No filed cases found.</p>
                                </div>
                            ) : (
                                filteredRequests.map((req) => {
                                    const status = getStatusStyle(req.status);
                                    const StatusIcon = status.icon;
                                    const isSelected = selectedRequest?.id === req.id;
                                    return (
                                        <div 
                                            key={req.id} 
                                            onClick={() => setSelectedRequest(req)}
                                            style={{ 
                                                padding: '20px', 
                                                borderBottom: '1px solid #f1f5f9', 
                                                cursor: 'pointer',
                                                background: isSelected ? '#eff6ff' : 'transparent',
                                                borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94a3b8' }}>{req.caseId}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: status.color, background: status.bg, padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '800' }}>
                                                    <StatusIcon size={12} /> {status.label}
                                                </div>
                                            </div>
                                            <h3 style={{ fontSize: '1rem', color: '#1e293b', margin: '0 0 10px 0' }}>{req.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.75rem', color: '#64748b' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {new Date(req.createdAt).toLocaleDateString()}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {req.location}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Detail Section */}
                    {selectedRequest && (
                        <div className="case-detail-panel fade-in" style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                            <div style={{ padding: '30px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(to bottom right, #f8fafc, #ffffff)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <span style={{ background: '#3b82f6', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' }}>{selectedRequest.caseId}</span>
                                    <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                                </div>
                                <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0 0 25px 0' }}>{selectedRequest.title}</h2>
                                
                                {/* Case Progress Tracker */}
                                <div style={{ marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '10px' }}>
                                        {/* Progress Line */}
                                        <div style={{ position: 'absolute', top: '15px', left: '20px', right: '20px', height: '2px', background: '#e2e8f0', zIndex: 1 }}>
                                            <div style={{ 
                                                height: '100%', 
                                                background: '#10b981', 
                                                width: selectedRequest.status === 'accepted' ? '100%' : 
                                                       selectedRequest.status === 'pending_review' ? '75%' : 
                                                       selectedRequest.status === 'analyzed' ? '50%' : '25%',
                                                transition: 'width 0.8s ease-in-out'
                                            }}></div>
                                        </div>

                                        {[
                                            { label: 'E-Filed', icon: Upload, status: ['pending', 'analyzed', 'pending_review', 'accepted'] },
                                            { label: 'AI Analysis', icon: BrainCircuit, status: ['analyzed', 'pending_review', 'accepted'] },
                                            { label: 'Specialist Match', icon: Search, status: ['pending_review', 'accepted'] },
                                            { label: 'Final Review', icon: Clock, status: ['pending_review', 'accepted'] },
                                            { label: 'Accepted', icon: CheckCircle, status: ['accepted'] }
                                        ].map((step, i) => {
                                            const isCompleted = step.status.includes(selectedRequest.status);
                                            const isCurrent = step.status[0] === selectedRequest.status;
                                            return (
                                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                                                    <div style={{ 
                                                        width: '32px', 
                                                        height: '32px', 
                                                        borderRadius: '50%', 
                                                        background: isCompleted ? '#10b981' : '#fff', 
                                                        border: `2px solid ${isCompleted ? '#10b981' : '#e2e8f0'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: isCompleted ? '#fff' : '#94a3b8',
                                                        marginBottom: '8px',
                                                        boxShadow: isCurrent ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
                                                        transition: 'all 0.3s'
                                                    }}>
                                                        <step.icon size={16} />
                                                    </div>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: '800', color: isCompleted ? '#1e293b' : '#94a3b8', textAlign: 'center', textTransform: 'uppercase' }}>{step.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '30px' }}>
                                {/* AI Summary Section */}
                                <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '15px', border: '1px solid #bae6fd', marginBottom: '25px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <BrainCircuit size={20} color="#0369a1" />
                                        <span style={{ color: '#0369a1', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase' }}>AI Case Analysis</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#0c4a6e', lineHeight: '1.6', fontStyle: 'italic' }}>
                                        "{selectedRequest.aiAnalysis?.summary || selectedRequest.description}"
                                    </p>
                                </div>

                                {/* Lawyer Details if Accepted */}
                                {selectedRequest.status === 'accepted' && selectedRequest.assignedLawyerId && (
                                    <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '15px', border: '1px solid #a7f3d0', marginBottom: '25px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                                            <CheckCircle size={20} color="#059669" />
                                            <span style={{ color: '#059669', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase' }}>Assigned Specialist</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '45px', height: '45px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#059669', border: '2px solid #059669' }}>
                                                {selectedRequest.assignedLawyerId.fullName[0]}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#064e3b' }}>{selectedRequest.assignedLawyerId.fullName}</h4>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#059669' }}>{selectedRequest.assignedLawyerId.specialization}</p>
                                            </div>
                                        </div>
                                        {selectedRequest.lawyerNote && (
                                            <div style={{ marginTop: '15px', padding: '12px', background: '#fff', borderRadius: '10px', borderLeft: '4px solid #10b981', fontSize: '0.9rem', color: '#065f46', fontStyle: 'italic' }}>
                                                " {selectedRequest.lawyerNote} "
                                            </div>
                                        )}
                                        <button 
                                            onClick={handleBookClick}
                                            style={{ 
                                                marginTop: '20px', 
                                                width: '100%', 
                                                padding: '12px', 
                                                borderRadius: '10px', 
                                                background: '#10b981', 
                                                color: '#fff', 
                                                border: 'none', 
                                                fontWeight: '800', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                                            }}
                                        >
                                            <CalendarCheck size={18} /> BOOK ANOTHER SLOT
                                        </button>

                                        {/* Join Meeting Button */}
                                        {appointments.find(a => a.caseId?._id === selectedRequest._id || a.caseId === selectedRequest._id) && (
                                            <button 
                                                onClick={() => {
                                                    const apt = appointments.find(a => a.caseId?._id === selectedRequest._id || a.caseId === selectedRequest._id);
                                                    router.push(`/video-consultation/${apt._id}`);
                                                }}
                                                style={{ 
                                                    marginTop: '10px', 
                                                    width: '100%', 
                                                    padding: '12px', 
                                                    borderRadius: '10px', 
                                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                                                    color: '#fff', 
                                                    border: 'none', 
                                                    fontWeight: '800', 
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '10px',
                                                    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)'
                                                }}
                                            >
                                                <Video size={18} /> JOIN VIDEO CONSULTATION
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div style={{ marginBottom: '25px' }}>
                                    <h4 style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>Original Description</h4>
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#475569', lineHeight: '1.7' }}>
                                        {selectedRequest.description}
                                    </div>
                                </div>

                                {/* Evidence Section */}
                                {selectedRequest.evidence && selectedRequest.evidence.length > 0 && (
                                    <div style={{ marginBottom: '25px' }}>
                                        <h4 style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px' }}>Uploaded Evidence</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                                            {selectedRequest.evidence.map((file, i) => (
                                                <a 
                                                    key={i} 
                                                    href={`http://localhost:5001/${file.filepath?.replace(/\\/g, '/')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', textDecoration: 'none', color: '#1e293b', fontSize: '0.8rem' }}
                                                >
                                                    <Paperclip size={14} color="#3b82f6" />
                                                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.originalName || file.filename}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="fade-in" style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '25px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', position: 'relative' }}>
                            <button onClick={() => setShowBookingModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
                            <CalendarCheck size={32} style={{ marginBottom: '15px', opacity: 0.9 }} />
                            <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Book Consultation</h3>
                            <p style={{ margin: '5px 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Select a convenient slot with {selectedRequest.assignedLawyerId.fullName}</p>
                        </div>

                        {bookingSuccess ? (
                            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                                <div style={{ width: '80px', height: '80px', background: '#ecfdf5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <CheckCircle size={40} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', color: '#064e3b', marginBottom: '10px' }}>Booking Confirmed!</h3>
                                <p style={{ color: '#059669' }}>Your consultation has been scheduled successfully.</p>
                            </div>
                        ) : (
                            <div style={{ padding: '30px' }}>
                                {/* Day Selection */}
                                <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Available Days</label>
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '25px' }}>
                                    {availability.map((day, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => { setSelectedDay(day); setSelectedSlot(null); }}
                                            style={{ 
                                                padding: '10px 18px', 
                                                borderRadius: '12px', 
                                                background: selectedDay?.day === day.day ? '#eff6ff' : '#f8fafc', 
                                                border: `2px solid ${selectedDay?.day === day.day ? '#3b82f6' : '#e2e8f0'}`,
                                                color: selectedDay?.day === day.day ? '#3b82f6' : '#64748b',
                                                fontWeight: '700',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {day.day}
                                        </button>
                                    ))}
                                </div>

                                {/* Slot Selection */}
                                {selectedDay && (
                                    <>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Available Slots for {selectedDay.day}</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '30px' }}>
                                            {selectedDay.slots.map((slot, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    style={{ 
                                                        padding: '12px 8px', 
                                                        borderRadius: '10px', 
                                                        background: selectedSlot?.time === slot.time ? '#3b82f6' : '#fff', 
                                                        border: `1px solid ${selectedSlot?.time === slot.time ? '#3b82f6' : '#e2e8f0'}`,
                                                        color: selectedSlot?.time === slot.time ? '#fff' : '#1e293b',
                                                        fontWeight: '700',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {slot.time}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <button 
                                    disabled={!selectedSlot || bookingLoading}
                                    onClick={handleConfirmBooking}
                                    style={{ 
                                        width: '100%', 
                                        padding: '15px', 
                                        borderRadius: '15px', 
                                        background: (!selectedSlot || bookingLoading) ? '#cbd5e1' : '#3b82f6', 
                                        color: '#fff', 
                                        border: 'none', 
                                        fontWeight: '800', 
                                        fontSize: '1rem',
                                        cursor: (!selectedSlot || bookingLoading) ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                                    }}
                                >
                                    {bookingLoading ? 'Processing...' : 'CONFIRM APPOINTMENT'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .requests-list::-webkit-scrollbar { width: 6px; }
                .requests-list::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 3px; }
            `}</style>
        </div>
    );
};

export default FiledCasesPage;
