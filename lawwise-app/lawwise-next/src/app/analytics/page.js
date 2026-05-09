'use client';

import React, { useState, useEffect } from 'react';
import { 
    Activity, 
    Users, 
    Briefcase, 
    FileText, 
    Video, 
    MessageSquare, 
    Clock,
    BarChart3
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    LineChart, 
    Line,
    Legend
} from 'recharts';
import { authService } from '@/lib/services/api';
import LawyerSidebar from '@/components/LawyerSidebar';
import '@/styles/LawyerAnalytics.css';

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    // Strict Royal Blue Palette
    const BLUE_COLORS = ['#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await authService.getAnalytics();
                if (response.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="analytics-container">
                <LawyerSidebar />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    const growthData = data?.growth?.map(item => ({
        name: new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' }),
        count: item.count
    })) || [];

    const statusData = data?.distribution?.status?.map(item => ({
        name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
        value: item.count
    })) || [];

    const typeData = data?.distribution?.types?.map(item => ({
        name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
        cases: item.count
    })) || [];

    return (
        <div className="analytics-container">
            <LawyerSidebar />
            
            <div style={{ flex: 1 }}>
                <header className="analytics-header">
                    <h1>Practice Analytics</h1>
                    <p>Real-time data insights and practice performance tracking</p>
                </header>

                <div className="analytics-content">
                    {/* Stat Cards - Uniform Blue Branding */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon"><Briefcase size={20} /></div>
                            <div className="stat-info">
                                <h4>Total Cases</h4>
                                <div className="stat-value">{data?.overview?.totalCases || 0}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><Users size={20} /></div>
                            <div className="stat-info">
                                <h4>Total Clients</h4>
                                <div className="stat-value">{data?.overview?.totalClients || 0}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><FileText size={20} /></div>
                            <div className="stat-info">
                                <h4>Documents</h4>
                                <div className="stat-value">{data?.overview?.totalDocuments || 0}</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon"><Activity size={20} /></div>
                            <div className="stat-info">
                                <h4>Connections</h4>
                                <div className="stat-value">{data?.overview?.connections || 0}</div>
                            </div>
                        </div>
                    </div>

                    <div className="charts-grid">
                        <div className="chart-card">
                            <h3>Case Growth Trends</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={growthData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        />
                                        <Line 
                                            type="stepAfter" 
                                            dataKey="count" 
                                            stroke="#1d4ed8" 
                                            strokeWidth={2.5} 
                                            dot={{ r: 4, fill: '#1d4ed8', strokeWidth: 2, stroke: '#fff' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="chart-card">
                            <h3>Status Distribution</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={BLUE_COLORS[index % BLUE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="chart-card">
                            <h3>Practice Areas</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={typeData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#1e293b', fontSize: 11, fontWeight: 600}} width={90} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} />
                                        <Bar dataKey="cases" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="chart-card">
                            <h3>Platform Engagement</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '5px' }}>
                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>AI Drafts</p>
                                    <h2 style={{ margin: '5px 0 0', fontSize: '1.25rem', color: '#1e293b' }}>{data?.aiUsage?.totalDrafts || 0}</h2>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Learning</p>
                                    <h2 style={{ margin: '5px 0 0', fontSize: '1.25rem', color: '#1e293b' }}>{data?.aiUsage?.videosWatched || 0}</h2>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Chat Sessions</p>
                                    <h2 style={{ margin: '5px 0 0', fontSize: '1.25rem', color: '#1e293b' }}>{data?.aiUsage?.aiChatSessions || 0}</h2>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Connections</p>
                                    <h2 style={{ margin: '5px 0 0', fontSize: '1.25rem', color: '#1e293b' }}>{data?.overview?.connections || 0}</h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="activity-grid">
                        <div className="activity-card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', margin: '0 0 15px' }}>
                                <Clock size={16} color="#3b82f6" /> Recent Case Activity
                            </h3>
                            <div className="activity-list">
                                {data?.recentActivity?.cases?.map((c, i) => (
                                    <div key={i} className="activity-item">
                                        <div className="activity-info">
                                            <h5>{c.title}</h5>
                                            <p>{c.client}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className={`status-badge status-${c.status}`}>{c.status}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!data?.recentActivity?.cases || data.recentActivity.cases.length === 0) && (
                                    <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px', fontSize: '0.8rem' }}>No recent activity</p>
                                )}
                            </div>
                        </div>

                        <div className="activity-card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', margin: '0 0 15px' }}>
                                <BarChart3 size={16} color="#3b82f6" /> Learning Sessions
                            </h3>
                            <div className="activity-list">
                                {data?.recentActivity?.learning?.map((h, i) => (
                                    <div key={i} className="activity-item">
                                        <div className="activity-info">
                                            <h5>{h.title}</h5>
                                            <p>Legal Guidance Video</p>
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                            {new Date(h.watchedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                                {(!data?.recentActivity?.learning || data.recentActivity.learning.length === 0) && (
                                    <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px', fontSize: '0.8rem' }}>No learning sessions</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
