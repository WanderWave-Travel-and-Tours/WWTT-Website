import React, { useEffect, useRef } from "react";
import { Wand2, Sparkles, Calendar, Layers } from "lucide-react";

const BlogFormFields = ({ 
  blogDetails, 
  onChange, 
  onOpenGemini,
  isAiLoading 
}) => {
  
  // 1. Gumawa tayo ng Reference para sa editable div
  const editorRef = useRef(null);

  // 2. Ito ang mag-a-update ng content kapag galing kay Gemini
  useEffect(() => {
    if (editorRef.current && blogDetails.content !== editorRef.current.innerHTML) {
      // I-update lang kung malaki ang pinagkaiba (para hindi tumalon ang cursor habang nagta-type ka)
      // Karaniwan, gagana ito nang maayos pagkatanggap ng AI response
      if (Math.abs(blogDetails.content.length - editorRef.current.innerHTML.length) > 5) {
         editorRef.current.innerHTML = blogDetails.content;
      }
    }
  }, [blogDetails.content]);

  // 3. Custom handler kapag nagta-type ka manually
  const handleContentChange = (e) => {
    const htmlContent = e.currentTarget.innerHTML;
    onChange({
      target: {
        name: "content",
        value: htmlContent
      }
    });
  };

  return (
    <section className="blog-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
      <h2 className="blog-section-title">BLOG DETAILS</h2>

      <button
          type="button"
          onClick={() => onOpenGemini("FullBlog")} 
          disabled={isAiLoading}
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #d946ef)", 
            border: "none",
            color: "white",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: isAiLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 10px rgba(139, 92, 246, 0.3)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.target.style.transform = "translateY(-1px)"}
          onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
        >
          <Layers size={16} strokeWidth={2.5} />
          Generate Full Blog
        </button>
      </div>
      
      <div className="blog-fields">
        {/* Title */}
        <div className="blog-field blog-field--full">
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Title
            <button 
              type="button"
              onClick={() => onOpenGemini("Title")}
              disabled={isAiLoading}
              style={{
                background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                border: "none", color: "white", padding: "6px 12px",
                borderRadius: "8px", fontSize: "12px", fontWeight: "600",
                cursor: isAiLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "6px",
                opacity: isAiLoading ? 0.5 : 1
              }}
            >
              <Wand2 size={16} />
              Auto-Generate
            </button>
          </label>
          <input
            type="text"
            name="title"
            value={blogDetails.title}
            onChange={onChange}
            placeholder="e.g., Top 10 Hidden Gems in Palawan"
            required
          />
        </div>

        {/* Author */}
        <div className="blog-field">
          <label>Author</label>
          <input
            type="text"
            name="author"
            value={blogDetails.author}
            onChange={onChange}
            placeholder="e.g., Admin Team"
          />
        </div>

        {/* Category */}
        <div className="blog-field">
          <label>Category</label>
          <select
            name="category"
            value={blogDetails.category}
            onChange={onChange}
          >
            <option value="" disabled>Select Category</option>
            <option value="Trending Stories">Trending Stories</option>
            <option value="Travel Guide">Travel Guide</option>
            <option value="News & Updates">News & Updates</option>
            <option value="Promos">Latest Promos</option>
            <option value="Tips">Travel Tips</option>
          </select>
        </div>

        {/* --- DITO ANG PAGBABAGO --- */}
        <div className="blog-field blog-field--full">
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Content Body
            <button 
              type="button"
              onClick={() => onOpenGemini("Content")}
              disabled={isAiLoading}
              style={{
                background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                border: "none", color: "white", padding: "6px 12px",
                borderRadius: "8px", fontSize: "12px", fontWeight: "600",
                cursor: isAiLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "6px",
                opacity: isAiLoading ? 0.6 : 1
              }}
            >
              <Sparkles size={14} />
              Write with Gemini
            </button>
          </label>
          
          {/* Native Editable Div - Walang iniinstall! */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning={true}
            onInput={handleContentChange}
            style={{
              width: "100%",
              minHeight: "400px",        // Mataas na space para sa pagsusulat
              maxHeight: "600px",
              overflowY: "auto",
              padding: "15px",
              border: "1px solid #ccc",  // Border para mukhang input box
              borderRadius: "8px",
              backgroundColor: "white",
              outline: "none",           // Tanggalin ang blue outline pag kinlick
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#333",
              fontFamily: "inherit"
            }}
          />
           <p style={{ fontSize: "11px", color: "#888", marginTop: "5px" }}>
            * This is a visual editor. The AI will generate formatted text here.
          </p>
        </div>
        {/* --- END NG PAGBABAGO --- */}

        {/* Status */}
        <div className="blog-field">
          <label>Status</label>
          <select
            name="status"
            value={blogDetails.status}
            onChange={onChange}
          >
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>

        {/* Scheduled Date (conditional) */}
        {blogDetails.status === 'Scheduled' && (
          <div className="blog-field">
            <label>
              <Calendar size={14} style={{ display: "inline", marginRight: "4px" }} />
              Schedule Date & Time
            </label>
            <input
              type="datetime-local"
              name="scheduledAt"
              value={blogDetails.scheduledAt}
              onChange={onChange}
              required
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogFormFields;