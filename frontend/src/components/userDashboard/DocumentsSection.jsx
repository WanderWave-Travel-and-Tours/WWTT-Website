import React, { useState } from 'react';
// I-import ang 'Toaster' para mag-render ang notifications
import toast, { Toaster } from 'react-hot-toast'; 
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
    uploadProgress,
    uploadedDocuments = [],
    isLoadingDocuments = false
}) => {
    const [draggingSection, setDraggingSection] = useState(null);

    // Set the accepted file types for the 'accept' attribute
    const acceptedFileTypes = '.jpg, .jpeg, .png, .webp, .pdf, .doc, .docx';
    
    // Define the valid file extensions for strict validation
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB — must match backend's uploadDocument multer limit

    // --- Custom Toast Design Functions ---

    // Success/Removal Toast (Green Theme)
    const showSuccessToast = (message) => {
        toast.success(message, {
            position: 'top-center',
            style: { 
                border: '1px solid #10b981', // Success Green
                color: '#10b981',
                backgroundColor: '#d1fae5', 
            },
            iconTheme: { 
                primary: '#10b981', 
                secondary: '#fff' 
            },
        });
    };

    // Error Toast (Red Theme) - ginamit na natin ito dati
    const showErrorToast = (message) => {
        toast.error(message, {
            position: 'top-center', 
            style: { 
                border: '1px solid #ef4444', 
                color: '#ef4444',
                backgroundColor: '#fee2e2', 
            },
            iconTheme: { 
                primary: '#ef4444', 
                secondary: '#fff' 
            },
        });
    };

    // --- Validation Logic Function ---
    const validateFiles = (fileList) => {
        const filesToUpload = [];
        const invalidTypeFiles = [];
        const oversizedFiles = [];

        for (const file of fileList) {
            // Get the file extension (e.g., 'file.docx' -> 'docx')
            const extension = file.name.split('.').pop().toLowerCase();

            if (!validExtensions.includes(extension)) {
                invalidTypeFiles.push(file);
                continue;
            }

            if (file.size > maxFileSize) {
                oversizedFiles.push(file);
                continue;
            }

            filesToUpload.push(file);
        }

        if (invalidTypeFiles.length > 0) {
            const invalidFileNames = invalidTypeFiles.map(f => f.name).join(', ');
            showErrorToast(
                `The following files were rejected: ${invalidFileNames}. Only JPG, PNG, WEBP, PDF, DOC, and DOCX files are allowed.`
            );
        }

        if (oversizedFiles.length > 0) {
            const oversizedFileNames = oversizedFiles.map(f => f.name).join(', ');
            showErrorToast(
                `The following files exceed the 10MB limit: ${oversizedFileNames}.`
            );
        }

        return filesToUpload;
    };
    // ---------------------------------
    
    // --- New Handlers for Toast Notifications ---
    
    const handleRemoveFile = (sectionTitle, fileId, fileName) => {
        // 1. Tawagin ang prop function
        removeFile(sectionTitle, fileId);
        // 2. Ipakita ang success toast para sa pagtanggal
        showSuccessToast(`File "${fileName}" has been successfully removed.`);
    };

    // FIX: Ipakita muna ang Toaster at tawagin ang submitDocuments() sa huli.
    // NOTE: Kung lalabas pa rin ang alert, ang problema ay nasa implementation ng 'submitDocuments' function (sa parent component).
    const handleSubmitDocuments = () => {
        // 1. Ipakita ang success toast para sa submission (Ito ang gusto mong notification
        // 2. Tawagin ang prop function (Ito ay dapat walang 'alert()' function sa loob nito)
        submitDocuments();
    };

    // --------------------------------------------

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

    // --- Updated Drop Handler with Validation ---
    const onDropHandler = (e, section) => { 
        setDraggingSection(null); 
        e.preventDefault(); 

        const fileList = e.dataTransfer.files;
        const validFileList = validateFiles(fileList);
        
        if (validFileList.length > 0) {
            handleDrop(e, section); 
        }
    };
    // ------------------------------------------

    // --- Updated File Select Handler with Validation ---
    const handleFileInputChange = (e, sectionTitle) => {
        const fileList = e.target.files;
        const validFileList = validateFiles(fileList);
        
        if (validFileList.length > 0) {
            handleFileSelect(e, sectionTitle);
        }
        
        // Reset the input value to allow the same file to be selected again
        e.target.value = null;
    };
    // ---------------------------------------------------

    return (
        <div className="ud-docs-wrapper">
            {/* INILAGAY ANG TOASTER DITO para gumana ang notifications */}
            <Toaster />
            
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
                                            accept={acceptedFileTypes}
                                            onChange={(e) => handleFileInputChange(e, section.title)} 
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
                                        // Gumamit ng handler na may toast notification
                                        onClick={() => handleRemoveFile(section.title, file.id, file.name)}
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
                    // Gumamit ng handler na may toast notification
                    onClick={handleSubmitDocuments}
                >
                    Submit All Documents
                </button>
                <p className="ud-submit-note">
                    Ensure all documents are clear and legible before submitting
                </p>
            </div>

            {/* ── SUBMITTED DOCUMENTS GALLERY ── */}
            {isLoadingDocuments ? (
                <div className="ud-submitted-loading">
                    <div className="ud-submitted-spinner"></div>
                    <p>Loading submitted documents...</p>
                </div>
            ) : uploadedDocuments && uploadedDocuments.length > 0 ? (
                <div className="ud-submitted-section">
                    <div className="ud-submitted-header">
                        <div className="ud-submitted-title-row">
                            <div className="ud-submitted-icon-wrap">
                                <Icons.Check />
                            </div>
                            <h3>Submitted Documents</h3>
                        </div>
                        <span className="ud-submitted-count">{uploadedDocuments.length} file{uploadedDocuments.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="ud-submitted-grid">
                        {uploadedDocuments.map((doc, idx) => {
                            const isImage = doc.mimetype?.startsWith('image/') || 
                                            /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.filename || doc.originalName || '');
                            const fileUrl = doc.url || `https://wanderwaveph.onrender.com/uploads/documents/${doc.filename}`;

                            return (
                                <div key={doc._id || idx} className="ud-submitted-card">
                                    {isImage ? (
                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="ud-submitted-img-wrap">
                                            <img 
                                                src={fileUrl} 
                                                alt={doc.originalName || doc.filename || `Document ${idx + 1}`}
                                                className="ud-submitted-img"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            <div className="ud-submitted-img-fallback" style={{ display: 'none' }}>
                                                <Icons.File />
                                            </div>
                                            <div className="ud-submitted-img-overlay">
                                                <span>View</span>
                                            </div>
                                        </a>
                                    ) : (
                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="ud-submitted-file-wrap">
                                            <div className="ud-submitted-file-icon">
                                                <Icons.File />
                                            </div>
                                            <span className="ud-submitted-open-text">Open File</span>
                                        </a>
                                    )}
                                    <div className="ud-submitted-card-info">
                                        <span className="ud-submitted-name" title={doc.originalName || doc.filename}>
                                            {doc.originalName || doc.filename || `Document ${idx + 1}`}
                                        </span>
                                        {doc.section && (
                                            <span className="ud-submitted-section-tag">{doc.section}</span>
                                        )}
                                        {doc.size && (
                                            <span className="ud-submitted-size">
                                                {typeof doc.size === 'number' 
                                                    ? (doc.size / 1024).toFixed(1) + ' KB' 
                                                    : doc.size}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default DocumentsSection;