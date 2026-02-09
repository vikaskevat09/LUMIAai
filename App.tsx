
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
      setError("Failed to process selected images.");
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleGenerate = async () => {
    if (!settings.prompt.trim()) {
      setError("Please describe your vision.");
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
      setError(err.message || "Engine failure.");
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
          <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar shadow-2xl relative">
            <button onClick={() => setActivePolicy(null)} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4 text-white">{policy.title}</h2>
            <div className="text-neutral-400 text-sm space-y-3 leading-relaxed">
              <p>{policy.body}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 bg-[#0b0b0b]/80 backdrop-blur-md border-b border-neutral-800/50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-lg shadow-purple-500/20">L</div>
            <span className="text-xl font-black tracking-tighter text-white">Lumina<span className="text-purple-500">AI</span></span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-xs font-semibold">
            <button onClick={() => setActivePolicy('about')} className="text-neutral-400 hover:text-white transition-colors">About</button>
            <button onClick={() => setActivePolicy('contact')} className="text-neutral-400 hover:text-white transition-colors">Contact</button>
            <div className="h-3 w-px bg-neutral-800" />
            <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-black border border-green-500/20">Live</span>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-[1600px] mx-auto px-6 py-8 w-full space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Settings Panel - Left Side (More compact) */}
          <div className="lg:col-span-4 bg-[#161616] border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-xl lg:order-1 sticky top-24">
            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Settings
            </h3>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Style</label>
              <select 
                value={settings.style}
                onChange={(e) => setSettings({ ...settings, style: e.target.value })}
                className="w-full bg-[#0b0b0b] border border-neutral-800 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-purple-500 text-white appearance-none cursor-pointer"
              >
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Aspect Ratio</label>
              <div className="grid grid-cols-5 gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.value}
                    onClick={() => setSettings({ ...settings, aspectRatio: ar.value as AspectRatio })}
                    className={`h-10 flex items-center justify-center rounded-xl text-[9px] font-black border transition-all ${
                      settings.aspectRatio === ar.value 
                        ? 'border-purple-500 bg-purple-500/10 text-white' 
                        : 'border-neutral-800 text-neutral-500 hover:border-neutral-700'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Quality</label>
                <select 
                  value={settings.quality}
                  onChange={(e) => setSettings({ ...settings, quality: e.target.value as Quality })}
                  className="w-full bg-[#0b0b0b] border border-neutral-800 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-purple-500 text-white appearance-none cursor-pointer"
                >
                  {QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Variants</label>
                <select 
                  value={settings.batchCount}
                  onChange={(e) => setSettings({ ...settings, batchCount: Number(e.target.value) })}
                  className="w-full bg-[#0b0b0b] border border-neutral-800 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-purple-500 text-white appearance-none cursor-pointer"
                >
                  {BATCH_COUNTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Reference</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex justify-center px-4 py-6 border border-neutral-800 border-dashed rounded-2xl hover:border-purple-500/50 hover:bg-purple-500/[0.02] transition-all cursor-pointer group"
              >
                <div className="text-center pointer-events-none">
                  <svg className="mx-auto h-6 w-6 text-neutral-600 group-hover:text-purple-500 mb-1" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[9px] font-bold text-neutral-500">Influence Generation</p>
                  <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileChange} accept="image/*" />
                </div>
              </div>
              {settings.referenceImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {settings.referenceImages.map((img, i) => (
                    <div key={i} className="relative w-10 h-10 rounded-lg border border-neutral-800 overflow-hidden group shadow-md">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button onClick={(e) => { e.stopPropagation(); setSettings(prev => ({ ...prev, referenceImages: prev.referenceImages.filter((_, idx) => idx !== i) })); }} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-bold transition-opacity">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Creation Workspace - Right Side */}
          <div className="lg:col-span-8 space-y-8 lg:order-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-white tracking-tighter">Vision Craft.</h1>
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-lg">Neural v2.5</span>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <textarea
                  value={settings.prompt}
                  onChange={(e) => setSettings({ ...settings, prompt: e.target.value })}
                  placeholder="A cinematic cyberpunk street at midnight..."
                  className="relative w-full h-40 bg-[#161616] border border-neutral-800 rounded-2xl p-6 text-base font-medium focus:ring-0 focus:border-purple-500 focus:outline-none transition-all resize-none placeholder:text-neutral-800 text-white shadow-inner"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black text-base flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] ${
                loading 
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-700' 
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-purple-900/10'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="animate-pulse">Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>Generate Vision</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center space-x-2 text-red-500 bg-red-500/5 border border-red-500/20 p-3 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold">{error}</span>
              </div>
            )}
          </div>
        </div>

        <section id="gallery-section" className="space-y-8 pt-12">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <h2 className="text-2xl font-black text-white tracking-tighter">Vault.</h2>
            {results.length > 0 && <span className="text-[9px] font-black text-neutral-500 tracking-widest uppercase">{results.length} Artifacts</span>}
          </div>

          {results.length === 0 && !loading && (
            <div className="text-center py-24 border border-neutral-800 border-dashed rounded-3xl bg-[#111]/10">
              <p className="text-xs font-bold text-neutral-600">No masterpieces yet. Begin above.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((img) => (
              <div key={img.id} className="group relative bg-[#161616] rounded-2xl overflow-hidden border border-neutral-800/50 transition-all duration-500">
                <div className={`${getAspectClass(img.aspectRatio)} relative overflow-hidden bg-black/60`}>
                  <img src={img.url} alt={img.prompt} loading="lazy" className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
                    <div className="flex justify-end">
                       <button onClick={() => deleteImage(img.id)} className="w-8 h-8 bg-red-500/20 hover:bg-red-500 text-white rounded-lg flex items-center justify-center transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-3">
                      <p className="text-white text-[10px] font-bold line-clamp-2 italic leading-relaxed">"{img.prompt}"</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => downloadImage(img.url, img.id)} className="bg-white text-black py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all">Export</button>
                        <button onClick={() => handleRemix(img.prompt)} className="bg-neutral-800 text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-neutral-700 transition-all border border-neutral-700">Remix</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && [...Array(settings.batchCount)].map((_, i) => (
              <div key={`load-${i}`} className={`${getAspectClass(settings.aspectRatio)} bg-[#161616] animate-pulse rounded-2xl border border-neutral-800`} />
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#0b0b0b] border-t border-neutral-800/50 pt-16 pb-8 mt-16">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-sm">L</div>
                <span className="text-xl font-black text-white">Lumina AI</span>
              </div>
              <p className="text-neutral-600 text-[10px] leading-relaxed max-w-xs font-medium uppercase tracking-wider">
                Professional Visual Synthesis Engine.
              </p>
            </div>
            
            <div className="md:col-span-2 flex justify-around">
              <div>
                <h4 className="text-white font-black text-[9px] uppercase tracking-[0.3em] mb-6 text-neutral-500">Legal</h4>
                <ul className="space-y-3 text-[10px] font-bold text-neutral-400">
                  <li><button onClick={() => setActivePolicy('privacy')} className="hover:text-purple-400">Privacy</button></li>
                  <li><button onClick={() => setActivePolicy('terms')} className="hover:text-purple-400">Terms</button></li>
                  <li><button onClick={() => setActivePolicy('cookie')} className="hover:text-purple-400">Cookies</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-black text-[9px] uppercase tracking-[0.3em] mb-6 text-neutral-500">Support</h4>
                <ul className="space-y-3 text-[10px] font-bold text-neutral-400">
                  <li><button onClick={() => setActivePolicy('about')} className="hover:text-purple-400">Vision</button></li>
                  <li><button onClick={() => setActivePolicy('contact')} className="hover:text-purple-400">Support</button></li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col space-y-4">
            </div>
          </div>
          
          <div className="border-t border-neutral-800/50 pt-8 flex flex-col md:flex-row justify-between items-center text-[9px] font-black uppercase tracking-2 text-neutral-700">
            <p>© 2024 Lumina AI Network.</p>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
               <span>Forever Free</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
