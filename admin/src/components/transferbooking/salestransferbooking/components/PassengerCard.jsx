import React from 'react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const PassengerCard = ({ index, passenger: p, total, onUpdate, onDobChange }) => {
  const isPrimary = index === 0;
  const req = isPrimary ? <span style={{ color: '#ef4444' }}>*</span> : null;

  return (
    <div className="nbm-passenger-card">
      <div className="nbm-passenger-heading">
        <div className="nbm-passenger-num">{index + 1}</div>
        <div className="nbm-passenger-label">Passenger {index + 1}</div>
        {isPrimary
          ? <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', background: '#fef3c7', border: '1px solid #fcd34d', padding: '2px 8px', borderRadius: '6px' }}>Primary Contact</span>
          : <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '6px' }}>Details Optional</span>
        }
      </div>

      {/* Optional note for additional passengers */}
      {!isPrimary && (
        <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px' }}>
          Additional passenger details are optional. You may fill them in now or leave them blank.
        </div>
      )}

      {/* Row 1: First + Last Name */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="nbm-pfield">
          <label>First Name {req}</label>
          <input
            value={p.firstName}
            onChange={e => onUpdate(index, 'firstName', e.target.value)}
            placeholder="Juan"
          />
        </div>
        <div className="nbm-pfield">
          <label>Last Name {req}</label>
          <input
            value={p.lastName}
            onChange={e => onUpdate(index, 'lastName', e.target.value)}
            placeholder="Dela Cruz"
          />
        </div>
      </div>

      {/* Row 2: Email + Phone */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <div className="nbm-pfield">
          <label>Email {isPrimary && <span style={{ color: '#ef4444' }}>*</span>}</label>
          <input
            type="email"
            value={p.email}
            onChange={e => onUpdate(index, 'email', e.target.value)}
            placeholder="juan@email.com"
          />
        </div>
        <div className="nbm-pfield">
          <label>Phone {isPrimary && <span style={{ color: '#ef4444' }}>*</span>}</label>
          <input
            type="tel"
            value={p.phone}
            onChange={e => onUpdate(index, 'phone', e.target.value)}
            placeholder="+63 912 345 6789"
          />
        </div>
      </div>

      {/* Row 3: Date of Birth */}
      <div className="nbm-pfield" style={{ marginTop: 10 }}>
        <label>Date of Birth {req}</label>
        <div className="nbm-dob-row">
          <select
            className="nbm-dob-select dob-day"
            value={p.dobDay}
            onChange={e => onDobChange(index, 'dobDay', e.target.value)}
            style={{ width: '72px' }}
          >
            <option value="">DD</option>
            {Array.from({ length: 31 }, (_, n) => n + 1).map(d => (
              <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
            ))}
          </select>
          <select
            className="nbm-dob-select"
            value={p.dobMonth}
            onChange={e => onDobChange(index, 'dobMonth', e.target.value)}
            style={{ width: '92px' }}
          >
            <option value="">Month</option>
            {MONTHS.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select
            className="nbm-dob-select dob-year"
            value={p.dobYear}
            onChange={e => onDobChange(index, 'dobYear', e.target.value)}
            style={{ width: '82px' }}
          >
            <option value="">Year</option>
            {Array.from({ length: new Date().getFullYear() - 1939 }, (_, n) => new Date().getFullYear() - n).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className={`nbm-age-badge${p.age ? '' : ' nbm-age-badge-empty'}`} style={{ minWidth: '68px', textAlign: 'center' }}>
            {p.age
              ? <>{p.age} <span style={{ fontSize: '0.73rem', opacity: 0.85 }}>yrs</span></>
              : '—'}
          </div>
        </div>

        {/* Age restriction warning for primary passenger */}
        {index === 0 && p.age && parseInt(p.age) < 18 && (
          <div style={{
            marginTop: '6px', padding: '6px 10px', borderRadius: '6px',
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#b91c1c', fontSize: '0.78rem', fontWeight: 600,
          }}>
            ⚠ Primary passenger must be at least 18 years old.
          </div>
        )}
        {p.age && parseInt(p.age) > 100 && (
          <div style={{
            marginTop: '6px', padding: '6px 10px', borderRadius: '6px',
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#b91c1c', fontSize: '0.78rem', fontWeight: 600,
          }}>
            ⚠ {index === 0 ? 'Primary passenger' : 'Passenger'} age cannot exceed 100 years.
          </div>
        )}
      </div>


      {/* Row 4: Gender + Nationality */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <div className="nbm-pfield">
          <label>Gender</label>
          <select value={p.gender} onChange={e => onUpdate(index, 'gender', e.target.value)}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="nbm-pfield">
          <label>Nationality</label>
          <input
            value={p.nationality}
            onChange={e => onUpdate(index, 'nationality', e.target.value)}
            placeholder="Filipino"
          />
        </div>
      </div>

      {/* Row 5: Address */}
      <div className="nbm-pfield" style={{ marginTop: 10 }}>
        <label>Complete Address</label>
        <input
          value={p.address}
          onChange={e => onUpdate(index, 'address', e.target.value)}
          placeholder="123 Main St, City"
        />
      </div>
    </div>
  );
};

export default PassengerCard;
