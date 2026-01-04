import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import Sidebar from "../../sidebar/sidebar"; 
import { FileText, AlertTriangle, CreditCard, CheckCircle, FolderOpen, ChevronLeft, ChevronRight, Search, UserPlus, Eye, Mail, Archive } from "lucide-react"; 
import { InquiryModal, ServiceListModal, ServiceEditorModal, ContactRemarksModal } from "./CenomarModals"; 
import "./CenomarRequest.css";
import { CenomarApplicationModal } from "./CenomarApplicationModal";

// Destination Images for Stats Cards
const CENOMAR_STAT_IMAGES = {
    TOTAL_REQUESTS: 'https://picsum.photos/seed/cenomar-total/800/600',
    PENDING: 'https://picsum.photos/seed/cenomar-pending/800/600',
    PAYMENT_PENDING: 'https://picsum.photos/seed/cenomar-payment/800/600',
    PAID: 'https://picsum.photos/seed/cenomar-paid/800/600'
};

// Pagination Component
const CenomarPagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
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
    <nav className="cenomar-pagination-nav">
      <div className="cenomar-pagination-info">
        <span className="cenomar-pagination-showing">
          Showing <strong>{totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
          <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
          <strong>{totalItems}</strong> items
        </span>
      </div>

      <div className="cenomar-pagination-jump">
        <button
          type="button"
          className="cenomar-jump-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={18} />
        </button>
        
        <form onSubmit={handleJump} className="cenomar-pagination-jump-form">
          <span className="cenomar-pagination-jump-label">Page</span>
          <input 
            type="number" 
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            placeholder={currentPage.toString()}
            min="1" 
            max={totalPages}
            className="cenomar-jump-input"
          />
          <span className="cenomar-pagination-jump-label">of {totalPages}</span>
        </form>
        
        <button
          type="button"
          className="cenomar-jump-arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
};

// Stats Component
const CenomarStats = ({ stats }) => {
    const getStatClass = (label) => {
        return label.toLowerCase().replace(/ /g, '-');
    }
    
    return (
        <div className="cenomar-stats-grid">
            {stats.map((s, i) => (
                <div 
                    className={`cenomar-stat-card cenomar-stat-card-${getStatClass(s.label)}`} 
                    key={i}
                    style={{backgroundImage: `url(${s.image})`}}
                >
                    <div className="cenomar-stat-card-content">
                        <h2>{s.value}</h2>
                        <span>{s.label}</span>
                    </div>
                    <div className="cenomar-stat-card-icon">{s.icon}</div>
                </div>
            ))}
        </div>
    );
};

// Filters Component
const CenomarFilters = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, statusOptions, getFilterClassName }) => {
  return (
    <div className="cenomar-filter-card">
      <div className="cenomar-filter-wrapper">
        <div className="cenomar-brand-label">
            CENOMAR <span>FILTERS</span>
        </div>
        
        <div className="cenomar-filter-buttons">
          {statusOptions.map(status => (
            <button
              key={status}
              className={`cenomar-filter-btn ${getFilterClassName(status)}`} 
              onClick={() => setFilterStatus(status)}
            >
              {status === 'ALL' ? 'All Requests' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="cenomar-search-box">
          <Search size={18} className="cenomar-search-icon" /> 
          <input
            type="text"
            className="cenomar-search-input"
            placeholder="Search by Requester, Document, Ref No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

// Table Component
const CenomarTable = ({ loading, filteredInquiriesCount, currentInquiries, handleViewInquiry, handleArchiveInquiry, startIndex }) => {
    const getStatusBadgeClass = (status) => {
        const normalizedStatus = (status || 'PENDING').toLowerCase();
        switch (normalizedStatus) {
            case 'pending': return 'cenomar-badge-pending';
            case 'contacted': return 'cenomar-badge-contacted';
            case 'payment_pending': return 'cenomar-badge-payment_pending';
            case 'paid': return 'cenomar-badge-paid';
            case 'confirmed': return 'cenomar-badge-confirmed';
            case 'completed': return 'cenomar-badge-completed';
            case 'cancelled': return 'cenomar-badge-cancelled';
            default: return 'cenomar-badge-pending';
        }
    };

    if (loading) {
        return (
            <tbody>
                <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                        Loading CENOMAR requests...
                    </td>
                </tr>
            </tbody>
        );
    }

    if (filteredInquiriesCount === 0) {
        return (
            <tbody>
                <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                        No CENOMAR requests found
                    </td>
                </tr>
            </tbody>
        );
    }

    return (
        <tbody>
            {currentInquiries.map((row, index) => (
                <tr key={row._id}>
                    <td style={{ fontWeight: "700", color: '#0f172a', textAlign: 'center', width: '60px' }}>
                        {startIndex + index + 1}
                    </td>
                    <td className="cenomar-ref-cell">{row._id.slice(-6).toUpperCase()}</td>
                    <td>
                        <div className="cenomar-requester-name">{row.fullName}</div>
                        <div className="cenomar-requester-email">
                            <Mail size={13} />
                            <span>{row.email}</span>
                        </div>
                    </td>
                    <td>
                        <span className="cenomar-doc-badge">CNM</span>
                        {row.cenomarDocument || row.serviceName}
                    </td>
                    <td>
                        <span className={`cenomar-table-badge ${getStatusBadgeClass(row.status)}`}>
                            {row.status || 'PENDING'}
                        </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                        <div className="cenomar-action-group">
                            <button 
                                className="cenomar-action-btn cenomar-view-btn" 
                                onClick={() => handleViewInquiry(row)}
                                title="View Details"
                            >
                                <Eye size={16} /> View
                            </button>
                            <button 
                                className="cenomar-action-btn cenomar-archive-btn" 
                                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                onClick={() => handleArchiveInquiry(row._id)}
                                title="Archive Request"
                            >
                                <Archive size={16} /> Archive
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};

// Main Component
const CenomarRequest = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cenomarDocs, setCenomarDocs] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [showContactRemarks, setShowContactRemarks] = useState(false);
  const [contactRemarks, setContactRemarks] = useState("");
  const [contactEvidence, setContactEvidence] = useState(null);
  const [showDeliverDocs, setShowDeliverDocs] = useState(false);
  const [deliveryFiles, setDeliveryFiles] = useState([]);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  const [isCENOMARFormsOpen, setIsCENOMARFormsOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedCENOMAR, setSelectedCENOMAR] = useState(null);
  
  const [newCENOMARForm, setNewCENOMARForm] = useState({ documentType: "", desc: "", price: "" });
  const [requirements, setRequirements] = useState([]);
  const [downloadForms, setDownloadForms] = useState([]);
  const [stepsProcess, setStepsProcess] = useState([]);
  const [accordionState, setAccordionState] = useState({ requirements: true, downloadForms: false, stepsProcess: false });

  useEffect(() => {
    fetchCENOMARDocs();
    fetchInquiries();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const fetchCENOMARDocs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/cenomar");
      if (Array.isArray(res.data)) {
        const mapped = res.data.map(d => ({ ...d, id: d._id, desc: d.description }));
        setCenomarDocs(mapped);
      }
    } catch (error) { 
        console.error("Error fetching CENOMAR docs:", error); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/inquiries');
      if (response.data.success) {
        // FILTER: inquiryType ay CENOMAR at isArchive ay No
        const cenomarRequests = response.data.data.filter(inq => 
          inq.inquiryType === 'CENOMAR' && inq.isArchive === 'No'
        );
        // Sort by newest first
        cenomarRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInquiries(cenomarRequests);
      }
    } catch (error) { 
        console.error('Error fetching inquiries:', error); 
    } finally {
        setIsLoading(false);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredInquiries = useMemo(() => {
    let list = inquiries;
    const lowerSearchTerm = searchTerm.toLowerCase();

    if (filterStatus !== "ALL") {
      list = list.filter(inq => (inq.status || 'PENDING') === filterStatus);
    }

    if (lowerSearchTerm) {
      list = list.filter(inq =>
        inq.fullName.toLowerCase().includes(lowerSearchTerm) ||
        (inq.cenomarDocument || inq.serviceName || '').toLowerCase().includes(lowerSearchTerm) ||
        (inq.message || '').toLowerCase().includes(lowerSearchTerm) ||
        (inq._id || '').slice(-6).toLowerCase().includes(lowerSearchTerm) 
      );
    }
    
    return list;
  }, [inquiries, searchTerm, filterStatus]);

  const stats = useMemo(() => [
    { 
        label: "Total Requests", 
        value: inquiries.length, 
        icon: <FileText size={24} />, 
        image: CENOMAR_STAT_IMAGES.TOTAL_REQUESTS 
    },
    { 
        label: "To Process", 
        value: inquiries.filter(i => (i.status || 'PENDING') === 'PENDING').length, 
        icon: <AlertTriangle size={24} />, 
        image: CENOMAR_STAT_IMAGES.PENDING 
    },
    { 
        label: "Pending Payment", 
        value: inquiries.filter(i => i.status === 'PAYMENT_PENDING').length, 
        icon: <CreditCard size={24} />, 
        image: CENOMAR_STAT_IMAGES.PAYMENT_PENDING 
    },
    { 
        label: "Paid/Confirming", 
        value: inquiries.filter(i => i.status === 'PAID').length, 
        icon: <CheckCircle size={24} />, 
        image: CENOMAR_STAT_IMAGES.PAID 
    },
  ], [inquiries]);

  const getFilterClassName = (status) => {
    return status === filterStatus ? 'cenomar-active-navy' : '';
  }

  const statusOptions = useMemo(() => {
    const statuses = new Set(inquiries.map(i => i.status || 'PENDING')); 
    const allPossibleStatuses = [
      'PENDING', 'CONTACTED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED'
    ];
    const sortedStatuses = allPossibleStatuses.filter(status => statuses.has(status));
    return ['ALL', ...sortedStatuses];
  }, [inquiries]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInquiries = filteredInquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalItems = filteredInquiries.length;
  const startIndex = (currentPage - 1) * itemsPerPage;

  const fetchDocuments = async (inquiryId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/documents/inquiry/${inquiryId}`);
      if (response.data.success) setDocuments(response.data.documents || []);
    } catch (error) { 
        console.error('Error fetching documents:', error); 
        setDocuments([]); 
    }
  };

  const handleViewInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsInquiryModalOpen(true); 
    fetchDocuments(inquiry._id);
  };

  const handleArchiveInquiry = async (id) => {
    if (!window.confirm("Are you sure you want to archive this request?")) return;
    try {
      const res = await axios.put(`http://localhost:5000/api/inquiries/${id}/archive`, { isArchive: "Yes" });
      if (res.data.success) {
        alert("Inquiry archived successfully!");
        fetchInquiries(); // Refresh list
        if (isInquiryModalOpen) handleCloseInquiryModal();
      }
    } catch (error) {
      console.error("Archive error:", error);
      alert("Failed to archive inquiry.");
    }
  };

  const handleCloseInquiryModal = () => {
    setIsInquiryModalOpen(false);
    setTimeout(() => {
      setSelectedInquiry(null); 
      setDocuments([]); 
      setShowDeliverDocs(false);
      setDeliveryFiles([]); 
      setShowContactRemarks(false); 
      setContactRemarks(""); 
      setContactEvidence(null);
    }, 200);
  };

  const handleUpdateInquiryStatus = async (inquiryId, newStatus) => {
    if (!window.confirm(`Set status to ${newStatus}?`)) return;
    try {
      const response = await axios.put(`http://localhost:5000/api/inquiries/${inquiryId}/status`, { status: newStatus });
      if (response.data.success) {
        alert('Status updated successfully!'); 
        fetchInquiries();
        if (selectedInquiry && selectedInquiry._id === inquiryId) setSelectedInquiry({ ...selectedInquiry, status: newStatus });
      }
    } catch (error) { 
        console.error(error); 
        alert('Failed to update status'); 
    }
  };

  const handleRequestPayment = async () => {
    if (!window.confirm("Request payment from user?")) return;
    try {
      const response = await axios.put(`http://localhost:5000/api/inquiries/${selectedInquiry._id}/status`, { status: 'PAYMENT_PENDING' });
      if (response.data.success) {
        alert('Payment requested!'); 
        fetchInquiries();
        setSelectedInquiry({ ...selectedInquiry, status: 'PAYMENT_PENDING' });
      }
    } catch (error) { 
        console.error(error); 
        alert('Failed to request payment'); 
    }
  };

  const submitContactWithRemarks = async () => {
    if (!selectedInquiry || !contactRemarks.trim()) return alert('Please enter remarks');
    try {
      const formData = new FormData();
      formData.append('status', 'CONTACTED');
      formData.append('remarks', contactRemarks);
      if (contactEvidence) formData.append('evidence', contactEvidence);
      const response = await axios.put(`http://localhost:5000/api/inquiries/${selectedInquiry._id}/status`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        alert('Status updated to CONTACTED!'); 
        fetchInquiries();
        setSelectedInquiry({ ...selectedInquiry, status: 'CONTACTED' });
        setShowContactRemarks(false); 
        setContactRemarks(""); 
        setContactEvidence(null);
      }
    } catch (error) { 
        console.error(error); 
        alert('Failed to update status'); 
    }
  };

  const handleConfirmPayment = async () => {
    if (!window.confirm("Confirm payment received?")) return;
    try {
      const response = await axios.put(`http://localhost:5000/api/inquiries/${selectedInquiry._id}/confirm-payment`, { adminName: 'Admin' });
      if (response.data.success) {
        alert('Payment confirmed!'); 
        fetchInquiries();
        setSelectedInquiry({ ...selectedInquiry, status: 'CONFIRMED' });
      }
    } catch (error) { 
        console.error(error); 
        alert('Failed to confirm payment'); 
    }
  };

  const handleDeliverDocuments = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (deliveryFiles.length === 0) return alert('Select files first');
    const formData = new FormData();
    deliveryFiles.forEach(file => formData.append('documents', file));

    try {
      const response = await axios.put(`http://localhost:5000/api/inquiries/${selectedInquiry._id}/deliver-documents`, formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      if (response.data.success) {
        alert('Documents sent successfully!');
        fetchInquiries(); 
        setSelectedInquiry({ ...selectedInquiry, status: 'COMPLETED' });
        await fetchDocuments(selectedInquiry._id);
        setDeliveryFiles([]);
        setShowDeliverDocs(true); 
      }
    } catch (error) { console.error(error); alert('Failed to send documents'); }
  };

  // --- CMS HANDLERS ---
  const handleManageService = () => setIsCENOMARFormsOpen(true);

  const handleAddNewCENOMAR = () => {
    setIsCENOMARFormsOpen(false); 
    setIsAddFormOpen(true); 
    setIsEditorOpen(false); 
    setSelectedCENOMAR(null);
    setNewCENOMARForm({ documentType: "", desc: "", price: "" });
    setRequirements([]); 
    setDownloadForms([]); 
    setStepsProcess([]);
    setAccordionState({ requirements: true, downloadForms: false, stepsProcess: false });
  };

  const handleEditCENOMAR = (cenomar) => {
    setIsCENOMARFormsOpen(false); 
    setIsAddFormOpen(true); 
    setIsEditorOpen(true); 
    setSelectedCENOMAR(cenomar);
    setNewCENOMARForm({ documentType: cenomar.documentType, desc: cenomar.description || cenomar.desc, price: cenomar.price });
    setRequirements(cenomar.requirements || []); 
    setDownloadForms(cenomar.downloadableForms || []); 
    setStepsProcess(cenomar.processSteps || []);
  };

  const handleDeleteCENOMAR = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try { await axios.delete(`http://localhost:5000/api/cenomar/${id}`); fetchCENOMARDocs(); } 
    catch(err) { console.error(err); alert("Failed to delete"); }
  };

  const handleSaveChanges = async () => {
    const payload = {
      documentType: newCENOMARForm.documentType, 
      description: newCENOMARForm.desc, 
      price: parseFloat(newCENOMARForm.price),
      requirements, 
      downloadableForms: downloadForms, 
      processSteps: stepsProcess
    };
    try {
      if (isEditorOpen && selectedCENOMAR) await axios.put(`http://localhost:5000/api/cenomar/${selectedCENOMAR._id}`, payload);
      else await axios.post(`http://localhost:5000/api/cenomar`, payload);
      alert("Service saved!"); setIsAddFormOpen(false); setIsCENOMARFormsOpen(true); fetchCENOMARDocs();
    } catch (err) { console.error(err); alert("Failed to save"); }
  };

  const toggleAccordion = (section) => setAccordionState((prev) => ({ ...prev, [section]: !prev[section] }));
  const addCategory = () => setRequirements([...requirements, { id: Date.now(), title: "", items: [] }]);
  const removeCategory = (id) => setRequirements(requirements.filter(c => c.id !== id));
  const handleCategoryTitleChange = (id, v) => setRequirements(requirements.map(c => c.id === id ? { ...c, title: v } : c));
  const addRequirement = (cId) => setRequirements(requirements.map(c => c.id === cId ? { ...c, items: [...c.items, { id: Date.now(), label: "" }] } : c));
  const removeRequirement = (cId, iId) => setRequirements(requirements.map(c => c.id === cId ? { ...c, items: c.items.filter(i => i.id !== iId) } : c));
  const handleLabelChange = (cId, iId, v) => setRequirements(requirements.map(c => c.id === cId ? { ...c, items: c.items.map(i => i.id === iId ? { ...i, label: v } : i) } : c));
  const addStep = () => setStepsProcess([...stepsProcess, { id: Date.now(), label: "" }]);
  const removeStep = (id) => setStepsProcess(stepsProcess.filter(s => s.id !== id));
  const handleStepChange = (id, v) => setStepsProcess(stepsProcess.map(s => s.id === id ? { ...s, label: v } : s));

  const handleDirectFileUpload = async (e) => {
    const file = e.target.files[0]; 
    if (!file) return;
    const formData = new FormData(); 
    formData.append('file', file);
    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData);
      if (res.data.success) setDownloadForms([...downloadForms, { id: Date.now(), name: file.name, url: res.data.fileUrl }]);
    } catch(err) { 
        console.error(err); 
        alert("Upload failed"); 
    }
  };
  
  const removeDownloadForm = (id) => setDownloadForms(downloadForms.filter(f => f.id !== id));

  return (
    <div className="cenomar-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
      
      <main className={`cenomar-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="cenomar-container">
          
          <div className="cenomar-header">
            <div className="cenomar-title">
                <h1>CENOMAR Request</h1>
                <p>Active Certificate of No Marriage Applications</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="cenomar-btn-add" 
                  style={{ background: '#0f172a' }} 
                  onClick={() => setIsApplicationModalOpen(true)}
                >
                  <UserPlus size={18} /> Add Applicant
                </button>
                
                <button className="cenomar-btn-add" onClick={handleManageService}>
                  <FolderOpen size={18} /> Manage Service
                </button>
            </div>
          </div>

          <CenomarStats stats={stats} />
          
          <CenomarFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            statusOptions={statusOptions}
            getFilterClassName={getFilterClassName}
          />

          <div className="cenomar-table-container">
            <table className="cenomar-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '60px' }}>#</th>
                  <th>Ref No.</th>
                  <th>Requester</th>
                  <th>Document</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <CenomarTable 
                loading={isLoading}
                filteredInquiriesCount={filteredInquiries.length}
                currentInquiries={currentInquiries}
                handleViewInquiry={handleViewInquiry}
                handleArchiveInquiry={handleArchiveInquiry}
                startIndex={startIndex}
              />
            </table>
          </div>

          {filteredInquiries.length > 0 && Math.ceil(filteredInquiries.length / itemsPerPage) > 1 && (
            <CenomarPagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          )}
        </div>
      </main>

      <CenomarApplicationModal 
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        refreshData={fetchInquiries}
        cenomarDocs={cenomarDocs}
      />

      {isInquiryModalOpen && selectedInquiry && (
        <InquiryModal 
          inquiry={selectedInquiry}
          documents={documents}
          // [CRITICAL] Passing the list of services to the modal so it can find the price
          cenomarDocs={cenomarDocs}
          onClose={handleCloseInquiryModal}
          onUpdateStatus={handleUpdateInquiryStatus}
          onRequestPayment={handleRequestPayment}
          onConfirmPayment={handleConfirmPayment}
          showDeliverDocs={showDeliverDocs}
          setShowDeliverDocs={setShowDeliverDocs}
          deliveryFiles={deliveryFiles}
          setDeliveryFiles={setDeliveryFiles}
          handleDeliverDocuments={handleDeliverDocuments}
          setShowContactRemarks={setShowContactRemarks}
        />
      )}

      {showContactRemarks && (
        <ContactRemarksModal 
          remarks={contactRemarks}
          setRemarks={setContactRemarks}
          setEvidence={setContactEvidence}
          onSubmit={submitContactWithRemarks}
          onClose={() => { 
              setShowContactRemarks(false); 
              setContactRemarks(""); 
              setContactEvidence(null); 
          }}
        />
      )}

      {isCENOMARFormsOpen && (
        <ServiceListModal 
          services={cenomarDocs}
          onAdd={handleAddNewCENOMAR}
          onEdit={handleEditCENOMAR}
          onDelete={handleDeleteCENOMAR}
          onClose={() => setIsCENOMARFormsOpen(false)}
        />
      )}

      {isAddFormOpen && (
        <ServiceEditorModal 
          isEditorOpen={isEditorOpen}
          form={newCENOMARForm} 
          setForm={setNewCENOMARForm}
          requirements={requirements}
          steps={stepsProcess}
          downloads={downloadForms}
          accordionState={accordionState}
          toggleAccordion={toggleAccordion}
          addCategory={addCategory} 
          removeCategory={removeCategory} 
          handleCategoryTitleChange={handleCategoryTitleChange}
          addRequirement={addRequirement} 
          removeRequirement={removeRequirement} 
          handleLabelChange={handleLabelChange}
          addStep={addStep} 
          removeStep={removeStep} 
          handleStepChange={handleStepChange}
          handleDirectFileUpload={handleDirectFileUpload} 
          removeDownloadForm={removeDownloadForm}
          onSave={handleSaveChanges}
          onClose={() => { 
              setIsAddFormOpen(false); 
              setIsCENOMARFormsOpen(true); 
          }}
        />
      )}
    </div>
  );
};

export default CenomarRequest;