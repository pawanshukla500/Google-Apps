import React, { useState } from 'react';
import { X, Loader2, ArrowRight } from 'lucide-react';
import { GeneratedImage } from '../types';
import { editFashionImage } from '../services/geminiService';

interface EditModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
  onUpdateImage: (id: number, newUrl: string) => void;
}

const EditModal: React.FC<EditModalProps> = ({ image, onClose, onUpdateImage }) => {
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!image || !image.imageUrl) return null;

  const handleEdit = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      const newImageUrl = await editFashionImage({
        imageBase64: image.imageUrl!,
        prompt: prompt
      });
      onUpdateImage(image.id, newImageUrl);
      onClose();
    } catch (err) {
      setError("Failed to edit image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex overflow-hidden shadow-2xl">
        
        {/* Left Side: Image */}
        <div className="w-1/2 bg-gray-100 flex items-center justify-center p-4 relative">
          <img src={image.imageUrl} alt="To Edit" className="max-w-full max-h-full object-contain" />
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-700 border border-gray-200 shadow-sm">
            Original Generated Image
          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Regenerate Pose
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Describe modifications to this pose. <br/>
                <span className="text-gray-500 text-xs">Example: "Change background to outdoor setting", "Adjust lighting", "Modify pose slightly".</span>
              </p>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Edit Instruction</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="What would you like to change?"
              />
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleEdit}
              disabled={isProcessing || !prompt.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Generate Edit <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;