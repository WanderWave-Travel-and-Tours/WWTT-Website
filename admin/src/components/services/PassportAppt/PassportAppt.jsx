import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Sidebar from '../../sidebar/sidebar';
import {
    BookOpen, Calendar, CheckCircle, RotateCcw,
    FileText, Settings, RefreshCw, X, CreditCard, User,
    ChevronDown, Trash2, PlusCircle, Save, ClipboardList, ListPlus, Download,
    ChevronLeft, ChevronRight, Search // Added Search for search bar
} from 'lucide-react';
import './PassportAppt.css';

const PassportAppt = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('appointments');

    const [showContactRemarks, setShowContactRemarks] = useState(false);
    const [contactRemarks, setContactRemarks] = useState("");
    const [contactEvidence, setContactEvidence] = useState(null);

    const [appointments, setAppointments] = useState([]);
    const [passportData, setPassportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [documents, setDocuments] = useState([]);

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorData, setEditorData] = useState({
        requirements: [],
        additionalDocuments: [],
        stepsProcess: []
    });
    const [accordionState, setAccordionState] = useState({
        requirements: false,
        additionalDocs: false,
        stepsProcess: false
    });

    // --- SEARCH AND FILTER STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // Default to 'ALL'
    // --- END SEARCH AND FILTER STATE ---

    // --- FILTERING LOGIC (Use useMemo for efficient filtering) ---
    const filteredAppointments = useMemo(() => {
        let filtered = appointments;

        // 1. Filter by Status
        if (filterStatus !== 'ALL') {
            filtered = filtered.filter(appt => appt.status === filterStatus);
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(appt => 
                appt.fullName.toLowerCase().includes(lowerCaseSearch) ||
                appt.email.toLowerCase().includes(lowerCaseSearch) ||
                appt._id.toLowerCase().includes(lowerCaseSearch) ||
                (appt.passportDetails?.dfaLocation || '').toLowerCase().includes(lowerCaseSearch)
            );
        }
        
        return filtered;
    }, [appointments, filterStatus, searchTerm]);
    // --- END FILTERING LOGIC ---


    // --- PAGINATION STATE & LOGIC (Updated to use filteredAppointments) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAppointments = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    
    // Reset page to 1 whenever filters or search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, searchTerm]);
    // --- END PAGINATION LOGIC ---

    // Helper to toggle sidebar state
    const toggleSidebar = () => {
        setSidebarCollapsed(!isSidebarCollapsed);
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getStatusRank = (status) => {
        switch(status) {
            case 'PENDING': return 1;
            case 'CONTACTED': return 2;
            case 'PAYMENT_PENDING': return 3;
            case 'PAID': return 4;
            case 'COMPLETED': return 5;
            default: return 0;
        }
    };

    const fetchPassportDetails = async () => {
        try {
            const res = await axios.get('https://wanderwaveph-backend.onrender.com/api/passports');
            if (res.data.success && res.data.data.length > 0) {
                const data = res.data.data[0];
                setPassportData(data);
                setEditorData({
                    requirements: data.requirements || [],
                    additionalDocuments: data.additionalDocuments || [],
                    stepsProcess: data.stepsProcess || []
                });
            }
        } catch (error) {
            console.error("Error fetching passport details:", error);
        }
    };

    const fetchInquiries = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('https://wanderwaveph-backend.onrender.com/api/inquiries');
            if (response.data.success) {
                const passportRequests = response.data.data.filter(inq =>
                    inq.inquiryType === 'PASSPORT' ||
                    (inq.serviceName && inq.serviceName.toUpperCase().includes('PASSPORT'))
                );
                passportRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setAppointments(passportRequests);
                setCurrentPage(1); // Reset to first page after fetching new data
            }
        } catch (error) {
            console.error('Error fetching inquiries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDocuments = async (inquiryId) => {
        try {
            const response = await axios.get(`https://wanderwaveph-backend.onrender.com/api/documents/inquiry/${inquiryId}`);
            if (response.data.success) {
                setDocuments(response.data.documents || []);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            setDocuments([]);
        }
    };

    useEffect(() => {
        fetchPassportDetails();
        fetchInquiries();
    }, []);

    const initiateContactStatus = () => {
        setShowContactRemarks(true);
    };

    const submitContactWithRemarks = async () => {
        if (!selectedAppointment) return;
        try {
            const formData = new FormData();
            formData.append('status', 'CONTACTED');
            formData.append('remarks', contactRemarks);
            if (contactEvidence) formData.append('evidence', contactEvidence);

            const response = await axios.put(
                `https://wanderwaveph-backend.onrender.com/api/inquiries/${selectedAppointment._id}/status`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (response.data.success) {
                alert('Status updated to CONTACTED with remarks!');
                fetchInquiries();
                setSelectedAppointment({
                    ...selectedAppointment,
                    status: 'CONTACTED',
                    remarks: contactRemarks,
                    evidenceUrl: response.data.data.evidenceUrl
                });
                setShowContactRemarks(false);
                setContactRemarks("");
                setContactEvidence(null);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handleViewAppointment = async (appt) => {
        setSelectedAppointment(appt);
        await fetchDocuments(appt._id);
        setIsViewModalOpen(true);
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const response = await axios.put(`https://wanderwaveph-backend.onrender.com/api/inquiries/${id}/status`, { status: newStatus });
            if (response.data.success) {
                alert(`Status updated to ${newStatus}`);
                fetchInquiries();
                if (selectedAppointment && selectedAppointment._id === id) {
                    setSelectedAppointment({ ...selectedAppointment, status: newStatus });
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    // Editor Logic handlers removed for brevity, assume they are same as before...
    const toggleAccordion = (section) => setAccordionState(prev => ({ ...prev, [section]: !prev[section] }));
    const handleReqTitleChange = (idx, val) => { const newReqs = [...editorData.requirements]; newReqs[idx].title = val; setEditorData({ ...editorData, requirements: newReqs }); };
    const handleReqItemChange = (catIdx, itemIdx, val) => { const newReqs = [...editorData.requirements]; newReqs[catIdx].items[itemIdx] = val; setEditorData({ ...editorData, requirements: newReqs }); };
    const addReqItem = (catIdx) => { const newReqs = [...editorData.requirements]; newReqs[catIdx].items.push(""); setEditorData({ ...editorData, requirements: newReqs }); };
    const removeReqItem = (catIdx, itemIdx) => { const newReqs = [...editorData.requirements]; newReqs[catIdx].items.splice(itemIdx, 1); setEditorData({ ...editorData, requirements: newReqs }); };
    const addReqCategory = () => { setEditorData({ ...editorData, requirements: [...editorData.requirements, { title: "New Requirements Section", items: [""] }] }); };
    const removeReqCategory = (idx) => { const newReqs = [...editorData.requirements]; newReqs.splice(idx, 1); setEditorData({ ...editorData, requirements: newReqs }); };
    const handleAddDocTitleChange = (idx, val) => { const newDocs = [...editorData.additionalDocuments]; newDocs[idx].title = val; setEditorData({ ...editorData, additionalDocuments: newDocs }); };
    const handleAddDocItemChange = (catIdx, itemIdx, val) => { const newDocs = [...editorData.additionalDocuments]; newDocs[catIdx].items[itemIdx] = val; setEditorData({ ...editorData, additionalDocuments: newDocs }); };
    const addAddDocItem = (catIdx) => { const newDocs = [...editorData.additionalDocuments]; newDocs[catIdx].items.push(""); setEditorData({ ...editorData, additionalDocuments: newDocs }); };
    const removeAddDocItem = (catIdx, itemIdx) => { const newDocs = [...editorData.additionalDocuments]; newDocs[catIdx].items.splice(itemIdx, 1); setEditorData({ ...editorData, additionalDocuments: newDocs }); };
    const addAddDocCategory = () => { setEditorData({ ...editorData, additionalDocuments: [...editorData.additionalDocuments, { title: "New Special Case", items: [""] }] }); };
    const removeAddDocCategory = (idx) => { const newDocs = [...editorData.additionalDocuments]; newDocs.splice(idx, 1); setEditorData({ ...editorData, additionalDocuments: newDocs }); };
    const handleStepChange = (idx, val) => { const newSteps = [...editorData.stepsProcess]; newSteps[idx] = val; setEditorData({ ...editorData, stepsProcess: newSteps }); };
    const addStep = () => { setEditorData({ ...editorData, stepsProcess: [...editorData.stepsProcess, ""] }); };
    const removeStep = (idx) => { const newSteps = [...editorData.stepsProcess]; newSteps.splice(idx, 1); setEditorData({ ...editorData, stepsProcess: newSteps }); };

    const handleSaveChanges = async () => {
        if (!passportData || !passportData._id) return;
        try {
            const cleanedData = {
                ...passportData,
                requirements: editorData.requirements.map(cat => ({ ...cat, items: cat.items.filter(i => i.trim() !== "") })),
                additionalDocuments: editorData.additionalDocuments.map(cat => ({ ...cat, items: cat.items.filter(i => i.trim() !== "") })),
                stepsProcess: editorData.stepsProcess.filter(s => s.trim() !== "")
            };
            const res = await axios.put(`https://wanderwaveph-backend.onrender.com/api/passports/${passportData._id}`, cleanedData);
            if (res.data.success) {
                setPassportData(res.data.data);
                alert("Requirements updated successfully!");
                setIsEditorOpen(false);
            }
        } catch (error) {
            console.error("Error saving passport details:", error);
            alert("Failed to save changes.");
        }
    };

    const getStatusBadgeClass = (status) => {
        switch(status) {
            case 'PAID': return 'badge-paid';
            case 'COMPLETED': return 'badge-completed';
            case 'CANCELLED': return 'badge-cancelled';
            case 'CONTACTED': return 'badge-contacted';
            case 'PAYMENT_PENDING': return 'badge-payment-pending';
            default: return 'badge-pending';
        }
    };

    // Calculate stats based on ALL fetched appointments, not filtered ones
    const stats = [
        { label: 'Total Appts', value: appointments.length, icon: <BookOpen size={24}/> },
        { label: 'Pending', value: appointments.filter(a => a.status === 'PENDING').length, icon: <Calendar size={24}/> },
        { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length, icon: <CheckCircle size={24}/> },
        { label: 'Cancelled', value: appointments.filter(a => a.status === 'CANCELLED').length, icon: <RotateCcw size={24}/> },
    ];
    
    // Define the list of unique status filters
    const statusFilters = useMemo(() => {
        const statuses = new Set(appointments.map(a => a.status));
        return ['ALL', ...Array.from(statuses)].filter(s => s); // Ensure 'ALL' is first and no empty strings
    }, [appointments]);


    const currentStatusRank = selectedAppointment ? getStatusRank(selectedAppointment.status) : 0;

    // Logic to render pagination numbers
    const renderPaginationNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5; // Adjust this number as needed
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <li key={i}>
                    <button
                        onClick={() => paginate(i)}
                        className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
                    >
                        {i}
                    </button>
                </li>
            );
        }
        return pageNumbers;
    };


    return (
        <div className="passport-page">
                   <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
        <main
          className={`passport-main ${
            // FIX: Changed "passport-main--collapsed" to "expanded"
            isSidebarCollapsed ? "expanded" : ""
          }`}
        >
                <div className="passport-container">
                    <div className="passport-header">
                        <div className="passport-title">
                            <h1>Passport Appointment</h1>
                            <p>DFA Slot Management & Assistance</p>
                        </div>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <button onClick={() => setActiveTab('appointments')} className={`passport-btn-add ${activeTab !== 'appointments' ? 'secondary' : ''}`} style={{backgroundColor: activeTab === 'appointments' ? '#3b82f6' : 'white', color: activeTab === 'appointments' ? 'white' : '#64748b', border: activeTab !== 'appointments' ? '1px solid #e2e8f0' : 'none'}}>
                                <Calendar size={18} style={{marginRight:'8px'}}/> Appointments
                            </button>
                            <button onClick={() => setActiveTab('details')} className={`passport-btn-add ${activeTab !== 'details' ? 'secondary' : ''}`} style={{backgroundColor: activeTab === 'details' ? '#3b82f6' : 'white', color: activeTab === 'details' ? 'white' : '#64748b', border: activeTab !== 'details' ? '1px solid #e2e8f0' : 'none'}}>
                                <FileText size={18} style={{marginRight:'8px'}}/> Requirements
                            </button>
                        </div>
                    </div>

                    {activeTab === 'appointments' && (
                        <>
                            <div className="passport-stats-grid">
                                {stats.map((s, i) => (<div className="passport-card" key={i}><div><h2>{s.value}</h2><span>{s.label}</span></div><div className="passport-card-icon">{s.icon}</div></div>))}
                            </div>

                            {/* --- SEARCH AND FILTER CARD --- */}
                            <div className="search-filter-card">
                                <div className="search-filter-wrapper">
                                    <div className="search-box">
                                        <Search size={20} className="search-icon" />
                                        <input
                                            type="text"
                                            placeholder="Search by Applicant Name, Email, DFA Location, or Ref ID..."
                                            className="search-input"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="filter-buttons">
                                        {statusFilters.map((status) => (
                                            <button
                                                key={status}
                                                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                                                onClick={() => setFilterStatus(status)}
                                            >
                                                {status.toUpperCase()} ({status === 'ALL' ? appointments.length : appointments.filter(a => a.status === status).length})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* --- END SEARCH AND FILTER CARD --- */}


                            <div className="passport-table-container">
                                <div style={{padding: '15px', borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <span style={{fontSize:'12px', color:'#64748b', fontWeight:'600'}}>
                                        Showing {Math.min(indexOfFirstItem + 1, filteredAppointments.length)} - {Math.min(indexOfLastItem, filteredAppointments.length)} of {filteredAppointments.length} appointments
                                    </span>
                                    <button onClick={fetchInquiries} style={{background:'none', border:'none', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <RefreshCw size={14}/> Refresh List
                                    </button>
                                </div>
                                {isLoading ? (
                                    <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>Loading appointments...</div>
                                ) : (
                                    <>
                                    <table className="passport-table">
                                        <thead>
                                            <tr>
                                                <th>Ref ID</th><th>Applicant</th><th>Type</th><th>DFA Site</th><th>Target Date</th><th>Status</th><th style={{textAlign:'right'}}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentAppointments.length > 0 ? currentAppointments.map((item) => (
                                                <tr key={item._id}>
                                                    <td style={{fontWeight:'700', color:'#0f172a'}}>#{item._id.substring(item._id.length - 6).toUpperCase()}</td>
                                                    <td><div style={{display:'flex', alignItems:'center', gap:'10px'}}><div style={{background:'#eff6ff', padding:'8px', borderRadius:'50%', color:'#3b82f6'}}><User size={16}/></div><div>{item.fullName}<br/><span style={{fontSize:'11px', color:'#94a3b8'}}>{item.email}</span></div></div></td>
                                                    <td>{item.passportDetails?.applicationType || 'NEW'}<br/><span style={{fontSize:'11px', color:'#64748b'}}>{item.passportDetails?.processingType || 'REGULAR'}</span></td>
                                                    <td>{item.passportDetails?.dfaLocation || 'TBD'}</td>
                                                    <td>{item.passportDetails?.appointmentDate || 'TBD'}</td>
                                                    <td><span className={`visa-badge ${getStatusBadgeClass(item.status)}`}>{item.status}</span></td>
                                                    <td style={{textAlign:'right'}}>
                                                        <button className="passport-action-btn" onClick={() => handleViewAppointment(item)}>View</button>
                                                    </td>
                                                </tr>
                                            )) : (<tr><td colSpan="7" style={{textAlign:'center', padding:'30px', color:'#64748b'}}>No Passport appointments found matching your criteria.</td></tr>)}
                                        </tbody>
                                    </table>
                                    {/* --- PAGINATION NAV --- */}
                                    {totalPages > 1 && (
                                        <nav className="pagination-nav" aria-label="Pagination">
                                            <ul className="pagination-list">
                                                <li>
                                                    <button
                                                        onClick={goToPrevPage}
                                                        disabled={currentPage === 1}
                                                        className="pagination-btn"
                                                    >
                                                        <ChevronLeft size={16} /> Prev
                                                    </button>
                                                </li>
                                                {renderPaginationNumbers()}
                                                <li>
                                                    <button
                                                        onClick={goToNextPage}
                                                        disabled={currentPage === totalPages}
                                                        className="pagination-btn"
                                                    >
                                                        Next <ChevronRight size={16} />
                                                    </button>
                                                </li>
                                            </ul>
                                        </nav>
                                    )}
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'details' && passportData && (
                        <div className="passport-details-container" style={{background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                            {/* Editor UI Removed for brevity - same as before */}
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                                <h2>Service Requirements Configuration</h2>
                                <button className="passport-action-btn" onClick={() => setIsEditorOpen(true)}><Settings size={14} style={{marginRight: '5px'}}/> Edit Requirements</button>
                            </div>
                            <div style={{marginBottom: '30px'}}>
                                <h3 style={{color: '#0f172a', fontSize: '16px', fontWeight: '800', marginBottom: '15px', textTransform:'uppercase'}}>Primary Requirements</h3>
                                {passportData.requirements.map((req, idx) => (<div key={idx} style={{marginBottom:'15px'}}><h4 style={{fontSize:'14px', margin:'0 0 5px 0', color:'#334155'}}>{req.title}</h4><ul style={{paddingLeft: '20px', color: '#64748b', fontSize:'13px', lineHeight: '1.6'}}>{req.items.map((item, i) => (<li key={i}>{item}</li>))}</ul></div>))}
                            </div>
                            <div style={{marginBottom: '30px'}}>
                                <h3 style={{color: '#0f172a', fontSize: '16px', fontWeight: '800', marginBottom: '15px', textTransform:'uppercase'}}>Additional Documents (Special Cases)</h3>
                                {passportData.additionalDocuments.map((doc, idx) => (<div key={idx} style={{marginBottom:'15px'}}><h4 style={{fontSize:'14px', margin:'0 0 5px 0', color:'#334155'}}>{doc.title}</h4><ul style={{paddingLeft: '20px', color: '#64748b', fontSize:'13px', lineHeight: '1.6'}}>{doc.items.map((item, i) => (<li key={i}>{item}</li>))}</ul></div>))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* EDITOR MODAL COMPONENT (Hidden for brevity) */}
            {isEditorOpen && (
               <div className="modal-overlay">
                   {/* ... Editor Content ... */}
                   <div className="modal-content modal-content-large">
                        <div className="modal-header">
                            <div><h2 style={{margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a"}}>EDIT PASSPORT REQUIREMENTS</h2><p style={{margin: "4px 0 0 0", color: "#64748b", fontSize: "13px"}}>Manage the checklist for passport applicants</p></div>
                            <button className="modal-close-btn" onClick={() => setIsEditorOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body bg-gray">
                            <div className="accordion-section"><button className={`accordion-header ${accordionState.requirements ? 'active' : ''}`} onClick={() => toggleAccordion('requirements')}><span className="accordion-title"><FileText size={18} style={{marginRight:'8px', color:'#f97316'}}/> Primary Requirements</span><ChevronDown size={20} className={`accordion-chevron ${accordionState.requirements ? 'rotate' : ''}`}/></button>{accordionState.requirements && (<div className="accordion-content">{editorData.requirements.map((cat, catIdx) => (<div key={catIdx} className="req-category"><div className="req-category-header"><input type="text" className="req-header-input" value={cat.title} onChange={(e) => handleReqTitleChange(catIdx, e.target.value)} placeholder="SECTION TITLE" /><button className="req-header-delete-btn" onClick={() => removeReqCategory(catIdx)}><Trash2 size={16}/></button></div><div className="req-list">{cat.items.map((item, itemIdx) => (<div key={itemIdx} className="req-item-editable"><input type="text" className="req-input-text" value={item} onChange={(e) => handleReqItemChange(catIdx, itemIdx, e.target.value)} placeholder="Enter requirement..." /><button className="req-delete-btn" onClick={() => removeReqItem(catIdx, itemIdx)}><Trash2 size={16}/></button></div>))}</div><div className="req-category-footer"><button className="req-add-btn" onClick={() => addReqItem(catIdx)}><PlusCircle size={16}/> Add Item</button></div></div>))}<button className="req-add-group-btn" onClick={addReqCategory}><ListPlus size={20}/> Add New Section</button></div>)}</div>
                            <div className="accordion-section"><button className={`accordion-header ${accordionState.additionalDocs ? 'active' : ''}`} onClick={() => toggleAccordion('additionalDocs')}><span className="accordion-title"><FileText size={18} style={{marginRight:'8px', color:'#f97316'}}/> Additional Documents (Special Cases)</span><ChevronDown size={20} className={`accordion-chevron ${accordionState.additionalDocs ? 'rotate' : ''}`}/></button>{accordionState.additionalDocs && (<div className="accordion-content">{editorData.additionalDocuments.map((cat, catIdx) => (<div key={catIdx} className="req-category"><div className="req-category-header"><input type="text" className="req-header-input" value={cat.title} onChange={(e) => handleAddDocTitleChange(catIdx, e.target.value)} placeholder="CASE TITLE" /><button className="req-header-delete-btn" onClick={() => removeAddDocCategory(catIdx)}><Trash2 size={16}/></button></div><div className="req-list">{cat.items.map((item, itemIdx) => (<div key={itemIdx} className="req-item-editable"><input type="text" className="req-input-text" value={item} onChange={(e) => handleAddDocItemChange(catIdx, itemIdx, e.target.value)} placeholder="Enter additional doc..." /><button className="req-delete-btn" onClick={() => removeAddDocItem(catIdx, itemIdx)}><Trash2 size={16}/></button></div>))}</div><div className="req-category-footer"><button className="req-add-btn" onClick={() => addAddDocItem(catIdx)}><PlusCircle size={16}/> Add Item</button></div></div>))}<button className="req-add-group-btn" onClick={addAddDocCategory}><ListPlus size={20}/> Add New Case</button></div>)}</div>
                            <div className="accordion-section"><button className={`accordion-header ${accordionState.stepsProcess ? 'active' : ''}`} onClick={() => toggleAccordion('stepsProcess')}><span className="accordion-title"><ClipboardList size={18} style={{marginRight:'8px', color:'#f97316'}}/> Steps and Process</span><ChevronDown size={20} className={`accordion-chevron ${accordionState.stepsProcess ? 'rotate' : ''}`}/></button>{accordionState.stepsProcess && (<div className="accordion-content"><div className="simple-list">{editorData.stepsProcess.map((step, idx) => (<div key={idx} className="step-item-editable"><span className="step-number-badge">{idx + 1}</span><input type="text" className="req-input-text" value={step} onChange={(e) => handleStepChange(idx, e.target.value)} placeholder="Enter process step..." /><button className="req-delete-btn" onClick={() => removeStep(idx)}><Trash2 size={18}/></button></div>))}</div><button className="req-add-btn" onClick={addStep} style={{marginTop:'15px'}}><ClipboardList size={16}/> Add Step</button></div>)}</div>
                        </div>
                        <div className="modal-footer"><button className="modal-cancel-btn" onClick={() => setIsEditorOpen(false)}>Cancel</button><button className="modal-save-btn" onClick={handleSaveChanges}><Save size={18}/> Save Changes</button></div>
                    </div>
               </div>
            )}

            {isViewModalOpen && selectedAppointment && (
                <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') setIsViewModalOpen(false) }}>
                    <div className="modal-content modal-content-large">
                        <div className="modal-header">
                            <div><h2 style={{margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a"}}>APPOINTMENT DETAILS</h2><p style={{margin: "4px 0 0 0", color: "#64748b", fontSize: "13px"}}>Ref: {selectedAppointment._id.toUpperCase()}</p></div>
                            <button className="modal-close-btn" onClick={() => setIsViewModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border:'1px solid #e2e8f0' }}>
                                <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'15px', color:'#334155'}}>CLIENT INFORMATION</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div><label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>FULL NAME</label><p style={{margin:'4px 0 0', fontWeight:'600', color:'#0f172a'}}>{selectedAppointment.fullName}</p></div>
                                    <div><label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>EMAIL</label><p style={{margin:'4px 0 0', fontWeight:'600', color:'#0f172a'}}>{selectedAppointment.email}</p></div>
                                    <div><label style={{fontSize:'11px', color:'#64748b', fontWeight:'600'}}>SERVICE FEE</label><p style={{margin:'4px 0 0', fontWeight:'600', color:'#059669'}}>₱{selectedAppointment.estimatedPrice?.toLocaleString()}</p></div>
                                </div>
                            </div>

                            {/* --- GROUP APPLICANTS LIST (ONE BLOCK ONLY) --- */}
                            {selectedAppointment.passportDetails?.applicants?.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>
                                        APPLICANT DETAILS ({selectedAppointment.passportDetails.applicants.length} Pax)
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {selectedAppointment.passportDetails.applicants.map((applicant, index) => (
                                            <div key={index} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                                {/* Header ng Applicant Card */}
                                                <div style={{ background: '#f8fafc', padding: '10px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#334155' }}>
                                                        #{index + 1} - {applicant.lastName}, {applicant.firstName}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                                                        {applicant.civilStatus}
                                                    </span>
                                                </div>

                                                {/* Details Body */}
                                                <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div>
                                                        <label style={{fontSize:'10px', color:'#94a3b8', fontWeight:'600', display:'block'}}>FULL NAME</label>
                                                        <span style={{fontSize:'12px', fontWeight:'500', color:'#0f172a'}}>
                                                            {applicant.firstName} {applicant.middleName} {applicant.lastName}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <label style={{fontSize:'10px', color:'#94a3b8', fontWeight:'600', display:'block'}}>BIRTH DETAILS</label>
                                                        <span style={{fontSize:'12px', fontWeight:'500', color:'#0f172a'}}>
                                                            {applicant.dateOfBirth} • {applicant.placeOfBirth}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <label style={{fontSize:'10px', color:'#94a3b8', fontWeight:'600', display:'block'}}>CONTACT</label>
                                                        <span style={{fontSize:'12px', fontWeight:'500', color:'#0f172a'}}>
                                                            {applicant.mobile} <br/> {applicant.email}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <label style={{fontSize:'10px', color:'#94a3b8', fontWeight:'600', display:'block'}}>PARENTS</label>
                                                        <span style={{fontSize:'12px', fontWeight:'500', color:'#0f172a'}}>
                                                            F: {applicant.fatherName || 'N/A'} <br/>
                                                            M: {applicant.motherMaidenName || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- DOCUMENTS SECTION --- */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>SUBMITTED DOCUMENTS ({documents.length})</h3>
                                {documents.length === 0 ? (
                                    <p style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontStyle: 'italic', background:'#f8fafc', borderRadius:'8px', border:'1px dashed #e2e8f0' }}>No documents uploaded yet.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {Object.entries(documents.reduce((acc, doc) => { const section = doc.section || 'General Documents'; if (!acc[section]) acc[section] = []; acc[section].push(doc); return acc; }, {})).map(([section, docs]) => (
                                            <div key={section} style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
                                                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', textTransform:'uppercase' }}>📁 {section} ({docs.length})</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {docs.map((doc) => (
                                                        <div key={doc._id} style={{ background: 'white', padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                                <span style={{ fontSize: '24px' }}>{doc.fileType?.includes('pdf') ? '📄' : doc.fileType?.includes('image') ? '🖼️' : '📎'}</span>
                                                                <div><p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>{doc.originalName}</p><p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{formatFileSize(doc.fileSize)} • {new Date(doc.uploadDate).toLocaleDateString()}</p></div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <a href={`https://wanderwaveph-backend.onrender.com${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="passport-action-btn" style={{ fontSize: '11px', padding: '6px 12px', textDecoration:'none' }}>View</a>
                                                                <a href={`https://wanderwaveph-backend.onrender.com${doc.fileUrl}`} download={doc.originalName} className="passport-action-btn" style={{ fontSize: '11px', padding: '6px 12px', textDecoration:'none' }}><Download size={12}/></a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{marginTop: '20px'}}>
                                <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'15px', color:'#334155'}}>UPDATE STATUS</h3>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                        className="passport-action-btn"
                                        onClick={() => handleUpdateStatus(selectedAppointment._id, 'PENDING')}
                                        disabled={currentStatusRank >= 1}
                                        style={{
                                            opacity: currentStatusRank >= 1 ? 0.5 : 1,
                                            cursor: currentStatusRank >= 1 ? 'not-allowed' : 'pointer',
                                            background: currentStatusRank >= 1 ? '#f1f5f9' : 'white'
                                        }}
                                    >
                                        Set Pending
                                    </button>

                                    <button
                                        className="passport-action-btn"
                                        onClick={initiateContactStatus}
                                        disabled={currentStatusRank >= 2}
                                        style={{
                                            opacity: currentStatusRank >= 2 ? 0.5 : 1,
                                            cursor: currentStatusRank >= 2 ? 'not-allowed' : 'pointer',
                                            background: currentStatusRank >= 2 ? '#f1f5f9' : 'white'
                                        }}
                                    >
                                        Set Contacted
                                    </button>

                                    <button
                                        className="passport-action-btn"
                                        onClick={() => handleUpdateStatus(selectedAppointment._id, 'PAYMENT_PENDING')}
                                        disabled={currentStatusRank >= 3}
                                        style={{
                                            background: currentStatusRank >= 3 ? '#f1f5f9' : '#dcfce7',
                                            color: currentStatusRank >= 3 ? '#94a3b8' : '#15803d',
                                            border: currentStatusRank >= 3 ? '1px solid #e2e8f0' : '1px solid #86efac',
                                            opacity: currentStatusRank >= 3 ? 0.5 : 1,
                                            cursor: currentStatusRank >= 3 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Approve & Payment
                                    </button>

                                    <button
                                        className="passport-action-btn"
                                        onClick={() => handleUpdateStatus(selectedAppointment._id, 'COMPLETED')}
                                        disabled={currentStatusRank >= 5}
                                        style={{
                                            background: currentStatusRank >= 5 ? '#f1f5f9' : '#3b82f6',
                                            color: currentStatusRank >= 5 ? '#94a3b8' : 'white',
                                            border: 'none',
                                            opacity: currentStatusRank >= 5 ? 0.5 : 1,
                                            cursor: currentStatusRank >= 5 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Mark Completed
                                    </button>

                                    <button
                                        className="passport-action-btn"
                                        onClick={() => handleUpdateStatus(selectedAppointment._id, 'CANCELLED')}
                                        disabled={selectedAppointment.status === 'CANCELLED'}
                                        style={{
                                            background: selectedAppointment.status === 'CANCELLED' ? '#f1f5f9' : '#ef4444',
                                            color: selectedAppointment.status === 'CANCELLED' ? '#94a3b8' : 'white',
                                            border: 'none',
                                            opacity: selectedAppointment.status === 'CANCELLED' ? 0.5 : 1,
                                            cursor: selectedAppointment.status === 'CANCELLED' ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Cancel Appt
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showContactRemarks && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: '500px', height: 'auto', padding: '0' }}>
                        <div className="modal-header">
                            <div><h2 style={{margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a"}}>ADD REMARKS & EVIDENCE</h2><p style={{margin: "4px 0 0 0", color: "#64748b", fontSize: "13px"}}>Please provide details of the contact made.</p></div>
                            <button className="modal-close-btn" onClick={() => setShowContactRemarks(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{marginBottom: '15px'}}>
                                <label style={{display:'block', marginBottom:'8px', fontSize:'13px', fontWeight:'700', color:'#0f172a'}}>Remarks / Notes *</label>
                                <textarea rows="4" style={{ width: '100%', resize: 'none', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} value={contactRemarks} onChange={(e) => setContactRemarks(e.target.value)} placeholder="e.g. Called client, confirmed requirements. Client will submit lacking docs tomorrow..." />
                            </div>
                            <div>
                                <label style={{display:'block', marginBottom:'8px', fontSize:'13px', fontWeight:'700', color:'#0f172a'}}>Upload Evidence (Screenshot/Email)</label>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => setContactEvidence(e.target.files[0])} style={{ display: 'block', width: '100%', fontSize: '13px' }} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel-btn" onClick={() => setShowContactRemarks(false)}>Cancel</button>
                            <button className="modal-save-btn" onClick={submitContactWithRemarks}><CheckCircle size={16} style={{marginRight:'5px'}}/> Proceed & Set Contacted</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PassportAppt;