import React, { useState, useEffect } from "react";
import api from '../../lib/axiosInstance';
import { ChevronRight, ChevronDown, FileText, Download, ClipboardList, X } from "lucide-react";
import "./VisaTable.css";
import { useToast } from "../toast/ToastManager";

const VisaTable = ({ onSelectVisa, onClose }) => {
  const [visas, setVisas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedVisas, setExpandedVisas] = useState({});
  const [accordionStates, setAccordionStates] = useState({});
  const toast = useToast();

  useEffect(() => {
    const fetchVisas = async () => {
      try {
        const res = await api.get('/api/visas');
        
        if (Array.isArray(res.data)) {
          setVisas(res.data);
        } else {
          setVisas([]);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchVisas();
  }, []);

  const toggleVisaExpansion = (id) => {
    setExpandedVisas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    
    // Reset accordion states when collapsing
    if (expandedVisas[id]) {
      setAccordionStates((prev) => ({
        ...prev,
        [id]: {
          requirements: false,
          downloadForms: false,
          stepsProcess: false
        }
      }));
    }
  };

  const toggleAccordion = (visaId, section) => {
    setAccordionStates((prev) => ({
      ...prev,
      [visaId]: {
        ...prev[visaId],
        [section]: !prev[visaId]?.[section]
      }
    }));
  };

  const handleSendInquiry = (visa) => {
    if (onSelectVisa) {
      onSelectVisa(visa);
    } else {
      toast.info(`Inquiry for ${visa.country} has been noted. Please fill in the form.`, "Inquiry");
    }
  };

  const handleDownloadClick = async (e, fullUrl, label) => {
    e.preventDefault();
    try {
      const res = await fetch(fullUrl, { method: 'HEAD' });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || contentType.includes('application/json')) {
        toast.error(
          'This file is currently unavailable. Please contact us directly for the latest forms.',
          'File Not Found'
        );
        return;
      }
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Unable to reach the file. Please check your connection or contact us.', 'Error');
    }
  };

  const truncateFilename = (name, maxLen = 35) => {
    if (name.length <= maxLen) return name;
    const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
    return name.slice(0, maxLen - ext.length - 3) + '...' + ext;
  };

  if (loading) {
    return (
      <div className="visa-list-container">
        <p style={{padding:'20px', textAlign:'center'}}>Loading Visa Information...</p>
      </div>
    );
  }

  return (
    <div className="visa-list-container">
      <div className="visa-list-header">
        <div className="visa-header-text">
          <h2 className="visa-list-title">Visa Requirements</h2>
          <p className="visa-list-subtitle">
            This table shows all Visa Forms you can apply for.
          </p>
        </div>
        <button className="visa-close-modal-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="visa-list-wrapper">
        {visas.length === 0 ? (
          <p style={{textAlign: 'center', padding: '20px', color: '#888'}}>
            No visa requirements found. (Check Admin Dashboard)
          </p>
        ) : (
          visas.map((visa) => (
            <div key={visa._id} className="visa-list-item">
              <div className="visa-item-content">
                <div className="visa-item-header">
                  <div className="visa-header-left">
                    {visa.flagCode ? (
                      <img 
                        src={`https://flagcdn.com/w80/${visa.flagCode.toLowerCase()}.png`}
                        alt={`${visa.country} flag`}
                        className="visa-flag-img"
                        onError={(e) => { e.target.style.display = 'none'; }} 
                      />
                    ) : (
                      <span className="visa-flag">🌐</span>
                    )}
                    <div className="visa-info">
                      <h3 className="visa-title">{visa.country || "Unknown"}</h3>
                      <span className="visa-subtitle">{visa.description || "Visa Assistance"}</span>
                      <span className="visa-price">
                        Starts at: ₱{visa.price || "0.00"}/person
                      </span>
                    </div>
                  </div>

                  {!expandedVisas[visa._id] && (
                    <div className="visa-header-right">
                      <button
                        className="view-requirements-btn-visa"
                        onClick={() => toggleVisaExpansion(visa._id)}
                      >
                        <ChevronRight size={18} />
                        <span>View Requirements</span>
                      </button>
                    </div>
                  )}
                </div>

                {expandedVisas[visa._id] && (
                  <div className="visa-requirements-expanded">
                    {/* ACCORDION 1: LIST OF REQUIREMENTS */}
                    <div className="visa-accordion-section">
                      <button 
                        className={`visa-accordion-header ${accordionStates[visa._id]?.requirements ? 'active' : ''}`}
                        onClick={() => toggleAccordion(visa._id, 'requirements')}
                      >
                        <span className="visa-accordion-title">
                          <span className="visa-accordion-icon"><FileText size={18} /></span>
                          List Of Requirements
                          {visa.requirements && visa.requirements.length > 0 && (
                            <span className="visa-accordion-count">{visa.requirements.length} Categories</span>
                          )}
                        </span>
                        <span className={`visa-accordion-chevron ${accordionStates[visa._id]?.requirements ? 'rotate' : ''}`}>
                          <ChevronDown size={20} />
                        </span>
                      </button>
                      
                      {accordionStates[visa._id]?.requirements && (
                        <div className="visa-accordion-content">
                          {visa.requirements && visa.requirements.length > 0 ? (
                            visa.requirements.map((reqSection, sectionIndex) => (
                              <div key={sectionIndex} className="requirements-section">
                                <h5 className="requirements-category">
                                  {reqSection.title}
                                </h5>
                                <ul className="requirements-list-simple">
                                  {reqSection.items && reqSection.items.map((req, index) => (
                                    <li key={index} className="requirement-simple-item">
                                      <span className="req-checkbox">☑️</span>
                                      <span>{req}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          ) : (
                            <p style={{fontSize: '14px', color: '#888', fontStyle: 'italic', margin: '10px 0'}}>
                              No specific requirements listed.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ACCORDION 2: DOWNLOAD FORMS HERE */}
                    <div className="visa-accordion-section">
                      <button 
                        className={`visa-accordion-header ${accordionStates[visa._id]?.downloadForms ? 'active' : ''}`}
                        onClick={() => toggleAccordion(visa._id, 'downloadForms')}
                      >
                        <span className="visa-accordion-title">
                          <span className="visa-accordion-icon"><Download size={18} /></span>
                          Download Forms Here
                          {visa.downloadForms && Array.isArray(visa.downloadForms) && visa.downloadForms.length > 0 && (
                            <span className="visa-accordion-count">{visa.downloadForms.length} Forms</span>
                          )}
                        </span>
                        <span className={`visa-accordion-chevron ${accordionStates[visa._id]?.downloadForms ? 'rotate' : ''}`}>
                          <ChevronDown size={20} />
                        </span>
                      </button>
                      
                      {accordionStates[visa._id]?.downloadForms && (
                        <div className="visa-accordion-content">
                          {visa.downloadForms && Array.isArray(visa.downloadForms) && visa.downloadForms.length > 0 ? (
                            <ul className="visa-download-list">
                              {visa.downloadForms.map((form, index) => {
                                const formLabel = typeof form === 'string' ? form : (form.fileName || form.label || 'Download Form');
                                const formUrl = typeof form === 'object' ? form.fileUrl : null;
                                const fullUrl = formUrl ? `https://wanderwaveph.onrender.com${formUrl}` : null;
                                const shortLabel = truncateFilename(formLabel);

                                return (
                                  <li key={index} className="visa-download-item">
                                    <span className="download-icon">📄</span>
                                    <div className="download-file-info">
                                      {fullUrl ? (
                                        <a
                                          href={fullUrl}
                                          onClick={(e) => handleDownloadClick(e, fullUrl, formLabel)}
                                          className="download-link"
                                          title={formLabel}
                                        >
                                          {shortLabel}
                                        </a>
                                      ) : (
                                        <span className="download-label" title={formLabel}>{shortLabel}</span>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p style={{fontSize: '14px', color: '#888', fontStyle: 'italic', margin: '10px 0'}}>
                              No download forms available.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ACCORDION 3: STEPS AND OTHER PROCESS */}
                    <div className="visa-accordion-section">
                      <button 
                        className={`visa-accordion-header ${accordionStates[visa._id]?.stepsProcess ? 'active' : ''}`}
                        onClick={() => toggleAccordion(visa._id, 'stepsProcess')}
                      >
                        <span className="visa-accordion-title">
                          <span className="visa-accordion-icon"><ClipboardList size={18} /></span>
                          Steps and Other Process
                          {visa.stepsProcess && Array.isArray(visa.stepsProcess) && visa.stepsProcess.length > 0 && (
                            <span className="visa-accordion-count">{visa.stepsProcess.length} Steps</span>
                          )}
                        </span>
                        <span className={`visa-accordion-chevron ${accordionStates[visa._id]?.stepsProcess ? 'rotate' : ''}`}>
                          <ChevronDown size={20} />
                        </span>
                      </button>
                      
                      {accordionStates[visa._id]?.stepsProcess && (
                        <div className="visa-accordion-content">
                          {visa.stepsProcess && Array.isArray(visa.stepsProcess) && visa.stepsProcess.length > 0 ? (
                            <ol className="visa-steps-list">
                              {visa.stepsProcess.map((step, index) => (
                                <li key={index} className="visa-step-item">
                                  <span className="step-number">{index + 1}</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p style={{fontSize: '14px', color: '#888', fontStyle: 'italic', margin: '10px 0'}}>
                              No process steps listed.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="visa-actions-bottom">
                      <button
                        className="hide-requirements-btn"
                        onClick={() => toggleVisaExpansion(visa._id)}
                      >
                        <ChevronDown size={18} />
                        <span>Hide Requirements</span>
                      </button>
                      <button
                        className="send-inquiry-btn"
                        onClick={() => handleSendInquiry(visa)}
                      >
                        <span>Send Inquiry Request</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VisaTable;