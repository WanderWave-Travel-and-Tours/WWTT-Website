import React, { useState, useEffect } from 'react'; 
import Sidebar from '../sidebar/sidebar';
import './viewtestimonials.css';

const ViewTestimonials = () => {
    const [testimonials, setTestimonials] = useState([]);

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
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete the testimonial from ${name}?`)) {
            setTestimonials(testimonials.filter(t => t._id !== id));
            alert(`Testimonial from ${name} has been deleted (from view).`);
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar />

            <div className="view-testimonials-content">
                <h1>⭐ Customer Testimonials</h1>
                <p>Manage and review all customer feedback received from various sources.</p>

                <div className="testimonials-grid">
                    {testimonials.map(t => (
                        <div key={t._id} className="testimonial-card">
                            <div className="card-header">
                                <img 
                                    src={
                                        t.customerImage 
                                        ? `http://localhost:5000/uploads/${t.customerImage}` 
                                        : 'https://via.placeholder.com/150/CCCCCC/000000?text=No+Img'
                                    } 
                                    alt={`Profile of ${t.customerName}`} 
                                    className="profile-picture" 
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150/CCCCCC/000000?text=Error"; }}
                                />
                                <div className="user-info">
                                    <h3 className="user-name">{t.customerName}</h3>
                                    <span className={`source-tag ${t.source ? t.source.split(' ')[0].toLowerCase() : 'other'}`}>
                                        {t.source}
                                    </span>
                                </div>
                            </div>
                            
                            <p className="feedback-text">"{t.feedback}"</p>
                            
                            <button 
                                className="delete-testimonial-btn"
                                onClick={() => handleDelete(t._id, t.customerName)}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
                
                {testimonials.length === 0 && (
                    <p className="no-testimonials">No testimonials found. Add some!</p>
                )}
            </div>
        </div>
    );
};

export default ViewTestimonials;