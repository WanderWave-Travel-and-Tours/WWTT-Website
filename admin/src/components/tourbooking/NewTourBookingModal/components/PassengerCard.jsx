import React from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1939 }, (_, n) => currentYear - n);
const days  = Array.from({ length: 31 }, (_, n) => n + 1);

const PassengerCard = ({ passenger: p, index: i, total, onUpdate, onDobChange, onRemove }) => (
  <div className="ntbm-passenger-card">

    {/* Heading */}
    <div className="ntbm-passenger-heading">
      <div className="ntbm-passenger-num">{i + 1}</div>
      <span className="ntbm-passenger-label">Passenger {i + 1}</span>
      {total > 1 && (
        <button className="ntbm-remove-pax-btn" onClick={onRemove}>
          ✕ Remove
        </button>
      )}
    </div>

    {/* First + Last Name */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <div className="ntbm-pfield">
        <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          className="ntbm-input"
          value={p.firstName}
          onChange={e => onUpdate(i, 'firstName', e.target.value)}
          placeholder="Juan"
        />
      </div>
      <div className="ntbm-pfield">
        <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          className="ntbm-input"
          value={p.lastName}
          onChange={e => onUpdate(i, 'lastName', e.target.value)}
          placeholder="Dela Cruz"
        />
      </div>
    </div>

    {/* Email + Phone */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
      <div className="ntbm-pfield">
        <label>
          Email{' '}
          <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', fontSize: '0.78rem' }}>
            (optional)
          </span>
        </label>
        <input
          className="ntbm-input"
          value={p.email}
          onChange={e => onUpdate(i, 'email', e.target.value)}
          placeholder="juan@email.com"
        />
      </div>
      <div className="ntbm-pfield">
        <label>Phone <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          className="ntbm-input"
          value={p.phone}
          onChange={e => onUpdate(i, 'phone', e.target.value)}
          placeholder="09171234567"
        />
      </div>
    </div>

    {/* Date of Birth */}
    <div style={{ marginTop: '12px' }}>
      <label style={{
        display: 'block',
        fontSize: '0.82rem',
        fontWeight: 600,
        color: '#64748b',
        marginBottom: '6px',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}>
        Date of Birth <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Day */}
        <select
          className="ntbm-dob-select"
          value={p.dobDay}
          onChange={e => onDobChange(i, 'dobDay', e.target.value)}
          style={{ width: '72px' }}
        >
          <option value="">DD</option>
          {days.map(d => (
            <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
          ))}
        </select>

        {/* Month */}
        <select
          className="ntbm-dob-select"
          value={p.dobMonth}
          onChange={e => onDobChange(i, 'dobMonth', e.target.value)}
          style={{ width: '92px' }}
        >
          <option value="">Month</option>
          {MONTHS.map((m, idx) => (
            <option key={idx + 1} value={idx + 1}>{m}</option>
          ))}
        </select>

        {/* Year */}
        <select
          className="ntbm-dob-select"
          value={p.dobYear}
          onChange={e => onDobChange(i, 'dobYear', e.target.value)}
          style={{ width: '82px' }}
        >
          <option value="">Year</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Age badge */}
        <div className={`ntbm-age-badge${p.age ? '' : ' empty'}`}>
          {p.age
            ? <>{p.age}<span style={{ fontSize: '0.73rem', opacity: 0.85, marginLeft: 2 }}>yrs</span></>
            : '—'
          }
        </div>
      </div>
    </div>

    {/* Gender + Nationality */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
      <div className="ntbm-pfield">
        <label>Gender <span style={{ color: '#ef4444' }}>*</span></label>
        <select
          className="ntbm-input"
          value={p.gender}
          onChange={e => onUpdate(i, 'gender', e.target.value)}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="ntbm-pfield">
        <label>Nationality <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          className="ntbm-input"
          value={p.nationality}
          onChange={e => onUpdate(i, 'nationality', e.target.value)}
          placeholder="Filipino"
        />
      </div>
    </div>

    {/* Address */}
    <div className="ntbm-pfield" style={{ marginTop: '12px' }}>
      <label>Complete Address <span style={{ color: '#ef4444' }}>*</span></label>
      <input
        className="ntbm-input"
        value={p.address}
        onChange={e => onUpdate(i, 'address', e.target.value)}
        placeholder="123 Main St, Quezon City"
      />
    </div>
  </div>
);

export default PassengerCard;
