import React, { useState } from 'react';
import * as Icons from './Icons';
import './DocumentsSection.css';

const DocumentsSection = ({ 
    visaDetails, 
    uploadedFiles, 
    handleFileSelect, 
    handleDrop, 
    removeFile, 
    submitDocuments, 
    isUploading, 
    uploadProgress 
}) => {
    const [draggingSection, setDraggingSection] = useState(null);

    const getRequirements = () => {
        if (visaDetails?.requirements) {
            return visaDetails.requirements.map(req => ({ 
                title: req.title, 
                items: req.items || [] 
            }));
        }
        return [{ 
            title: 'General Requirements', 
            items: ['Valid ID', 'Recent Photo', 'Proof of Address'] 
        }];
    };

    const onDragOver = (e, section) => { 
        e.preventDefault(); 
        setDraggingSection(section); 
    };

    const onDragLeave = (e) => { 
        e.preventDefault(); 
        setDraggingSection(null); 
    };

    const onDropHandler = (e, section) => { 
        setDraggingSection(null); 
        handleDrop(e, section); 
    };

    return (
        <div className="ud-docs-wrapper">
            <div className="ud-docs-header">
                <h2>Required Documents</h2>
                <p>Upload clear copies of the required documents for your application</p>
            </div>

            {getRequirements().map((section, idx) => (
                <div key={idx} className="ud-doc-section">
                    <div className="ud-doc-section-head">
                        <h3>{section.title}</h3>
                        <span className="ud-doc-count">{section.items.length} items</span>
                    </div>

                    {/* Requirements List */}
                    <div className="ud-req-grid">
                        {section.items.map((item, i) => (
                            <div key={i} className="ud-req-item">
                                <Icons.Check />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>

                    {/* Upload Zone */}
                    <div 
                        className={`ud-upload-zone ${draggingSection === section.title ? 'ud-upload-active' : ''}`}
                        onDragOver={(e) => onDragOver(e, section.title)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDropHandler(e, section.title)}
                    >
                        <div className="ud-upload-content">
                            <div className="ud-upload-icon">
                                <Icons.Upload />
                            </div>
                            <div className="ud-upload-text">
                                <h4>Drag & drop files here</h4>
                                <p>
                                    or{' '}
                                    <label className="ud-browse-link">
                                        browse
                                        <input 
                                            type="file" 
                                            multiple 
                                            onChange={(e) => handleFileSelect(e, section.title)} 
                                            hidden 
                                        />
                                    </label>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Uploaded Files */}
                    {uploadedFiles[section.title]?.length > 0 && (
                        <div className="ud-files-grid">
                            {uploadedFiles[section.title].map(file => (
                                <div key={file.id} className="ud-file-card">
                                    <div className="ud-file-icon">
                                        {file.type.includes('image') ? <Icons.Image /> : <Icons.File />}
                                    </div>
                                    <div className="ud-file-info">
                                        <span className="ud-file-name">{file.name}</span>
                                        <span className="ud-file-size">{file.size}</span>
                                    </div>
                                    <button 
                                        className="ud-remove-file" 
                                        onClick={() => removeFile(section.title, file.id)}
                                    >
                                        <Icons.Close />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {/* Upload Progress */}
            {isUploading && (
                <div className="ud-progress-container">
                    <div 
                        className="ud-progress-bar" 
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
            )}

            {/* Submit Button */}
            <div className="ud-submit-area">
                <button 
                    className="ud-submit-btn" 
                    onClick={submitDocuments}
                >
                    Submit All Documents
                </button>
                <p className="ud-submit-note">
                    Ensure all documents are clear and legible before submitting
                </p>
            </div>
        </div>
    );
};

export default DocumentsSection;