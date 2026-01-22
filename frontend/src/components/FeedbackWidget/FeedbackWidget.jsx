import React, { useState, useRef } from 'react';
import { X, MessageSquare, Send, Star, Sparkles, Bug, FileText, Upload, CheckCircle } from 'lucide-react';
import './FeedbackWidget.css';

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // New state for success modal
  const [screenshot, setScreenshot] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'bug',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate message
    if (!formData.message.trim()) {
      alert('Please enter your feedback message');
      return;
    }

    setIsSubmitting(true);

    // Capture technical details
    const technicalData = {
      url: window.location.href,
      browser: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
      language: navigator.language,
      platform: navigator.platform
    };

    // Prepare feedback payload
    const feedbackPayload = {
      category: formData.category,
      message: formData.message.trim(),
      name: formData.name.trim() || 'Anonymous', // Use provided name or 'Anonymous'
      rating: rating,
      screenshot: screenshot || null,
      technicalData: technicalData
    };

    try {
      const API_URL = 'http://localhost:5000';
      const endpoint = `${API_URL}/api/feedback`;
      
      console.log('Submitting feedback to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackPayload)
      });

      console.log('Response status:', response.status);

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Handle non-JSON response (usually HTML error pages)
        const text = await response.text();
        console.error('Received non-JSON response:', text);
        throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
      }

      const data = await response.json();

      if (response.ok && data.success) {
        // Success
        // alert('Thank you for your feedback! We appreciate your input.'); // Removed alert
        
        // Reset form
        setFormData({ name: '', category: 'bug', message: '' });
        setRating(0);
        setScreenshot(null);
        setIsOpen(false);
        setShowSuccessModal(true); // Show success modal
      } else {
        // Error from server
        console.error('Server error:', data);
        alert(data.message || 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      // More detailed error message
      if (error.message.includes('Failed to fetch')) {
        alert('Cannot connect to server. Please check your internet connection.');
      } else {
        alert(`Error: ${error.message}\n\nPlease try again later.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsOpen(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  if (!isOpen && !showSuccessModal) {
    return (
      <button 
        className="feedback-trigger-btn" 
        onClick={handleOpenModal}
        title="Send us your feedback"
      >
        <MessageSquare size={22} />
        <span>Feedback</span>
      </button>
    );
  }

  return (
    <>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay" onClick={handleCloseSuccessModal}>
          <div className="success-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-header">
              <CheckCircle size={48} color="#10B981" />
              <h3>Thank You!</h3>
            </div>
            <div className="success-modal-body">
              <p>Thank you for your feedback! We appreciate your input.</p>
            </div>
            <div className="success-modal-footer">
              <button className="success-modal-ok-btn" onClick={handleCloseSuccessModal}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Form Modal */}
      {isOpen && (
        <div className="feedback-overlay" onClick={handleCloseModal}>
          <div className="feedback-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-header">
              <div className="header-content">
                <MessageSquare size={24} />
                <div>
                  <h3>We'd Love Your Feedback</h3>
                  <p>Help us improve your travel experience</p>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseModal} disabled={isSubmitting}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-body">
                
                {/* Optional Name Field */}
                <div className="form-group">
                  <label>
                    Your Name <span className="optional-label">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your name or leave blank to stay anonymous"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    maxLength={100}
                    className="name-input"
                  />
                </div>

                {/* Star Rating */}
                <div className="rating-section">
                  <label className="rating-label">How would you rate your experience?</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= (hoveredStar || rating) ? 'active' : ''}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        disabled={isSubmitting}
                      >
                        <Star 
                          size={32} 
                          fill={star <= (hoveredStar || rating) ? '#fc9c1b' : 'none'}
                          stroke={star <= (hoveredStar || rating) ? '#fc9c1b' : '#d1d5db'}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <div className="rating-text">
                      {rating === 1 && "😞 We can do better"}
                      {rating === 2 && "😕 Not quite there"}
                      {rating === 3 && "😐 It's okay"}
                      {rating === 4 && "😊 Pretty good!"}
                      {rating === 5 && "🤩 Excellent!"}
                    </div>
                  )}
                </div>

                {/* Category Selection */}
                <div className="form-group">
                  <label>What type of feedback is this?</label>
                  <div className="category-grid">
                    <label className={`category-card ${formData.category === 'bug' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="category" 
                        value="bug"
                        checked={formData.category === 'bug'}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      <div className="category-content">
                        <Bug size={24} />
                        <span>Report a Bug</span>
                      </div>
                    </label>
                    
                    <label className={`category-card ${formData.category === 'suggestion' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="category" 
                        value="suggestion"
                        checked={formData.category === 'suggestion'}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      <div className="category-content">
                        <Sparkles size={24} />
                        <span>Suggest Feature</span>
                      </div>
                    </label>
                    
                    <label className={`category-card ${formData.category === 'general' ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name="category" 
                        value="general"
                        checked={formData.category === 'general'}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      <div className="category-content">
                        <FileText size={24} />
                        <span>General Feedback</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Message */}
                <div className="form-group">
                  <label>Tell us more (required)</label>
                  <textarea 
                    name="message" 
                    rows="4" 
                    placeholder="Please share your thoughts, suggestions, or describe the issue you encountered..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    maxLength={1000}
                  />
                  <div className="character-count">
                    {formData.message.length}/1000 characters
                  </div>
                </div>

                {/* Screenshot Preview */}
                {screenshot && (
                  <div className="screenshot-preview">
                    <div className="preview-header">
                      <span className="preview-label">
                        <Upload size={14} />
                        Image attached
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setScreenshot(null)} 
                        className="remove-btn"
                        disabled={isSubmitting}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="preview-image-wrapper">
                      <img src={screenshot} alt="Attached screenshot" />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="form-footer">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={isSubmitting}
                />
                
                <button 
                  type="button" 
                  className="attach-btn" 
                  onClick={triggerFileInput}
                  disabled={screenshot || isSubmitting}
                >
                  <Upload size={18} />
                  {screenshot ? 'Image Attached' : 'Attach Image'} 
                </button>
                
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="submit-spinner"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!isOpen && !showSuccessModal && (
        <button 
          className="feedback-trigger-btn" 
          onClick={handleOpenModal}
          title="Send us your feedback"
        >
          <MessageSquare size={22} />
          <span>Feedback</span>
        </button>
      )}
    </>
  );
};

export default FeedbackWidget;