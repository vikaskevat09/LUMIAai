
import React, { useState, useRef } from 'react';
import { 
  GenerationSettings, 
  AspectRatio, 
  Quality, 
  GeneratedImage 
} from './types.ts';
import { 
  STYLES, 
  ASPECT_RATIOS, 
  BATCH_COUNTS, 
  QUALITIES 
} from './constants.tsx';
import { generateAIImages } from './services/geminiService.ts';
import AdPlaceholder from './components/AdPlaceholder.tsx';

type PolicyPage = 'privacy' | 'terms' | 'dmca' | 'cookie' | 'about' | 'contact' | 'disclaimer' | null;

const App: React.FC = () => {
  const [settings, setSettings] = useState<GenerationSettings>({
    prompt: '',
    style: 'None',
    aspectRatio: AspectRatio.SQUARE,
    quality: Quality.STANDARD,
    batchCount: 1,
    referenceImages: []
  });

  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePolicy, setActivePolicy] = useState<PolicyPage>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files).slice(0, 5) as File[];
    
    try {
      const readFilesPromises = filesArray.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(readFilesPromises);
      setSettings(prev => ({
        ...prev,
        referenceImages: [...prev.referenceImages, ...base64Images].slice(0, 5)
      }));
    } catch (err) {
      console.error("Error reading files:", err);
      setError("Failed to process selected images. Please try again.");
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleGenerate = async () => {
    if (!settings.prompt.trim()) {
      setError("Please describe what you want to see.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const urls = await generateAIImages(settings);
      const newGeneratedImages: GeneratedImage[] = urls.map((url, idx) => ({
        id: Math.random().toString(36).substr(2, 9),
        url,
        prompt: settings.prompt,
        timestamp: Date.now() + idx,
        aspectRatio: settings.aspectRatio
      }));

      setResults(prev => [...newGeneratedImages, ...prev]);
      const gallery = document.getElementById('gallery-section');
      gallery?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Engine failure. Please refine your prompt and try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumina-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemix = (prompt: string) => {
    setSettings(prev => ({ ...prev, prompt }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shareImage = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Image URL copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy URL");
    }
  };

  const deleteImage = (id: string) => {
    setResults(prev => prev.filter(img => img.id !== id));
  };

  const renderPolicyContent = () => {
    switch (activePolicy) {
      case 'privacy': return { title: 'Privacy Policy', body: 'Lumina AI respects your privacy. We do not store your personal images or prompt data on our servers beyond the session generation period.' };
      case 'terms': return { title: 'Terms & Conditions', body: 'By using Lumina AI, you agree to generate responsible content. We prohibit illegal or harmful generations.' };
      case 'dmca': return { title: 'DMCA Notice', body: 'We respond to all valid DMCA takedown requests for images generated on our platform.' };
      case 'cookie': return { title: 'Cookie Policy', body: 'We use cookies to enhance your experience and for ad personalization via Google AdSense.' };
      case 'about': return { title: 'About Lumina AI', body: 'Lumina AI is a premium platform for AI art generation, powered by state-of-the-art models.' };
      case 'contact': return { title: 'Contact Us', body: 'Email us at support@lumina-ai.example.com for any queries.' };
      case 'disclaimer': return { title: 'Disclaimer', body: 'Images are AI-generated and may not reflect reality. Use responsibly.' };
      default: return null;
    }
  };

  const policy = renderPolicyContent();

  const getAspectClass = (ratio: AspectRatio) => {
    switch(ratio) {
      case AspectRatio.SQUARE: return 'aspect-square';
      case AspectRatio.LANDSCAPE_16_9: return 'aspect-video';
      case AspectRatio.PORTRAIT_9_16: return 'aspect-[9/16]';
      case AspectRatio.LANDSCAPE_4_3: return 'aspect-[4/3]';
      case AspectRatio.PORTRAIT_3_4: return 'aspect-[3/4]';
      default: return 'aspect-square';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0b] text-neutral-200">
      {activePolicy && policy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar shadow-2xl relative">
            <button onClick={() => setActivePolicy(null)} className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">{policy.title}</h2>
            <div className="text-neutral-400 space-y-4 leading-relaxed">
              <p>{policy.body}</p>
              <p className="text-sm italic">Last updated: June 2024</p>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 bg-[#0b0b0b]/80 backdrop-blur-md border-b border-neutral-800/50">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-purple-500/20">L</div>
            <span className="text-2xl font-black tracking-tighter text-white">Lumina<span className="text-purple-500">AI</span></span>
          </div>
          <div className="hidden md:flex items-center space-x-10 text-sm font-semibold">
            <button onClick={() => setActivePolicy('about')} className="text-neutral-400 hover:text-white transition-colors">About</button>
            <button onClick={() => setActivePolicy('contact')} className="text-neutral-400 hover:text-white transition-colors">Contact</button>
            <div className="h-4 w-px bg-neutral-800" />
            <span className="bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest font-black border border-green-500/20">System Live</span>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-[1800px] mx-auto px-6 lg:px-12 py-10 w-full space-y-12">
        <AdPlaceholder className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Settings Panel - Left Side (Wider and Full Height capable) */}
          <div className="lg:col-span-4 bg-[#161616] border border-neutral-800 rounded-[2.5rem] p-10 space-y-10 shadow-2xl lg:order-1 sticky top-28">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Engine Configuration
            </h3>

            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Creative Style</label>
              <select 
                value={settings.style}
                onChange={(e) => setSettings({ ...settings, style: e.target.value })}
                className="w-full bg-[#0b0b0b] border border-neutral-800 rounded-2xl p-5 text-sm font-bold focus:outline-none focus:border-purple-500 text-white appearance-none cursor-pointer hover:border-neutral-700 transition-colors"
              >
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Aspect Ratio Selection</label>
              <div className="grid grid-cols-5 gap-3">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.value}
                    onClick={() => setSettings({ ...settings, aspectRatio: ar.value as AspectRatio })}
                    className={`h-16 flex items-center justify-center rounded-2xl text-xs font-black border transition-all duration-300 ${
                      settings.aspectRatio === ar.value 
                        ? 'border-purple-500 bg-purple-500/10 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)] scale-[1.05]' 
                        : 'border-neutral-800 text-neutral-500 hover:border-neutral-600'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Output Fidelity</label>
                <select 
                  value={settings.quality}
                  onChange={(e) => setSettings({ ...settings, quality: e.target.value as Quality })}
                  className="w-full bg-[#0b0b0b] border border-neutral-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-purple-500 text-white appearance-none cursor-pointer"
                >
                  {QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Variant Density</label>
                <select 
                  value={settings.batchCount}
                  onChange={(e) => setSettings({ ...settings, batchCount: Number(e.target.value) })}
                  className="w-full bg-[#0b0b0b] border border-neutral-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-purple-500 text-white appearance-none cursor-pointer"
                >
                  {BATCH_COUNTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Visual Reference</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex justify-center px-10 py-10 border-2 border-neutral-800 border-dashed rounded-3xl hover:border-purple-500/50 hover:bg-purple-500/[0.03] transition-all cursor-pointer relative group"
              >
                <div className="space-y-3 text-center pointer-events-none">
                  <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <svg className="h-7 w-7 text-neutral-500 group-hover:text-purple-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="text-sm font-bold text-neutral-400">
                    Drop imagery to <span className="text-purple-500">influence generation</span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      multiple 
                      onChange={handleFileChange} 
                      accept="image/png, image/jpeg, image/webp" 
                    />
                  </div>
                </div>
              </div>
              {settings.referenceImages.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-6">
                  {settings.referenceImages.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl border-2 border-neutral-800 overflow-hidden group shadow-lg">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSettings(prev => ({ ...prev, referenceImages: prev.referenceImages.filter((_, idx) => idx !== i) }));
                        }}
                        className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-2xl font-black transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Creation Workspace - Right Side (Wider and Clearer) */}
          <div className="lg:col-span-8 space-y-12 lg:order-2">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-5xl font-black text-white tracking-tighter">Vision Craft.</h1>
                <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 px-5 py-2 rounded-2xl">
                  <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">Neural Engine v2.5</span>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
                <textarea
                  value={settings.prompt}
                  onChange={(e) => setSettings({ ...settings, prompt: e.target.value })}
                  placeholder="Describe your masterpiece... (e.g., A sprawling futuristic metropolis built into a massive canyon at sunset, hyper-detailed, synthwave color palette)"
                  className="relative w-full h-64 bg-[#161616] border-2 border-neutral-800 rounded-[2.5rem] p-10 text-xl font-medium focus:ring-0 focus:border-purple-500 focus:outline-none transition-all resize-none placeholder:text-neutral-700 text-white shadow-inner custom-scrollbar"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-8 rounded-[2rem] font-black text-2xl tracking-tight flex items-center justify-center space-x-4 transition-all transform active:scale-[0.97] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${
                loading 
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-700' 
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:shadow-[0_20px_50px_rgba(168,85,247,0.3)] text-white'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="animate-pulse tracking-widest uppercase text-lg">Synthesizing Imagery</span>
                </>
              ) : (
                <>
                  <span>Initialize Generation</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center space-x-4 text-red-500 bg-red-500/10 border-2 border-red-500/20 p-6 rounded-3xl animate-shake">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-lg font-bold">{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-[#161616] p-8 rounded-[2rem] border border-neutral-800/50">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 mb-4">Prompt Tips</h4>
                 <p className="text-sm text-neutral-400 font-medium leading-relaxed italic">"Try adding keywords like 'volumetric lighting', 'macro photography', or 'unreal engine 5' for more dramatic results."</p>
              </div>
              <div className="bg-[#161616] p-8 rounded-[2rem] border border-neutral-800/50">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 mb-4">Batch Processing</h4>
                 <p className="text-sm text-neutral-400 font-medium leading-relaxed italic">"Generating variants (2-5) helps you find the perfect interpretation of your creative vision."</p>
              </div>
            </div>
          </div>
        </div>

        <section id="gallery-section" className="space-y-12 pt-16">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-8">
            <h2 className="text-6xl font-black text-white tracking-tighter flex items-end">
              Masterpiece Vault
              {results.length > 0 && (
                <span className="ml-10 text-sm font-black text-neutral-500 bg-neutral-900 border border-neutral-800 px-6 py-2.5 rounded-full tracking-widest uppercase">
                  {results.length} Artifacts Collected
                </span>
              )}
            </h2>
          </div>

          {results.length === 0 && !loading && (
            <div className="text-center py-40 border-2 border-neutral-800/50 border-dashed rounded-[4rem] bg-[#111]/20">
              <div className="w-24 h-24 bg-neutral-900 rounded-3xl flex items-center justify-center mx-auto mb-10 text-neutral-700">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
              </div>
              <h3 className="text-2xl font-black text-neutral-400 mb-4">The vault is empty</h3>
              <p className="text-neutral-600 font-bold max-w-sm mx-auto">Your creative journey begins above. Generate visions to store them in your professional vault.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {results.map((img) => (
              <div key={img.id} className="group relative bg-[#161616] rounded-[3rem] overflow-hidden border-2 border-neutral-800/50 hover:border-purple-500/50 transition-all duration-700 shadow-3xl">
                <div className={`${getAspectClass(img.aspectRatio)} relative overflow-hidden bg-black/60`}>
                  <img 
                    src={img.url} 
                    alt={img.prompt} 
                    loading="lazy" 
                    className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-between p-10">
                    <div className="flex justify-end">
                       <button onClick={() => deleteImage(img.id)} className="w-12 h-12 bg-red-500/20 hover:bg-red-500 text-white rounded-2xl flex items-center justify-center transition-all border border-red-500/40 backdrop-blur-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-6 transform translate-y-10 group-hover:translate-y-0 transition-transform duration-700">
                      <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                        <p className="text-white text-base font-bold line-clamp-3 italic leading-relaxed">"{img.prompt}"</p>
                        <div className="mt-3 flex items-center space-x-3 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                           <span>{img.aspectRatio} Aspect</span>
                           <div className="w-1 h-1 bg-neutral-700 rounded-full" />
                           <span>Lumina Processed</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => downloadImage(img.url, img.id)}
                          className="bg-white text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center hover:bg-neutral-200 transition-all shadow-2xl"
                        >
                          Export Artifact
                        </button>
                        <button 
                          onClick={() => handleRemix(img.prompt)}
                          className="bg-neutral-800 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center hover:bg-neutral-700 transition-all border border-neutral-700 shadow-2xl"
                        >
                          Modify Logic
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && [...Array(settings.batchCount)].map((_, i) => (
              <div key={`load-${i}`} className={`${getAspectClass(settings.aspectRatio)} bg-[#161616] animate-pulse rounded-[3rem] border-2 border-neutral-800 shadow-2xl overflow-hidden`}>
                 <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-transparent flex items-center justify-center">
                    <div className="text-neutral-800 font-black text-[10rem] select-none">...</div>
                 </div>
              </div>
            ))}
          </div>

          <AdPlaceholder label="Partner Innovation" className="mt-12" />
        </section>
      </main>

      <footer className="bg-[#0b0b0b] border-t border-neutral-800/50 pt-32 pb-16 mt-32">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg">L</div>
                <span className="text-3xl font-black text-white tracking-tighter">Lumina AI</span>
              </div>
              <p className="text-neutral-500 text-base leading-relaxed max-w-sm font-medium">
                Engineered for the elite. A professional grade, dark-themed visual synthesizer powered by cutting-edge neural frameworks.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.4em] mb-10">Protocols</h4>
              <ul className="space-y-5 text-sm font-bold text-neutral-500">
                <li><button onClick={() => setActivePolicy('privacy')} className="hover:text-purple-400 transition-colors">Privacy Shield</button></li>
                <li><button onClick={() => setActivePolicy('terms')} className="hover:text-purple-400 transition-colors">Service Terms</button></li>
                <li><button onClick={() => setActivePolicy('cookie')} className="hover:text-purple-400 transition-colors">Cookie Governance</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.4em] mb-10">Knowledge</h4>
              <ul className="space-y-5 text-sm font-bold text-neutral-500">
                <li><button onClick={() => setActivePolicy('about')} className="hover:text-purple-400 transition-colors">Core Vision</button></li>
                <li><button onClick={() => setActivePolicy('contact')} className="hover:text-purple-400 transition-colors">Direct Support</button></li>
                <li><button onClick={() => setActivePolicy('dmca')} className="hover:text-purple-400 transition-colors">Rights Management</button></li>
              </ul>
            </div>

            <div className="flex flex-col space-y-6">
              <AdPlaceholder label="Network Member" className="min-h-[160px] border-none bg-indigo-600/5" />
            </div>
          </div>
          
          <div className="border-t border-neutral-800/50 pt-12 flex flex-col md:flex-row justify-between items-center text-[11px] font-black uppercase tracking-[0.3em] text-neutral-600">
            <div className="flex items-center space-x-3">
               <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
               <p>© 2024 Lumina AI Network. All Rights Reserved. Engineered Globally.</p>
            </div>
            <div className="mt-8 md:mt-0 flex items-center space-x-6">
               <span className="text-neutral-500">Forever Free Engine</span>
               <div className="h-4 w-px bg-neutral-800" />
               <span>AdSense Compliant Infrastructure</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
