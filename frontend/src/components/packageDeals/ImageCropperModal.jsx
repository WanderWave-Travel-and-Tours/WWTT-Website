import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';
import './ImageCropperModal.css';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });

async function getCroppedBlob(imageSrc, pixelCrop, rotation = 0, outputFileName = 'cropped.jpg') {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(image, safeArea / 2 - image.width / 2, safeArea / 2 - image.height / 2);

  const data = ctx.getImageData(0, 0, safeArea, safeArea);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], outputFileName, { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg', 0.92);
  });
}

const ImageCropperModal = ({ imageSrc, fileName, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setConfirming(true);
    try {
      const croppedFile = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation, fileName);
      onConfirm(croppedFile);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="icm-overlay">
      <div className="icm-card">
        {/* Header */}
        <div className="icm-header">
          <div>
            <h3 className="icm-header-title">
              Preview &amp; Crop
            </h3>
            <p className="icm-header-subtitle">
              Drag to reposition · Scroll to zoom
            </p>
          </div>
          <button
            onClick={onCancel}
            className="icm-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Crop area */}
        <div className="icm-crop-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controls */}
        <div className="icm-controls">
          {/* Zoom slider */}
          <div className="icm-zoom-row">
            <ZoomOut size={16} color="#94a3b8" />
            <input
              type="range"
              min={1} max={3} step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="icm-zoom-slider"
            />
            <ZoomIn size={16} color="#94a3b8" />
          </div>

          {/* Rotate + action buttons */}
          <div className="icm-actions-row">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="icm-rotate-btn"
            >
              <RotateCw size={15} /> Rotate
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="icm-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className={`icm-confirm-btn ${confirming ? 'icm-confirm-btn-busy' : 'icm-confirm-btn-idle'}`}
            >
              <Check size={15} />
              {confirming ? 'Processing...' : 'Use This Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
