import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidebar/sidebar"; 
import { FolderOpen, Clock, CheckCircle, RefreshCw, FileText, UserPlus, Search, Archive } from "lucide-react"; 
import "./VisaProcessing.css"; 

import VisaInquiryModal from "./VisaInquiryModal";
import VisaSettingsModal from "./VisaSettingsModal";
import VisaApplicationModal from "./VisaApplicationModal"; 

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

const VisaProcessing = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

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

  const fetchVisas = async () => {
    try {
      const res = await axios.get("https://wanderwaveph-backend.onrender.com/api/visas");
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
      // Nagpasa tayo ng query param na isArchive=No para sa initial fetch
      const response = await axios.get('https://wanderwaveph-backend.onrender.com/api/inquiries?isArchive=No');
      if (response.data.success) {
        // Dito natin ifi-filter para siguradong inquiryType: "VISA" lang at isArchive: "No" ang lalabas
        const visaRequests = response.data.data.filter(inq => 
            (inq.inquiryType === 'VISA') && inq.isArchive === 'No'
        );
        setInquiries(visaRequests);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  // BAGONG FUNCTION: Para sa Pag-archive
  const handleArchive = async (id) => {
    if (window.confirm("Are you sure you want to archive this inquiry?")) {
      try {
        const response = await axios.put(`https://wanderwaveph-backend.onrender.com/api/inquiries/${id}/archive`, {
          isArchive: "Yes"
        });
        if (response.data.success) {
          alert("Inquiry archived successfully.");
          fetchInquiries(); // I-refresh ang listahan
        }
      } catch (error) {
        console.error("Error archiving inquiry:", error);
        alert("Failed to archive inquiry.");
      }
    }
  };

  useEffect(() => {
    fetchVisas();
    fetchInquiries();
  }, []);

  const getActiveClass = (status) => {
    switch(status.toUpperCase()) {
      case 'ALL': return 'active';
      case 'PENDING': return 'pending-active';
      case 'COMPLETED': return 'confirmed-active';
      case 'CONTACTED': return 'contacted-active';
      case 'PAYMENT PENDING': return 'payment-pending-active';
      default: return 'active';
    }
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
    mongoId: inquiry._id, // Itatago natin ang full ID para sa archive function
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
          <div className="visa-header">
            <div className="visa-title">
              <h1>Visa Processing</h1>
              <p>Manage visa requirements and forms</p>
            </div>
            <div className="header-actions">
              <button className="visa-btn-edit-req" onClick={() => setIsApplicationModalOpen(true)}>
                <UserPlus size={18} /> Add Applicant
              </button>
              <button className="visa-btn-edit-req" onClick={() => setIsSettingsOpen(true)}>
                <FileText size={18} /> Manage Visa Forms
              </button>
            </div>
          </div>

          <VisaStats stats={stats} />

          <div className="search-filter-card">
            <div className="search-filter-wrapper">
              <div className="search-box">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by client name, Ref ID, or country..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${currentFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => { setCurrentFilter('ALL'); setCurrentPage(1); }}
                >
                  All Items
                </button>
                {FILTER_BUTTONS.filter(status => status !== 'ALL').map(status => (
                  <button
                    key={status}
                    className={`filter-btn ${currentFilter === status ? getActiveClass(status) : ''}`}
                    onClick={() => { setCurrentFilter(status); setCurrentPage(1); }}
                  >
                    {status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="visa-table-container">
            <table className="visa-table">
              <thead>
                <tr>
                  <th>S. No.</th>
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
                {currentApplications.map((app, index) => (
                  <tr key={app.id}>
                    <td>{pageBaseIndex + index + 1}</td>
                    <td>{app.id}</td>
                    <td>{app.client}</td>
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
                    <td>{app.type}</td>
                    <td>{app.date}</td>
                    <td>
                      <span className={`visa-badge badge-${app.status.toLowerCase().replace(/[\s_]/g, '-')}`}>{app.status}</span>
                    </td>
                    <td>
                      <button className="visa-action-btn visa-view-btn" onClick={() => setSelectedInquiry(app._original)}>
                        View
                      </button>
                      {/* BINAGONG BUTTON: Delete naging Archive */}
                      <button 
                        className="visa-action-btn" 
                        style={{ backgroundColor: '#f39c12', color: 'white', marginLeft: '5px' }}
                        onClick={() => handleArchive(app.mongoId)}
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <Pagination 
                applicationsPerPage={applicationsPerPage} 
                totalApplications={filteredApplications.length} 
                paginate={setCurrentPage} 
                currentPage={currentPage}
            />
          </div>

          <VisaSettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            visaForms={visaForms}
            isLoading={isLoading}
            countryCodes={countryCodes}
            refreshData={fetchVisas} 
          />

          {selectedInquiry && (
            <VisaInquiryModal
              isOpen={!!selectedInquiry}
              onClose={() => setSelectedInquiry(null)}
              inquiry={selectedInquiry}
              refreshData={fetchInquiries}
            />
          )}

          <VisaApplicationModal
            isOpen={isApplicationModalOpen}
            onClose={() => setIsApplicationModalOpen(false)}
            refreshData={fetchInquiries} 
            visaForms={visaForms} 
          />
        </div>
      </div>
    </div>
  );
};

export default VisaProcessing;