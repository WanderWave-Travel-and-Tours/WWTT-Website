import React from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1939 }, (_, n) => currentYear - n);
const days  = Array.from({ length: 31 }, (_, n) => n + 1);

const PassengerCard = ({ passenger: p, index: i, total, onUpdate, onDobChange, onRemove }) => {
  const isPrimary = i === 0;
  const req = isPrimary ? <span style={{ color: '#ef4444' }}>*</span> : null;

  return (
  <div className="ntbm-passenger-card">

    {/* Heading */}
    <div className="ntbm-passenger-heading">
      <div className="ntbm-passenger-num">{i + 1}</div>
      <span className="ntbm-passenger-label">Passenger {i + 1}</span>
      {isPrimary
        ? <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', background: '#fef3c7', border: '1px solid #fcd34d', padding: '2px 8px', borderRadius: '6px' }}>Primary Contact</span>
        : <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '6px' }}>Details Optional</span>
      }
      {total > 1 && (
        <button className="ntbm-remove-pax-btn" onClick={onRemove}>
          ✕ Remove
        </button>
      )}
    </div>

    {/* Optional note for additional passengers */}
    {!isPrimary && (
      <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px' }}>
        Additional passenger details are optional. You may fill them in now or leave them blank.
      </div>
    )}

    {/* First + Last Name */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <div className="ntbm-pfield">
        <label>First Name {req}</label>
        <input
          className="ntbm-input"
          value={p.firstName}
          onChange={e => onUpdate(i, 'firstName', e.target.value)}
          placeholder="Juan"
        />
      </div>
      <div className="ntbm-pfield">
        <label>Last Name {req}</label>
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
        <label>Phone {req}</label>
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
        Date of Birth {req}
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

      {/* Age restriction warning for primary passenger */}
      {i === 0 && p.age && parseInt(p.age) < 18 && (
        <div style={{
          marginTop: '6px', padding: '6px 10px', borderRadius: '6px',
          background: '#fef2f2', border: '1px solid #fecaca',
          color: '#b91c1c', fontSize: '0.78rem', fontWeight: 600,
        }}>
          ⚠ Primary passenger must be at least 18 years old.
        </div>
      )}
    </div>


    {/* Gender + Nationality */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
      <div className="ntbm-pfield">
        <label>Gender {req}</label>
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
        <label>Nationality {req}</label>
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
      <label>Complete Address {req}</label>
      <input
        className="ntbm-input"
        value={p.address}
        onChange={e => onUpdate(i, 'address', e.target.value)}
        placeholder="123 Main St, Quezon City"
      />
    </div>
  </div>
  );
};

export default PassengerCard;
