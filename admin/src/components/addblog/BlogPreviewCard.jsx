import React from "react";
import { FileText, User, Calendar, Loader2, Eye } from "lucide-react";

const BlogPreviewCard = ({ 
  blogDetails, 
  imagePreview, 
  currentDate,
  onCancel,
  onSubmit,
  isSubmitting,
  onPreview 
}) => {
  return (
    <aside className="blog-right">
      {/* Preview Card */}
      <div className="blog-preview-card">
        <span className="blog-preview-label">BLOG PREVIEW</span>

        <div className="bp-card">
          <div className="bp-image-wrapper">
            {imagePreview ? (
              <img src={imagePreview} alt="Blog Cover" />
            ) : (
              <div className="bp-placeholder">
                <FileText size={40} />
              </div>
            )}
            {blogDetails.category && (
              <span className="bp-category-tag">{blogDetails.category}</span>
            )}
          </div>

          <div className="bp-content">
            <h3 className="bp-title">
              {blogDetails.title || "Your Blog Title Here"}
            </h3>

            <div className="bp-meta">
              <div className="bp-meta-item">
                <User size={12} />
                <span>{blogDetails.author || "Author"}</span>
              </div>
              <div className="bp-meta-item">
                {blogDetails.status === 'Scheduled' && blogDetails.scheduledAt ? (
                  <>
                    <Calendar size={12} />
                    <span>{new Date(blogDetails.scheduledAt).toLocaleDateString()}</span>
                  </>
                ) : (
                  <span>• {currentDate}</span>
                )}
              </div>
            </div>

            <p className="bp-excerpt">
              {blogDetails.content
                ? blogDetails.content.replace(/<[^>]*>/g, '').substring(0, 100) + "..."
                : "Preview of your blog content will appear here..."}
            </p>

            <div 
              className="bp-readmore" 
              onClick={onPreview} // 👈 Trigger Modal
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
            >
              Read Article <Eye size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="blog-actions">
        <button
          type="button"
          className="blog-btn blog-btn--cancel"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="blog-btn blog-btn--submit"
          disabled={isSubmitting}
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="vb-spinner" size={18} />
              Processing...
            </>
          ) : (
            blogDetails.status === 'Scheduled' ? 'Schedule Post' : 'Publish'
          )}
        </button>
      </div>
    </aside>
  );
};

export default BlogPreviewCard;