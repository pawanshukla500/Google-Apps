import React, { useState } from 'react';
import { Sparkles, Command, Wand2 } from 'lucide-react';
import { PoseDefinition, GlobalSettings, OutputQuality, StylePreset } from '../types';
import { STYLE_PRESETS } from '../constants';

interface PromptPanelProps {
  settings: GlobalSettings;
  poses: PoseDefinition[];
  onSettingsChange: (s: GlobalSettings) => void;
  onPoseChange: (id: number, prompt: string) => void;
  onAutoGeneratePoses?: () => Promise<void>;
  hasImage?: boolean;
}

const PromptPanel: React.FC<PromptPanelProps> = ({ 
  settings, 
  poses, 
  onSettingsChange, 
  onPoseChange,
  onAutoGeneratePoses,
  hasImage
}) => {
  const [activePoseTab, setActivePoseTab] = useState(0);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  // Labels matching the new 5-shot order
  const poseLabels = ["1. Front", "2. Side", "3. Back", "4. Sitting", "5. Detail"];

  const handleAutoGenerate = async () => {
    if (!onAutoGeneratePoses || !hasImage) return;
    setIsAutoGenerating(true);
    try {
      await onAutoGeneratePoses();
    } finally {
      setIsAutoGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Model Description Card */}
      <div className="bg-white p-0">
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
                Model Context
            </h3>
        </div>
        
        <div className="relative group">
            <textarea
            value={settings.globalPrompt}
            onChange={(e) => onSettingsChange({ ...settings, globalPrompt: e.target.value })}
            className="w-full h-24 bg-transparent border-b border-gray-200 p-0 py-2 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-black resize-none transition-all font-serif leading-relaxed"
            placeholder="Describe the model features (e.g. Scandinavian, 175cm, blonde hair)..."
            />
            <div className="absolute top-0 right-0 p-2 pointer-events-none">
                 <Command size={14} className="text-gray-200" />
            </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4">
           <div className="flex-1 min-w-[120px]">
             <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Aesthetic</label>
             <select 
                value={settings.stylePreset}
                onChange={(e) => onSettingsChange({...settings, stylePreset: e.target.value as StylePreset})}
                className="w-full text-xs font-medium bg-gray-50 border-none rounded px-3 py-2 text-black focus:ring-1 focus:ring-black cursor-pointer hover:bg-gray-100 transition-colors"
             >
                {STYLE_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
           </div>
           
           <div className="w-28">
             <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Quality</label>
             <select 
                value={settings.quality}
                onChange={(e) => onSettingsChange({...settings, quality: e.target.value as OutputQuality})}
                className="w-full text-xs font-medium bg-gray-50 border-none rounded px-3 py-2 text-black focus:ring-1 focus:ring-black cursor-pointer hover:bg-gray-100 transition-colors"
             >
                <option value={OutputQuality.Q_2K}>2K Studio</option>
                <option value={OutputQuality.Q_4K}>4K Ultra</option>
             </select>
           </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Pose Direction Card */}
      <div className="bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <h3 className="text-xs font-bold text-black uppercase tracking-wider">Shot Configuration</h3>
             {hasImage && (
                <button 
                  onClick={handleAutoGenerate}
                  disabled={isAutoGenerating}
                  className="flex items-center gap-1.5 px-2 py-1 bg-black text-white rounded text-[9px] font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                   {isAutoGenerating ? (
                     <Wand2 size={10} className="animate-spin" />
                   ) : (
                     <Sparkles size={10} />
                   )}
                   {isAutoGenerating ? 'Analyzing...' : 'Auto-Generate Poses'}
                </button>
             )}
          </div>
          <span className="text-[10px] font-medium text-gray-400">Step {activePoseTab + 1} of 5</span>
        </div>

        {/* Tabs - Minimal Black/White */}
        <div className="flex border-b border-gray-100 mb-6 overflow-x-auto no-scrollbar">
          {poses.map((pose, index) => (
            <button
              key={pose.id}
              onClick={() => setActivePoseTab(index)}
              className={`flex-1 py-3 px-1 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap relative ${
                activePoseTab === index
                  ? 'text-black'
                  : 'text-gray-300 hover:text-gray-500'
              }`}
            >
              {poseLabels[index] || `Pose ${index + 1}`}
              {activePoseTab === index && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></span>
              )}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="relative bg-gray-50 p-4 rounded-sm border border-gray-100 group hover:border-gray-200 transition-colors">
          <textarea
            value={poses[activePoseTab].prompt}
            onChange={(e) => onPoseChange(poses[activePoseTab].id, e.target.value)}
            className="w-full h-24 bg-transparent border-none p-0 text-sm text-gray-700 focus:outline-none focus:ring-0 resize-none font-sans"
            placeholder="Describe the pose details..."
          />
          <div className="flex justify-end mt-2">
              <span className="text-[10px] text-gray-400 font-medium">AI Instruction</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptPanel;