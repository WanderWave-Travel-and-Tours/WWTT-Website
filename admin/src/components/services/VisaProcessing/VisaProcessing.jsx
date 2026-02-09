import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidebar/sidebar"; 
import { 
  FolderOpen, Clock, CheckCircle, RefreshCw, FileText, 
  UserPlus, Search, Archive, ChevronLeft, ChevronRight, 
  Mail, Eye, HelpCircle 
} from "lucide-react"; 
import "./VisaProcessing.css"; 

import VisaInquiryModal from "./VisaInquiryModal";
import VisaSettingsModal from "./VisaSettingsModal";
import VisaApplicationModal from "./VisaApplicationModal"; 

// 🔥 Import Toast and Context
import { useToast } from "../../toast/ToastManager"; 

// --- CUSTOM CONFIRMATION MODAL COMPONENT ---
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="ev-confirm-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 11000
    }}>
      <div className="ev-confirm-modal" style={{
        backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
        maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none',
              backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6',
              color: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// HELPER FUNCTION - GET ADMIN DATA (Activity Logs)
const getAdminData = () => {
    try {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        console.log('📊 Admin Data from localStorage:', adminData);
        
        return {
            userEmail: adminData.email || adminData.username || 'Unknown Admin',
            adminId: adminData._id || adminData.id || null
        };
    } catch (error) {
        console.error('❌ Error getting admin data:', error);
        return {
            userEmail: 'Unknown Admin',
            adminId: null
        };
    }
};

const VISA_STAT_IMAGES = {
    TOTAL_CONFIGURED: 'https://picsum.photos/seed/visa-total/800/600',
    PENDING: 'https://picsum.photos/seed/visa-pending/800/600',
    CONTACTED: 'https://picsum.photos/seed/visa-contacted/800/600',
    COMPLETED: 'https://picsum.photos/seed/visa-completed/800/600'
};

const VisaPagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const [jumpPageInput, setJumpPageInput] = useState('');
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const handleJump = (e) => {
      e.preventDefault();
      const page = parseInt(jumpPageInput, 10);
      if (page >= 1 && page <= totalPages) {
          onPageChange(page);
          setJumpPageInput('');
      } else {
          alert(`Please enter a page number between 1 and ${totalPages}.`);
      }
  };

  return (
    <nav className="visa-pagination-nav">
      <div className="visa-pagination-info">
        <span className="visa-pagination-showing">
          Showing <strong>{totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
          <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
          <strong>{totalItems}</strong> items
        </span>
      </div>

      <div className="visa-pagination-jump">
        <button
          type="button"
          className="visa-jump-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={18} />
        </button>
        
        <form onSubmit={handleJump} className="visa-pagination-jump-form">
          <span className="visa-pagination-jump-label">Page</span>
          <input 
            type="number" 
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            placeholder={currentPage.toString()}
            min="1" 
            max={totalPages}
            className="visa-jump-input"
          />
          <span className="visa-pagination-jump-label">of {totalPages}</span>
        </form>
        
        <button
          type="button"
          className="visa-jump-arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
};

const VisaStats = ({ stats }) => {
    const getStatClass = (label) => {
        return label.toLowerCase().replace(/ /g, '-');
    }
    
    return (
        <div className="visa-stats-grid">
            {stats.map((s, i) => (
                <div 
                    className={`visa-stat-card visa-stat-card-${getStatClass(s.label)}`} 
                    key={i}
                    style={{backgroundImage: `url(${s.image})`}}
                >
                    <div className="visa-stat-card-content">
                        <h2>{s.value}</h2>
                        <span>{s.label}</span>
                    </div>
                    <div className="visa-stat-card-icon">{s.icon}</div>
                </div>
            ))}
        </div>
    );
};

const VisaFilters = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, statusOptions, getFilterClassName }) => {
  return (
    <div className="visa-filter-card">
      <div className="visa-filter-wrapper">
        <div className="visa-brand-label">
            VISA <span>FILTERS</span>
        </div>
        
        <div className="visa-filter-buttons">
          {statusOptions.map(status => (
            <button
              key={status}
              className={`visa-filter-btn ${getFilterClassName(status)}`} 
              onClick={() => setFilterStatus(status)}
            >
              {status === 'ALL' ? 'All Applications' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="visa-search-box">
          <Search size={18} className="visa-search-icon" /> 
          <input
            type="text"
            className="visa-search-input"
            placeholder="Search by Applicant, Country, Ref ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

const VisaTable = ({ loading, filteredCount, currentApplications, handleViewInquiry, handleArchiveInquiry, startIndex, getCountryCode }) => {
    const getStatusBadgeClass = (status) => {
        const normalizedStatus = (status || 'PENDING').toLowerCase().replace(/[\s_]/g, '-');
        return `visa-badge-${normalizedStatus}`;
    };

    if (loading) {
        return (
            <tbody>
                <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                        Loading visa applications...
                    </td>
                </tr>
            </tbody>
        );
    }

    if (filteredCount === 0) {
        return (
            <tbody>
                <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                        No visa applications found
                    </td>
                </tr>
            </tbody>
        );
    }

    return (
        <tbody>
            {currentApplications.map((app, index) => (
                <tr key={app.id}>
                    <td style={{ fontWeight: "700", color: '#0f172a', textAlign: 'center', width: '60px' }}>
                        {startIndex + index + 1}
                    </td>
                    <td className="visa-ref-cell">{app.id}</td>
                    <td>
                        <div className="visa-applicant-name">{app.client}</div>
                        <div className="visa-applicant-email">
                            <Mail size={13} />
                            <span>{app._original?.email || 'N/A'}</span>
                        </div>
                    </td>
                    <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className="visa-flag-circle-small">
                                {app.flagCode ? (
                                    <img className="visa-flag-img" src={`https://flagcdn.com/w40/${app.flagCode.toLowerCase()}.png`} alt={app.country} />
                                ) : (
                                    <span>{app.flag}</span>
                                )}
                            </div>
                            <span>{app.country}</span>
                        </div>
                    </td>
                    <td>
                        <span className="visa-type-badge">VISA</span>
                        {app.type}
                    </td>
                    <td>{app.date}</td>
                    <td>
                        <span className={`visa-table-badge ${getStatusBadgeClass(app.status)}`}>
                            {app.status}
                        </span>
                    </td>
                    <td>
                        <div className="visa-action-group">
                            <button className="visa-action-btn visa-view-btn" onClick={() => handleViewInquiry(app._original)}>
                                <Eye size={16} />
                                View
                            </button>
                            <button 
                                className="visa-action-btn visa-archive-btn" 
                                onClick={() => handleArchiveInquiry(app.mongoId)}
                            >
                                <Archive size={16} />
                                Archive
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};

const VisaProcessing = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  
  // 🔥 Toast Hook
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState(""); 
  const [currentFilter, setCurrentFilter] = useState("ALL"); 

  const [visaForms, setVisaForms] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false); 
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [applicationsPerPage] = useState(10);

  // 🔥 Confirmation State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary"
  });

  const countryCodes = [
    { code: "AE", name: "United Arab Emirates" }, { code: "AR", name: "Argentina" }, { code: "AT", name: "Austria" },
    { code: "AU", name: "Australia" }, { code: "BD", name: "Bangladesh" }, { code: "BE", name: "Belgium" },
    { code: "BG", name: "Bulgaria" }, { code: "BH", name: "Bahrain" }, { code: "BN", name: "Brunei" },
    { code: "BR", name: "Brazil" }, { code: "CA", name: "Canada" }, { code: "CH", name: "Switzerland" },
    { code: "CL", name: "Chile" }, { code: "CN", name: "China" }, { code: "CO", name: "Colombia" },
    { code: "CZ", name: "Czech Republic" }, { code: "DE", name: "Germany" }, { code: "DK", name: "Denmark" },
    { code: "EG", name: "Egypt" }, { code: "ES", name: "Spain" }, { code: "FI", name: "Finland" },
    { code: "FR", name: "France" }, { code: "GB", name: "United Kingdom" }, { code: "GR", name: "Greece" },
    { code: "HK", name: "Hong Kong" }, { code: "HR", name: "Croatia" }, { code: "HU", name: "Hungary" },
    { code: "ID", name: "Indonesia" }, { code: "IE", name: "Ireland" }, { code: "IL", name: "Israel" },
    { code: "IN", name: "India" }, { code: "IT", name: "Italy" }, { code: "JO", name: "Jordan" },
    { code: "JP", name: "Japan" }, { code: "KE", name: "Kenya" }, { code: "KH", name: "Cambodia" },
    { code: "KR", name: "South Korea" }, { code: "KW", name: "Kuwait" }, { code: "LA", name: "Laos" },
    { code: "LB", name: "Lebanon" }, { code: "LK", name: "Sri Lanka" }, { code: "MA", name: "Morocco" },
    { code: "MM", name: "Myanmar" }, { code: "MO", name: "Macau" }, { code: "MV", name: "Maldives" },
    { code: "MX", name: "Mexico" }, { code: "MY", name: "Malaysia" }, { code: "NG", name: "Nigeria" },
    { code: "NL", name: "Netherlands" }, { code: "NO", name: "Norway" }, { code: "NP", name: "Nepal" },
    { code: "NZ", name: "New Zealand" }, { code: "OM", name: "Oman" }, { code: "PE", name: "Peru" },
    { code: "PK", name: "Pakistan" }, { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" },
    { code: "QA", name: "Qatar" }, { code: "RO", name: "Romania" }, { code: "RS", name: "Serbia" },
    { code: "RU", name: "Russia" }, { code: "SA", name: "Saudi Arabia" }, { code: "SE", name: "Sweden" },
    { code: "SG", name: "Singapore" }, { code: "TH", name: "Thailand" }, { code: "TR", name: "Turkey" },
    { code: "TW", name: "Taiwan" }, { code: "UA", name: "Ukraine" }, { code: "US", name: "United States" },
    { code: "VN", name: "Vietnam" }, { code: "ZA", name: "South Africa" },
  ].sort((a, b) => a.name.localeCompare(b.name));

  // 🔥 Helper for Confirmation Modal
  const askConfirmation = (title, message, onConfirm, type = "primary") => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      type
    });
  };

  const fetchVisas = async () => {
    try {
      const res = await axios.get("https://wanderwaveph.onrender.com/api/visas");
      if (Array.isArray(res.data)) {
        setVisaForms(res.data.map((v) => ({ ...v, id: v._id, desc: v.description })));
      }
    } catch (error) {
      console.error("Error fetching visas:", error);
      toast.error("Failed to fetch visa forms.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const response = await axios.get('https://wanderwaveph.onrender.com/api/inquiries?isArchive=No');
      if (response.data.success) {
        const visaRequests = response.data.data.filter(inq => 
            (inq.inquiryType === 'VISA') && inq.isArchive === 'No'
        );
        setInquiries(visaRequests);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error("Failed to load inquiries.");
    }
  };

  // 🔥 UPDATED: ARCHIVE WITH ADMIN DATA, TOAST, AND CUSTOM MODAL
  const handleArchive = (id) => {
    askConfirmation(
        "Archive Inquiry",
        "Are you sure you want to archive this visa application?",
        async () => {
            const { userEmail, adminId } = getAdminData();
            try {
                const response = await axios.put(`https://wanderwaveph.onrender.com/api/inquiries/${id}/archive`, {
                    isArchive: "Yes",
                    userEmail, 
                    adminId    
                });
                if (response.data.success) {
                    toast.success("Inquiry archived successfully.");
                    fetchInquiries();
                } else {
                    toast.error(response.data.message || "Failed to archive inquiry.");
                }
            } catch (error) {
                console.error("Error archiving inquiry:", error);
                toast.error("An error occurred while archiving.");
            }
        },
        "danger"
    );
  };

  useEffect(() => {
    fetchVisas();
    fetchInquiries();
  }, []);

  const getFilterClassName = (status) => {
    if (currentFilter === status) {
        return 'visa-active-navy';
    }
    return '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  function getCountryCode(countryName) {
    const country = countryCodes.find(c => c.name.toUpperCase() === countryName.toUpperCase());
    return country ? country.code : null;
  }

  const allApplications = inquiries.map((inquiry) => ({
    id: inquiry._id.slice(-8).toUpperCase(),
    mongoId: inquiry._id,
    client: inquiry.fullName,
    country: inquiry.visaCountry || 'N/A',
    flagCode: inquiry.visaCountry ? getCountryCode(inquiry.visaCountry) : null,
    flag: '🌍',
    type: inquiry.serviceName, 
    date: formatDate(inquiry.createdAt),
    status: inquiry.status || 'PENDING',
    _original: inquiry 
  }));

  const FILTER_BUTTONS = ['ALL', 'PENDING', 'CONTACTED', 'COMPLETED', 'PAYMENT PENDING'];

  const filteredApplications = allApplications.filter(app => {
    const normalizedAppStatus = app.status ? app.status.replace(/_/g, ' ').toUpperCase() : '';
    const normalizedFilter = currentFilter.toUpperCase();
    const statusMatch = currentFilter === "ALL" || (normalizedAppStatus === normalizedFilter);
    const searchMatch = app.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        app.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        app.type.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const indexOfLastApplication = currentPage * applicationsPerPage;
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstApplication, indexOfLastApplication);
  const pageBaseIndex = (currentPage - 1) * applicationsPerPage;

  const stats = [
    { label: "Total Configured", value: visaForms.length, icon: <FolderOpen size={28} />, image: VISA_STAT_IMAGES.TOTAL_CONFIGURED },
    { label: "Pending Review", value: inquiries.filter(i => i.status === 'PENDING').length, icon: <Clock size={28} />, image: VISA_STAT_IMAGES.PENDING },
    { label: "Contacted", value: inquiries.filter(i => i.status === 'CONTACTED').length, icon: <CheckCircle size={28} />, image: VISA_STAT_IMAGES.CONTACTED },
    { label: "Completed", value: inquiries.filter(i => i.status === 'COMPLETED').length, icon: <RefreshCw size={28} />, image: VISA_STAT_IMAGES.COMPLETED },
  ];

  return (
    <div className="visa-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <main className={`visa-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="visa-container">
          
          <div className="visa-header">
            <div className="visa-title">
                <h1>VISA PROCESSING</h1>
                <p>Active Visa Applications & Requirements</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="visa-btn-add" 
                  style={{ background: '#0f172a' }} 
                  onClick={() => setIsApplicationModalOpen(true)}
                >
                  <UserPlus size={18} /> Add Applicant
                </button>
                
                <button className="visa-btn-add" onClick={() => setIsSettingsOpen(true)}>
                  <FolderOpen size={18} /> Manage Forms
                </button>
            </div>
          </div>

          <VisaStats stats={stats} />
          
          <VisaFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={currentFilter}
            setFilterStatus={(status) => { setCurrentFilter(status); setCurrentPage(1); }}
            statusOptions={FILTER_BUTTONS}
            getFilterClassName={getFilterClassName}
          />

          <div className="visa-table-container">
            <table className="visa-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '60px' }}>#</th>
                  <th>Ref ID</th>
                  <th>Applicant</th>
                  <th>Country</th>
                  <th>Visa Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <VisaTable 
                loading={isLoading}
                filteredCount={filteredApplications.length}
                currentApplications={currentApplications}
                handleViewInquiry={(inquiry) => setSelectedInquiry(inquiry)}
                handleArchiveInquiry={handleArchive}
                startIndex={pageBaseIndex}
                getCountryCode={getCountryCode}
              />
            </table>
          </div>

          {filteredApplications.length > 0 && Math.ceil(filteredApplications.length / applicationsPerPage) > 1 && (
            <VisaPagination
              totalItems={filteredApplications.length}
              itemsPerPage={applicationsPerPage}
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </div>
      </main>

      <VisaApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        refreshData={fetchInquiries} 
        visaForms={visaForms} 
      />

      {selectedInquiry && (
        <VisaInquiryModal
          isOpen={!!selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          inquiry={selectedInquiry}
          refreshData={fetchInquiries}
        />
      )}

      <VisaSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        visaForms={visaForms}
        isLoading={isLoading}
        countryCodes={countryCodes}
        refreshData={fetchVisas} 
      />

      {/* 🔥 Global Custom Confirmation Modal */}
      <CustomConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default VisaProcessing;