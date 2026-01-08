import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle } from "lucide-react"; // Para sa confirmation modal icon
import Sidebar from "../sidebar/sidebar";
import ServiceImageUpload from "./ServiceImageUpload";
import ServiceDetails from "./ServiceDetails";
import ServiceRequirements from "./ServiceRequirements";
import ServicePreview from "./ServicePreview";
import "./addservice.css";

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// ✅ Import Toast Manager
import { useToast } from "../toast/ToastManager";

// ✅ Custom Confirm Modal Component (Reference from EditVisa.jsx)
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="arc-confirm-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 11000
    }}>
      <div className="arc-confirm-modal" style={{
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

const AddService = () => {
  const navigate = useNavigate();
  const toast = useToast(); // ✅ Initialize Toast

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // ✅ Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary"
  });

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

  // Service form state
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    icon: "",
    category: "DOCUMENTATION",
    price: "",
    order: "",
    isActive: true,
    hasSubCollection: false,
    subCollectionName: "",
    requirements: [""],
  });

  // Image state
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // =========================================================
  // ✅ AUTO-DRAFT LOGIC START
  // =========================================================

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const base64ToFile = async (base64String, fileName, mimeType) => {
    const res = await fetch(base64String);
    const blob = await res.blob();
    return new File([blob], fileName, { type: mimeType });
  };

  const [draftPayload, setDraftPayload] = useState(null);

  useEffect(() => {
    const updateDraft = async () => {
      const isFormEmpty = 
        !formState.title && 
        !formState.description && 
        !formState.icon && 
        !formState.price && 
        !formState.order && 
        !formState.hasSubCollection && 
        !formState.subCollectionName && 
        formState.category === "DOCUMENTATION" && 
        (formState.requirements.length === 1 && formState.requirements[0] === "") && 
        !file;

      if (isFormEmpty) {
        setDraftPayload(null);
        return;
      }

      let imageBase64 = null;
      let imageMeta = null;

      if (file) {
        try {
          if (file.size < 3 * 1024 * 1024) { 
            imageBase64 = await fileToBase64(file);
            imageMeta = { name: file.name, type: file.type };
          }
        } catch (err) {
          console.warn("Image too large for draft, saving text only.");
        }
      }

      setDraftPayload({
        ...formState,
        image: imageBase64,
        imageMeta: imageMeta
      });
    };

    const timeoutId = setTimeout(() => {
      updateDraft();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formState, file]);

  const restoreDraftData = async (data) => {
    if (!data) return;

    setFormState({
      title: data.title || "",
      description: data.description || "",
      icon: data.icon || "",
      category: data.category || "DOCUMENTATION",
      price: data.price || "",
      order: data.order || "",
      isActive: data.isActive !== undefined ? data.isActive : true,
      hasSubCollection: data.hasSubCollection || false,
      subCollectionName: data.subCollectionName || "",
      requirements: data.requirements || [""],
    });

    if (data.image && data.imageMeta) {
      try {
        const restoredFile = await base64ToFile(data.image, data.imageMeta.name, data.imageMeta.type);
        setFile(restoredFile);
        setPreviewUrl(URL.createObjectURL(restoredFile));
      } catch (err) {
        console.error("Failed to restore image:", err);
      }
    }
  };

  const { 
    clearDraft, 
    hasDraft, 
    restoreDraft, 
    discardDraft,
    draftInfo 
  } = useAutoDraft({
    module: 'add-service',
    formData: draftPayload,
    setFormData: restoreDraftData,
    imagePreview: previewUrl, 
    autoRestore: false 
  });

  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    if (hasDraft) {
      setShowRestoreModal(true);
    }
  }, [hasDraft]);

  const handleRestoreDraft = () => {
    restoreDraft();
    setShowRestoreModal(false);
    toast.info("Draft restored successfully.", "Draft System");
  };

  const handleDiscardDraft = async () => {
    await discardDraft();
    setShowRestoreModal(false);
    toast.info("Draft discarded.");
  };

  // =========================================================
  // ✅ AUTO-DRAFT LOGIC END
  // =========================================================

  const updateField = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateRequirements = (newRequirements) => {
    setFormState((prev) => ({ ...prev, requirements: newRequirements }));
  };

  // ✅ Updated Handle Cancel with Custom Modal
  const handleCancel = () => {
    askConfirmation(
      "Discard Changes",
      "Are you sure you want to cancel? All unsaved changes will be lost.",
      async () => {
        await clearDraft();
        toast.info("Changes discarded.");
        navigate(-1);
      },
      "danger"
    );
  };

  // ✅ Updated Handle Submit with Custom Modal
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!file) {
      toast.warning("Please upload an image for the service.", "Missing Attachment");
      return;
    }

    askConfirmation(
      "Publish Service",
      "Are you sure you want to publish this new service?",
      () => performSubmit()
    );
  };

  const performSubmit = async () => {
    const processedRequirements = formState.requirements.filter(
      (item) => item.trim().length > 0
    );

    const priceNum = parseFloat(formState.price) || 0;
    const orderNum = parseInt(formState.order) || 0;

    const formData = new FormData();
    formData.append("title", formState.title);
    formData.append("description", formState.description);
    formData.append("icon", formState.icon);
    formData.append("category", formState.category);
    formData.append("price", priceNum.toString());
    formData.append("order", orderNum.toString());
    formData.append("isActive", formState.isActive.toString());
    formData.append("hasSubCollection", formState.hasSubCollection.toString());
    formData.append(
      "subCollectionName",
      formState.hasSubCollection ? formState.subCollectionName : ""
    );
    formData.append("requirements", JSON.stringify(processedRequirements));

    if (file) {
      formData.append("image", file);
    }

    try {
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
      const activeId = adminData.id || adminData._id || "";

      formData.append("userEmail", activeUser);
      formData.append("adminId", activeId);
    } catch (err) {
      console.error("Error parsing admin data:", err);
    }

    try {
      const response = await fetch("http://localhost:5000/api/services", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Service added successfully!");
        await clearDraft();

        // Reset form
        setFormState({
          title: "",
          description: "",
          icon: "",
          category: "DOCUMENTATION",
          price: "",
          order: "",
          isActive: true,
          hasSubCollection: false,
          subCollectionName: "",
          requirements: [""],
        });
        setFile(null);
        setPreviewUrl(null);
        
        // Navigate back or to list after success
        setTimeout(() => navigate("/services"), 1500);
      } else {
        toast.error(data.message || "Failed to save service", "Server Error");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error connecting to server. Please try again later.", "Connection Failed");
    }
  };

  return (
    <div className="svc-page">
      
      {/* ✅ RESTORE DRAFT MODAL */}
      <RestoreDraftModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftInfo={draftInfo}
      />

      {/* ✅ CUSTOM CONFIRMATION MODAL */}
      <CustomConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main
        className={`svc-main ${
          isSidebarCollapsed ? "svc-main--collapsed" : ""
        }`}
      >
        <div className="svc-container">
          <header className="svc-header">
            <div className="svc-header-content">
              <h1 className="svc-title">ADD SERVICE</h1>
              <p className="svc-subtitle">
                Create a new service offering (e.g., VISA, PSA, etc.)
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="svc-form">
            <div className="svc-grid">
              <div className="svc-left">
                <ServiceImageUpload
                  file={file}
                  setFile={setFile}
                  previewUrl={previewUrl}
                  setPreviewUrl={setPreviewUrl}
                />

                <ServiceDetails
                  formState={formState}
                  updateField={updateField}
                />

                <ServiceRequirements
                  requirements={formState.requirements}
                  updateRequirements={updateRequirements}
                />
              </div>

              <aside className="svc-right">
                <ServicePreview
                  formState={formState}
                  previewUrl={previewUrl}
                />
                <div className="svc-actions">
                  <button
                    type="button"
                    className="svc-btn svc-btn--cancel"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="svc-btn svc-btn--submit">
                    Publish
                  </button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddService;