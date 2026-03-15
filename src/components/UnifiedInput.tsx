import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Camera, Send, X, Image as ImageIcon, FileText, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UnifiedInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onFileProcessed: (text: string) => void;
  isProcessing: boolean;
  isExtracting: boolean;
  setIsExtracting: (loading: boolean) => void;
}

export const UnifiedInput: React.FC<UnifiedInputProps> = ({
  value,
  onChange,
  onAnalyze,
  onFileProcessed,
  isProcessing,
  isExtracting,
  setIsExtracting,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
    }
  }, [value]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setIsExtracting(true);

    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target?.result as string;
          const base64Content = base64Data.split(',')[1];
          window.dispatchEvent(new CustomEvent('extract-image-text', { 
            detail: { base64: base64Content, mimeType: file.type } 
          }));
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        window.dispatchEvent(new CustomEvent('extract-pdf-text', { 
          detail: { arrayBuffer } 
        }));
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        onFileProcessed(text);
      } else {
        alert('Unsupported file type. Please upload an image, PDF, or text file.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process file.');
    } finally {
      setIsExtracting(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const base64Data = canvasRef.current.toDataURL('image/png');
        const base64Content = base64Data.split(',')[1];
        
        window.dispatchEvent(new CustomEvent('extract-image-text', { 
          detail: { base64: base64Content, mimeType: 'image/png' } 
        }));
        stopCamera();
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Camera Overlay */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <div className="bg-stone-900 rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full relative border border-stone-700">
              <button 
                onClick={stopCamera}
                className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 z-10"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="aspect-video bg-black flex items-center justify-center relative">
                {cameraError ? (
                  <div className="text-white text-center p-8">
                    <p className="text-rose-400 mb-2 font-medium">{cameraError}</p>
                    <button onClick={stopCamera} className="text-sm underline opacity-70">Close</button>
                  </div>
                ) : (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {!cameraError && (
                <div className="p-6 flex justify-center bg-stone-900 border-t border-stone-800">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center group hover:scale-105 transition-transform"
                  >
                    <div className="w-12 h-12 bg-white rounded-full group-active:scale-90 transition-transform" />
                  </button>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Input Container */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-white dark:bg-[#252525] border-2 rounded-3xl transition-all duration-300 shadow-xl ${
          isDragging 
            ? 'border-orange-500 ring-4 ring-orange-500/10' 
            : 'border-stone-200 dark:border-stone-800 focus-within:border-orange-300 dark:focus-within:border-orange-700'
        }`}
      >
        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-orange-500/5 backdrop-blur-[2px] rounded-[22px] z-10 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-orange-500 text-white px-6 py-3 rounded-full font-medium shadow-lg flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                Drop to attach files
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 flex flex-col gap-2">
          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter text, upload files, or take a photo..."
            className="w-full bg-transparent border-none focus:ring-0 text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 resize-none min-h-[60px] max-h-[300px] py-2 px-2 text-base leading-relaxed custom-scrollbar"
          />

          {/* Action Bar */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 dark:border-stone-800/50">
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-stone-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-xl transition-all"
                title="Attach Files"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                onClick={startCamera}
                className="p-2.5 text-stone-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-xl transition-all"
                title="Take Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
              
              {isExtracting && (
                <div className="flex items-center gap-2 ml-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-medium animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing asset...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {value.length > 0 && (
                <button
                  onClick={() => onChange("")}
                  className="text-xs font-medium text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onAnalyze}
                disabled={isProcessing || !value.trim() || isExtracting}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-medium transition-all shadow-lg ${
                  isProcessing || !value.trim() || isExtracting
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed shadow-none'
                    : 'bg-[#d97757] hover:bg-[#c86646] text-white shadow-orange-900/10 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          accept="image/*,.pdf,.txt"
        />
      </div>

      {/* Helper Text */}
      <div className="mt-4 flex justify-center gap-8 text-[10px] uppercase tracking-widest text-stone-400 font-bold opacity-60">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-3 h-3" />
          <span>Multimodal OCR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          <span>PDF Extraction</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Camera className="w-3 h-3" />
          <span>Live Capture</span>
        </div>
      </div>
    </div>
  );
};

// Re-exporting RefreshCw for the button
import { RefreshCw } from 'lucide-react';
