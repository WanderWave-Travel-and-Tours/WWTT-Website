import React from 'react';
import { Eye, Archive, Star, Bug, Sparkles, FileText, Image as ImageIcon } from 'lucide-react';
import './FeedbackTable.css';

// Note: Pinalitan ang 'onDelete' ng 'onArchive' sa props
const FeedbackTable = ({ loading, feedbacks, onView, onArchive }) => {
  
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'bug': return <Bug size={14} />;
      case 'suggestion': return <Sparkles size={14} />;
      case 'general': return <FileText size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={12} 
        fill={i < rating ? '#fbbf24' : 'none'}
        stroke={i < rating ? '#fbbf24' : '#d1d5db'}
      />
    ));
  };

  const TableHeader = () => (
    <thead>
      <tr>
        <th>Name</th>
        <th>Category</th>
        <th>Rating</th>
        <th>Message</th>
        <th>Date</th>
        <th style={{ textAlign: 'center' }}>Screenshot</th>
        <th style={{ textAlign: 'right' }}>Actions</th>
      </tr>
    </thead>
  );

  if (loading) {
    return (
      <div className="fb-table-container">
        <table className="fb-table">
          <TableHeader />
          <tbody>
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div className="fb-spinner"></div>
                <p>Loading feedback...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="fb-table-container">
        <table className="fb-table">
          <TableHeader />
          <tbody>
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No feedback found matching your filters.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="fb-table-container">
      <table className="fb-table">
        <TableHeader />
        <tbody>
          {feedbacks.map((feedback) => (
            <tr key={feedback._id}>
              <td>
                <strong style={{ color: '#0f172a' }}>{feedback.name || 'Anonymous'}</strong>
              </td>
              <td>
                <span className={`fb-category-badge category-${feedback.category}`}>
                  {getCategoryIcon(feedback.category)}
                  {feedback.category}
                </span>
              </td>
              <td>
                {feedback.rating > 0 ? (
                  <div className="fb-rating-stars">
                    {renderStars(feedback.rating)}
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>No rating</span>
                )}
              </td>
              <td>
                <div className="fb-message-preview">
                  {feedback.message.length > 80 
                    ? `${feedback.message.substring(0, 80)}...` 
                    : feedback.message
                  }
                </div>
              </td>
              <td style={{ fontSize: '13px', color: '#64748b' }}>
                {new Date(feedback.createdAt).toLocaleDateString()}
              </td>
              <td style={{ textAlign: 'center' }}>
                {feedback.screenshot ? (
                  <span className="fb-screenshot-badge">
                    <ImageIcon size={14} />
                    Yes
                  </span>
                ) : (
                  <span style={{ color: '#cbd5e1', fontSize: '13px' }}>No</span>
                )}
              </td>
              <td style={{ textAlign: 'right' }}>
                <div className="fb-action-group">
                  <button 
                    className="fb-action-btn"
                    onClick={() => onView(feedback)}
                    title="View Details"
                  >
                    <Eye size={14} />
                    View
                  </button>
                  
                  {/* ARCHIVE BUTTON DITO (Pinalitan ang Delete) */}
                  <button 
                    className="fb-action-btn archive"
                    onClick={() => onArchive(feedback._id)}
                    title="Archive Feedback"
                  >
                    <Archive size={14} />
                    Archive
                  </button>

                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FeedbackTable;