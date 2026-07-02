import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';

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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '92%', maxWidth: '520px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #e2e8f0'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
              Preview &amp; Crop
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
              Drag to reposition · Scroll to zoom
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px', borderRadius: '8px', color: '#64748b'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Crop area */}
        <div style={{ position: 'relative', width: '100%', height: '320px', background: '#0f172a' }}>
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
        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0' }}>
          {/* Zoom slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <ZoomOut size={16} color="#94a3b8" />
            <input
              type="range"
              min={1} max={3} step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#f97316' }}
            />
            <ZoomIn size={16} color="#94a3b8" />
          </div>

          {/* Rotate + action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', border: '1px solid #e2e8f0',
                borderRadius: '8px', background: '#f8fafc',
                cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: '600'
              }}
            >
              <RotateCw size={15} /> Rotate
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1, padding: '10px 16px',
                border: '1px solid #e2e8f0', borderRadius: '8px',
                background: '#f8fafc', cursor: 'pointer',
                fontSize: '13px', color: '#475569', fontWeight: '600'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              style={{
                flex: 2, padding: '10px 16px', border: 'none',
                borderRadius: '8px', background: '#f97316',
                color: '#fff', cursor: confirming ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                opacity: confirming ? 0.7 : 1
              }}
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
