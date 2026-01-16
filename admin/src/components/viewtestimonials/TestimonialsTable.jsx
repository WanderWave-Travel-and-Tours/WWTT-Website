import React from 'react';
import { Trash2, Eye, Calendar, MessageSquare, Star } from 'lucide-react';
import './TestimonialsTable.css';

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
                        {testimonials.map((testimonial) => (
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

                                {/* RATING */}
                                <td>
                                    <span className="tst-rating">
                                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                        5.0 Stars
                                    </span>
                                </td>

                                {/* STATUS */}
                                <td>
                                    <span className="tst-status tst-status--active">
                                        <MessageSquare size={12} />
                                        Active
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
                        ))}

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