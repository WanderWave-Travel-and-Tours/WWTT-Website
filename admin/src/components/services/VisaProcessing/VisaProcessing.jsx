import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidebar/sidebar"; // Adjust path if needed
import { FolderOpen, Clock, CheckCircle, RefreshCw, FileText, UserPlus } from "lucide-react";
import "./VisaProcessing.css"; 

// Import Sub-components
import VisaInquiryModal from "./VisaInquiryModal";
import VisaSettingsModal from "./VisaSettingsModal";
import VisaApplicationModal from "./VisaApplicationModal"; // NEW COMPONENT

// --- Pagination Component ---
const Pagination = ({ applicationsPerPage, totalApplications, paginate, currentPage }) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalApplications / applicationsPerPage);
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);

  if (totalApplications <= applicationsPerPage) return null;

  return (
    <nav className="pagination-nav">
      <ul className="pagination-list">
        <li>
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="pagination-btn">Previous</button>
        </li>
        {pageNumbers.map(number => (
          <li key={number} className="page-item">
            <button onClick={() => paginate(number)} className={`pagination-btn ${number === currentPage ? 'active' : ''}`}>{number}</button>
          </li>
        ))}
        <li>
          <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-btn">Next</button>
        </li>
      </ul>
    </nav>
  );
};

// --- Stats Component ---
const VisaStats = ({ stats }) => (
  <div className="visa-stats-grid">
    {stats.map((stat, index) => (
      <div key={index} className="visa-card">
        <div className="visa-card-content">
          <h2>{stat.value}</h2>
          <span>{stat.label}</span>
        </div>
        <div className="visa-card-icon">{stat.icon}</div>
      </div>
    ))}
  </div>
);

// --- MAIN COMPONENT ---
const VisaProcessing = () => {
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // Data States
  const [visaForms, setVisaForms] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false); // NEW STATE
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [applicationsPerPage] = useState(10);

  // Country Codes Data
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

  // --- API CALLS ---
  const fetchVisas = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/visas");
      if (Array.isArray(res.data)) {
        setVisaForms(res.data.map((v) => ({ ...v, id: v._id, desc: v.description })));
      }
    } catch (error) {
      console.error("Error fetching visas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inquiries');
      if (response.data.success) {
        const visaRequests = response.data.data.filter(inq => 
            (inq.serviceName && inq.serviceName.toUpperCase().includes('VISA')) ||
            inq.visaCountry 
        );
        setInquiries(visaRequests);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  useEffect(() => {
    fetchVisas();
    fetchInquiries();
  }, []);

  // --- HELPERS ---
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  function getCountryCode(countryName) {
    const country = countryCodes.find(c => c.name.toUpperCase() === countryName.toUpperCase());
    return country ? country.code : null;
  }

  // --- DATA MAPPING & PAGINATION ---
  const allApplications = inquiries.map((inquiry) => ({
    id: inquiry._id.slice(-8).toUpperCase(),
    client: inquiry.fullName,
    country: inquiry.visaCountry || 'N/A',
    flagCode: inquiry.visaCountry ? getCountryCode(inquiry.visaCountry) : null,
    flag: '🌍',
    type: inquiry.serviceName,
    date: formatDate(inquiry.createdAt),
    status: inquiry.status || 'PENDING',
    _original: inquiry 
  }));

  const indexOfLastApplication = currentPage * applicationsPerPage;
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
  const currentApplications = allApplications.slice(indexOfFirstApplication, indexOfLastApplication);

  const stats = [
    { label: "Total Visas Configured", value: visaForms.length, icon: <FolderOpen size={28} /> },
    { label: "Pending Review", value: inquiries.filter(i => i.status === 'PENDING').length, icon: <Clock size={28} /> },
    { label: "Contacted", value: inquiries.filter(i => i.status === 'CONTACTED').length, icon: <CheckCircle size={28} /> },
    { label: "Completed", value: inquiries.filter(i => i.status === 'COMPLETED').length, icon: <RefreshCw size={28} /> },
  ];

  return (
    <div className="visa-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <div className={`visa-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="visa-container">
          
          {/* Header */}
          <div className="visa-header">
            <div className="visa-title">
              <h1>Visa Processing</h1>
              <p>Manage visa requirements and forms</p>
            </div>
            <div className="header-actions">
              <button className="visa-btn-edit-req" onClick={() => setIsApplicationModalOpen(true)}>
                <UserPlus size={18} />
                Add Applicant
              </button>
              <button className="visa-btn-edit-req" onClick={() => setIsSettingsOpen(true)}>
                <FileText size={18} />
                Manage Visa Forms
              </button>
            </div>
          </div>

          {/* Stats */}
          <VisaStats stats={stats} />

          {/* Table */}
          <div className="visa-table-container">
            <table className="visa-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Applicant</th>
                  <th>Country</th>
                  <th>Visa Type</th>
                  <th>Date Received</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentApplications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.id}</td>
                    <td>{app.client}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="visa-flag-circle-small">
                          {app.flagCode ? (
                            <img className="visa-flag-img" src={`https://flagcdn.com/w40/${app.flagCode.toLowerCase()}.png`} alt={app.country} onError={(e) => { e.target.style.display = "none"; }} />
                          ) : (
                            <span>{app.flag}</span>
                          )}
                        </div>
                        <span>{app.country}</span>
                      </div>
                    </td>
                    <td>{app.type}</td>
                    <td>{app.date}</td>
                    <td>
                      <span className={`visa-badge badge-${app.status.toLowerCase()}`}>{app.status}</span>
                    </td>
                    <td>
                      <button className="visa-action-btn visa-view-btn" onClick={() => setSelectedInquiry(app._original)}>
                        View
                      </button>
                      <button className="visa-action-btn">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <Pagination 
                applicationsPerPage={applicationsPerPage} 
                totalApplications={allApplications.length} 
                paginate={setCurrentPage} 
                currentPage={currentPage}
            />
          </div>

          {/* --- SUB MODALS --- */}
          
          {/* 1. Visa Settings Modal */}
          <VisaSettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            visaForms={visaForms}
            isLoading={isLoading}
            countryCodes={countryCodes}
            refreshData={fetchVisas} 
          />

          {/* 2. Inquiry View Modal */}
          {selectedInquiry && (
            <VisaInquiryModal
              isOpen={!!selectedInquiry}
              onClose={() => setSelectedInquiry(null)}
              inquiry={selectedInquiry}
              refreshData={fetchInquiries}
            />
          )}

          {/* 3. NEW: Visa Application Modal */}
          <VisaApplicationModal
            isOpen={isApplicationModalOpen}
            onClose={() => setIsApplicationModalOpen(false)}
          />

        </div>
      </div>
    </div>
  );
};

export default VisaProcessing;