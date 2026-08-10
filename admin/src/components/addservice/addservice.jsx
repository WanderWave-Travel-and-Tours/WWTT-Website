import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

// ✅ Import Custom Confirm Modal
import CustomConfirmModal from "../../components/confirmationModal/CustomConfirmModal";

const AddService = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary"
  });

  // ✅ Helper function to trigger confirmation modal
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
      toast.success('Your service draft has been restored successfully!', 'Draft Restored', 3000);
  };

  const handleDiscardDraft = async () => {
      await discardDraft();
      setShowRestoreModal(false);
      toast.info('Draft has been discarded.', 'Discarded');
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

  // ✅ Changed to use CustomConfirmModal
  const handleCancel = () => {
    askConfirmation(
        "Discard Changes",
        "Are you sure you want to cancel? All unsaved changes and drafts will be lost.",
        async () => {
            await clearDraft();
            toast.info('Action cancelled. Redirecting...', 'Cancelled');
            navigate(-1);
        },
        "danger"
    );
  };

  // ✅ Changed to use CustomConfirmModal
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!file) {
        toast.warning('Please upload an image for the service.', 'Missing Image');
        return;
    }

    if (!formState.title || !formState.description || !formState.price) {
        toast.warning('Please fill in all required fields (Title, Description, Price).', 'Incomplete Form');
        return;
    }

    askConfirmation(
        "Publish Service",
        `Are you sure you want to publish the "${formState.title}" service?`,
        () => performSubmit(),
        "primary"
    );
  };

  const performSubmit = async () => {
    setIsSubmitting(true);
    const loadingToastId = toast.info('Publishing service...', 'Please Wait', 0);

    const processedRequirements = formState.requirements.filter(
        (item) => item.trim().length > 0
    );

    const formData = new FormData();
    formData.append("title", formState.title);
    formData.append("description", formState.description);
    formData.append("icon", formState.icon);
    formData.append("category", formState.category);
    formData.append("price", (parseFloat(formState.price) || 0).toString());
    formData.append("order", (parseInt(formState.order) || 0).toString());
    formData.append("isActive", formState.isActive.toString());
    formData.append("hasSubCollection", formState.hasSubCollection.toString());
    formData.append("subCollectionName", formState.hasSubCollection ? formState.subCollectionName : "");
    formData.append("requirements", JSON.stringify(processedRequirements));

    if (file) {
        formData.append("image", file);
    }

    try {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        formData.append("userEmail", adminData.email || adminData.username || 'Unknown User');
        formData.append("adminId", adminData.id || adminData._id || "");
    } catch (err) {
        console.error("Error parsing admin data:", err);
    }

    try {
        const response = await fetch("/api/services", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();

        if (response.ok) {
            toast.success(
                `Service "${formState.title}" has been published successfully!`,
                'Service Published',
                5000
            );

            await clearDraft();

            // Reset Form Fields
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
            
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } else {
            const errorMessage = data.message || 'Unknown error occurred';
            toast.error(`Failed to save service: ${errorMessage}`, 'Save Failed');
        }
    } catch (error) {
        console.error('❌ Network Error:', error);
        toast.error(`Unable to connect to server. Please check your connection.`, 'Connection Error');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="svc-page">
      
      <RestoreDraftModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        draftInfo={draftInfo}
      />

      {/* ✅ Add the CustomConfirmModal here */}
      <CustomConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`svc-main ${isSidebarCollapsed ? "svc-main--collapsed" : ""}`}>
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
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="svc-btn svc-btn--submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Publishing..." : "Publish"}
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