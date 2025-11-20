import React, { useState } from 'react';
import Sidebar from '../sidebar/sidebar';
import './viewtestimonials.css';

const mockTestimonials = [
    { 
        id: 1, 
        name: 'Maria T. Reyes', 
        feedback: 'Absolutely loved the Batanes tour package! The hotels were excellent and the itinerary was perfect. Highly recommended!', 
        pictureUrl: 'https://via.placeholder.com/150/007bff/FFFFFF?text=MR', 
        source: 'Facebook' 
    },
    { 
        id: 2, 
        name: 'Juan Dela Cruz', 
        feedback: "The Palawan trip was seamless. From booking to the actual flight, everything was handled professionally. Five stars!", 
        pictureUrl: 'https://via.placeholder.com/150/28a745/FFFFFF?text=JD', 
        source: 'Website Form' 
    },
    { 
        id: 3, 
        name: 'Sofia A. Gomez', 
        feedback: 'Great customer service! They quickly resolved my booking conflict. Will definitely book my next vacation with Wanderwave.', 
        pictureUrl: 'https://via.placeholder.com/150/ffc107/333333?text=SG', 
        source: 'Email' 
    },
];

const ViewTestimonials = () => {
    const [testimonials, setTestimonials] = useState(mockTestimonials);

    const handleDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to delete the testimonial from ${name}?`)) {
            setTestimonials(testimonials.filter(t => t.id !== id));
            alert(`Testimonial from ${name} has been deleted.`);
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
                        <div key={t.id} className="testimonial-card">
                            <div className="card-header">
                                <img 
                                    src={t.pictureUrl} 
                                    alt={`Profile of ${t.name}`} 
                                    className="profile-picture" 
                                />
                                <div className="user-info">
                                    <h3 className="user-name">{t.name}</h3>
                                    <span className={`source-tag ${t.source.split(' ')[0].toLowerCase()}`}>{t.source}</span>
                                </div>
                            </div>
                            
                            <p className="feedback-text">"{t.feedback}"</p>
                            
                            <button 
                                className="delete-testimonial-btn"
                                onClick={() => handleDelete(t.id, t.name)}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
                
                {testimonials.length === 0 && (
                    <p className="no-testimonials">No testimonials found.</p>
                )}
            </div>
        </div>
    );
};

export default ViewTestimonials;