import React, { useState, useEffect, useRef } from "react";
import { Sparkles, ImageIcon, Paperclip, X, Wand2, Zap } from "lucide-react";

const GeminiInputModal = ({ isOpen, onClose, onGenerate, mode }) => {
  const [prompt, setPrompt] = useState("");
  const [attachedImage, setAttachedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPrompt("");
      setAttachedImage(null);
      setPreviewImage(null);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result);
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachedImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!prompt.trim() && !attachedImage) return;
    onGenerate(prompt, attachedImage);
    onClose();
  };

  const placeholderText = {
    Title: "e.g., Best beaches in Siargao",
    Content: "e.g., Top attractions in Palawan",
    Image: "e.g., Tropical beach sunset with palm trees",
    FullBlog: "e.g., Hidden Gems of Batanes (Enter a topic/category)"
  };

  const helperText = {
    Title: "Enter a topic (or attach an image) to generate a catchy title.",
    Content: "Enter a topic (or attach an image) for Gemini to write a full article.",
    Image: "Describe the image you want, OR attach a reference photo for Gemini to copy the style/composition.",
    FullBlog: "Enter a topic or category. Gemini will create a Title AND write the full Content automatically!" 
  };

  return (
    <div style={{
      position: "fixed", 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)", 
      zIndex: 12000,
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{ 
        backgroundColor: "white", 
        padding: "24px", 
        borderRadius: "16px", 
        maxWidth: "600px", 
        width: "100%",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        animation: "slideIn 0.3s ease-out"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              background: mode === "Image" 
                ? "linear-gradient(135deg, #a855f7, #6366f1)"
                : "linear-gradient(135deg, #0ea5e9, #2563eb)",
              padding: "12px",
              borderRadius: "12px",
              display: "flex"
            }}>
              {mode === "Image" ? (
                <ImageIcon size={24} color="white" strokeWidth={2.5} />
              ) : (
                <Sparkles size={24} color="white" strokeWidth={2.5} />
              )}
            </div>
            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: "20px", 
                fontWeight: "800",
                color: "#1e293b"
              }}>
                {mode === "Image" ? "Generate AI Image" : `Generate ${mode}`}
              </h3>
              <p style={{ 
                margin: "2px 0 0 0", 
                fontSize: "13px", 
                color: "#64748b",
                fontWeight: "600"
              }}>
                Powered by Google Gemini
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
              transition: "all 0.2s"
            }}
          >
            <X size={24} color="#64748b" strokeWidth={2} />
          </button>
        </div>

        {/* Helper Text */}
        <div style={{
          background: "#f8fafc",
          border: "2px solid #e2e8f0",
          borderRadius: "10px",
          padding: "14px 16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <Zap size={18} color="#0ea5e9" strokeWidth={2.5} />
          <p style={{ 
            margin: 0, 
            fontSize: "13px", 
            color: "#64748b",
            lineHeight: "1.5",
            fontWeight: "600"
          }}>
            {helperText[mode]}
          </p>
        </div>

        {/* Preview Attached Image */}
        {previewImage && (
          <div style={{
            position: "relative",
            marginBottom: "16px",
            borderRadius: "12px",
            overflow: "hidden",
            border: "2px solid #e2e8f0"
          }}>
            <img 
              src={previewImage} 
              alt="Attached" 
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "200px",
                objectFit: "cover"
              }}
            />
            <button
              onClick={removeAttachment}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "rgba(239, 68, 68, 0.9)",
                border: "none",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
                display: "flex",
                backdropFilter: "blur(8px)"
              }}
            >
              <X size={18} color="white" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div style={{ position: "relative", marginBottom: "20px" }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholderText[mode]}
            rows="5"
            style={{
              width: "100%",
              padding: "14px 16px",
              paddingBottom: "50px",
              fontSize: "14px",
              fontFamily: "'Segoe UI', Arial, sans-serif",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              resize: "vertical",
              outline: "none",
              transition: "border 0.2s"
            }}
            onFocus={(e) => e.target.style.borderColor = "#0ea5e9"}
            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
          />
          
          {/* Attach Button */}
          <div style={{ 
            position: "absolute", 
            bottom: "12px", 
            left: "12px",
            display: "flex" 
          }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "#f8fafc",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                padding: "8px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: "700",
                color: "#64748b",
                transition: "all 0.2s"
              }}
            >
              <Paperclip size={16} />
              {attachedImage ? "Change Image" : "Attach Image"}
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button 
            onClick={onClose} 
            style={{ 
              padding: "10px 20px", 
              border: "2px solid #e2e8f0", 
              borderRadius: "8px", 
              background: "white", 
              cursor: "pointer",
              fontWeight: "600",
              color: "#64748b",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.borderColor = "#cbd5e1"}
            onMouseLeave={(e) => e.target.style.borderColor = "#e2e8f0"}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={!prompt.trim() && !attachedImage}
            style={{ 
              padding: "10px 24px", 
              border: "none", 
              borderRadius: "8px", 
              background: mode === "Image" 
                ? "linear-gradient(135deg, #a855f7, #6366f1)"
                : "linear-gradient(135deg, #0ea5e9, #2563eb)", 
              color: "white", 
              cursor: (prompt.trim() || attachedImage) ? "pointer" : "not-allowed",
              fontWeight: "600",
              opacity: (prompt.trim() || attachedImage) ? 1 : 0.6,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Sparkles size={16} />
            Generate
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default GeminiInputModal;