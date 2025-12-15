import React, { useState, useEffect } from 'react';
import { Trash2, Calendar, Eye, EyeOff, Search } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './viewposter.css';

const ViewPoster = () => {

        // --- SIDEBAR TOGGLE LOGIC START ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    // --- SIDEBAR TOGGLE LOGIC END ---

    const [posters, setPosters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(() => {
        fetchPosters();
    }, []);

    const fetchPosters = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://wanderwaveph-backend.onrender.com/api/posters');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setPosters(data);
        } catch (error) {
            console.error('Error fetching posters:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this poster?')) {
            try {
                const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/posters/${id}`, { 
                    method: 'DELETE' 
                });

                if (response.ok) {
                    setPosters(posters.filter(poster => poster._id !== id));
                    alert('Poster deleted successfully');
                } else {
                    alert('Failed to delete poster');
                }
            } catch (error) {
                console.error('Error deleting:', error);
                alert('Server error while deleting');
            }
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        
        try {
            const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/posters/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setPosters(posters.map(p => 
                    p._id === id ? { ...p, status: newStatus } : p
                ));
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const filteredPosters = posters.filter(poster => 
        poster.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="vp-page">
                        <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className={`vp-main ${isSidebarCollapsed ? 'vp-main-collapsed' : ''}`}>
                <div className="vp-container">
                    <header className="vp-header">
                        <div>
                            <h1 className="vp-title">POSTER LIST</h1>
                            <p className="vp-subtitle">Manage your website's promotional banners</p>
                        </div>
                        <div className="vp-search-box">
                            <Search size={18} className="vp-search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search poster title..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </header>

                    {loading ? (
                        <div className="vp-loading">Loading posters from database...</div>
                    ) : (
                        <div className="vp-grid">
                            {filteredPosters.length > 0 ? (
                                filteredPosters.map((poster) => (
                                    <div key={poster._id} className={`vp-card ${poster.status === 'Inactive' ? 'inactive' : ''}`}>
                                        
                                        <div className={`vp-badge ${poster.status.toLowerCase()}`}>
                                            {poster.status === 'Active' ? <Eye size={12} /> : <EyeOff size={12} />}
                                            {poster.status}
                                        </div>

                                        <div className="vp-image-wrapper">
                                            <img src={`https://wanderwaveph-backend.onrender.com/${poster.imageUrl}`} alt={poster.title} />
                                        </div>

                                        <div className="vp-content">
                                            <h3 className="vp-card-title">{poster.title}</h3>
                                            <p className="vp-card-desc">{poster.description || 'No description provided.'}</p>
                                            
                                            <div className="vp-meta">
                                                <div className="vp-date">
                                                    <Calendar size={14} />
                                                    <span>Start: {poster.startDate ? new Date(poster.startDate).toLocaleDateString() : '--'}</span>
                                                </div>
                                                <div className="vp-date">
                                                    <Calendar size={14} />
                                                    <span>End: {poster.endDate ? new Date(poster.endDate).toLocaleDateString() : '--'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="vp-actions">
                                            <button 
                                                className="vp-btn-toggle"
                                                onClick={() => toggleStatus(poster._id, poster.status)}
                                            >
                                                {poster.status === 'Active' ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button 
                                                className="vp-btn-delete"
                                                onClick={() => handleDelete(poster._id)}
                                                title="Delete Poster"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="vp-empty">
                                    <p>No posters found. Try adding one!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ViewPoster;