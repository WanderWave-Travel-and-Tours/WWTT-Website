import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import Sidebar from "../../sidebar/sidebar"; 
import { FileText, AlertTriangle, CreditCard, CheckCircle, FolderOpen, ChevronLeft, ChevronRight, Search, UserPlus, Archive } from "lucide-react"; 
import { InquiryModal, ServiceListModal, ServiceEditorModal, ContactRemarksModal } from "./CenomarModals"; 
import "./CenomarRequest.css";
import { CenomarApplicationModal } from "./CenomarApplicationModal";

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (start > 2) pageNumbers.push('...');
      
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (end < totalPages - 1) pageNumbers.push('...');

      if (!pageNumbers.includes(totalPages)) {
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers.filter((value, index, self) => 
      self.indexOf(value) === index || value === currentPage
    ).filter((value, index, self) => 
      !(value === '...' && self[index - 1] === '...')
    );
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="pagination-nav">
      <ul className="pagination-list">
        <li>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          ><ChevronLeft size={16} /></button>
        </li>
        {pageNumbers.map((number, index) => (
          <li key={index}>
            {number === '...' ? (
              <span className="pagination-btn" style={{ cursor: 'default', opacity: 1, backgroundColor: 'white' }}>...</span>
            ) : (
              <button
                onClick={() => onPageChange(number)}
                className={`pagination-btn ${number === currentPage ? 'active' : ''}`}
              >
                {number}
              </button>
            )}
          </li>
        ))}
        <li>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          ><ChevronRight size={16} /></button>
        </li>
      </ul>
    </nav>
  );
};

const CenomarRequest = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cenomarDocs, setCenomarDocs] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); 
  
  // --- PAGINATION STATES ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // --- MODAL STATES ---
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [showContactRemarks, setShowContactRemarks] = useState(false);
  const [contactRemarks, setContactRemarks] = useState("");
  const [contactEvidence, setContactEvidence] = useState(null);
  const [showDeliverDocs, setShowDeliverDocs] = useState(false);
  const [deliveryFiles, setDeliveryFiles] = useState([]);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  // --- CMS STATES ---
  const [isCENOMARFormsOpen, setIsCENOMARFormsOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedCENOMAR, setSelectedCENOMAR] = useState(null);
  
  // Editor Form State
  const [newCENOMARForm, setNewCENOMARForm] = useState({ documentType: "", desc: "", price: "" });
  const [requirements, setRequirements] = useState([]);
  const [downloadForms, setDownloadForms] = useState([]);
  const [stepsProcess, setStepsProcess] = useState([]);
  const [accordionState, setAccordionState] = useState({ requirements: true, downloadForms: false, stepsProcess: false });

  // --- INITIAL DATA FETCHING ---
  useEffect(() => {
    fetchCENOMARDocs();
    fetchInquiries();
  }, []);

  const fetchCENOMARDocs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/cenomar");
      if (Array.isArray(res.data)) {
        const mapped = res.data.map(d => ({ ...d, id: d._id, desc: d.description }));
        setCenomarDocs(mapped);
      }
    } catch (error) { console.error("Error fetching CENOMAR docs:", error); } 
    finally { setIsLoading(false); }
  };

  const fetchInquiries = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inquiries');
      if (response.data.success) {
        // FILTER: inquiryType ay CENOMAR at isArchive ay No
        const cenomarRequests = response.data.data.filter(inq => 
          inq.inquiryType === 'CENOMAR' && inq.isArchive === 'No'
        );
        setInquiries(cenomarRequests);
      }
    } catch (error) { console.error('Error fetching inquiries:', error); }
  };

  // --- ARCHIVE FUNCTION ---
  const handleArchiveInquiry = async (id) => {
    if (!window.confirm("Sigurado ka bang gusto mong i-archive ang request na ito?")) return;
    try {
      const res = await axios.put(`http://localhost:5000/api/inquiries/${id}/archive`, { isArchive: "Yes" });
      if (res.data.success) {
        alert("Inquiry archived successfully!");
        fetchInquiries(); // Refresh listahan
      }
    } catch (error) {
      console.error("Archive error:", error);
      alert("Failed to archive inquiry.");
    }
  };

  // --- FILTERING LOGIC ---
  const filteredInquiries = useMemo(() => {
    let list = inquiries;
    const lowerSearchTerm = searchTerm.toLowerCase();

    // 1. Filter by Status
    if (filterStatus !== "ALL") {
      list = list.filter(inq => (inq.status || 'PENDING') === filterStatus);
    }

    // 2. Filter by Search Term
    if (lowerSearchTerm) {
      list = list.filter(inq =>
        inq.fullName.toLowerCase().includes(lowerSearchTerm) ||
        (inq.cenomarDocument || inq.serviceName || '').toLowerCase().includes(lowerSearchTerm) ||
        (inq.message || '').toLowerCase().includes(lowerSearchTerm) ||
        (inq._id || '').slice(-6).toLowerCase().includes(lowerSearchTerm) 
      );
    }
    
    if (currentPage > Math.ceil(list.length / itemsPerPage) && list.length > 0) {
      setCurrentPage(1);
    } else if (list.length === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }

    return list;
  }, [inquiries, searchTerm, filterStatus, itemsPerPage, currentPage]);

  const stats = [
    { label: "Total Requests", value: inquiries.length, icon: <FileText size={24} /> },
    { label: "To Process", value: inquiries.filter(i => (i.status || 'PENDING') === 'PENDING').length, icon: <AlertTriangle size={24} /> },
    { label: "Pending Payment", value: inquiries.filter(i => i.status === 'PAYMENT_PENDING').length, icon: <CreditCard size={24} /> },
    { label: "Paid/Confirming", value: inquiries.filter(i => i.status === 'PAID').length, icon: <CheckCircle size={24} /> },
  ];

  const getFilterClassName = (status) => {
    switch(status) {
      case 'PENDING':
      case 'PAYMENT_PENDING':
      case 'CONTACTED':
        return 'pending-active';
      case 'PAID':
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'confirmed-active';
      case 'CANCELLED':
        return 'cancelled-active';
      default:
        return 'active'; 
    }
  }

  const statusOptions = useMemo(() => {
    const statuses = new Set(inquiries.map(i => i.status || 'PENDING')); 
    const allPossibleStatuses = [
      'PENDING', 
      'CONTACTED', 
      'PAYMENT_PENDING', 
      'PAID', 
      'CONFIRMED', 
      'COMPLETED',
      'CANCELLED'
    ];
    const sortedStatuses = allPossibleStatuses.filter(status => statuses.has(status));
    return ['ALL', ...sortedStatuses];
  }, [inquiries]);


  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInquiries = filteredInquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalItems = filteredInquiries.length;
  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);


  // --- INQUIRY HANDLERS ---
  const fetchDocuments = async (inquiryId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/documents/inquiry/${inquiryId}`);
      if (response.data.success) setDocuments(response.data.documents || []);
    } catch (error) { console.error('Error fetching documents:', error); setDocuments([]); }
  };

  const handleViewInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsInquiryModalOpen(true); 
    fetchDocuments(inquiry._id);
  };

  const handleCloseInquiryModal = () => {
    setIsInquiryModalOpen(false);
    setTimeout(() => {
      setSelectedInquiry(null); setDocuments([]); setShowDeliverDocs(false);
      setDeliveryFiles([]); setShowContactRemarks(false); setContactRemarks(""); setContactEvidence(null);
    }, 200);
  };

  const handleUpdateInquiryStatus = async (inquiryId, newStatus) => {
    if (!window.confirm(`Set status to ${newStatus}?`)) return;
    try {
      const response = await axios.put(`http://localhost:5000/api/inquiries/${inquiryId}/status`, { status: newStatus });
      if (response.data.success) {
        alert('Status updated successfully!'); fetchInquiries();
        if (selectedInquiry && selectedInquiry._id === inquiryId) setSelectedInquiry({ ...selectedInquiry, status: newStatus });
      }
    } catch (error) { console.error(error); alert('Failed to update status'); }
  };

  const handleRequestPayment = async () => {
    if (!window.confirm("Request payment from user?")) return;
    try {
      const response = await axios.put(`http://localhost:5000/api/inquiries/${selectedInquiry._id}/status`, { status: 'PAYMENT_PENDING' });
      if (response.data.success) {
        alert('Payment requested!'); fetchInquiries();
        setSelectedInquiry({ ...selectedInquiry, status: 'PAYMENT_PENDING' });
      }
    } catch (error) { console.error(error); alert('Failed to request payment'); }
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
        alert('Status updated to CONTACTED!'); fetchInquiries();
        setSelectedInquiry({ ...selectedInquiry, status: 'CONTACTED' });
        setShowContactRemarks(false); setContactRemarks(""); setContactEvidence(null);
      }
    } catch (error) { console.error(error); alert('Failed to update status'); }
  };

  const handleConfirmPayment = async () => {
    if (!window.confirm("Confirm payment received?")) return;
    try {
      const response = await axios.put(`http://localhost:5000/api/inquiries/${selectedInquiry._id}/confirm-payment`, { adminName: 'Admin' });
      if (response.data.success) {
        alert('Payment confirmed!'); fetchInquiries();
        setSelectedInquiry({ ...selectedInquiry, status: 'CONFIRMED' });
      }
    } catch (error) { console.error(error); alert('Failed to confirm payment'); }
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
    setIsCENOMARFormsOpen(false); setIsAddFormOpen(true); setIsEditorOpen(false); setSelectedCENOMAR(null);
    setNewCENOMARForm({ documentType: "", desc: "", price: "" });
    setRequirements([]); setDownloadForms([]); setStepsProcess([]);
    setAccordionState({ requirements: true, downloadForms: false, stepsProcess: false });
  };

  const handleEditCENOMAR = (cenomar) => {
    setIsCENOMARFormsOpen(false); setIsAddFormOpen(true); setIsEditorOpen(true); setSelectedCENOMAR(cenomar);
    setNewCENOMARForm({ documentType: cenomar.documentType, desc: cenomar.description || cenomar.desc, price: cenomar.price });
    setRequirements(cenomar.requirements || []); setDownloadForms(cenomar.downloadableForms || []); setStepsProcess(cenomar.processSteps || []);
  };

  const handleDeleteCENOMAR = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try { await axios.delete(`http://localhost:5000/api/cenomar/${id}`); fetchCENOMARDocs(); } 
    catch(err) { console.error(err); alert("Failed to delete"); }
  };

  const handleSaveChanges = async () => {
    const payload = {
      documentType: newCENOMARForm.documentType, description: newCENOMARForm.desc, price: parseFloat(newCENOMARForm.price),
      requirements, downloadableForms: downloadForms, processSteps: stepsProcess
    };
    try {
      if (isEditorOpen && selectedCENOMAR) await axios.put(`http://localhost:5000/api/cenomar/${selectedCENOMAR._id}`, payload);
      else await axios.post(`http://localhost:5000/api/cenomar`, payload);
      alert("Service saved!"); setIsAddFormOpen(false); setIsCENOMARFormsOpen(true); fetchCENOMARDocs();
    } catch (err) { console.error(err); alert("Failed to save"); }
  };

  // --- CMS HELPERS ---
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
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData);
      if (res.data.success) setDownloadForms([...downloadForms, { id: Date.now(), name: file.name, url: res.data.fileUrl }]);
    } catch(err) { console.error(err); alert("Upload failed"); }
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

          <div className="cenomar-stats-grid">
            {stats.map((s, i) => (
              <div className="cenomar-card" key={i}>
                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                <div className="cenomar-card-icon">{s.icon}</div>
              </div>
            ))}
          </div>
          
          <div className="search-filter-card">
              <div className="search-filter-wrapper">
                  <div className="search-box">
                      <Search size={20} className="search-icon" />
                      <input
                          type="text"
                          className="search-input"
                          placeholder="Search by Requester, Ref No..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <div className="filter-buttons">
                      {statusOptions.map(status => (
                          <button
                              key={status}
                              className={`filter-btn ${filterStatus === status ? getFilterClassName(status) : ''}`}
                              onClick={() => setFilterStatus(status)}
                          >
                              {status === 'ALL' ? 'All Active' : status.replace('_', ' ')}
                          </button>
                      ))}
                  </div>
              </div>
          </div>

          <div className="cenomar-table-container">
            <table className="cenomar-table">
              <thead>
                <tr>
                  <th>Ref No.</th>
                  <th>Requester</th>
                  <th>Document</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentInquiries.length === 0 ? (
                  <tr><td colSpan="5" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>{isLoading ? 'Loading...' : 'No active CENOMAR requests found'}</td></tr>
                ) : (
                  currentInquiries.map((row) => (
                    <tr key={row._id}>
                      <td style={{ fontWeight: "700" }}>{row._id.slice(-6).toUpperCase()}</td>
                      <td>{row.fullName}</td>
                      <td><span className="doc-badge">CNM</span>{row.cenomarDocument || row.serviceName}</td>
                      <td><span className={`cenomar-badge badge-${(row.status || 'PENDING').toLowerCase()}`}>{row.status || 'PENDING'}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="cenomar-action-btn cenomar-view-btn" onClick={() => handleViewInquiry(row)}>View</button>
                            <button 
                                className="cenomar-action-btn" 
                                style={{ backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => handleArchiveInquiry(row._id)}
                            >
                                <Archive size={14} /> Archive
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <Pagination
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>

      <CenomarApplicationModal 
            isOpen={isApplicationModalOpen}
            onClose={() => setIsApplicationModalOpen(false)}
            refreshData={fetchInquiries}
            cenomarDocs={cenomarDocs}
      />

      {/* MODALS */}
      {isInquiryModalOpen && selectedInquiry && (
        <InquiryModal 
          inquiry={selectedInquiry}
          documents={documents}
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
          onClose={() => { setShowContactRemarks(false); setContactRemarks(""); setContactEvidence(null); }}
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
          form={newCENOMARForm} setForm={setNewCENOMARForm}
          requirements={requirements}
          steps={stepsProcess}
          downloads={downloadForms}
          accordionState={accordionState}
          toggleAccordion={toggleAccordion}
          addCategory={addCategory} removeCategory={removeCategory} handleCategoryTitleChange={handleCategoryTitleChange}
          addRequirement={addRequirement} removeRequirement={removeRequirement} handleLabelChange={handleLabelChange}
          addStep={addStep} removeStep={removeStep} handleStepChange={handleStepChange}
          handleDirectFileUpload={handleDirectFileUpload} removeDownloadForm={removeDownloadForm}
          onSave={handleSaveChanges}
          onClose={() => { setIsAddFormOpen(false); setIsCENOMARFormsOpen(true); }}
        />
      )}
    </div>
  );
};

export default CenomarRequest;