import React from 'react';
import { Trash2, Eye, Calendar, MessageSquare, Star, CheckCircle, XCircle } from 'lucide-react';
import './TestimonialsTable.css';

// ✅ ADDED: StarRating Component to handle dynamic stars
const StarRating = ({ rating, size = 12, color = '#f59e0b' }) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars.push(
            <Star key={`full-${i}`} size={size} fill={color} color={color} />
        );
    }

    // Half star (using a relative div to overlay a filled star on an empty one)
    if (hasHalfStar) {
        stars.push(
            <div key="half" style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
                <Star size={size} color="#e5e7eb" fill="#e5e7eb" style={{ position: 'absolute', top: 0, left: 0 }} />
                <div style={{ 
                    position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' 
                }}>
                    <Star size={size} fill={color} color={color} />
                </div>
            </div>
        );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars.push(
            <Star key={`empty-${i}`} size={size} color="#e5e7eb" fill="#e5e7eb" />
        );
    }

    return <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>{stars}</div>;
};

const TestimonialsTable = ({ 
    testimonials, 
    handleViewDetails, 
    handleArchive,
    getImageUrl
}) => {

    return (
        <div className="tst-table-wrapper">
            <div className="tst-table-container">
                <table className="tst-table">
                    <thead>
                        <tr>
                            <th className="tst-col-customer">CUSTOMER</th>
                            <th className="tst-col-feedback">FEEDBACK</th>
                            <th className="tst-col-date">DATE ADDED</th>
                            <th className="tst-col-source">SOURCE</th>
                            <th className="tst-col-rating">RATING</th>
                            <th className="tst-col-status">STATUS</th>
                            <th className="tst-col-actions">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {testimonials.map((testimonial) => {
                            // Helper for status to match your other files
                            const isActive = testimonial.isArchive === "No" || testimonial.isArchive === "0" || !testimonial.isArchive;
                            
                            return (
                                <tr key={testimonial._id}>
                                    {/* CUSTOMER */}
                                    <td>
                                        <div className="tst-customer-cell">
                                            <div className="tst-image-preview">
                                                <img 
                                                    src={getImageUrl(testimonial.customerImage)} 
                                                    alt=""
                                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                                                />
                                            </div>
                                            <span className="tst-customer-name">{testimonial.customerName}</span>
                                        </div>
                                    </td>

                                    {/* FEEDBACK */}
                                    <td>
                                        <span className="tst-excerpt" title={testimonial.feedback}>
                                            {testimonial.feedback?.substring(0, 80)}...
                                        </span>
                                    </td>

                                    {/* DATE ADDED */}
                                    <td>
                                        <div className="tst-date-added">
                                            <Calendar size={14} />
                                            <span>{testimonial.displayDateAdded}</span>
                                        </div>
                                    </td>

                                    {/* SOURCE */}
                                    <td>
                                        <div className="tst-source">
                                            <MessageSquare size={14} />
                                            <span>{testimonial.source}</span>
                                        </div>
                                    </td>

                                    {/* ✅ RATING: UPDATED TO USE DYNAMIC DATA */}
                                    <td>
                                        <span className="tst-rating" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                            <StarRating rating={testimonial.rating || 5} size={14} />
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#b45309' }}>
                                                {(testimonial.rating || 5).toFixed(1)} Stars
                                            </span>
                                        </span>
                                    </td>

                                    {/* STATUS */}
                                    <td>
                                        <span className={`tst-status ${isActive ? 'tst-status--active' : 'tst-status--archived'}`} 
                                              style={{ 
                                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                  backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                                                  color: isActive ? '#166534' : '#991b1b',
                                                  padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600'
                                              }}>
                                            {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {isActive ? 'Active' : 'Archived'}
                                        </span>
                                    </td>

                                    {/* ACTIONS */}
                                    <td>
                                        <div className="tst-action-group">
                                            {/* View Button */}
                                            <button 
                                                className="tst-action-btn tst-view-btn" 
                                                onClick={() => handleViewDetails(testimonial)}
                                                title="View Details"
                                            >
                                                <Eye size={16} /> 
                                                <span>View</span>
                                            </button>

                                            {/* Archive Button */}
                                            <button 
                                                className="tst-action-btn tst-archive-btn" 
                                                onClick={() => handleArchive(testimonial._id, testimonial.customerName)}
                                                title="Archive Testimonial"
                                            >
                                                <Trash2 size={16} /> 
                                                <span>Archive</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Empty State */}
                        {testimonials.length === 0 && (
                            <tr>
                                <td colSpan="7" className="tst-empty-cell"> 
                                    No testimonials found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TestimonialsTable;