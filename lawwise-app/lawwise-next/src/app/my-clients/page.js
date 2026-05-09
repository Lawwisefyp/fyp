'use client';

import React, { useState, useEffect } from 'react';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';
import {
    Users,
    MessageCircle,
    UserPlus,
    Check,
    X,
    Clock,
    Mail,
    UserCheck,
    Search
} from 'lucide-react';
import '@/styles/Dashboard.css';
import '@/styles/MyClients.css';

const MyClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const API_BASE = 'http://localhost:5001';

    const loadData = async () => {
        setLoading(true);
        try {
            const [clientsRes, pendingRes] = await Promise.all([
                authService.getMyClients(),
                authService.getPendingConnections()
            ]);

            if (clientsRes.success) setClients(clientsRes.clients);
            if (pendingRes.success) setPendingRequests(pendingRes.requests);
        } catch (error) {
            console.error('Failed to load clients data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRespond = async (requestId, status) => {
        try {
            const res = await authService.respondToConnection(requestId, status);
            if (res.success) {
                // Refresh data
                loadData();
            }
        } catch (error) {
            alert('Failed to respond to request.');
        }
    };

    const getAvatar = (u) => {
        const photo = u?.profilePicture || u?.personalInfo?.profilePicture;
        if (photo) {
            return <img src={`${API_BASE}/${photo.replace(/\\/g, '/')}`} alt="Avatar" />;
        }
        return u?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const filteredClients = clients.filter(c =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-body" style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#fff', margin: 0, padding: 0 }}>
            <LawyerSidebar />

            <main className="my-clients-container">
                <header className="my-clients-header">
                    <div>
                        <h1>My Clients</h1>
                        <p style={{ color: '#64748b', marginTop: '4px' }}>Professional connections and client relationships.</p>
                    </div>
                    <div className="search-bar-container" style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '12px 12px 12px 40px',
                                borderRadius: '10px',
                                border: '1px solid #f1f5f9',
                                background: '#f8fafc',
                                width: '350px',
                                outline: 'none',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>
                </header>

                {pendingRequests.length > 0 && (
                    <section style={{ marginBottom: '50px' }}>
                        <h2 className="section-title-clean">
                            <Clock size={16} /> Pending Requests
                        </h2>
                        <div className="clients-list">
                            {pendingRequests.map((req) => (
                                <div key={req._id} className="client-row">
                                    <div className="client-avatar">
                                        {getAvatar(req.client)}
                                    </div>
                                    <div className="client-info">
                                        <h3>{req.client.fullName}</h3>
                                        <p>{req.client.email}</p>
                                    </div>
                                    <div className="client-actions">
                                        <button
                                            onClick={() => handleRespond(req._id, 'accepted')}
                                            className="btn-minimal primary"
                                        >
                                            <Check size={16} /> Accept Request
                                        </button>
                                        <button
                                            onClick={() => handleRespond(req._id, 'rejected')}
                                            className="btn-minimal"
                                            style={{ color: '#ef4444' }}
                                        >
                                            <X size={16} /> Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <h2 className="section-title-clean">
                        <UserCheck size={16} /> Connected Clients ({clients.length})
                    </h2>

                    {loading ? (
                        <div className="empty-state-clean">Loading client directory...</div>
                    ) : filteredClients.length > 0 ? (
                        <div className="clients-list">
                            {filteredClients.map((client) => (
                                <div key={client.id} className="client-row">
                                    <div className="client-avatar">
                                        {getAvatar(client)}
                                    </div>
                                    <div className="client-info">
                                        <h3>{client.fullName}</h3>
                                        <p>{client.email}</p>
                                    </div>
                                    <div className="client-actions">
                                        <button
                                            className="btn-minimal primary"
                                            onClick={() => window.location.href = `/communication?userId=${client.id}`}
                                        >
                                            <MessageCircle size={16} /> Send Message
                                        </button>
                                        <button className="btn-minimal">
                                            <Mail size={16} /> Official Email
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state-clean">
                            <Users size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                            <p>{searchTerm ? "No clients match your search." : "Your client list is currently empty."}</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default MyClientsPage;
