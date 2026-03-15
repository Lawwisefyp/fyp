import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import '../styles/SearchLawyers.css';

const SearchLawyersPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [filters, setFilters] = useState({
        query: '',
        practiceArea: '',
        city: '',
        minExperience: '',
        maxRate: '',
        isAvailable: '',
        rating: ''
    });

    const practiceAreas = [
        "Criminal Law", "Family Law", "Corporate Law", "Civil Law",
        "Immigration Law", "Tax Law", "Property Law", "Labor Law",
        "Intellectual Property", "Bankruptcy Law"
    ];

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const practiceArea = queryParams.get('practiceArea');
        const query = queryParams.get('query');

        if (practiceArea || query) {
            const initialFilters = {
                ...filters,
                practiceArea: practiceArea || '',
                query: query || ''
            };
            setFilters(initialFilters);
            performSearch(1, initialFilters);
        } else {
            performSearch();
        }
    }, [location.search]);

    const performSearch = async (page = 1, currentFilters = filters) => {
        setLoading(true);
        try {
            const params = { ...currentFilters, page, limit: 10, showAll: true };
            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null) delete params[key];
            });

            const data = await authService.searchLawyers(params);
            if (data.success) {
                setResults(data.lawyers);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({
            query: '',
            practiceArea: '',
            city: '',
            minExperience: '',
            maxRate: '',
            isAvailable: '',
            rating: ''
        });
        setResults([]);
        setPagination(null);
    };

    return (
        <div className="search-page-body">
            <div className="search-container">
                <Link to="/client-dashboard" className="back-link">← Back to Dashboard</Link>

                <div className="search-header">
                    <h1>🔍 Find the Right Lawyer</h1>
                    <p>Search through our network of experienced and qualified legal professionals</p>
                </div>

                <div className="search-filters-card">
                    <h2 style={{ marginBottom: '25px', color: '#333' }}>Search Filters</h2>
                    <form onSubmit={(e) => { e.preventDefault(); performSearch(); }} className="filters-grid">
                        <div className="filter-group">
                            <label>Lawyer Name or Specialty</label>
                            <input
                                type="text"
                                name="query"
                                value={filters.query}
                                onChange={handleFilterChange}
                                className="filter-input"
                                placeholder="e.g. John Doe"
                            />
                        </div>

                        <div className="filter-group">
                            <label>Practice Area</label>
                            <select name="practiceArea" value={filters.practiceArea} onChange={handleFilterChange} className="filter-select">
                                <option value="">All Practice Areas</option>
                                {practiceAreas.map(area => <option key={area} value={area}>{area}</option>)}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>City/Location</label>
                            <input
                                type="text"
                                name="city"
                                value={filters.city}
                                onChange={handleFilterChange}
                                className="filter-input"
                                placeholder="e.g. Karachi"
                            />
                        </div>

                        <div className="filter-group">
                            <label>Min Experience (Years)</label>
                            <select name="minExperience" value={filters.minExperience} onChange={handleFilterChange} className="filter-select">
                                <option value="">Any</option>
                                <option value="1">1+</option>
                                <option value="5">5+</option>
                                <option value="10">10+</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Max Hourly Rate ($)</label>
                            <input
                                type="number"
                                name="maxRate"
                                value={filters.maxRate}
                                onChange={handleFilterChange}
                                className="filter-input"
                                placeholder="e.g. 5000"
                            />
                        </div>

                        <div className="filter-group">
                            <label>Availability</label>
                            <select name="isAvailable" value={filters.isAvailable} onChange={handleFilterChange} className="filter-select">
                                <option value="">All</option>
                                <option value="true">Available Now</option>
                            </select>
                        </div>

                        <div className="search-actions">
                            <button type="submit" className="btn-primary-search" disabled={loading}>
                                {loading ? 'Searching...' : '🔍 Search'}
                            </button>
                            <button type="button" onClick={clearFilters} className="btn-secondary-clear">Clear</button>
                        </div>
                    </form>
                </div>

                <div className="results-grid">
                    {results.length > 0 ? (
                        results.map(lawyer => (
                            <div key={lawyer._id} className="lawyer-search-card">
                                <div className="lawyer-card-avatar">
                                    {lawyer.fullName ? lawyer.fullName.split(' ').map(n => n[0]).join('') : 'L'}
                                </div>
                                <div className="lawyer-card-content">
                                    <h2 className="lawyer-card-name">{lawyer.fullName}</h2>
                                    <div className="lawyer-card-specialty">{lawyer.specialization || 'General Advocate'}</div>
                                    <div className="lawyer-card-stats">
                                        <div className="card-stat">📍 {lawyer.personalInfo?.city || 'N/A'}</div>
                                        <div className="card-stat">💼 {lawyer.professionalInfo?.yearsOfExperience || 0} Years Exp</div>
                                        <div className="card-stat">⭐ 4.8 (24 Reviews)</div>
                                    </div>
                                    <p className="lawyer-card-bio">
                                        {lawyer.personalInfo?.bio || "Experienced legal professional dedicated to providing expert advice and representation in complex litigation and consulting matters."}
                                    </p>
                                </div>
                                <div className="lawyer-card-actions">
                                    <div className="card-rate">${lawyer.professionalInfo?.hourlyRate || '150'}/hr</div>
                                    <button className="btn-card-primary" onClick={() => navigate(`/lawyer-public-profile/${lawyer._id}?contact=true`)}>Contact Lawyer</button>
                                    <button className="btn-card-secondary" onClick={() => navigate(`/lawyer-public-profile/${lawyer._id}`)}>View Profile</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        !loading && (
                            <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '20px' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
                                <h2 style={{ color: '#333' }}>No Lawyers Found</h2>
                                <p style={{ color: '#666' }}>Try adjusting your filters or enter a search query.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchLawyersPage;
