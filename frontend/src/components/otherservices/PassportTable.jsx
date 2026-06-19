import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ChevronRight, ChevronDown, FileText, ClipboardList, AlertCircle, RefreshCw } from "lucide-react";
import "./PassportTable.css";

const PassportTable = ({ onSelectPassport }) => {
  const [allPassports, setAllPassports] = useState([]); // Store all types here
  const [activePassport, setActivePassport] = useState(null); // Currently selected type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedService, setExpandedService] = useState(false);
  const [accordionStates, setAccordionStates] = useState({
    requirements: false,
    additionalDocs: false,
    stepsProcess: false
  });

  useEffect(() => {
    fetchPassportData();
  }, []);

  const fetchPassportData = async () => {
    try {
      const res = await axios.get('https://wanderwaveph.onrender.com/api/passports');
      
      if (res.data.success && res.data.data.length > 0) {
        setAllPassports(res.data.data);
        // Default to the first one (usually 'New Application' depending on sort)
        setActivePassport(res.data.data[0]); 
      } else {
        setError("No active passport service found in the database.");
      }
    } catch (err) {
      setError("Failed to load passport information.");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (passport) => {
    setActivePassport(passport);
    // Reset accordion states when switching types
    setAccordionStates({
      requirements: false,
      additionalDocs: false,
      stepsProcess: false
    });
  };

  const toggleServiceExpansion = () => {
    setExpandedService(!expandedService);
    if (expandedService) {
      setAccordionStates({
        requirements: false,
        additionalDocs: false,
        stepsProcess: false
      });
    }
  };

  const toggleAccordion = (section) => {
    setAccordionStates((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSendInquiry = () => {
    if (onSelectPassport && activePassport) {
      onSelectPassport({
        serviceId: activePassport._id,
        // Gamitin ang serviceType kung meron, kung wala serviceName
        serviceName: activePassport.serviceType 
          ? `Passport Appointment - ${activePassport.serviceType}` 
          : activePassport.serviceName,
        estimatedPrice: activePassport.price,
        serviceType: activePassport.serviceType || 'NEW',
        inquiryType: 'PASSPORT'
      });
    }
  };

  if (loading) {
    return <div className="passport-list-container"><p style={{padding:'40px', textAlign:'center'}}>Loading Live Passport Information...</p></div>;
  }

  if (error || !activePassport) {
    return (
      <div className="passport-list-container">
        <div style={{textAlign:'center', padding:'40px', color:'#ef4444', background:'#fef2f2', borderRadius:'12px', border:'1px solid #fee2e2'}}>
            <AlertCircle size={32} style={{marginBottom:'10px'}}/>
            <h3>Service Unavailable</h3>
            <p>{error || "Please initialize passport data in the admin panel first."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="passport-list-container">
      <div className="passport-list-header">
        <h2 className="passport-list-title">Passport Appointment</h2>
        <p className="passport-list-subtitle">
          Book your Philippine passport appointment through WanderWave Travel and Tours
        </p>
      </div>

      {/* --- NEW: TABS SELECTION FOR PASSPORT TYPES --- */}
      <div className="passport-type-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {allPassports.map((ppt) => (
          <button
            key={ppt._id}
            onClick={() => handleTypeSelect(ppt)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: activePassport._id === ppt._id ? '2px solid #fc9c1b' : '1px solid #e2e8f0',
              background: activePassport._id === ppt._id ? '#fff7ed' : 'white',
              color: activePassport._id === ppt._id ? '#c2410c' : '#64748b',
              fontWeight: activePassport._id === ppt._id ? '700' : '500',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {ppt.serviceType || ppt.serviceName} 
          </button>
        ))}
      </div>

      <div className="passport-list-wrapper">
        <div className="passport-list-item">
          <div className="passport-item-content">
            <div className="passport-item-header">
              <div className="passport-header-left">
                <span className="passport-icon">{activePassport.icon || '🛂'}</span>
                <div className="passport-info">
                  <h3 className="passport-title">
                    {activePassport.serviceType || activePassport.serviceName}
                  </h3>
                  <span className="passport-subtitle">{activePassport.description}</span>
                  <span className="passport-price">
                    Service Fee: ₱{activePassport.price?.toLocaleString()}
                  </span>
                  {activePassport.processingTime && (
                     <span style={{fontSize:'12px', color:'#64748b', display:'block', marginTop:'4px'}}>
                        ⏱️ {activePassport.processingTime}
                     </span>
                  )}
                </div>
              </div>

              {!expandedService && (
                <div className="passport-header-right">
                  <button className="view-requirements-btn-passport" onClick={toggleServiceExpansion}>
                    <ChevronRight size={18} /> <span>View Requirements</span>
                  </button>
                </div>
              )}
            </div>

            {expandedService && (
              <div className="passport-requirements-expanded">
                {/* Requirements Accordion */}
                <div className="passport-accordion-section">
                  <button 
                    className={`passport-accordion-header ${accordionStates.requirements ? 'active' : ''}`}
                    onClick={() => toggleAccordion('requirements')}
                  >
                    <span className="passport-accordion-title">
                      <span className="passport-accordion-icon"><FileText size={18} /></span>
                      Primary Requirements
                    </span>
                    <span className={`passport-accordion-chevron ${accordionStates.requirements ? 'rotate' : ''}`}>
                      <ChevronDown size={20} />
                    </span>
                  </button>
                  {accordionStates.requirements && (
                    <div className="passport-accordion-content">
                      {activePassport.requirements?.map((reqSection, idx) => (
                        <div key={idx}>
                           <h5 style={{margin:'0 0 10px 0', color:'#0f172a'}}>{reqSection.title}</h5>
                           <ul className="requirements-list-simple">
                             {reqSection.items?.map((req, i) => (
                               <li key={i} className="requirement-simple-item"><span className="req-checkbox">☑️</span>{req}</li>
                             ))}
                           </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Docs Accordion */}
                <div className="passport-accordion-section">
                  <button 
                    className={`passport-accordion-header ${accordionStates.additionalDocs ? 'active' : ''}`}
                    onClick={() => toggleAccordion('additionalDocs')}
                  >
                    <span className="passport-accordion-title">
                      <span className="passport-accordion-icon"><FileText size={18} /></span>
                      Special Cases / Additional Docs
                    </span>
                    <span className={`passport-accordion-chevron ${accordionStates.additionalDocs ? 'rotate' : ''}`}>
                       <ChevronDown size={20} />
                    </span>
                  </button>
                  {accordionStates.additionalDocs && (
                    <div className="passport-accordion-content">
                      {activePassport.additionalDocuments?.map((docSection, idx) => (
                        <div key={idx}>
                           <ul className="requirements-list-simple">
                             {docSection.items?.map((doc, i) => (
                               <li key={i} className="requirement-simple-item"><span className="req-checkbox">⚠️</span>{doc}</li>
                             ))}
                           </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Process Steps */}
                <div className="passport-accordion-section">
                  <button 
                    className={`passport-accordion-header ${accordionStates.stepsProcess ? 'active' : ''}`}
                    onClick={() => toggleAccordion('stepsProcess')}
                  >
                    <span className="passport-accordion-title">
                      <span className="passport-accordion-icon"><ClipboardList size={18} /></span>
                      Steps and Process
                    </span>
                    <span className={`passport-accordion-chevron ${accordionStates.stepsProcess ? 'rotate' : ''}`}>
                      <ChevronDown size={20} />
                    </span>
                  </button>
                  {accordionStates.stepsProcess && (
                    <div className="passport-accordion-content">
                        <ol className="passport-steps-list">
                          {activePassport.stepsProcess?.map((step, index) => (
                            <li key={index} className="passport-step-item">
                              <span className="step-number">{index + 1}</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                    </div>
                  )}
                </div>

                <div className="passport-actions-bottom">
                  <button className="hide-requirements-btn" onClick={toggleServiceExpansion}>
                    <ChevronDown size={18} /> <span>Hide Requirements</span>
                  </button>
                  <button className="send-inquiry-btn" onClick={handleSendInquiry}>
                    <span>Book {activePassport.serviceType}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassportTable;