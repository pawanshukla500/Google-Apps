import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ImageUploader from './components/ImageUploader';
import PromptPanel from './components/PromptPanel';
import Gallery from './components/Gallery';
import EditModal from './components/EditModal';
import { 
  DEFAULT_GLOBAL_PROMPT, 
  DEFAULT_POSES, 
  DEFAULT_QUALITY, 
  DEFAULT_STYLE_PRESET
} from './constants';
import { 
  UploadedImage, 
  PoseDefinition, 
  GlobalSettings, 
  GeneratedImage,
} from './types';
import { generateFashionImage, checkApiKey, openApiKeySelector, generatePoseIdeas } from './services/geminiService';
import { Key, Wand2, ArrowRight } from 'lucide-react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

const App: React.FC = () => {
  // State
  const [apiKeySet, setApiKeySet] = useState(false);
  const [frontImage, setFrontImage] = useState<UploadedImage | null>(null);
  const [backImage, setBackImage] = useState<UploadedImage | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    quality: DEFAULT_QUALITY,
    globalPrompt: DEFAULT_GLOBAL_PROMPT,
    stylePreset: DEFAULT_STYLE_PRESET
  });
  const [poses, setPoses] = useState<PoseDefinition[]>(DEFAULT_POSES);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);

  // Initial check for API Key
  useEffect(() => {
    checkApiKey().then(setApiKeySet);
  }, []);

  const handleApiKeySelection = async () => {
    await openApiKeySelector();
    setApiKeySet(true);
  };

  const handlePoseChange = (id: number, prompt: string) => {
    setPoses(poses.map(p => p.id === id ? { ...p, prompt } : p));
  };

  const handleAutoGeneratePoses = async () => {
    if (!frontImage) return;
    
    try {
      const generatedPrompts = await generatePoseIdeas(frontImage.base64);
      
      // Map the 5 generated strings to the 5 pose definitions
      const newPoses = poses.map((pose, index) => {
        if (index < generatedPrompts.length) {
          return { ...pose, prompt: generatedPrompts[index] };
        }
        return pose;
      });
      
      setPoses(newPoses);
    } catch (error) {
      console.error("Failed to auto-generate poses", error);
      alert("Could not auto-generate poses. Please check your API key and try again.");
    }
  };

  const generateSingleImage = async (pose: PoseDefinition, existingId?: number) => {
     if (!frontImage) return null;

     const augmentedGlobalPrompt = `${globalSettings.stylePreset} Aesthetic. ${globalSettings.globalPrompt}`;

     try {
       const result = await generateFashionImage({
          frontImageBase64: frontImage.base64,
          backImageBase64: backImage?.base64,
          globalPrompt: augmentedGlobalPrompt,
          posePrompt: pose.prompt,
          quality: globalSettings.quality
        });
        return result; // Now returns { imageUrl, usage }
     } catch (error) {
       console.error(error);
       throw error;
     }
  }

  const startBatchGeneration = async () => {
    if (!frontImage) return;

    setIsGenerating(true);
    
    // Initialize placeholders
    const newImages: GeneratedImage[] = poses.map(pose => ({
      id: Date.now() + pose.id,
      poseId: pose.id,
      imageUrl: null,
      status: 'loading',
      posePrompt: pose.prompt
    }));
    
    setGeneratedImages(newImages);

    // Process sequentially
    const results = [...newImages];
    for (let i = 0; i < results.length; i++) {
      const img = results[i];
      const poseDef = poses.find(p => p.id === img.poseId);
      if(!poseDef) continue;

      try {
        const result = await generateSingleImage(poseDef);
        if (result) {
          results[i] = { 
            ...img, 
            status: 'success', 
            imageUrl: result.imageUrl,
            usage: result.usage 
          };
        } else {
          throw new Error("No result returned");
        }
        setGeneratedImages([...results]); 
      } catch (error: any) {
        results[i] = { ...img, status: 'error', error: error.message || "Failed" };
        setGeneratedImages([...results]);
      }
    }

    setIsGenerating(false);
  };

  const handleRegenerateSingle = async (imageToRegen: GeneratedImage) => {
    if(!frontImage) return;

    setGeneratedImages(prev => prev.map(img => 
      img.id === imageToRegen.id ? { ...img, status: 'loading', error: undefined } : img
    ));

    const poseDef = poses.find(p => p.id === imageToRegen.poseId);
    if (!poseDef) return;

    try {
      const result = await generateSingleImage(poseDef);
      if (result) {
        setGeneratedImages(prev => prev.map(img => 
          img.id === imageToRegen.id ? { 
            ...img, 
            status: 'success', 
            imageUrl: result.imageUrl,
            usage: result.usage
          } : img
        ));
      }
    } catch (error: any) {
      setGeneratedImages(prev => prev.map(img => 
        img.id === imageToRegen.id ? { ...img, status: 'error', error: error.message } : img
      ));
    }
  };

  const updateEditedImage = (id: number, newUrl: string) => {
    setGeneratedImages(prev => prev.map(img => 
      img.id === id ? { ...img, imageUrl: newUrl, status: 'success' } : img
    ));
  };

  const handleDownloadAll = async () => {
    const successfulImages = generatedImages.filter(img => img.status === 'success' && img.imageUrl);
    if (successfulImages.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder("youthnic-photoshoot");

    successfulImages.forEach((img) => {
      if (img.imageUrl) {
        const base64Data = img.imageUrl.split(',')[1];
        folder?.file(`pose-${img.poseId}.png`, base64Data, { base64: true });
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(content, `youthnic-collection-${Date.now()}.zip`);
  };

  if (!apiKeySet) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 animate-in fade-in duration-700">
          <div className="p-10 bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 max-w-lg w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
            <div className="mb-8 flex justify-center">
              <div className="bg-black text-white w-16 h-16 flex items-center justify-center rounded-full shadow-lg">
                 <Key size={24} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-black mb-3">Studio Access Required</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Connect your Gemini API key to access the Youthnic high-fidelity generation engine.
              </p>
            </div>
            <button
              onClick={handleApiKeySelection}
              className="w-full py-4 bg-black hover:bg-gray-900 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-3"
            >
              Connect Key
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT COLUMN: STUDIO CONFIG */}
        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-32">
          
          {/* Section 1: Product Images */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48">
              <ImageUploader 
                label="Front Reference" 
                type="front" 
                required
                image={frontImage} 
                onUpload={setFrontImage} 
                onRemove={() => setFrontImage(null)} 
              />
            </div>
            <div className="h-48">
              <ImageUploader 
                label="Back Reference" 
                type="back" 
                image={backImage} 
                onUpload={setBackImage} 
                onRemove={() => setBackImage(null)} 
              />
            </div>
          </div>

          {/* Prompt Sections */}
          <PromptPanel 
            settings={globalSettings}
            poses={poses}
            onSettingsChange={setGlobalSettings}
            onPoseChange={handlePoseChange}
            onAutoGeneratePoses={handleAutoGeneratePoses}
            hasImage={!!frontImage}
          />

          {/* Action Area */}
          <div className="pt-2">
            <button
                onClick={startBatchGeneration}
                disabled={!frontImage || isGenerating}
                className={`w-full py-5 text-xs font-bold uppercase tracking-widest rounded-sm flex items-center justify-center gap-3 transition-all ${
                !frontImage || isGenerating
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-900 shadow-xl shadow-black/10 hover:shadow-2xl hover:scale-[1.01]'
                }`}
            >
                {isGenerating ? (
                <>
                    <Wand2 className="animate-spin" size={16} /> Processing Assets...
                </>
                ) : (
                <>
                    Generate Catalog <ArrowRight size={16} />
                </>
                )}
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-4 font-medium">
                Estimated Output: 5 High-Res Images • ~2 Mins
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="lg:col-span-8 min-h-[800px] border-l border-gray-100 pl-12">
           <Gallery 
            images={generatedImages} 
            onEdit={setEditingImage} 
            onRegenerate={handleRegenerateSingle}
            onDownloadAll={handleDownloadAll}
           />
        </div>
      </div>

      {/* Modals */}
      {editingImage && (
        <EditModal 
          image={editingImage} 
          onClose={() => setEditingImage(null)} 
          onUpdateImage={updateEditedImage}
        />
      )}
    </Layout>
  );
};

export default App;