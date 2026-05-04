'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/StudentNotes.css';
import '@/styles/StudentPlanner.css';

const StudentPlannerPage = () => {
    const router = useRouter();
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({ streak: 0, todaysTasksCount: 0 });
    const [filter, setFilter] = useState('all'); // 'all', 'today', 'week'
    const [newTask, setNewTask] = useState({
        subject: '',
        title: '',
        date: '',
        duration: ''
    });

    const subjectsList = [
        { name: 'Criminal Law', color: '#ef4444' },
        { name: 'Contract Law', color: '#3b82f6' },
        { name: 'Constitutional Law', color: '#10b981' },
        { name: 'Family Law', color: '#f59e0b' },
        { name: 'Jurisprudence', color: '#8b5cf6' },
        { name: 'Other', color: '#64748b' }
    ];

    const getSubjectColor = (subjectName) => {
        const sub = subjectsList.find(s => s.name === subjectName);
        return sub ? sub.color : '#64748b';
    };

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');
            const res = await fetch('http://localhost:5001/api/students/planner', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setTasks(data.tasks);
        } catch (error) {
            console.error('Fetch tasks error:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');
            const res = await fetch('http://localhost:5001/api/students/planner/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setStats(data.stats);
        } catch (error) {
            console.error('Fetch stats error:', error);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchStats();
    }, []);

    const addTask = async () => {
        if (!newTask.subject || !newTask.title || !newTask.date) {
            alert('Please fill in Subject, Task, and Date');
            return;
        }
        try {
            const token = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');
            const res = await fetch('http://localhost:5001/api/students/planner', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTask)
            });
            const data = await res.json();
            if (data.success) {
                setTasks([...tasks, data.task]);
                setNewTask({ subject: '', title: '', date: '', duration: '' });
                fetchStats();
            }
        } catch (error) {
            console.error('Add task error:', error);
        }
    };

    const toggleTask = async (id) => {
        try {
            const token = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');
            const res = await fetch(`http://localhost:5001/api/students/planner/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setTasks(tasks.map(t => t._id === id ? data.task : t));
                fetchStats();
            }
        } catch (error) {
            console.error('Toggle task error:', error);
        }
    };

    const deleteTask = async (id) => {
        try {
            const token = localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken');
            const res = await fetch(`http://localhost:5001/api/students/planner/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setTasks(tasks.filter(t => t._id !== id));
                fetchStats();
            }
        } catch (error) {
            console.error('Delete task error:', error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const taskDate = new Date(task.date);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        // Always filter by completion status first
        if (filter === 'history') {
            return task.completed;
        } else {
            // Main view shows ONLY uncompleted tasks
            if (task.completed) return false;

            if (filter === 'today') {
                return taskDate.toISOString().split('T')[0] === today.toISOString().split('T')[0];
            }
            if (filter === 'week') {
                const weekEnd = new Date(today);
                weekEnd.setDate(today.getDate() + 7);
                return taskDate >= today && taskDate <= weekEnd;
            }
            return true;
        }
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const isTomorrow = (dateStr) => {
        const d = new Date(dateStr);
        d.setHours(0,0,0,0);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0,0,0,0);
        return d.getTime() === tomorrow.getTime();
    };

    return (
        <div className="notes-page-container">
            <div className="notes-sidebar">
                <div className="sidebar-section">
                    <button 
                        onClick={() => router.push('/student-dashboard')}
                        style={{ 
                            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', 
                            border: 'none', 
                            color: 'white', 
                            padding: '12px 20px', 
                            borderRadius: '12px', 
                            fontWeight: '700', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '25px',
                            width: '100%',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        ← Dashboard
                    </button>
                    <h3>Study Filters</h3>
                    <div className="folder-list">
                        <div className={`folder-item ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>📅 Active Plans</div>
                        <div className={`folder-item ${filter === 'today' ? 'active' : ''}`} onClick={() => setFilter('today')}>☀️ Today's Tasks</div>
                        <div className={`folder-item ${filter === 'week' ? 'active' : ''}`} onClick={() => setFilter('week')}>🗓️ This Week</div>
                        <div className={`folder-item ${filter === 'history' ? 'active' : ''}`} onClick={() => setFilter('history')}>📜 Task History</div>
                    </div>
                </div>

                <div className="sidebar-section" style={{ marginTop: 'auto' }}>
                    <div className="stat-box" style={{ background: '#fff7ed', borderColor: '#ffedd5', padding: '25px' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔥</div>
                        <div className="stat-num" style={{ color: '#ea580c' }}>{stats.streak} Days</div>
                        <div className="stat-label">Study Streak</div>
                    </div>
                </div>
            </div>

            <div className="notes-main-content">
                <div className="notes-header">
                    <div className="notes-title-sec">
                        <h1 style={{ fontSize: '2.5rem', color: '#1e293b', fontWeight: '800', margin: '0 0 10px 0' }}>
                            {filter === 'history' ? 'Completed History' : 'Study Planner'}
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                            {filter === 'history' ? 'Review your successfully completed study goals.' : 'Your personal productivity hub. Sync with DB & track your study streaks.'}
                        </p>
                    </div>
                </div>

                <div className="planner-stats">
                    <div className="stat-box">
                        <div className="stat-num">{tasks.filter(t => !t.completed).length}</div>
                        <div className="stat-label">Active Plans</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-num" style={{ color: '#22c55e' }}>{tasks.filter(t => t.completed).length}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-num" style={{ color: '#2563eb' }}>{stats.todaysTasksCount}</div>
                        <div className="stat-label">Today's Tasks</div>
                    </div>
                </div>

                <div className="planner-container">
                    {filter !== 'history' && (
                        <>
                            <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>✨ Create New Plan</h3>
                            <div className="planner-form">
                                <div className="planner-input-group">
                                    <label>Subject</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Criminal Law" 
                                        className="planner-input"
                                        value={newTask.subject}
                                        onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                                    />
                                </div>
                                <div className="planner-input-group">
                                    <label>Task / Topic</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Read Section 420" 
                                        className="planner-input"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                    />
                                </div>
                                <div className="planner-input-group">
                                    <label>Date</label>
                                    <input 
                                        type="date" 
                                        className="planner-input"
                                        value={newTask.date}
                                        onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                                    />
                                </div>
                                <div className="planner-input-group">
                                    <label>Duration</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 2 hrs" 
                                        className="planner-input"
                                        value={newTask.duration}
                                        onChange={(e) => setNewTask({...newTask, duration: e.target.value})}
                                    />
                                </div>
                                <button className="add-task-btn" onClick={async () => {
                                    await addTask();
                                    alert('✅ Study Plan saved successfully!');
                                }}>Save</button>
                            </div>
                        </>
                    )}

                    <h3 style={{ margin: '30px 0 20px 0', color: '#1e293b' }}>
                        {filter === 'history' ? '📜 Completed Tasks' : '📅 Your Study Schedule'}
                    </h3>

                    <div className="task-list">
                        {filteredTasks.length > 0 ? filteredTasks.map(task => (
                            <div key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`} style={{ borderLeft: `6px solid ${getSubjectColor(task.subject)}` }}>
                                <div className="task-info">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div className="task-subject" style={{ color: getSubjectColor(task.subject) }}>{task.subject}</div>
                                            <div className="task-title">{task.title}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {!task.completed && isTomorrow(task.date) && (
                                                <div style={{ background: '#fef2f2', color: '#ef4444', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800' }}>
                                                    ⚠️ DUE TOMORROW
                                                </div>
                                            )}
                                            
                                            <button 
                                                onClick={() => toggleTask(task._id)}
                                                className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                                                style={{ 
                                                    background: task.completed ? '#22c55e' : 'white',
                                                    border: `2px solid ${task.completed ? '#22c55e' : '#2563eb'}`,
                                                    color: task.completed ? 'white' : '#2563eb',
                                                    width: 'auto',
                                                    height: 'auto',
                                                    padding: '8px 15px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                {task.completed ? '✓ Completed' : '○ Mark as Done'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="task-meta">
                                        <div className="task-date">📅 {new Date(task.date).toLocaleDateString()}</div>
                                        {task.duration && <div className="task-duration">⏱️ {task.duration}</div>}
                                    </div>
                                </div>
                                <button 
                                    className="delete-task-btn" 
                                    onClick={() => deleteTask(task._id)}
                                    title="Delete Task"
                                >
                                    🗑️
                                </button>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>
                                    {filter === 'history' ? '📜' : '🍃'}
                                </div>
                                <h3>{filter === 'history' ? 'Your history is empty' : 'No active tasks found'}</h3>
                                <p>{filter === 'history' ? 'Complete your study plans to see them here.' : 'Try changing the filter or adding a new study plan.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentPlannerPage;
