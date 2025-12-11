import React from 'react';
import { Users, Check, Star } from 'lucide-react';
import './hotelRoomSelector.css';

const HotelRoomSelector = ({ 
  roomTypes = [], 
  selectedRoomType, 
  onRoomTypeChange,
  numberOfRooms = 1,
  numberOfPax = 1,
  durationDays = 1,
  durationNights = 1
}) => {
  
  const sortedRoomTypes = [...roomTypes].sort((a, b) => a.price - b.price);

  // Room upgrade pricing per NIGHT per pax (FOR COMPUTATION)
  const getUpgradePricing = (type) => {
    const typeUpper = type?.toUpperCase() || '';
    if (typeUpper.includes('BUDGET')) return 0;
    if (typeUpper.includes('STANDARD')) return 750;
    if (typeUpper.includes('4 STAR')) return 1200;
    if (typeUpper.includes('5 STAR')) return 2040;
    return 0;
  };

  const getRoomTypeIcon = (type) => {
    const typeUpper = type?.toUpperCase() || '';
    if (typeUpper.includes('BUDGET')) return '💰';
    if (typeUpper.includes('STANDARD')) return '⭐';
    if (typeUpper.includes('4 STAR')) return '⭐⭐⭐⭐';
    if (typeUpper.includes('5 STAR')) return '⭐⭐⭐⭐⭐';
    return '🏨';
  };

  const getRoomTypeBadgeColor = (type) => {
    const typeUpper = type?.toUpperCase() || '';
    if (typeUpper.includes('BUDGET')) return '#10b981'; 
    if (typeUpper.includes('STANDARD')) return '#3b82f6'; 
    if (typeUpper.includes('4 STAR')) return '#f59e0b'; 
    if (typeUpper.includes('5 STAR')) return '#ef4444'; 
    return '#6b7280'; 
  };

  if (!roomTypes || roomTypes.length === 0) {
    return null;
  }

  return (
    <div className="hotel-room-selector">
      <div className="room-selector-header">
        <h3>Choose Your Accommodation Package</h3>
        <p className="room-selector-subtitle">All packages include tour activities + hotel accommodation</p>
      </div>

      <div className="room-types-list">
        {sortedRoomTypes.map((room, index) => {
          const isSelected = selectedRoomType?.type === room.type;
          const upgradePrice = getUpgradePricing(room.type);
          const totalUpgradeCost = upgradePrice * durationNights * numberOfPax; // Use NIGHTS
          const badgeColor = getRoomTypeBadgeColor(room.type);

          return (
            <div 
              key={index}
              className={`room-type-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onRoomTypeChange(room)}
            >
              {isSelected && (
                <div className="selected-checkmark">
                  <Check size={16} color="#fff" strokeWidth={3} />
                </div>
              )}

              <div className="room-type-header">
                <div className="room-type-title">
                  <span className="room-icon">{getRoomTypeIcon(room.type)}</span>
                  <h4>{room.type}</h4>
                  {room.type?.toUpperCase().includes('BUDGET') && !isSelected && (
                    <span style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      marginLeft: '8px'
                    }}>
                      BEST VALUE
                    </span>
                  )}
                </div>
                
                {isSelected && (
                  <div className="selected-badge">
                    ✓ SELECTED
                  </div>
                )}
              </div>

              <div className="room-type-details">
                <div className="room-detail-item">
                  <Users size={14} color="#6b7280" />
                  <span>Max {room.capacity} persons per room</span>
                </div>
                
                {room.description && (
                  <p className="room-description">{room.description}</p>
                )}
              </div>

              <div className="room-type-footer">
                <button 
                  className={`select-room-btn ${isSelected ? 'selected' : ''}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRoomTypeChange(room);
                  }}
                >
                  {isSelected ? 'SELECTED' : 'SELECT'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HotelRoomSelector;