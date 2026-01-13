import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, X, Save, Trash2, PlusCircle, ChevronDown, Download, ClipboardList, Upload, FileText, ListPlus } from "lucide-react";
import "./VisaSettingsModal.css"; 
import { useToast } from "../../toast/ToastManager"; // Path base sa iyong instruction
import CustomConfirmModal from "../../confirmationModal/CustomConfirmModal"; 

// --- SUB COMPONENT: REQUIREMENTS EDITOR ---
const RequirementEditor = ({ selectedVisa, onBack, onSave }) => {
    const toast = useToast();
    const [requirements, setRequirements] = useState([]);
    const [downloadForms, setDownloadForms] = useState([]);
    const [stepsProcess, setStepsProcess] = useState([]);
    const [accordionState, setAccordionState] = useState({ requirements: false, downloadForms: false, stepsProcess: false });

    useEffect(() => {
        if (selectedVisa) {
            // Transform data for local editing
            const dbReqs = selectedVisa.requirements || [];
            setRequirements(dbReqs.map((cat, i) => ({
                id: `cat-${i}-${Date.now()}`,
                title: cat.title,
                items: cat.items.map((item, j) => ({ id: `item-${i}-${j}-${Date.now()}`, label: item }))
            })));

            const dbForms = Array.isArray(selectedVisa.downloadForms) ? selectedVisa.downloadForms : [];
            setDownloadForms(dbForms.map((f, i) => ({
                id: `form-${i}-${Date.now()}`,
                label: typeof f === "string" ? f : f.label || "",
                fileUrl: typeof f === "object" ? f.fileUrl : null,
                fileName: typeof f === "object" ? f.fileName : null,
            })));

            const dbSteps = Array.isArray(selectedVisa.stepsProcess) ? selectedVisa.stepsProcess : [];
            setStepsProcess(dbSteps.map((s, i) => ({ id: `step-${i}-${Date.now()}`, label: s })));
        }
    }, [selectedVisa]);

    const handleSave = () => {
        const apiRequirements = requirements.map(cat => ({
            title: cat.title,
            items: cat.items.map(i => i.label).filter(l => l.trim() !== "")
        }));
        
        const apiDownloadForms = downloadForms.map(f => ({
            label: f.label, fileUrl: f.fileUrl || null, fileName: f.fileName || null
        })).filter(f => f.label.trim() !== "");

        const apiStepsProcess = stepsProcess.map(s => s.label).filter(l => l.trim() !== "");

        onSave({ requirements: apiRequirements, downloadForms: apiDownloadForms, stepsProcess: apiStepsProcess });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post('http://localhost:5000/api/visas/upload', formData, { 
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                const { fileName, fileUrl } = res.data.data;
                setDownloadForms(prev => [...prev, { id: `form-${Date.now()}`, label: fileName, fileUrl, fileName }]);
                toast.success("File uploaded successfully!");
            }
        } catch (error) { 
            toast.error("Upload failed. Please try again."); 
        }
    };

    const toggleAccordion = (section) => setAccordionState(prev => ({ ...prev, [section]: !prev[section] }));

    // Helper functions for updating state
    const updateReqTitle = (id, val) => setRequirements(prev => prev.map(c => c.id === id ? { ...c, title: val } : c));
    const addReqCat = () => setRequirements(prev => [...prev, { id: `new-cat-${Date.now()}`, title: "NEW CATEGORY", items: [] }]);
    const removeReqCat = (id) => setRequirements(prev => prev.filter(c => c.id !== id));
    const addReqItem = (catId) => setRequirements(prev => prev.map(c => c.id === catId ? { ...c, items: [...c.items, { id: Date.now(), label: "" }] } : c));
    const updateReqItem = (catId, itemId, val) => setRequirements(prev => prev.map(c => c.id === catId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, label: val } : i) } : c));
    const removeReqItem = (catId, itemId) => setRequirements(prev => prev.map(c => c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c));

    return (
        <div className="modal-content modal-content-large">
            <div className="modal-header">
                <div>
                    <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>Edit Requirements</h2>
                    <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>Editing: {selectedVisa?.desc}</p>
                </div>
            </div>
            <div className="modal-body bg-gray">
                {/* Accordion 1: Requirements */}
                <div className="accordion-section">
                    <button className={`accordion-header ${accordionState.requirements ? "active" : ""}`} onClick={() => toggleAccordion("requirements")}>
                        <span className="accordion-title"><FileText size={18} /> Requirements List</span>
                        <ChevronDown size={20} className={`accordion-chevron ${accordionState.requirements ? "rotate" : ""}`} />
                    </button>
                    {accordionState.requirements && (
                        <div className="accordion-content">
                            {requirements.map(cat => (
                                <div key={cat.id} className="req-category">
                                    <div className="req-category-header">
                                        <input type="text" className="req-header-input" value={cat.title} onChange={(e) => updateReqTitle(cat.id, e.target.value)} />
                                        <button className="req-header-delete-btn" onClick={() => removeReqCat(cat.id)}><Trash2 size={16} /></button>
                                    </div>
                                    <div className="req-list">
                                        {cat.items.map(item => (
                                            <div key={item.id} className="req-item-editable">
                                                <input type="text" className="req-input-text" value={item.label} onChange={(e) => updateReqItem(cat.id, item.id, e.target.value)} />
                                                <button className="req-delete-btn" onClick={() => removeReqItem(cat.id, item.id)}><Trash2 size={18} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="req-category-footer">
                                        <button className="req-add-btn" onClick={() => addReqItem(cat.id)}><PlusCircle size={16} /> Add Item</button>
                                    </div>
                                </div>
                            ))}
                            <button className="req-add-group-btn" onClick={addReqCat}><ListPlus size={20} /> Add Category</button>
                        </div>
                    )}
                </div>

                {/* Accordion 2: Download Forms */}
                <div className="accordion-section">
                    <button className={`accordion-header ${accordionState.downloadForms ? "active" : ""}`} onClick={() => toggleAccordion("downloadForms")}>
                        <span className="accordion-title"><Download size={18} /> Download Forms</span>
                        <ChevronDown size={20} className={`accordion-chevron ${accordionState.downloadForms ? "rotate" : ""}`} />
                    </button>
                    {accordionState.downloadForms && (
                        <div className="accordion-content">
                            <div className="uploaded-forms-list">
                                {downloadForms.map(form => (
                                    <div key={form.id} className="uploaded-form-card">
                                        <div className="uploaded-form-info"><span className="uploaded-form-name">{form.fileName || form.label}</span></div>
                                        <button className="req-delete-btn" onClick={() => setDownloadForms(prev => prev.filter(f => f.id !== form.id))}><Trash2 size={18} /></button>
                                    </div>
                                ))}
                            </div>
                            <label className="upload-download-form-btn">
                                <Upload size={16} /> Upload Form
                                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} style={{ display: "none" }} />
                            </label>
                        </div>
                    )}
                </div>
                
                 {/* Accordion 3: Steps */}
                 <div className="accordion-section">
                    <button className={`accordion-header ${accordionState.stepsProcess ? "active" : ""}`} onClick={() => toggleAccordion("stepsProcess")}>
                        <span className="accordion-title"><ClipboardList size={18} /> Steps & Process</span>
                        <ChevronDown size={20} className={`accordion-chevron ${accordionState.stepsProcess ? "rotate" : ""}`} />
                    </button>
                    {accordionState.stepsProcess && (
                        <div className="accordion-content">
                             <div className="simple-list">
                                {stepsProcess.map((step, i) => (
                                    <div key={step.id} className="step-item-editable">
                                        <span className="step-number-badge">{i+1}</span>
                                        <input type="text" className="req-input-text" value={step.label} onChange={(e) => setStepsProcess(prev => prev.map(s => s.id === step.id ? {...s, label: e.target.value} : s))} />
                                        <button className="req-delete-btn" onClick={() => setStepsProcess(prev => prev.filter(s => s.id !== step.id))}><Trash2 size={18} /></button>
                                    </div>
                                ))}
                             </div>
                             <button className="req-add-btn" onClick={() => setStepsProcess(prev => [...prev, {id: Date.now(), label: ""}])} style={{ marginTop: 16 }}><ClipboardList size={16}/> Add Step</button>
                        </div>
                    )}
                 </div>
            </div>
            <div className="modal-footer">
                <button className="modal-cancel-btn" onClick={onBack}>Back to List</button>
                <button className="modal-save-btn" onClick={handleSave}><Save size={18} /> Save Changes</button>
            </div>
        </div>
    );
};


// --- MAIN MODAL WRAPPER ---
const VisaSettingsModal = ({ isOpen, onClose, visaForms, isLoading, countryCodes, refreshData }) => {
    const toast = useToast();
    const [viewMode, setViewMode] = useState("LIST"); // LIST | EDITOR
    const [selectedVisa, setSelectedVisa] = useState(null);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [newVisa, setNewVisa] = useState({ country: "", flagCode: "", desc: "", price: "" });

    // State for Custom Confirm Modal
    const [confirmConfig, setConfirmConfig] = useState({ 
        isOpen: false, 
        visaId: null, 
        visaName: "" 
    });

    // Reset when opening/closing
    useEffect(() => {
        if (!isOpen) {
            setViewMode("LIST");
            setSelectedVisa(null);
            setIsAddFormOpen(false);
        }
    }, [isOpen]);

    const handleEditClick = (visa) => {
        setSelectedVisa(visa);
        setViewMode("EDITOR");
    };

    const handleSaveRequirements = async (updatedData) => {
        try {
            await axios.put(`http://localhost:5000/api/visas/${selectedVisa.id}`, updatedData);
            toast.success("Requirements updated successfully!");
            refreshData();
            setViewMode("LIST");
        } catch (error) {
            toast.error("Error saving requirements");
        }
    };

    const openDeleteConfirm = (id, country) => {
        setConfirmConfig({
            isOpen: true,
            visaId: id,
            visaName: country
        });
    };

    const handleDeleteVisa = async () => {
        try {
            await axios.delete(`http://localhost:5000/api/visas/${confirmConfig.visaId}`);
            toast.success(`${confirmConfig.visaName} visa configuration deleted.`);
            refreshData();
        } catch (error) { 
            toast.error("Delete failed. Please try again."); 
        } finally {
            setConfirmConfig({ ...confirmConfig, isOpen: false });
        }
    };

    const handleAddVisa = async () => {
        if (!newVisa.country || !newVisa.flagCode || !newVisa.desc || !newVisa.price) {
            toast.warning("Please fill all required fields."); 
            return;
        }
        try {
            await axios.post("http://localhost:5000/api/visas/add", {
                country: newVisa.country.toUpperCase(),
                flagCode: newVisa.flagCode.toUpperCase(),
                description: newVisa.desc.toUpperCase(),
                price: newVisa.price,
            });
            toast.success("New visa form added successfully!");
            refreshData();
            setNewVisa({ country: "", flagCode: "", desc: "", price: "" });
            setIsAddFormOpen(false);
        } catch (error) { 
            toast.error("Failed to add visa. Check your connection."); 
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={(e) => e.target.className === "modal-overlay" && onClose()}>
                {viewMode === "EDITOR" ? (
                    <RequirementEditor 
                        selectedVisa={selectedVisa} 
                        onBack={() => setViewMode("LIST")} 
                        onSave={handleSaveRequirements}
                    />
                ) : (
                    <div className="modal-content modal-content-large">
                        <div className="modal-header">
                            <div>
                                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" }}>Visa Forms</h2>
                                <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>Manage visa configurations</p>
                            </div>
                            <button className="modal-close-btn" onClick={onClose}><X size={24} /></button>
                        </div>

                        <div className="modal-body bg-gray">
                            {!isAddFormOpen ? (
                                <button className="add-visa-toggle-btn" onClick={() => setIsAddFormOpen(true)}>
                                    <Plus size={20} /> Add New Visa Form
                                </button>
                            ) : (
                                <div className="add-visa-form-container">
                                    <div className="add-visa-form-header">
                                        <h3>Add New Visa</h3>
                                        <button className="form-close-btn" onClick={() => setIsAddFormOpen(false)}><X size={20} /></button>
                                    </div>
                                    <div className="add-visa-form-grid">
                                        <div className="form-group">
                                            <label>Country *</label>
                                            <input type="text" placeholder="JAPAN" value={newVisa.country} onChange={e => setNewVisa({...newVisa, country: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Flag Code *</label>
                                            <select value={newVisa.flagCode} onChange={e => setNewVisa({...newVisa, flagCode: e.target.value})}>
                                                <option value="">Select...</option>
                                                {countryCodes.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group form-group-full">
                                            <label>Description *</label>
                                            <input type="text" placeholder="Title..." value={newVisa.desc} onChange={e => setNewVisa({...newVisa, desc: e.target.value})} />
                                        </div>
                                        <div className="form-group form-group-full">
                                            <label>Price *</label>
                                            <input type="number" placeholder="0.00" value={newVisa.price} onChange={e => setNewVisa({...newVisa, price: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="add-visa-form-actions">
                                        <button className="form-cancel-btn" onClick={() => setIsAddFormOpen(false)}>Cancel</button>
                                        <button className="form-save-btn" onClick={handleAddVisa}>Add Visa</button>
                                    </div>
                                </div>
                            )}

                            <div className="visa-forms-list">
                                {isLoading ? <p style={{textAlign:'center'}}>Loading...</p> : visaForms.map(visa => (
                                    <div key={visa.id} className="visa-form-card">
                                        <div className="visa-form-left">
                                            <div className="visa-flag-circle">
                                                <img src={`https://flagcdn.com/w80/${visa.flagCode.toLowerCase()}.png`} className="visa-flag-img" alt="" onError={e => e.target.style.display='none'} />
                                            </div>
                                            <div className="visa-form-info">
                                                <h3>{visa.country}</h3>
                                                <p className="visa-desc">{visa.desc}</p>
                                                <p className="visa-price">₱{visa.price}</p>
                                            </div>
                                        </div>
                                        <div className="visa-form-actions">
                                            <button className="visa-form-edit-btn" onClick={() => handleEditClick(visa)}><FileText size={16} /> Edit Reqs</button>
                                            <button className="visa-form-delete-btn" onClick={() => openDeleteConfirm(visa.id, visa.country)}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* INTEGRATED CUSTOM CONFIRM MODAL */}
            <CustomConfirmModal 
                isOpen={confirmConfig.isOpen}
                title="Delete Visa Configuration"
                message={`Are you sure you want to delete the visa form for ${confirmConfig.visaName}? This action cannot be undone.`}
                type="danger"
                onConfirm={handleDeleteVisa}
                onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
            />
        </>
    );
};

export default VisaSettingsModal;