import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

const BookingLeftColumn = ({ pkg }) => {
  const [activeTab, setActiveTab] = useState('itinerary');

  return (
    <div className="booking-left-content">
      
      {/* Hero Image */}
      <div className="booking-image-wrapper">
        <img src={pkg.image} alt={pkg.name} className="booking-main-image" />
      </div>

      {/* Inclusions Section */}
      <div className="info-section">
        <h3 className="section-title-with-icon">
          <Check className="icon-check" size={20} />
          What's Included
        </h3>
        <ul className="included-list">
          {pkg.includes?.map((item, idx) => (
            <li key={idx} className="included-item">
              <Check className="check-icon" size={16} />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Exclusions (Only show if exists) */}
        {pkg.excludes && pkg.excludes.length > 0 && (
          <>
            <h3 className="section-title-with-icon" style={{marginTop: '24px'}}>
              <X className="icon-x" size={20} />
              What's Excluded
            </h3>
            <ul className="excluded-list">
              {pkg.excludes.map((item, idx) => (
                <li key={idx} className="excluded-item">
                  <X className="x-icon" size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <hr style={{border: '0', borderTop: '1px solid #f0f0f0', margin: '32px 0'}} />

      {/* Tabs System */}
      <div className="tabs-section">
        <div className="tabs-header">
          {['itinerary', 'campaign', 'terms'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              style={{ textTransform: 'capitalize' }}
            >
              {tab === 'campaign' ? 'Description' : tab === 'terms' ? 'Terms' : tab}
            </button>
          ))}
        </div>

        <div className="tabs-content">
          {activeTab === 'itinerary' && (
            <div className="itinerary-content">
              {pkg.itinerary?.map((day, idx) => (
                <div key={idx} style={{ marginBottom: '20px', paddingLeft: '10px' }}>
                  <h4 style={{fontWeight: '700', color: '#001b3e'}}>Day {day.day}: {day.title}</h4>
                  <ul style={{ paddingLeft: '20px', marginTop: '8px', color: '#4b5563' }}>
                    {day.activities.map((act, i) => <li key={i}>{act}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'campaign' && (
            <div className="campaign-content">
              <p style={{lineHeight: '1.6', color: '#4b5563'}}>{pkg.description}</p>
            </div>
          )}
          
          {activeTab === 'terms' && (
            <div className="terms-content" style={{lineHeight: '1.6', color: '#4b5563'}}>
              <p>• Full payment required at booking</p>
              <p>• Cancellation 7 days before: 50% refund</p>
              <p>• No refund for last-minute cancellations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingLeftColumn;