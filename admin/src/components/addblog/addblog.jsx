import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import { useToast } from "../toast/ToastManager";
import useAutoDraft from "../../hooks/useAutoDraft";
import RestoreDraftModal from "../../components/RestoreDraftModal/RestoreDraftModal";

// Modals - FLAT IMPORT (same folder)
import CustomConfirmModal from "./CustomConfirmModal";
import UnsplashSearchModal from "./UnsplashSearchModal";
import GeminiInputModal from "./GeminiInputModal";

// Components - FLAT IMPORT (same folder)
import BlogImageUpload from "./BlogImageUpload";
import BlogFormFields from "./BlogFormFields";
import BlogPreviewCard from "./BlogPreviewCard";

// Utils - FLAT IMPORT (same folder)
import { 
  fileToBase64, 
  base64ToFile, 
  getCurrentFormattedDate,
  validateScheduledDate,
  getAdminData 
} from "./BlogHelpers";

import "./addblog.css";

const AddBlog = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const API_BASE_URL = "http://localhost:5000";

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // Blog form state
  const [blogDetails, setBlogDetails] = useState({
    title: "",
    author: "",
    category: "",
    content: "",
    status: "Published",
    scheduledAt: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI & Modal states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [unsplashModalOpen, setUnsplashModalOpen] = useState(false);
  const [geminiMode, setGeminiMode] = useState("Content");
  const [aiProgress, setAiProgress] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "primary",
    onConfirm: () => {},
  });

  // =============================================================================
  // MODAL HANDLERS
  // =============================================================================
  const openGeminiModal = (mode) => {
    setGeminiMode(mode);
    setGeminiModalOpen(true);
  };

  const openUnsplashModal = () => {
    setUnsplashModalOpen(true);
  };

  const handleUnsplashSelect = async (imageData) => {
    try {
      const response = await fetch(imageData.url);
      const blob = await response.blob();
      const file = new File([blob], `unsplash-${imageData.alt}.jpg`, { type: "image/jpeg" });
      
      setImageFile(file);
      setImagePreview(imageData.url);
      
      toast.success(
        `Image by ${imageData.photographer} added successfully!`,
        "✅ Image Selected",
        4000
      );
    } catch (error) {
      console.error("Error handling Unsplash image:", error);
      toast.error("Failed to load image", "❌ Error");
    }
  };

  // =============================================================================
  // AI GENERATION HANDLER
  // =============================================================================
  const handleAiSubmit = async (prompt, attachedImageBase64) => {
    setIsAiLoading(true);
    
    // Ibahin ang loading text kung FullBlog ang mode
    let progressText = "Connecting to AI server...";
    if (geminiMode === "FullBlog") progressText = "Generating Title & Content (This may take a moment)...";
    else if (attachedImageBase64) progressText = "Analyzing image...";
    
    setAiProgress(progressText);

    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/generate-ai-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: prompt, 
          type: geminiMode, 
          image: attachedImageBase64
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "AI generation failed");
      }

      // ✅ 1. Handle Full Blog (Title + Content)
      if (geminiMode === "FullBlog") {
          setBlogDetails(prev => ({ 
            ...prev, 
            title: data.title,
            content: data.content 
          }));
          
          toast.success("Blog title and content generated successfully!", "✨ Magic Complete");
      }
      
      // ✅ 2. Handle Title Only
      else if (geminiMode === "Title") {
          const cleanTitle = data.generatedText.replace(/^"|"$/g, '').trim();
          setBlogDetails(prev => ({ ...prev, title: cleanTitle }));
          toast.success("Blog title generated!", "✨ Title Created");
      } 
      
      // ✅ 3. Handle Content Only
      else if (geminiMode === "Content") {
          setBlogDetails(prev => ({ ...prev, content: data.generatedText }));
          toast.success("Content generated!", "✨ Content Ready");
      }

      // ✅ 4. Handle Image Prompt
      else if (geminiMode === "Image") {
          toast.info("Image prompt: " + data.generatedText.substring(0, 50) + "...", "ℹ️ Ready");
      }

    } catch (error) {
      console.error("❌ AI Error:", error);
      toast.error(`Failed: ${error.message}`, "❌ AI Error");
    } finally {
      setIsAiLoading(false);
      setAiProgress("");
    }
  };

  // =============================================================================
  // DRAFT MANAGEMENT
  // =============================================================================
  const [draftPayload, setDraftPayload] = useState(null);

  useEffect(() => {
    const updateDraft = async () => {
      const isFormEmpty =
        !blogDetails.title &&
        !blogDetails.author &&
        !blogDetails.category &&
        !blogDetails.content &&
        blogDetails.status === "Published" &&
        !imageFile;

      if (isFormEmpty) {
        setDraftPayload(null);
        return;
      }

      let imageBase64 = null;
      let imageMeta = null;

      if (imageFile) {
        try {
          if (imageFile.size < 3 * 1024 * 1024) {
            imageBase64 = await fileToBase64(imageFile);
            imageMeta = { name: imageFile.name, type: imageFile.type };
          }
        } catch (err) {
          console.warn("Image too large for draft, saving text only.");
        }
      }

      setDraftPayload({
        ...blogDetails,
        image: imageBase64,
        imageMeta: imageMeta,
      });
    };

    const timeoutId = setTimeout(() => {
      updateDraft();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [blogDetails, imageFile]);

  const restoreDraftData = async (data) => {
    if (!data) return;
    setBlogDetails({
      title: data.title || "",
      author: data.author || "",
      category: data.category || "",
      content: data.content || "",
      status: data.status || "Published",
      scheduledAt: data.scheduledAt || "",
    });
    if (data.image && data.imageMeta) {
      try {
        const restoredFile = await base64ToFile(
          data.image,
          data.imageMeta.name,
          data.imageMeta.type
        );
        setImageFile(restoredFile);
        setImagePreview(URL.createObjectURL(restoredFile));
      } catch (err) {
        console.error("Failed to restore image:", err);
      }
    }
  };

  const { clearDraft, hasDraft, restoreDraft, discardDraft } = useAutoDraft({
    module: "add-blog",
    formData: draftPayload,
    setFormData: restoreDraftData,
    imagePreview: imagePreview,
    autoRestore: false,
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
    toast.success(
      "Your blog draft has been restored successfully!",
      "✅ Draft Restored",
      3000
    );
  };

  const handleDiscardDraft = async () => {
    await discardDraft();
    setShowRestoreModal(false);
    toast.info("Draft has been discarded.", "🗑️ Discarded");
  };

  // Cleanup image preview
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // =============================================================================
  // FORM HANDLERS
  // =============================================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBlogDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error(
          "Please upload a valid image file (JPG, PNG, WebP).",
          "❌ Invalid File"
        );
        return;
      }
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      toast.success(
        `Cover image "${file.name}" uploaded successfully!`,
        "✅ Image Added"
      );
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    toast.info("Cover image removed.", "🗑️ Image Removed");
  };

  // =============================================================================
  // SUBMIT HANDLERS
  // =============================================================================
  const executeSubmit = async () => {
    setIsSubmitting(true);
    const actionText = blogDetails.status === "Scheduled" ? "Scheduling" : "Publishing";
    toast.info(`${actionText} blog post...`, "📤 Please Wait", 2000);

    try {
      const formData = new FormData();
      formData.append("title", blogDetails.title);
      formData.append("author", blogDetails.author);
      formData.append("category", blogDetails.category);
      formData.append("content", blogDetails.content);
      formData.append("status", blogDetails.status);
      
      if (blogDetails.status === "Scheduled" && blogDetails.scheduledAt) {
        formData.append("scheduledAt", blogDetails.scheduledAt);
      }

      formData.append("image", imageFile);

      const { activeUser, activeId } = getAdminData();
      formData.append("userEmail", activeUser);
      formData.append("adminId", activeId);

      const response = await fetch(`${API_BASE_URL}/api/blogs/add`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        const successMsg = blogDetails.status === "Scheduled" 
          ? "Blog post has been scheduled successfully!" 
          : `Blog post "${blogDetails.title}" has been published successfully!`;
        toast.success(successMsg, "✅ Success", 5000);
        await clearDraft();
        setBlogDetails({
          title: "",
          author: "",
          category: "",
          content: "",
          status: "Published",
          scheduledAt: "",
        });
        setImageFile(null);
        setImagePreview(null);
      } else {
        const errorMessage = result.message || "Unknown error occurred";
        toast.error(`Failed to process: ${errorMessage}`, "❌ Failed", 5000);
      }
    } catch (error) {
      console.error("❌ Network Error:", error);
      toast.error(`Unable to connect to server: ${error.message}.`, "❌ Connection Error", 6000);
    } finally {
      setIsSubmitting(false);
      setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    // Validation
    if (!blogDetails.title || !blogDetails.content || !imageFile) {
      toast.warning("Please provide a title, content, and cover image.", "⚠️ Incomplete Form");
      return;
    }

    if (blogDetails.status === "Scheduled") {
      const validation = validateScheduledDate(blogDetails.scheduledAt);
      if (!validation.valid) {
        toast.warning(validation.message, "⚠️ Invalid Date");
        return;
      }
    }

    const confirmTitle = blogDetails.status === "Scheduled" ? "Schedule Blog?" : "Publish Blog?";
    const confirmMsg = blogDetails.status === "Scheduled"
      ? `Are you sure you want to schedule this blog for ${new Date(blogDetails.scheduledAt).toLocaleString()}?`
      : "Are you sure you want to publish this blog post now?";

    setConfirmConfig({
      isOpen: true,
      title: confirmTitle,
      message: confirmMsg,
      type: "primary",
      onConfirm: executeSubmit,
    });
  };

  const handleCancel = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Discard Changes?",
      message: "Are you sure you want to cancel? All unsaved changes will be lost.",
      type: "danger",
      onConfirm: async () => {
        await clearDraft();
        setBlogDetails({
          title: "",
          author: "",
          category: "",
          content: "",
          status: "Published",
          scheduledAt: "",
        });
        setImageFile(null);
        setImagePreview(null);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        toast.info("Action cancelled and form cleared.", "❌ Cancelled");
      },
    });
  };

  const currentDate = getCurrentFormattedDate();

  const BlogPreviewModal = () => {
    if (!isPreviewOpen) return null;

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.8)", zIndex: 13000,
        display: "flex", justifyContent: "center", alignItems: "center", p: "20px"
      }}>
        <div style={{
          background: "white", width: "90%", maxWidth: "800px", maxHeight: "90vh",
          borderRadius: "12px", overflowY: "auto", padding: "40px", position: "relative"
        }}>
          <button 
            onClick={() => setIsPreviewOpen(false)}
            style={{ position: "absolute", top: "20px", right: "20px", border: "none", background: "transparent", fontSize: "24px", cursor: "pointer" }}
          >✖</button>

          {/* HEADER IMAGE */}
          {imagePreview && (
            <img src={imagePreview} alt="Cover" style={{ width: "100%", height: "300px", objectFit: "cover", borderRadius: "8px", marginBottom: "30px" }} />
          )}

          {/* TITLE */}
          <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>{blogDetails.title}</h1>
          
          {/* META */}
          <p style={{ color: "#666", marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
            By {blogDetails.author || "Admin"} • {blogDetails.category}
          </p>

          {/* 👇 THE MAGIC PART: RENDER HTML */}
          <div 
            className="blog-content-renderer"
            dangerouslySetInnerHTML={{ __html: blogDetails.content }} 
          />
        </div>
      </div>
    );
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div className="blog-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      {/* Restore Draft Modal */}
      {showRestoreModal && (
        <RestoreDraftModal
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
          module="Add Blog"
        />
      )}

      {/* Confirmation Modal */}
      <CustomConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />

      {/* Unsplash Modal */}
      <UnsplashSearchModal
        isOpen={unsplashModalOpen}
        onClose={() => setUnsplashModalOpen(false)}
        onSelectImage={handleUnsplashSelect}
      />

      {/* Gemini Modal */}
      <GeminiInputModal
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        onGenerate={handleAiSubmit}
        mode={geminiMode}
      />

      <main className={`blog-main ${isSidebarCollapsed ? "blog-main--collapsed" : ""}`}>
        <div className="blog-container">
          {/* Header */}
          <header className="blog-header">
            <div className="blog-header-content">
              <h1 className="blog-title">Add New Blog</h1>
              <p className="blog-subtitle">Create and publish engaging travel stories</p>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="blog-grid">
              <div className="blog-left">
                {/* Image Upload Section */}
                <BlogImageUpload
                  imagePreview={imagePreview}
                  onImageChange={handleImageChange}
                  onRemoveImage={removeImage}
                  onOpenUnsplash={openUnsplashModal}
                  onOpenGemini={openGeminiModal}
                />

                {/* Form Fields Section */}
                <BlogFormFields
                  blogDetails={blogDetails}
                  onChange={handleChange}
                  onOpenGemini={openGeminiModal}
                  isAiLoading={isAiLoading}
                />
              </div>

              {/* Preview Card Section */}
              <BlogPreviewCard
                blogDetails={blogDetails}
                imagePreview={imagePreview}
                currentDate={currentDate}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                onPreview={() => setIsPreviewOpen(true)}
              />
            </div>
          </form>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .vb-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AddBlog;