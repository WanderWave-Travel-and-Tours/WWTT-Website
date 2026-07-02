import React from 'react';
import { Upload, CheckCircle, IdCard, X } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const PassengerCard = ({
  passenger: p,
  index: i,
  updatePassenger,
  handleFileUpload,
  removeFile,
  openCropper,
  handleDobPartChange,
  totalPassengers,
  removePassenger,
  isSoloPkg,
  isMinTwoPkg,
  isInternational,
}) => {
  const isPrimary = i === 0;

  const onPickFile = (type) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = null;
    if (file.type.startsWith('image/')) {
      openCropper(i, type, file);
    } else {
      handleFileUpload(i, type, { target: { files: [file] } });
    }
  };

  return (
  <div className="nbm-passenger-card">

    {/* Heading */}
    <div className="nbm-passenger-heading">
      <div className="nbm-passenger-num">{i + 1}</div>
      <span className="nbm-passenger-label">Passenger {i + 1}</span>
      {isPrimary && <span className="nbm-passenger-primary-badge">Primary Contact</span>}
      {totalPassengers > 1 && (
        <button
          onClick={() => removePassenger(i)}
          className="nbm-passenger-remove-btn"
          aria-label={`Remove Passenger ${i + 1}`}
        >
          <X size={16} />
        </button>
      )}
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

    {/* Documents sub-section */}
    <div className="nbm-passenger-subsection-title">
      <IdCard size={14} /> Travel Documents
    </div>

    {/* ID Upload — required for all passengers */}
    <div className="nbm-pfield" style={{ marginTop: '12px' }}>
      <label>
        Upload Valid ID {isPrimary && <span style={{ color: '#ef4444' }}>*</span>}
        <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', fontSize: '0.78rem', marginLeft: 6 }}>
          (Driver's License, UMID, SSS, Postal ID, etc.)
        </span>
      </label>

      {p.idFileName ? (
        <div className="nbm-file-uploaded">
          <div className="nbm-file-info">
            <CheckCircle size={18} color="#22c55e" />
            <span className="nbm-file-name">{p.idFileName}</span>
          </div>
          <button type="button" onClick={() => removeFile(i, 'id')} className="nbm-remove-file-btn">
            Remove
          </button>
        </div>
      ) : (
        <div className="nbm-file-upload-box">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={onPickFile('id')}
            id={`nbm-id-upload-${i}`}
            style={{ display: 'none' }}
          />
          <label htmlFor={`nbm-id-upload-${i}`} className="nbm-file-upload-label">
            <Upload size={24} color="#94a3b8" />
            <span className="nbm-upload-text">Click to upload ID</span>
            <span className="nbm-upload-subtext">PNG, JPG or PDF (Max 5MB)</span>
          </label>
        </div>
      )}
    </div>

    {/* Passport Upload — required only for international packages */}
    {isInternational && (
      <div className="nbm-pfield" style={{ marginTop: '12px' }}>
        <label>
          Upload Passport {isPrimary && <span style={{ color: '#ef4444' }}>*</span>}
          <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', fontSize: '0.78rem', marginLeft: 6 }}>
            (Bio-data page with photo)
          </span>
        </label>

        {p.passportFileName ? (
          <div className="nbm-file-uploaded">
            <div className="nbm-file-info">
              <CheckCircle size={18} color="#22c55e" />
              <span className="nbm-file-name">{p.passportFileName}</span>
            </div>
            <button type="button" onClick={() => removeFile(i, 'passport')} className="nbm-remove-file-btn">
              Remove
            </button>
          </div>
        ) : (
          <div className="nbm-file-upload-box">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={onPickFile('passport')}
              id={`nbm-passport-upload-${i}`}
              style={{ display: 'none' }}
            />
            <label htmlFor={`nbm-passport-upload-${i}`} className="nbm-file-upload-label">
              <Upload size={24} color="#94a3b8" />
              <span className="nbm-upload-text">Click to upload Passport</span>
              <span className="nbm-upload-subtext">PNG, JPG or PDF (Max 5MB)</span>
            </label>
          </div>
        )}
      </div>
    )}
  </div>
  );
};

export default PassengerCard;
