import "./HotelAmenities.css";

const HotelAmenities = ({ amenities, handleAmenityChange }) => {
  const amenitiesList = [
    { 
      id: 'wifi', 
      label: 'Free Wifi', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0114.08 0" /><path d="M1.42 9a16 16 0 0121.16 0" /><path d="M8.53 16.11a6 6 0 016.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
    },
    { 
      id: 'parking', 
      label: 'Parking', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 17V7h4a3 3 0 010 6H9" /></svg>
    },
    { 
      id: 'pool', 
      label: 'Pool', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20a2.4 2.4 0 002 1 2.4 2.4 0 002-1 2.4 2.4 0 012-1 2.4 2.4 0 012 1 2.4 2.4 0 012 1 2.4 2.4 0 002-1 2.4 2.4 0 012-1 2.4 2.4 0 012 1" /><path d="M2 16a2.4 2.4 0 002 1 2.4 2.4 0 002-1 2.4 2.4 0 012-1 2.4 2.4 0 012 1 2.4 2.4 0 012 1 2.4 2.4 0 002-1 2.4 2.4 0 012-1 2.4 2.4 0 012 1" /><path d="M20 4h-9a2 2 0 00-2 2v2" /></svg>
    },
    { 
      id: 'gym', 
      label: 'Gym', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.4 14.4L9.6 9.6" /><path d="M18.657 21.485a2 2 0 11-2.829-2.828l-1.767 1.768a2 2 0 11-2.829-2.829l6.364-6.364a2 2 0 112.829 2.829l-1.768 1.767a2 2 0 112.829 2.829z" /><path d="M21.5 21.5l-1.4-1.4" /><path d="M3.9 3.9l1.4 1.4" /></svg>
    },
    { 
      id: 'restaurant', 
      label: 'Restaurant', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></svg>
    },
    { 
      id: 'spa', 
      label: 'Spa', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" /></svg>
    },
    { 
      id: 'airConditioning', 
      label: 'A/C', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a1 1 0 00-1-1H8a1 1 0 00-1 1v2" /><rect x="3" y="13" width="18" height="8" rx="2" /><path d="M7 17h10M7 13V8a2 2 0 012-2h6a2 2 0 012 2v5" /></svg>
    },
    { 
      id: 'roomService', 
      label: 'Room Service', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v12" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 01-9 9" /></svg>
    },
    { 
      id: 'laundry', 
      label: 'Laundry', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" /></svg>
    },
    { 
      id: 'bar', 
      label: 'Bar', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>
    },
    { 
      id: 'breakfast', 
      label: 'Breakfast', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>
    },
    { 
      id: 'bathroom', 
      label: 'Bathroom', 
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z" /><path d="M6 12V5a2 2 0 012-2h3v2.25" /><circle cx="11" cy="5.25" r="1.25" /></svg>
    }
  ];

  // Check if bathroom is enabled (has a value other than 'none')
  const isBathroomActive = amenities.bathroom && amenities.bathroom !== 'none';

  return (
    <section className="hotel-section">
      <h2 className="hotel-section-title">AMENITIES</h2>
      <div className="hotel-amenities-grid">
        {amenitiesList.map(item => {
          // Special handling for bathroom — it's a toggle that enables sub-options
          if (item.id === 'bathroom') {
            return (
              <label
                key={item.id}
                className={`hotel-amenity-checkbox ${isBathroomActive ? 'active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isBathroomActive}
                  onChange={() => {
                    if (isBathroomActive) {
                      // Uncheck → set back to 'none'
                      handleAmenityChange('bathroom', 'none');
                    } else {
                      // Check → default to 'private'
                      handleAmenityChange('bathroom', 'private');
                    }
                  }}
                />
                <span className="hotel-amenity-icon">{item.icon}</span>
                {item.label}
              </label>
            );
          }

          // Regular boolean amenities
          return (
            <label
              key={item.id}
              className={`hotel-amenity-checkbox ${amenities[item.id] ? 'active' : ''}`}
            >
              <input
                type="checkbox"
                checked={amenities[item.id] || false}
                onChange={() => handleAmenityChange(item.id)}
              />
              <span className="hotel-amenity-icon">{item.icon}</span>
              {item.label}
            </label>
          );
        })}
      </div>

      {/* Bathroom Sub-Options — Only visible when bathroom is checked */}
      {isBathroomActive && (
        <div className="hotel-bathroom-suboption">
          <p className="hotel-bathroom-suboption-label">Select bathroom type:</p>
          <div className="hotel-bathroom-options">
            <label className={`hotel-bathroom-option ${amenities.bathroom === 'private' ? 'active' : ''}`}>
              <input
                type="radio"
                name="bathroom"
                value="private"
                checked={amenities.bathroom === 'private'}
                onChange={() => handleAmenityChange('bathroom', 'private')}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hotel-bathroom-option-icon">
                <path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z" />
                <path d="M6 12V5a2 2 0 012-2h3v2.25" />
                <circle cx="11" cy="5.25" r="1.25" />
                <path d="M17 7l2 2-2 2" />
              </svg>
              Private Bathroom
            </label>
            <label className={`hotel-bathroom-option ${amenities.bathroom === 'shared' ? 'active' : ''}`}>
              <input
                type="radio"
                name="bathroom"
                value="shared"
                checked={amenities.bathroom === 'shared'}
                onChange={() => handleAmenityChange('bathroom', 'shared')}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hotel-bathroom-option-icon">
                <path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z" />
                <path d="M6 12V5a2 2 0 012-2h3v2.25" />
                <circle cx="11" cy="5.25" r="1.25" />
                <path d="M16 3v4M14 5h4" />
              </svg>
              Shared Bathroom
            </label>
          </div>
        </div>
      )}
    </section>
  );
};

export default HotelAmenities;