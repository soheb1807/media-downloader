import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Automatically picks up Vercel environment variable or falls back to your Render live backend
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://media-downloader-backend-2ayq.onrender.com";

function App() {
    const [url, setUrl] = useState('');
    const [activeTab, setActiveTab] = useState('download'); // 'download', 'trimmer', 'thumbnail'
    const [type, setType] = useState('video');
    const [quality, setQuality] = useState('720');
    
    // Trimmer States
    const [trimSourceType, setTrimSourceType] = useState('link'); // 'link' or 'upload'
    const [uploadedFile, setUploadedFile] = useState(null);
    const [trimType, setTrimType] = useState('video'); // video or audio
    const [start, setStart] = useState('00:00:00'); 
    const [end, setEnd] = useState('00:00:30'); 
    
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [videoInfo, setVideoInfo] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    
    // PWA Install States
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallModal, setShowInstallModal] = useState(false);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, [darkMode]);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setDeferredPrompt(null);
        } else {
            setShowInstallModal(true);
        }
    };

    const fetchInfo = async () => {
        if (!url) return setStatus({ type: 'error', text: 'Please enter a valid video link.' });
        setLoading(true); setStatus(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/v1/info?url=${encodeURIComponent(url)}`);
            setVideoInfo(res.data);
            setStatus({ type: 'success', text: 'Thumbnail & metadata extracted successfully!' });
        } catch (err) {
            setStatus({ type: 'error', text: 'Failed to fetch details. Link might be restricted.' });
        }
        setLoading(false);
    };

    const handleAction = async (e) => {
        e.preventDefault();
        
        if (activeTab === 'trimmer') {
            if (trimSourceType === 'link' && !url) {
                return setStatus({ type: 'error', text: 'Please enter a video URL for trimming.' });
            }
            if (trimSourceType === 'upload' && !uploadedFile) {
                return setStatus({ type: 'error', text: 'Please select a video file from your device.' });
            }
        } else if (activeTab !== 'thumbnail' && !url) {
            return setStatus({ type: 'error', text: 'Please enter a valid media URL.' });
        }

        setLoading(true); setStatus(null);

        try {
            // Case 1: Uploaded File Trimming (Backend FFmpeg processing)
            if (activeTab === 'trimmer' && trimSourceType === 'upload' && uploadedFile) {
                const formData = new FormData();
                formData.append('video', uploadedFile);

                const response = await axios.post(
                    `${API_BASE_URL}/api/v1/trim-upload?start=${start}&end=${end}&type=${trimType}`,
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        responseType: 'blob'
                    }
                );

                const fileExt = trimType === 'audio' ? 'mp3' : 'mp4';
                const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = blobUrl;
                link.setAttribute('download', `Trimmed_Status_${Date.now()}.${fileExt}`); 
                document.body.appendChild(link); 
                link.click(); 
                link.parentNode.removeChild(link);
                
                setStatus({ type: 'success', text: `✨ Success! Trimmed ${fileExt.toUpperCase()} exported successfully.` });
                setLoading(false);
                return;
            }

            // Case 2 & 3: Normal Download / Link Trimming
            let apiUrl = `${API_BASE_URL}/api/v1/download?url=${encodeURIComponent(url)}&type=${activeTab === 'trimmer' ? trimType : type}&quality=${quality}`;
            
            if (activeTab === 'trimmer') {
                apiUrl += `&start=${start}&end=${end}`;
            }

            const response = await axios({ url: apiUrl, method: 'GET', responseType: 'blob' });
            const fileExtension = (activeTab === 'trimmer' ? trimType : type) === 'audio' ? 'mp3' : 'mp4';
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `AnySaver_${Date.now()}.${fileExtension}`); 
            document.body.appendChild(link); 
            link.click(); 
            link.parentNode.removeChild(link);
            
            setStatus({ type: 'success', text: '✨ Success! File processed and safely cleaned from server.' });
        } catch (error) {
            setStatus({ type: 'error', text: 'Processing failed. Check link permissions or time codes.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* Navbar */}
            <nav className="w-full px-6 py-4 max-w-6xl mx-auto flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-500/25">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tight">AnySaver<span className="text-blue-600 dark:text-blue-400">Pro</span></span>
                        <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">Universal Media Suite</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleInstallClick} 
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                        <span>📥 Install App</span>
                    </button>
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 transition-transform cursor-pointer">
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 pt-12 pb-24">
                {/* Hero Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold mb-4">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span> Lightning Fast & 100% Secure
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-none">
                        Download & Edit Media <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                            Without Limits
                        </span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-xl mx-auto font-medium">
                        The ultimate web utility for creators and users to extract media, cut WhatsApp statuses, and grab HD thumbnails.
                    </p>
                </div>

                {/* Main Interactive Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.55rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-6 md:p-10 backdrop-blur-xl">
                    
                    {/* Modern Tabs */}
                    <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl mb-8 border border-slate-200/50 dark:border-slate-800/80">
                        <button onClick={() => setActiveTab('download')} className={`py-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'download' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            📥 Downloader
                        </button>
                        <button onClick={() => setActiveTab('trimmer')} className={`py-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'trimmer' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            ✂️ Status Cutter
                        </button>
                        <button onClick={() => setActiveTab('thumbnail')} className={`py-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'thumbnail' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            🖼️ Creator Studio
                        </button>
                    </div>

                    {/* URL Input (For Downloader and Link Trimmer) */}
                    {activeTab !== 'trimmer' && activeTab !== 'thumbnail' && (
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Paste Video / Reel URL</label>
                            <input 
                                type="text" 
                                placeholder="https://www.youtube.com/watch?v=... or Instagram/Facebook link" 
                                value={url} 
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-blue-500 font-medium transition-all text-sm md:text-base"
                            />
                        </div>
                    )}

                    {/* Thumbnail URL Input */}
                    {activeTab === 'thumbnail' && (
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">YouTube Video URL</label>
                            <input 
                                type="text" 
                                placeholder="Paste YouTube link to grab thumbnail & title..." 
                                value={url} 
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-blue-500 font-medium transition-all text-sm md:text-base"
                            />
                        </div>
                    )}

                    {/* Trimmer Setup */}
                    {activeTab === 'trimmer' && (
                        <div className="mb-6 space-y-4">
                            <div className="flex gap-3 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <button type="button" onClick={() => setTrimSourceType('link')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${trimSourceType === 'link' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}>
                                    🔗 Link Trimmer
                                </button>
                                <button type="button" onClick={() => setTrimSourceType('upload')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${trimSourceType === 'upload' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}>
                                    📤 Uploaded File Trimmer
                                </button>
                            </div>

                            {trimSourceType === 'link' ? (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Source Video URL</label>
                                    <input 
                                        type="text" 
                                        placeholder="Paste link to cut..." 
                                        value={url} 
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-blue-500 font-medium text-sm"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Video from Device</label>
                                    <input 
                                        type="file" 
                                        accept="video/*"
                                        onChange={(e) => setUploadedFile(e.target.files[0])}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none text-xs font-medium file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Output Format</label>
                                <select value={trimType} onChange={(e) => setTrimType(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-medium text-sm">
                                    <option value="video">🎥 Trimmed Video (MP4)</option>
                                    <option value="audio">🎵 Extract Audio Only (MP3)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <div>
                                    <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Start Time</label>
                                    <input type="text" value={start} onChange={(e)=>setStart(e.target.value)} placeholder="00:00:00" className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-mono text-center text-sm font-bold" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">End Time</label>
                                    <input type="text" value={end} onChange={(e)=>setEnd(e.target.value)} placeholder="00:00:30" className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-mono text-center text-sm font-bold" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB ACTIONS */}
                    {activeTab === 'thumbnail' ? (
                        <div>
                            <button onClick={fetchInfo} disabled={loading} className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-pink-500/20 disabled:opacity-70 cursor-pointer">
                                {loading ? 'Analyzing Video...' : 'Extract Thumbnail & SEO Title'}
                            </button>
                            
                            {videoInfo?.thumbnail && (
                                <div className="mt-6 space-y-6 animate-fadeIn">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-left">
                                        <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider block mb-1">Detected Video Title</span>
                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">{videoInfo.title}</p>
                                        <button 
                                            onClick={() => { navigator.clipboard.writeText(videoInfo.title); alert('Title copied to clipboard!'); }}
                                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                                        >
                                            📋 Copy Title for SEO
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">Max Resolution Preview (1280x720)</label>
                                        <img src={videoInfo.thumbnail} alt="Thumbnail" className="w-full rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 mb-4 object-cover" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <a href={videoInfo.thumbnail} target="_blank" rel="noreferrer" className="p-3 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 rounded-xl text-center text-xs font-bold text-pink-700 dark:text-pink-400 hover:bg-pink-100 transition">
                                            🔥 Max HD (1280x720)
                                        </a>
                                        <a href={videoInfo.thumbnail.replace('maxresdefault', 'hqdefault')} target="_blank" rel="noreferrer" className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs font-bold hover:bg-slate-200 transition">
                                            ⚡ Standard HQ (480x360)
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'download' ? (
                        <form onSubmit={handleAction}>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Format</label>
                                    <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-medium text-sm">
                                        <option value="video">🎥 Video (MP4)</option>
                                        <option value="audio">🎵 Audio (MP3)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quality</label>
                                    {type === 'video' ? (
                                        <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none font-medium text-sm">
                                            <option value="1080">1080p Full HD</option>
                                            <option value="720">720p HD</option>
                                            <option value="360">360p Standard</option>
                                        </select>
                                    ) : (
                                        <div className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-center text-sm font-bold flex items-center justify-center">320kbps High</div>
                                    )}
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-base shadow-xl shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-70">
                                {loading ? 'Processing on Cloud...' : 'Download File Now'}
                            </button>
                        </form>
                    ) : (
                        <button onClick={handleAction} disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 text-white font-black text-base shadow-xl shadow-green-500/25 transition-all cursor-pointer disabled:opacity-70">
                            {loading ? 'Trimming & Exporting...' : `Export Trimmed ${trimType.toUpperCase()}`}
                        </button>
                    )}

                    {status && (
                        <div className={`mt-6 p-4 rounded-2xl text-center font-bold text-xs md:text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400'}`}>
                            {status.text}
                        </div>
                    )}
                </div>

                {/* HOW IT WORKS & EXAMPLES SECTION */}
                <div className="mt-20">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">How It Works & Live Examples</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Step-by-step guide to using our professional suite.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-black text-lg mb-4">01</div>
                                <h3 className="font-extrabold text-base mb-2">Universal Downloader</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">Save public reels, shorts, or full length videos in crisp MP4 or MP3 audio.</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 truncate">Example: youtu.be/...</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Result: 1080p Video / MP3 Audio</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center font-black text-lg mb-4">02</div>
                                <h3 className="font-extrabold text-base mb-2">Status Cutter & Audio</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">Cut 30-second clips from links or upload device files. Export as MP4 video or MP3 audio.</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="text-[11px] font-mono font-bold text-green-600 dark:text-green-400">Range: 00:00:00 to 00:00:30</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Result: Exact WhatsApp Status Clip</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center font-black text-lg mb-4">03</div>
                                <h3 className="font-extrabold text-base mb-2">Creator Studio</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">Pull HD cover thumbnails and copy optimized SEO video titles with a single click.</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="text-[11px] font-mono font-bold text-pink-600 dark:text-pink-400">Action: Fetch & Copy Title</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Result: Maxres Image & Keyword Text</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Install Guide Modal */}
            {showInstallModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">📥</div>
                        <h3 className="text-xl font-black mb-2">Install AnySaver Pro</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            Open your browser menu and select <strong className="text-blue-600 dark:text-blue-400">"Add to Home Screen"</strong> or <strong className="text-blue-600 dark:text-blue-400">"Install App"</strong> for an app-like experience.
                        </p>
                        <button onClick={() => setShowInstallModal(false)} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-sm cursor-pointer">
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;