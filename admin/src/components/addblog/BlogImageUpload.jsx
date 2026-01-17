import React from "react";
import { Upload, X, Image as ImageIcon, Globe } from "lucide-react";

const BlogImageUpload = ({ 
  imagePreview, 
  onImageChange, 
  onRemoveImage, 
  onOpenUnsplash,
  onOpenGemini 
}) => {
  return (
    <section className="blog-section" style={{ overflow: 'visible' }}>
      <h2 
        className="blog-section-title"
        style={{ 
          paddingLeft: '0px', 
          marginLeft: '0px',
          overflow: 'visible'
        }}
      >
        BLOG COVER IMAGE
      </h2>
      
      {!imagePreview ? (
        <div style={{ position: 'relative', width: '100%' }}>
          <label 
            htmlFor="blog-upload" 
            className="b-upload-zone-wrapper"
            style={{
              // Override any conflicting styles
              position: 'relative',
              display: 'block',
              width: '100%',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              background: '#f8fafc',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            <div 
              className="b-upload-icon-box"
              style={{
                width: '64px',
                height: '64px',
                background: '#fff',
                border: '2px solid #e2e8f0',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
                color: '#94a3b8'
              }}
            >
              <Upload size={28} />
            </div>
            <p style={{ 
              fontWeight: "700", 
              fontSize: "14px", 
              color: "#001F3F", 
              marginBottom: "6px",
              margin: '0 0 6px 0'
            }}>
              Drop or Click to Upload
            </p>
            <p style={{ 
              fontSize: "12px", 
              color: "#94a3b8",
              margin: '0'
            }}>
              JPG, PNG, WEBP (Max 5MB)
            </p>
            <input
              type="file"
              id="blog-upload"
              accept="image/*"
              onChange={onImageChange}
              style={{ display: "none" }}
            />
          </label>

          <div style={{
            display: "flex",
            gap: "10px",
            marginTop: "16px",
            width: '100%'
          }}>
            <button
              type="button"
              onClick={onOpenUnsplash}
              style={{
                flex: 1,
                padding: "12px 18px",
                background: "linear-gradient(135deg, #000000 0%, #333333 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Globe size={18} strokeWidth={2.5} />
              Browse Unsplash
            </button>

            <button
              type="button"
              onClick={() => onOpenGemini("Image")}
              style={{
                flex: 1,
                padding: "12px 18px",
                background: "linear-gradient(135deg, #a855f7, #6366f1)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <ImageIcon size={18} strokeWidth={2.5} />
              Generate AI Image
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="b-upload-preview-box"
          style={{
            position: 'relative',
            height: '300px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 31, 63, 0.08)'
          }}
        >
          <img 
            src={imagePreview} 
            alt="Blog Cover Preview" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
          <div 
            className="b-upload-actions"
            style={{
              position: 'absolute',
              bottom: '15px',
              right: '15px',
              display: 'flex',
              gap: '10px',
              zIndex: 10
            }}
          >
            <label 
              htmlFor="blog-change" 
              className="b-upload-change-btn"
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#fff',
                background: 'rgba(0, 31, 63, 0.9)',
                border: 'none',
                transition: 'all 0.2s ease',
                display: 'inline-block'
              }}
            >
              Change
              <input
                type="file"
                id="blog-change"
                accept="image/*"
                onChange={onImageChange}
                style={{ display: "none" }}
              />
            </label>
            <button 
              type="button" 
              onClick={onRemoveImage} 
              className="b-upload-remove-btn"
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#fff',
                background: 'rgba(220, 38, 38, 0.9)',
                border: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default BlogImageUpload;