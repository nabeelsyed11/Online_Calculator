import React, { useEffect, useRef, useState } from 'react';

function ImageUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [ocrResult, setOcrResult] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setOcrResult(null);
    setMessage('');
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage('');
    setOcrResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setMessage(json.message || 'Uploaded');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUploading(false);
    }
  };

  const solveWithOCR = async (inputFile) => {
    const f = inputFile || file;
    if (!f) return;
    setUploading(true);
    setMessage('Solving with OCR...');
    setOcrResult(null);
    try {
      const formData = new FormData();
      formData.append('image', f);
      const res = await fetch('/solve-image', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'OCR failed');
      setOcrResult(json);
      setMessage('OCR complete');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUploading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      streamRef.current = stream;
    } catch (e) {
      setMessage('Camera access denied or unavailable');
    }
  };

  const stopCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    const fileFromCamera = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setPreview(URL.createObjectURL(blob));
    setFile(fileFromCamera);
    await solveWithOCR(fileFromCamera);
  };

  return (
    <div className="image-upload">
      <h2>Image Upload / Camera OCR</h2>
      <div className="upload-form">
        <input
          className="file-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
        />

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="upload-button" onClick={upload} disabled={!file || uploading}>
            Upload Image
          </button>
          <button className="upload-button" onClick={() => solveWithOCR()} disabled={!file || uploading}>
            Solve From Image (OCR)
          </button>
        </div>

        {message && <p>{message}</p>}

        {preview && (
          <img src={preview} alt="preview" className="preview-image" />
        )}

        <hr />

        <div>
          <h3>Camera</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, justifyItems: 'center' }}>
            <video ref={videoRef} style={{ maxWidth: '100%', borderRadius: 8 }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="upload-button" onClick={startCamera}>Start Camera</button>
              <button className="upload-button" onClick={capturePhoto}>Capture & Solve</button>
              <button className="upload-button" onClick={stopCamera}>Stop Camera</button>
            </div>
          </div>
        </div>

        {ocrResult && (
          <div style={{ marginTop: 20, textAlign: 'left' }}>
            <h3>OCR Result</h3>
            <p><strong>Recognized Text:</strong> {ocrResult.recognizedText || '(none)'}</p>
            <p><strong>Expression:</strong> {ocrResult.expression || '(not detected)'}</p>
            <p><strong>Result:</strong> {ocrResult.result !== null && ocrResult.result !== undefined ? String(ocrResult.result) : '(n/a)'}</p>
            {ocrResult.error && <p><strong>Note:</strong> {ocrResult.error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUpload;
