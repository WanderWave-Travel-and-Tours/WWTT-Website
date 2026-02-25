import "./HotelDetails.css";

const HotelDetails = ({ 
  hotelDetails, 
  updateField, 
  type, 
  setType, 
  destinations, 
  loading, 
  fetchDestinations 
}) => {
  const calculateRooms = (guests) => {
    const maxCapacity = hotelDetails.maxCapacity || 4;
    return Math.ceil(guests / maxCapacity);
  };

  const exampleGuests = [4, 5, 8, 10];
  const roomCalculations = exampleGuests.map(guests => ({
    guests,
    rooms: calculateRooms(guests),
    totalPrice: calculateRooms(guests) * (Number(hotelDetails.price) || 0)
  }));

  return (
    <section className="hotel-section">
      <h2 className="hotel-section-title">HOTEL DETAILS</h2>
      <div className="hotel-fields">
        <div className="hotel-field hotel-field--full">
          <label>Hotel Category</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          >
            <option value="Budget">Budget</option>
            <option value="Standard">Standard</option>
            <option value="4 Star">4 Star</option>
            <option value="5 Star">5 Star</option>
          </select>
        </div>

        <div className="hotel-field hotel-field--full">
          <label>Hotel Name</label>
          <input
            type="text"
            placeholder="e.g. Wanderwave Resort & Spa"
            value={hotelDetails.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
          />
        </div>

        <div className="hotel-field">
          <label>Destination</label>
          {loading ? (
            <input
              type="text"
              value="Loading destinations..."
              disabled
              className="hotel-input--loading"
            />
          ) : destinations.length === 0 ? (
            <div>
              <input
                type="text"
                value="No destinations available"
                disabled
                className="hotel-input--error"
              />
              <button
                type="button"
                onClick={fetchDestinations}
                className="hotel-retry-btn"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <select
              value={hotelDetails.destination}
              onChange={(e) => updateField('destination', e.target.value)}
              required
            >
              <option value="">Select Destination</option>
              {destinations.map((dest, index) => (
                <option key={index} value={dest}>
                  {dest}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="hotel-field">
          <label>Max Capacity per Room</label>
          <input
            type="number"
            placeholder="e.g. 4"
            value={hotelDetails.maxCapacity}
            onChange={(e) => updateField('maxCapacity', e.target.value)}
            required
            min="1"
            max="10"
          />
        </div>

        <div className="hotel-field hotel-field--full">
          <label>Price per Room per Night (₱)</label>
          <input
            type="number"
            placeholder="e.g. 2500"
            value={hotelDetails.price}
            onChange={(e) => updateField('price', e.target.value)}
            required
            min="0"
          />
        </div>
{/*}
        {hotelDetails.price && hotelDetails.maxCapacity && (
          <div className="hotel-field hotel-field--full">
            <label>Room Calculation Preview</label>
            <div className="hotel-calculation-box">
              <p className="hotel-calculation-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
                Example: {hotelDetails.maxCapacity} persons/room @ ₱{hotelDetails.price}/room/night
              </p>
              <div className="hotel-calculation-list">
                {roomCalculations.map(calc => (
                  <div key={calc.guests} className="hotel-calculation-item">
                    <span className="hotel-calculation-guests">
                      {calc.guests} guests = {calc.rooms} room{calc.rooms > 1 ? 's' : ''}
                    </span>
                    <span className="hotel-calculation-price">
                      ₱{calc.totalPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
          */}
      </div>
    </section>
  );
};

export default HotelDetails;