import React, { useState, useEffect } from "react";
import axios from 'axios';
import Sidebar from "../../sidebar/sidebar"; 
import { FileText, AlertTriangle, CreditCard, CheckCircle, FolderOpen } from "lucide-react";
// Import ang modals mula sa CenomarModals.jsx
import { InquiryModal, ServiceListModal, ServiceEditorModal, ContactRemarksModal } from "./CenomarModals"; 
import "./CenomarRequest.css";

const CenomarRequest = () => {
  // --- LAYOUT & MAIN DATA ---
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cenomarDocs, setCenomarDocs] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- MODAL STATES ---
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [showContactRemarks, setShowContactRemarks] = useState(false);
  const [contactRemarks, setContactRemarks] = useState("");
  const [contactEvidence, setContactEvidence] = useState(null);
  const [showDeliverDocs, setShowDeliverDocs] = useState(false);
  const [deliveryFiles, setDeliveryFiles] = useState([]);

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
        const cenomarRequests = response.data.data.filter(inq => 
          inq.cenomarDocument || (inq.serviceName && inq.serviceName.toUpperCase().includes('CENOMAR'))
        );
        setInquiries(cenomarRequests);
      }
    } catch (error) { console.error('Error fetching inquiries:', error); }
  };

  const stats = [
    { label: "Total Requests", value: inquiries.length, icon: <FileText size={24} /> },
    { label: "To Process", value: inquiries.filter(i => i.status === 'PENDING').length, icon: <AlertTriangle size={24} /> },
    { label: "Pending Payment", value: inquiries.filter(i => i.status === 'PAYMENT_PENDING').length, icon: <CreditCard size={24} /> },
    { label: "Paid/Confirming", value: inquiries.filter(i => i.status === 'PAID').length, icon: <CheckCircle size={24} /> },
  ];

  // --- INQUIRY HANDLERS ---
  const fetchDocuments = async (inquiryId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/documents/inquiry/${inquiryId}`);
      if (response.data.success) setDocuments(response.data.documents || []);
    } catch (error) { console.error('Error fetching documents:', error); setDocuments([]); }
  };

  // FIX: Open modal IMMEDIATELY, then fetch data
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

  // Sa loob ng CenomarRequest.js

// Sa loob ng CenomarRequest.js

const handleDeliverDocuments = async (e) => {
  if (e && e.preventDefault) e.preventDefault();
  if (deliveryFiles.length === 0) return alert('Select files first');

  const formData = new FormData();
  deliveryFiles.forEach(file => formData.append('documents', file));
  
  // NOTE: Siguraduhin sa backend na sine-save nito ang 'uploader': 'ADMIN'
  // formData.append('uploader', 'ADMIN'); 

  try {
    const response = await axios.put(`http://localhost:5000/api/inquiries/${selectedInquiry._id}/deliver-documents`, formData, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    });

    if (response.data.success) {
      alert('Documents sent successfully!');

      // 1. Refresh ang main table
      fetchInquiries(); 

      // 2. Update local state para maging COMPLETED agad ang itsura
      setSelectedInquiry({ ...selectedInquiry, status: 'COMPLETED' });

      // 3. ITO ANG KULANG DATI: Fetch ulit ang documents para makuha yung kakasend mo lang
      await fetchDocuments(selectedInquiry._id);

      // 4. Clear ang input selection
      setDeliveryFiles([]);
      
      // 5. Wag isara ang modal/section para makita mo yung result
      setShowDeliverDocs(true); 
    }
  } catch (error) { 
    console.error(error); 
    alert('Failed to send documents'); 
  }
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
            <div className="cenomar-title"><h1>CENOMAR Request</h1><p>Certificate of No Marriage Applications</p></div>
            <button className="cenomar-btn-add" onClick={handleManageService}><FolderOpen size={18} /> Manage Service</button>
          </div>

          <div className="cenomar-stats-grid">
            {stats.map((s, i) => (
              <div className="cenomar-card" key={i}>
                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                <div className="cenomar-card-icon">{s.icon}</div>
              </div>
            ))}
          </div>

          <div className="cenomar-table-container">
            <table className="cenomar-table">
              <thead>
                <tr><th>Ref No.</th><th>Requester</th><th>Document</th><th>Purpose</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr>
              </thead>
              <tbody>
                {inquiries.length === 0 ? (
                  <tr><td colSpan="6" style={{textAlign:'center', padding:'40px', color:'#64748b'}}>{isLoading ? 'Loading...' : 'No CENOMAR requests found'}</td></tr>
                ) : (
                  inquiries.map((row) => (
                    <tr key={row._id}>
                      <td style={{ fontWeight: "700" }}>{row._id.slice(-6).toUpperCase()}</td>
                      <td>{row.fullName}</td>
                      <td><span className="doc-badge">CNM</span>{row.cenomarDocument || row.serviceName}</td>
                      <td><div className="truncate-text">{row.message}</div></td>
                      <td><span className={`cenomar-badge badge-${(row.status || 'PENDING').toLowerCase()}`}>{row.status || 'PENDING'}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <button className="cenomar-action-btn cenomar-view-btn" onClick={() => handleViewInquiry(row)}>View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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