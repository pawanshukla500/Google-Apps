import React, { useRef, useState } from 'react';
import { X, Image as ImageIcon, Upload, Check, Plus } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageUploaderProps {
  label: string;
  subLabel?: string;
  type: 'front' | 'back';
  image: UploadedImage | null;
  onUpload: (img: UploadedImage) => void;
  onRemove: () => void;
  required?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  subLabel, 
  type, 
  image, 
  onUpload, 
  onRemove, 
  required = false 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onUpload({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: reader.result as string,
        type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full group">
      <div className="flex justify-between items-center mb-2">
        <label className="text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-2">
          {label}
          {required && (
            <span className="text-red-500" title="Required">*</span>
          )}
        </label>
        {image && (
          <span className="text-[9px] font-medium text-emerald-600 flex items-center gap-1">
             Ready
          </span>
        )}
      </div>
      
      {image ? (
        <div className="relative w-full h-full min-h-[140px] bg-gray-50 rounded-sm overflow-hidden border border-gray-100 group-hover:border-gray-300 transition-all duration-300">
          <img src={image.previewUrl} alt={label} className="w-full h-full object-cover mix-blend-multiply" />
          
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute top-2 right-2 bg-black text-white p-1.5 rounded-full hover:bg-red-600 transition-colors z-10"
            title="Remove Image"
          >
            <X size={12} />
          </button>
          
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-2 border-t border-gray-100">
             <p className="text-[9px] font-bold text-black uppercase truncate">{image.file.name}</p>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full h-full min-h-[140px] rounded-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border border-dashed
            ${isDragging 
              ? 'bg-gray-50 border-black scale-[0.99]' 
              : 'bg-white border-gray-300 hover:border-black hover:bg-gray-50'
            }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${isDragging ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-black group-hover:text-white'}`}>
            <Plus size={16} />
          </div>
          <p className="text-[10px] font-bold text-black uppercase tracking-wide group-hover:underline decoration-1 underline-offset-4">Upload</p>
          <input 
            type="file" 
            ref={inputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={handleFileChange} 
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;