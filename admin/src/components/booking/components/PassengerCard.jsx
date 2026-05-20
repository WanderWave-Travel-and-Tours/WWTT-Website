import React from 'react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const PassengerCard = ({
  passenger: p,
  index: i,
  updatePassenger,
  handleDobPartChange,
  totalPassengers,
  removePassenger,
  isSoloPkg,
  isMinTwoPkg,
}) => (
  <div className="nbm-passenger-card">

    {/* Heading */}
    <div className="nbm-passenger-heading">
      <div className="nbm-passenger-num">{i + 1}</div>
      <span className="nbm-passenger-label">Passenger {i + 1}</span>
    </div>

    {/* Row 1: First Name + Last Name */}
    <div className="nbm-grid-2">
      <div className="nbm-pfield">
        <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          value={p.firstName}
          onChange={e => updatePassenger(i, 'firstName', e.target.value)}
          placeholder="Juan"
        />
      </div>
      <div className="nbm-pfield">
        <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          value={p.lastName}
          onChange={e => updatePassenger(i, 'lastName', e.target.value)}
          placeholder="Dela Cruz"
        />
      </div>
    </div>

    {/* Row 2: Email + Phone */}
    <div className="nbm-grid-2" style={{ marginTop: '12px' }}>
      <div className="nbm-pfield">
        <label>
          Email{' '}
          <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', fontSize: '0.78rem' }}>
            (optional)
          </span>
        </label>
        <input
          value={p.email}
          onChange={e => updatePassenger(i, 'email', e.target.value)}
          placeholder="juan@email.com"
        />
      </div>
      <div className="nbm-pfield">
        <label>Phone <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          value={p.phone}
          onChange={e => updatePassenger(i, 'phone', e.target.value)}
          placeholder="09171234567"
        />
      </div>
    </div>

    {/* Date of Birth */}
    <div style={{ marginTop: '12px' }}>
      <label style={{
        display: 'block', fontSize: '0.82rem', fontWeight: 600,
        color: '#64748b', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase',
      }}>
        Date of Birth <span style={{ color: '#ef4444' }}>*</span>
      </label>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Day */}
        <select
          className="nbm-dob-select"
          value={p.dobDay}
          onChange={e => handleDobPartChange(i, 'dobDay', e.target.value)}
          style={{ width: '72px', textAlign: 'left' }}
        >
          <option value="">DD</option>
          {Array.from({ length: 31 }, (_, n) => n + 1).map(d => (
            <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
          ))}
        </select>

        {/* Month */}
        <select
          className="nbm-dob-select"
          value={p.dobMonth}
          onChange={e => handleDobPartChange(i, 'dobMonth', e.target.value)}
          style={{ width: '92px', textAlign: 'left' }}
        >
          <option value="">Month</option>
          {MONTHS.map((m, idx) => (
            <option key={m} value={idx + 1}>{m}</option>
          ))}
        </select>

        {/* Year */}
        <select
          className="nbm-dob-select"
          value={p.dobYear}
          onChange={e => handleDobPartChange(i, 'dobYear', e.target.value)}
          style={{ width: '82px', textAlign: 'left' }}
        >
          <option value="">Year</option>
          {Array.from(
            { length: new Date().getFullYear() - 1939 },
            (_, n) => new Date().getFullYear() - n
          ).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Age Badge */}
        <div
          className={`nbm-age-badge${p.age ? '' : ' nbm-age-badge-empty'}`}
          style={{ minWidth: '68px', textAlign: 'center' }}
        >
          {p.age ? (
            <>{p.age} <span style={{ fontSize: '0.73rem', opacity: 0.85 }}>yrs</span></>
          ) : '—'}
        </div>
      </div>
    </div>

    {/* Row 4: Gender + Nationality */}
    <div className="nbm-grid-2" style={{ marginTop: '12px' }}>
      <div className="nbm-pfield">
        <label>Gender <span style={{ color: '#ef4444' }}>*</span></label>
        <select value={p.gender} onChange={e => updatePassenger(i, 'gender', e.target.value)}>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="nbm-pfield">
        <label>Nationality <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          value={p.nationality}
          onChange={e => updatePassenger(i, 'nationality', e.target.value)}
          placeholder="Filipino"
        />
      </div>
    </div>

    {/* Row 5: Address */}
    <div className="nbm-pfield" style={{ marginTop: '12px' }}>
      <label>Complete Address <span style={{ color: '#ef4444' }}>*</span></label>
      <input
        value={p.address}
        onChange={e => updatePassenger(i, 'address', e.target.value)}
        placeholder="123 Main St, Angeles City"
      />
    </div>

    {/* Remove button */}
    {totalPassengers > 1 && (
      <button
        onClick={() => removePassenger(i)}
        style={{
          marginTop: '14px', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600,
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
          padding: '6px 14px', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        ✕ Remove Passenger {i + 1}
      </button>
    )}
  </div>
);

export default PassengerCard;
