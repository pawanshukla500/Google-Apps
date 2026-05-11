import React from 'react';
import { GeneratedImage } from '../types';
import { Download, Edit2, RefreshCw, Clock, Coins, AlertTriangle, Layers } from 'lucide-react';

interface GalleryProps {
  images: GeneratedImage[];
  onEdit: (img: GeneratedImage) => void;
  onRegenerate: (img: GeneratedImage) => void;
  onDownloadAll?: () => void;
  onSyncToDrive?: () => void;
  isSyncing?: boolean;
  sku?: string;
}

const Gallery: React.FC<GalleryProps> = ({ 
  images, 
  onEdit, 
  onRegenerate, 
  onDownloadAll, 
  onSyncToDrive,
  isSyncing,
  sku 
}) => {
  const currentDate = new Date().toLocaleDateString('en-US');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end pb-6 border-b border-gray-100">
        <div>
           <div className="flex items-center gap-2 text-gray-400 mb-1">
             <Layers size={14} />
             <span className="text-[10px] uppercase font-bold tracking-widest">Collection</span>
           </div>
           <h2 className="text-3xl font-serif text-black">{sku || 'New Project'}</h2>
        </div>
        
        <div className="flex gap-3">
          <button 
                onClick={onSyncToDrive}
                disabled={isSyncing || images.filter(i => i.status === 'success').length === 0}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-sm text-xs font-bold text-gray-600 uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSyncing ? (
                <>
                  <RefreshCw className="animate-spin" size={14} /> Syncing...
                </>
            ) : (
                <>
                  <RefreshCw size={14} /> Sync to Drive
                </>
            )}
          </button>
          <button 
            onClick={onDownloadAll}
            disabled={images.filter(i => i.status === 'success').length === 0}
            className="px-5 py-2.5 bg-black text-white border border-black rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {images.length === 0 ? (
           // Placeholder state matching the card style
           <div className="bg-gray-50/50 rounded-lg border border-dashed border-gray-200 flex flex-col items-center justify-center text-center col-span-full h-[500px]">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                 <Layers className="text-gray-300" size={24} />
               </div>
               <h3 className="text-lg font-serif text-gray-900 mb-2">Awaiting Input</h3>
               <p className="text-sm text-gray-400 max-w-xs leading-relaxed">Configure your shoot parameters on the left and generate to view results.</p>
           </div>
        ) : (
          images.map((img) => (
            <div key={img.id} className="bg-white p-4 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 group flex flex-col h-full border border-gray-100/50">
              <div className="aspect-[3/4] bg-gray-100 rounded-sm mb-5 overflow-hidden relative isolate">
                {img.status === 'loading' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Rendering</span>
                  </div>
                ) : img.status === 'error' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500 p-6 text-center">
                    <AlertTriangle size={24} className="mb-3 text-red-400" />
                    <p className="text-[10px] font-medium mb-4 leading-relaxed uppercase tracking-wide">{img.error || "Generation Failed"}</p>
                    <button onClick={() => onRegenerate(img)} className="bg-white px-4 py-2 rounded-sm shadow-sm hover:shadow border border-gray-200 text-black text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-gray-50 flex items-center gap-2">
                      <RefreshCw size={12} /> Retry
                    </button>
                  </div>
                ) : img.imageUrl ? (
                  <>
                    <img src={img.imageUrl} alt="Result" className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700" />
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                       <button onClick={() => onEdit(img)} className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform shadow-xl hover:bg-black hover:text-white" title="Edit"><Edit2 size={16} /></button>
                       <button onClick={() => onRegenerate(img)} className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform shadow-xl hover:bg-black hover:text-white" title="Regenerate"><RefreshCw size={16} /></button>
                       <a href={img.imageUrl} download={`pose-${img.poseId}.png`} className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform shadow-xl hover:bg-black hover:text-white" title="Download"><Download size={16} /></a>
                    </div>
                  </>
                ) : null}
              </div>
              
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-3">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    Catalog / 0{img.poseId}
                  </span>
                  <span className="text-[9px] text-gray-300 font-medium tabular-nums">{currentDate}</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900 truncate mb-1 font-serif">
                  {img.posePrompt ? img.posePrompt.split(',')[0] : `Pose ${img.poseId}`}
                </h4>
                <p className="text-[10px] text-gray-400 truncate mb-3">
                    {img.posePrompt}
                </p>
                
                {/* Usage Stats */}
                {img.usage && (
                   <div className="flex items-center justify-between bg-gray-50 p-2 rounded-sm">
                      <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase tracking-wide">
                        <Coins size={10} />
                        <span>{img.usage.totalTokens < 1000 ? img.usage.totalTokens : (img.usage.totalTokens/1000).toFixed(1) + 'k'} Tkn</span>
                      </div>
                      <div className="text-[9px] text-gray-900 font-bold">
                        ${img.usage.estimatedCost.toFixed(4)}
                      </div>
                   </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Gallery;