import React from 'react';
import './BasicInfo.css';

const PREDEFINED_TOUR_TYPES = [
  'Solo',
  'Min of 2 pax',
  'Solo/Joiners',
  'With Free City Tour',
  'With City Tour',
  'Min of 2 pax (Exclusive Tour)',
];

const LOCAL_DESTINATIONS = [
  { value: 'BAGUIO', label: 'Baguio' },
  { value: 'BATANES', label: 'Batanes' },
  { value: 'BOHOL', label: 'Bohol' },
  { value: 'BOLINAO', label: 'Bolinao' },
  { value: 'BORACAY', label: 'Boracay' },
  { value: 'CEBU', label: 'Cebu' },
  { value: 'CORON', label: 'Coron' },
  { value: 'DAVAO', label: 'Davao' },
  { value: 'EL NIDO', label: 'El Nido' },
  { value: 'LA UNION', label: 'La Union' },
  { value: 'PUERTO PRINCESA', label: 'Puerto Princesa' },
  { value: 'SAGADA', label: 'Sagada' },
  { value: 'SIARGAO', label: 'Siargao' },
  { value: 'SIQUIJOR', label: 'Siquijor' },
];

const INTERNATIONAL_DESTINATIONS = [
  // East Asia
  { value: 'TOKYO, JAPAN', label: 'Tokyo, Japan' },
  { value: 'OSAKA, JAPAN', label: 'Osaka, Japan' },
  { value: 'KYOTO, JAPAN', label: 'Kyoto, Japan' },
  { value: 'SEOUL, SOUTH KOREA', label: 'Seoul, South Korea' },
  { value: 'BUSAN, SOUTH KOREA', label: 'Busan, South Korea' },
  { value: 'TAIPEI, TAIWAN', label: 'Taipei, Taiwan' },
  { value: 'HONG KONG', label: 'Hong Kong' },
  { value: 'BEIJING, CHINA', label: 'Beijing, China' },
  { value: 'SHANGHAI, CHINA', label: 'Shanghai, China' },
  // Southeast Asia
  { value: 'BANGKOK, THAILAND', label: 'Bangkok, Thailand' },
  { value: 'PHUKET, THAILAND', label: 'Phuket, Thailand' },
  { value: 'CHIANG MAI, THAILAND', label: 'Chiang Mai, Thailand' },
  { value: 'HANOI, VIETNAM', label: 'Hanoi, Vietnam' },
  { value: 'HO CHI MINH CITY, VIETNAM', label: 'Ho Chi Minh City, Vietnam' },
  { value: 'DA NANG, VIETNAM', label: 'Da Nang, Vietnam' },
  { value: 'SINGAPORE', label: 'Singapore' },
  { value: 'KUALA LUMPUR, MALAYSIA', label: 'Kuala Lumpur, Malaysia' },
  { value: 'LANGKAWI, MALAYSIA', label: 'Langkawi, Malaysia' },
  { value: 'KOTA KINABALU, MALAYSIA', label: 'Kota Kinabalu, Malaysia' },
  { value: 'BALI, INDONESIA', label: 'Bali, Indonesia' },
  { value: 'JAKARTA, INDONESIA', label: 'Jakarta, Indonesia' },
  { value: 'SIEM REAP, CAMBODIA', label: 'Siem Reap, Cambodia' },
  { value: 'PHNOM PENH, CAMBODIA', label: 'Phnom Penh, Cambodia' },
  // Middle East
  { value: 'DUBAI, UAE', label: 'Dubai, UAE' },
  { value: 'ABU DHABI, UAE', label: 'Abu Dhabi, UAE' },
  // Europe
  { value: 'PARIS, FRANCE', label: 'Paris, France' },
  { value: 'LONDON, UK', label: 'London, UK' },
  { value: 'ROME, ITALY', label: 'Rome, Italy' },
  { value: 'BARCELONA, SPAIN', label: 'Barcelona, Spain' },
  { value: 'AMSTERDAM, NETHERLANDS', label: 'Amsterdam, Netherlands' },
  // Americas
  { value: 'NEW YORK, USA', label: 'New York, USA' },
  { value: 'LOS ANGELES, USA', label: 'Los Angeles, USA' },
  { value: 'LAS VEGAS, USA', label: 'Las Vegas, USA' },
];

const BasicInfo = ({ 
  destination, setDestination, 
  duration, setDuration, 
  category, setCategory,
  tourType, setTourType,
  pax, setPax,
  minPax, setMinPax
}) => {
  const [isOtherDestination, setIsOtherDestination] = React.useState(false);
  const [isOtherTourType, setIsOtherTourType] = React.useState(false);
  const [otherTourTypeValue, setOtherTourTypeValue] = React.useState('');

  const isInternational = category === 'International Tour';
  const destinationList = isInternational ? INTERNATIONAL_DESTINATIONS : LOCAL_DESTINATIONS;

  const handleDestinationChange = (e) => {
    const value = e.target.value;
    if (value === 'OTHER') {
      setIsOtherDestination(true);
      setDestination('');
    } else {
      setIsOtherDestination(false);
      setDestination(value);
    }
  };

  // ✅ When category changes, reset destination to avoid mismatch
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setDestination('');
    setIsOtherDestination(false);
  };

  const handleTourTypeTag = (tag) => {
    setIsOtherTourType(false);
    setOtherTourTypeValue('');
    setTourType(tag);
  };

  const handleOtherTourTypeClick = () => {
    setIsOtherTourType(true);
    setTourType('');
  };

  const handleOtherTourTypeInput = (e) => {
    const value = e.target.value;
    setOtherTourTypeValue(value);
    setTourType(value);
  };

  return (
    <section className="apkg-section">
      <h2 className="apkg-section-title">BASIC INFORMATION</h2>
      <div className="apkg-fields">

        {/* ✅ DESTINATION */}
        <div className="apkg-field apkg-field--full">
          <label>Destination</label>
          <select
            value={isOtherDestination ? 'OTHER' : destination}
            onChange={handleDestinationChange}
            required
          >
            <option value="">Select Destination</option>
            {destinationList.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
            <option value="OTHER">Other</option>
          </select>

          {isOtherDestination && (
            <input
              type="text"
              placeholder={isInternational ? 'Enter destination (e.g. Zurich, Switzerland)' : 'Enter destination (e.g. Zambales)'}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              style={{ marginTop: '10px' }}
            />
          )}
        </div>

        {/* ✅ DURATION */}
        <div className="apkg-field">
          <label className="apkg-label">Duration *</label>
          <select
            className="apkg-input apkg-select"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          >
            <option value="">Select Duration</option>
            <option value="2D1N">2D1N</option>
            <option value="3D2N">3D2N</option>
            <option value="4D3N">4D3N</option>
            <option value="5D4N">5D4N</option>
          </select>
        </div>

        {/* ✅ TOUR CATEGORY */}
        <div className="apkg-field">
          <label>Tour Category</label>
          <select
            value={category}
            onChange={handleCategoryChange}
          >
            <option value="Local Tour">Local Tour</option>
            <option value="International Tour">International Tour</option>
          </select>
        </div>

        {/* ✅ TOUR TYPE TAGS */}
        <div className="apkg-field apkg-field--full">
          <label>Tour Type *</label>
          <div className="apkg-tour-type-tags">
            {PREDEFINED_TOUR_TYPES.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`apkg-type-tag ${!isOtherTourType && tourType === tag ? 'active' : ''}`}
                onClick={() => handleTourTypeTag(tag)}
              >
                {tag}
              </button>
            ))}
            {/* ✅ OTHER — custom tour type input */}
            <button
              type="button"
              className={`apkg-type-tag apkg-type-tag--other ${isOtherTourType ? 'active' : ''}`}
              onClick={handleOtherTourTypeClick}
            >
              + Other
            </button>
          </div>

          {/* ✅ Custom tour type text input (shown when Other is selected) */}
          {isOtherTourType && (
            <input
              type="text"
              placeholder="Enter custom tour type (e.g. With Island Hopping)"
              value={otherTourTypeValue}
              onChange={handleOtherTourTypeInput}
              required
              style={{ marginTop: '10px' }}
              className="apkg-input"
            />
          )}

          {tourType && (
            <span className="apkg-field-hint">
              Selected: <strong>{tourType}</strong>
            </span>
          )}
        </div>

      </div>
    </section>
  );
};

export default BasicInfo;