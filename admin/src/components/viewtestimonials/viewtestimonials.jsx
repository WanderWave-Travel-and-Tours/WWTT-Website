import React, { useState, useEffect } from 'react'; 
import Sidebar from '../sidebar/sidebar'; //
import './viewtestimonials.css'; //

const ViewTestimonials = () => {

    // --- SIDEBAR TOGGLE LOGIC (Existing) ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    }; //

    const [testimonials, setTestimonials] = useState([]); //

    const fetchTestimonials = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/testimonials');
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
            const data = await response.json();
            setTestimonials(data);
        } catch (error) {
            console.error("Error fetching testimonials:", error);
        }
    }; //

    useEffect(() => {
        fetchTestimonials();
    }, []); //

    // MODIFIED: handleDelete ay naging handleArchive na ngayon
    const handleArchive = async (id, name) => {
        if (window.confirm(`Are you sure you want to archive the testimonial of ${name}?`)) {
            try {
                // Tatawag sa PATCH route na ginawa natin sa itaas
                const response = await fetch(`http://localhost:5000/api/testimonials/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ isArchive: "Yes" }),
                });

                if (response.ok) {
                    // I-update ang UI list
                    setTestimonials(prev => prev.map(t => 
                        t._id === id ? { ...t, isArchive: "Yes" } : t
                    ));
                    alert(`The testimonial of ${name} has been successfully archived.`);
                } else {
                    alert("Error archiving testimonial");
                }
            } catch (error) {
                console.error("Error archiving testimonial:", error);
            }
        }
    };

    const getSourceClass = (source) => {
        if (!source) return 'default';
        const s = source.toLowerCase();
        if (s.includes('facebook')) return 'facebook';
        if (s.includes('website')) return 'website';
        if (s.includes('email')) return 'email';
        return 'default';
    }; //

    // --- LOGIC: Filter para mga naka isArchive === "No" lang ang ididisplay ---
    const activeTestimonials = testimonials.filter(t => t.isArchive === "No");

    return (
        <div className="vtest-page">
             <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className="vtest-main">
                <div className="vtest-container">
                    <header className="vtest-header">
                        <div className="vtest-header-left">
                            <h1 className="vtest-title">TESTIMONIALS</h1>
                            <p className="vtest-subtitle">
                                Managing {activeTestimonials.length} active customer reviews
                            </p>
                        </div>
                        <button className="vtest-btn vtest-btn--add" onClick={() => window.location.href='/add-testimonial'}>
                            + Add Testimonial
                        </button>
                    </header>

                    {activeTestimonials.length === 0 ? (
                        <div className="vtest-empty">
                            <span className="vtest-empty-icon">⭐</span>
                            <h3>No active testimonials</h3>
                            <p>Customer reviews will appear here</p>
                        </div>
                    ) : (
                        <div className="vtest-grid">
                            {activeTestimonials.map(t => (
                                <div key={t._id} className="vtest-card">
                                    <div className="vtest-card-header">
                                        <img 
                                            src={
                                                t.customerImage 
                                                ? `http://localhost:5000/uploads/${t.customerImage}` 
                                                : 'https://via.placeholder.com/150?text=No+Img'
                                            } 
                                            alt={`Profile of ${t.customerName}`} 
                                            className="vtest-avatar" 
                                            onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
                                        />
                                        <div className="vtest-user">
                                            <h3 className="vtest-name">{t.customerName}</h3>
                                            <span className={`vtest-source vtest-source--${getSourceClass(t.source)}`}>
                                                {t.source}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="vtest-card-body">
                                        <svg className="vtest-quote-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                                        </svg>
                                        <p className="vtest-feedback">{t.feedback}</p>
                                    </div>

                                    <div className="vtest-card-footer">
                                        <div className="vtest-rating">
                                            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                                        </div>
                                        {/* MODIFIED: Archive Button */}
                                        <button 
                                            className="vtest-delete-btn"
                                            style={{ backgroundColor: '#f39c12', color: 'white' }} 
                                            onClick={() => handleArchive(t._id, t.customerName)}
                                        >
                                            Archive
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stats Computed based on Active Testimonials */}
                    <div className="vtest-stats">
                        <div className="vtest-stat">
                            <strong>{activeTestimonials.length}</strong>
                            <span>Active Reviews</span>
                        </div>
                        <div className="vtest-stat">
                            <strong>{activeTestimonials.filter(t => t.source && t.source.toLowerCase().includes('facebook')).length}</strong>
                            <span>Facebook</span>
                        </div>
                        <div className="vtest-stat">
                            <strong>{activeTestimonials.filter(t => t.source && t.source.toLowerCase().includes('website')).length}</strong>
                            <span>Website</span>
                        </div>
                        <div className="vtest-stat">
                            <strong>{activeTestimonials.filter(t => t.source && t.source.toLowerCase().includes('email')).length}</strong>
                            <span>Email</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ViewTestimonials;