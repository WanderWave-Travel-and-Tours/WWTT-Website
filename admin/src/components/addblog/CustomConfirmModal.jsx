import React from "react";
import { AlertTriangle } from "lucide-react";

const CustomConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = "primary",
}) => {
  if (!isOpen) return null;
  
  return (
    <div
      className="arc-confirm-overlay"
      style={{
        position: "fixed", 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        zIndex: 11000,
      }}
    >
      <div
        className="arc-confirm-modal"
        style={{
          backgroundColor: "white", 
          padding: "2rem", 
          borderRadius: "12px",
          maxWidth: "400px", 
          width: "90%", 
          textAlign: "center",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
          <div style={{
              padding: "1rem", 
              borderRadius: "50%",
              backgroundColor: type === "danger" ? "#fee2e2" : "#e0f2fe",
              color: type === "danger" ? "#ef4444" : "#0ea5e9",
            }}
          >
            <AlertTriangle size={32} />
          </div>
        </div>
        
        <h3 style={{ 
          fontSize: "1.25rem", 
          fontWeight: "600", 
          marginBottom: "0.5rem", 
          color: "#1e293b" 
        }}>
          {title}
        </h3>
        
        <p style={{ 
          color: "#64748b", 
          marginBottom: "2rem", 
          lineHeight: "1.5" 
        }}>
          {message}
        </p>
        
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button 
            onClick={onCancel} 
            style={{ 
              padding: "0.75rem 1.5rem", 
              borderRadius: "8px", 
              border: "1px solid #e2e8f0", 
              backgroundColor: "white", 
              color: "#64748b", 
              fontWeight: "500", 
              cursor: "pointer" 
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            style={{ 
              padding: "0.75rem 1.5rem", 
              borderRadius: "8px", 
              border: "none", 
              backgroundColor: type === "danger" ? "#ef4444" : "#0ea5e9", 
              color: "white", 
              fontWeight: "500", 
              cursor: "pointer" 
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomConfirmModal;