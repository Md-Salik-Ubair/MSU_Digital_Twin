import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// Original Video & Image Assets
import avatarImg from './assets/avatar.jpg';
import idleVideo from './assets/idle.mp4';
import speakingVideo from './assets/speaking.mp4';
import thinkingVideo from './assets/thinking.mp4';

// Backend URL (LIVE RENDER SERVER)
const API_BASE_URL = 'https://salik-portfolio-backend.onrender.com';

function App() {
  const [currentView, setCurrentView] = useState('portfolio'); 
  const [backendData, setBackendData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // AI Cinematic Interface States
  const speakingRef = useRef(null);
  const thinkingRef = useRef(null);
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);
  
  const [aiState, setAiState] = useState('standby'); 
  const [userQuery, setUserQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]); 
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Modal States
  const [viewingNode, setViewingNode] = useState(null); 
  
  // Custom Toast Notification System
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
      setToast(message);
      setTimeout(() => setToast(null), 3000);
  };

  // Upload & Admin States
  const [isUploadingDP, setIsUploadingDP] = useState(false);
  const [isUploadingItemImg, setIsUploadingItemImg] = useState(false);
  const [editingNode, setEditingNode] = useState(null); 

  // Admin Forms
  const [profileForm, setProfileForm] = useState({
    full_name: '', professional_title: '', location: '', profile_summary: '', current_status: '',
    skills_list: '', languages_known: '', phone_number: '', whatsapp_link: '', family_narrative: '',
    display_picture_url: '', master_cv_url: '', master_cv_text: ''
  });

  const [socialForm, setSocialForm] = useState({
    email: '', linkedin: '', github: '', instagram: ''
  });

  const [itemForm, setItemForm] = useState({
    category: 'projects', title: '', organization_or_issuer: '', duration_or_date: '',
    description: '', hidden_readme: '', tag_or_skills_mapped: '', smart_links: [], image_urls: [] 
  });
  const [tempLink, setTempLink] = useState({ label: '', url: '' });

  // Escape key closes modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (viewingNode) setViewingNode(null);
        if (isChatOpen) setIsChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingNode, isChatOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory.length, aiState]);

  useEffect(() => {
    const handlePopState = (e) => {
        if (viewingNode) {
            e.preventDefault();
            setViewingNode(null); 
        } else if (isChatOpen) {
            e.preventDefault();
            setIsChatOpen(false); 
        }
    };
    
    if (viewingNode || isChatOpen) {
        window.history.pushState(null, "", window.location.href);
    }
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewingNode, isChatOpen]);

  // Core API Fetching
  const refreshPortfolioData = () => {
    fetch(`${API_BASE_URL}/api/portfolio/data`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setBackendData(data);
          setProfileForm({
            full_name: data.profile_core?.full_name || '',
            professional_title: data.profile_core?.professional_title || '',
            location: data.profile_core?.location || '',
            profile_summary: data.profile_core?.profile_summary || '',
            current_status: data.profile_core?.current_status || '',
            phone_number: data.profile_core?.phone_number || '',
            whatsapp_link: data.profile_core?.whatsapp_link || '',
            skills_list: data.profile_core?.skills_list || '',
            languages_known: data.profile_core?.languages_known || '',
            family_narrative: data.family_meta?.summary || '',
            display_picture_url: data.profile_core?.display_picture_url || '',
            master_cv_url: data.profile_core?.master_cv_url || '',
            master_cv_text: data.profile_core?.master_cv_text || ''
          });
          setSocialForm({
            email: data.social_channels?.email || '',
            linkedin: data.social_channels?.linkedin || '',
            github: data.social_channels?.github || '',
            instagram: data.social_channels?.instagram || ''
          });
        }
        setLoading(false); 
      })
      .catch(err => {
        console.error("Database connection failure.", err);
        setLoading(false);
      });
  };

  useEffect(() => { refreshPortfolioData(); }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(res => res.json()).then(data => {
      if (data.success) setIsAuthenticated(true);
      else showToast("Login Failed");
    }).catch(() => showToast("Server unreachable"));
  };

  // Upload & Form Management
  const handleImageUpload = async (e, type = 'dp') => {
    const file = e.target.files[0];
    if (!file) return;
    const IMGBB_API_KEY = "67a2f496c1625f298a33f240d8366100"; 
    
    if (type === 'dp') setIsUploadingDP(true);
    else setIsUploadingItemImg(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        if (type === 'dp') {
            setProfileForm({ ...profileForm, display_picture_url: data.data.url });
            showToast("Profile Photo Updated");
        } else {
            setItemForm({ ...itemForm, image_urls: [...(itemForm.image_urls || []), data.data.url] });
        }
      } else { showToast("Upload Failed"); }
    } catch (err) { showToast("Network Error during upload"); }

    if (type === 'dp') setIsUploadingDP(false);
    else setIsUploadingItemImg(false);
  };

  const removeUploadedImage = (index) => {
      const newImages = [...(itemForm.image_urls || [])];
      newImages.splice(index, 1);
      setItemForm({ ...itemForm, image_urls: newImages });
  };
  
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/portfolio/update-core`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileForm)
    }).then(res => res.json()).then(resData => {
      if (resData.success) {
        fetch(`${API_BASE_URL}/api/portfolio/update-socials`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(socialForm)
        }).then(() => { 
            fetch(`${API_BASE_URL}/api/portfolio/update-family`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: profileForm.family_narrative })
            }).then(() => {
                showToast("Data Synced to Core"); 
                refreshPortfolioData(); 
            });
        });
      }
    });
  };

  const addSmartLink = (e) => { e.preventDefault(); if (tempLink.label.trim() && tempLink.url.trim()) { setItemForm({ ...itemForm, smart_links: [...(itemForm.smart_links || []), tempLink] }); setTempLink({ label: '', url: '' }); } };
  const removeSmartLink = (index) => { const newLinks = [...(itemForm.smart_links || [])]; newLinks.splice(index, 1); setItemForm({ ...itemForm, smart_links: newLinks }); };
  
  const triggerEditNode = (category, node, e) => { 
    if(e) e.stopPropagation();
    let loadedSmartLinks = node.smart_links ? [...node.smart_links] : [];
    if (node.external_redirection_link && loadedSmartLinks.length === 0) { loadedSmartLinks.push({ label: 'Project Link', url: node.external_redirection_link }); }
    setEditingNode({ category, id: node.id }); 
    setItemForm({ 
        category: category, 
        title: node.title || '', 
        organization_or_issuer: node.organization_or_issuer || '', 
        duration_or_date: node.duration_or_date || '', 
        description: node.description || '', 
        hidden_readme: node.hidden_readme || '',
        tag_or_skills_mapped: node.tag_or_skills_mapped || '', 
        smart_links: loadedSmartLinks, 
        image_urls: node.image_urls || [] 
    }); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const cancelEdit = () => { setEditingNode(null); setItemForm({ category: 'projects', title: '', organization_or_issuer: '', duration_or_date: '', description: '', hidden_readme: '', tag_or_skills_mapped: '', smart_links: [], image_urls: [] }); };
  
  const handleItemSubmit = (e) => {
    e.preventDefault();
    const url = editingNode ? `${API_BASE_URL}/api/portfolio/item/${editingNode.category}/${editingNode.id}` : `${API_BASE_URL}/api/portfolio/item/${itemForm.category}`;
    fetch(url, { method: editingNode ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemForm) })
    .then(res => res.json()).then(resData => { if (resData.success) { showToast("Node Saved"); cancelEdit(); refreshPortfolioData(); } });
  };

  const handleDeleteNode = (category, id, e) => {
    if(e) e.stopPropagation();
    if (!window.confirm("Delete this entry permanently?")) return;
    fetch(`${API_BASE_URL}/api/portfolio/item/${category}/${id}`, { method: 'DELETE' }).then(res => res.json()).then(resData => { if (resData.success) refreshPortfolioData(); });
  };

  const handleMoveNode = (category, index, direction, e) => {
      if(e) e.stopPropagation();
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= backendData[category].length) return;
      
      const newData = [...backendData[category]];
      const temp = newData[index];
      newData[index] = newData[newIndex];
      newData[newIndex] = temp;
      
      setBackendData({...backendData, [category]: newData});
      
      fetch(`${API_BASE_URL}/api/portfolio/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, items: newData.map(item => item.id) })
      }).catch(() => {});
  };

  const getSkillIconUrl = (skillName) => {
    if (!skillName) return '';
    const s = skillName.toLowerCase().trim();
    const map = {
        'react.js': 'react', 'react': 'react', 'reactjs': 'react',
        'node.js': 'nodejs', 'nodejs': 'nodejs', 'node': 'nodejs',
        'python': 'python', 'mongodb': 'mongodb', 'mongo': 'mongodb',
        'flask': 'flask', 'git': 'git', 'github': 'github',
        'numpy': 'numpy', 'pandas': 'pandas', 'tensorflow': 'tensorflow',
        'scikit-learn': 'scikitlearn', 'sql': 'mysql', 'mysql': 'mysql',
        'javascript': 'javascript', 'js': 'javascript', 'java': 'java',
        'c++': 'cplusplus', 'c': 'c', 'html': 'html5', 'css': 'css3',
        'docker': 'docker', 'aws': 'amazonwebservices', 'figma': 'figma',
        'linux': 'linux', 'ubuntu': 'ubuntu', 'bash': 'bash', 'power bi': 'windows8'
    };
    const mapped = map[s] || s.replace(/[^a-z0-9]/g, '');
    return `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${mapped}/${mapped}-original.svg`;
  };

  // Virtual Presence Engine
  const isMuted = !isAudioEnabled;

  const stopAllAudio = () => {
    if (audioRef.current) { 
        audioRef.current.pause(); 
        audioRef.current.removeAttribute('src'); 
        audioRef.current.load(); 
        audioRef.current = null;
    }
    if (speakingRef.current) { speakingRef.current.pause(); speakingRef.current.currentTime = 0; }
    if (thinkingRef.current) { thinkingRef.current.pause(); thinkingRef.current.currentTime = 0; }
  };

  const handleStopResponse = () => {
    if (['intro', 'answering'].includes(aiState)) {
        stopAllAudio();
        setIsChatLoading(false);
        setAiState('idle'); 
        setChatHistory(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'ai') {
                const updatedChat = [...prev];
                updatedChat[updatedChat.length - 1] = {
                    ...lastMsg,
                    text: lastMsg.text + "\n\n*(Response stopped)*"
                };
                return updatedChat;
            }
            return prev;
        });
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(prev => {
        const nextState = !prev;
        const willBeMuted = !nextState;
        if (audioRef.current) audioRef.current.muted = willBeMuted;
        if (speakingRef.current) speakingRef.current.muted = willBeMuted || (aiState !== 'intro');
        if (thinkingRef.current) thinkingRef.current.muted = willBeMuted;
        if (nextState && aiState === 'answering' && speakingRef.current && speakingRef.current.paused) {
             speakingRef.current.play().catch(e => console.log("Video Play Blocked:", e));
        }
        return nextState;
    });
  };

  useEffect(() => {
      if (audioRef.current) audioRef.current.muted = isMuted;
      if (speakingRef.current) speakingRef.current.muted = isMuted || (aiState !== 'intro');
      if (thinkingRef.current) thinkingRef.current.muted = isMuted;
  }, [isMuted, aiState]);

  const startIntroSequence = () => {
    stopAllAudio(); 
    setAiState('intro');
    const introText = "Hello. I am the AI representation of Md Salik Ubair. I can provide insights into his engineering background, technical projects, and systems architecture experience. How can I assist you today?";
    setChatHistory([{ role: 'ai', text: introText }]);
    
    if (!isMuted && speakingRef.current) {
        speakingRef.current.currentTime = 0;
        speakingRef.current.play().catch(e => console.error("AutoPlay blocked:", e));
    } else {
        setTimeout(() => setAiState('idle'), 2500); 
    }
  };

  const handleSpeakingEnded = () => { if (aiState === 'intro') setAiState('idle'); };
  const handleThinkingEnded = () => { if (aiState === 'thinking') setAiState('idle_waiting'); };

  const playBackendStream = (data) => {
    stopAllAudio(); 
    const responseText = data.ai_response || "Connection verified.";
    const audioUrl = data.audio_url;
    
    if (audioUrl) {
        const fullAudioUrl = `${API_BASE_URL}${audioUrl}?t=${new Date().getTime()}`; 
        const newAudio = new Audio(fullAudioUrl);
        audioRef.current = newAudio; 
        newAudio.muted = isMuted; 
        
        newAudio.onplaying = () => {
            if (!audioRef.current) return;
            setAiState('answering');
            setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]); 
            setIsChatLoading(false);
            if (speakingRef.current) {
                speakingRef.current.currentTime = 0;
                speakingRef.current.play().catch(e => console.log("Video Play Blocked:", e));
            }
        };
        newAudio.onended = () => {
            setAiState('idle');
            if (speakingRef.current) speakingRef.current.pause();
        };
        newAudio.onerror = (e) => {
            console.error("Audio Load Error:", e);
            setAiState('idle');
            setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]); 
            setIsChatLoading(false);
        };
        newAudio.play().catch(e => { 
            console.error("Audio AutoPlay blocked:", e); 
            setAiState('idle'); 
            setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]); 
            setIsChatLoading(false);
        });
    } else {
        setAiState('idle');
        setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]);
        setIsChatLoading(false);
    }
  };

  const executeAiQuery = (queryText) => {
    if (!queryText.trim() || ['intro', 'thinking'].includes(aiState) || isChatLoading) return;
    
    if (aiState === 'answering') handleStopResponse();
    
    setIsChatLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', text: queryText }]);
    setUserQuery('');
    setAiState('thinking');
    stopAllAudio(); 

    if (thinkingRef.current) {
        thinkingRef.current.currentTime = 0;
        thinkingRef.current.play().catch(e => console.log("Thinking video blocked", e));
    }

    fetch(`${API_BASE_URL}/api/rag/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: queryText })
    })
    .then(res => res.json())
    .then(data => playBackendStream(data))
    .catch(() => {
      setChatHistory(prev => [...prev, { role: 'ai', text: "The backend instance is currently unavailable or experiencing high load. Please try again momentarily." }]);
      setAiState('idle');
      setIsChatLoading(false);
    });
  };

  const triggerAiQuery = (e) => {
      e.preventDefault();
      executeAiQuery(userQuery);
  };

  const showThinking = ['thinking', 'idle_waiting'].includes(aiState) && !isMuted;
  const showSpeaking = ['intro', 'answering'].includes(aiState) && !isMuted;
  const showIdle = ['standby', 'idle'].includes(aiState) || isMuted;

  // Navigation Links
  const navLinks = [
    { label: 'About', view: 'portfolio', section: 'top' },
    { label: 'Experience', view: 'portfolio', section: 'section-experiences' },
    { label: 'Projects', view: 'portfolio', section: 'section-projects' },
    { label: 'Education', view: 'portfolio', section: 'section-education' },
    { label: 'Certifications', view: 'portfolio', section: 'section-certifications_and_achievements' },
    { label: 'Admin', view: 'admin-hub', section: null },
  ];

  const handleNavClick = (view, sectionId) => {
      setCurrentView(view);
      setIsMobileMenuOpen(false);
      if(sectionId && view === 'portfolio') {
          setTimeout(() => {
              if(sectionId === 'top') {
                  window.scrollTo({top: 0, behavior: 'smooth'});
              } else {
                  const element = document.getElementById(sectionId);
                  if(element) element.scrollIntoView({behavior: 'smooth', block: 'start'});
              }
          }, 100);
      }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans antialiased selection:bg-white/20 scroll-smooth">
      
      {/* Toast Notification */}
      {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] animate-fadeIn">
              <div className="bg-[#111]/95 border border-white/10 text-white px-5 py-2.5 rounded-full text-xs font-mono tracking-wide backdrop-blur-2xl shadow-2xl flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  {toast}
              </div>
          </div>
      )}

      {/* Atmospheric Background Lighting */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-gradient-to-b from-sky-500/[0.04] via-indigo-500/[0.02] to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ============================================================== */}
      {/* 🚀 MINIMALIST LOADER 🚀 */}
      {/* ============================================================== */}
      {loading ? (
          <div className="fixed inset-0 z-[99999] bg-[#050505] flex flex-col items-center justify-center select-none">
              <div className="flex flex-col items-center space-y-4">
                  <span className="font-mono text-sm tracking-[0.4em] text-white/90 font-semibold">MSU</span>
                  <div className="w-24 h-[1.5px] bg-white/10 relative overflow-hidden rounded-full">
                      <div className="w-10 h-full bg-white absolute animate-[shimmer_1.4s_infinite]"></div>
                  </div>
              </div>
          </div>
      ) : (

        // ==============================================================
        // 🌟 MAIN APPLICATION VIEW 🌟
        // ==============================================================
        <>
          {/* NAVIGATION BAR */}
          <nav className="fixed w-full border-b border-white/[0.04] bg-[#050505]/80 backdrop-blur-2xl z-50 px-6 md:px-12 py-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavClick('portfolio', 'top')}>
              <span className="font-mono text-xs font-semibold tracking-widest text-slate-300 hover:text-white transition-colors">
                MSU
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
                {navLinks.map((link, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleNavClick(link.view, link.section)}
                        className="text-xs font-medium tracking-wider text-slate-400 hover:text-white transition-colors"
                    >
                        {link.label}
                    </button>
                ))}
            </div>

            <div className="md:hidden flex items-center">
                 <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 text-lg hover:text-slate-300 transition-colors">
                     {isMobileMenuOpen ? '✕' : '☰'}
                 </button>
            </div>
          </nav>

          {/* MOBILE MENU */}
          {isMobileMenuOpen && (
              <div className="fixed top-[65px] left-0 w-full bg-[#050505]/95 backdrop-blur-3xl border-b border-white/5 z-40 md:hidden flex flex-col p-6 space-y-4 shadow-2xl animate-fadeIn">
                  {navLinks.map((link, idx) => (
                      <button 
                          key={idx}
                          onClick={() => handleNavClick(link.view, link.section)}
                          className="text-sm font-medium tracking-widest text-slate-300 hover:text-white py-2 text-left transition-all"
                      >
                          {link.label}
                      </button>
                  ))}
              </div>
          )}

          {/* ITEM PREVIEW MODAL */}
          {viewingNode && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-10 bg-black/90 backdrop-blur-xl animate-fadeIn" onClick={() => setViewingNode(null)}>
                <div className="bg-[#0a0a0a] border border-white/[0.04] w-full h-full md:w-full md:max-w-3xl md:h-auto md:max-h-[85vh] md:rounded-3xl overflow-y-auto shadow-2xl relative scrollbar-hide" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setViewingNode(null)} className="absolute top-5 right-5 w-8 h-8 bg-black/60 hover:bg-white/10 text-white rounded-full flex items-center justify-center border border-white/10 transition-colors z-50 text-sm">✕</button>
                    
                    <div className="w-full h-56 md:h-72 relative bg-black flex items-end">
                        {viewingNode?.image_urls?.length > 0 && (
                            <img src={viewingNode.image_urls[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-10" />
                        
                        <div className="relative z-20 p-6 md:p-10 w-full">
                            <div className="flex flex-wrap items-center gap-3 mb-2 text-xs text-slate-400 font-mono">
                                <span className="uppercase tracking-widest">{viewingNode._category?.replace(/_/g, ' ')}</span>
                                <span className="text-slate-600">•</span>
                                <span>{viewingNode.duration_or_date}</span>
                            </div>
                            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">{viewingNode.title}</h2>
                            <p className="text-sm md:text-base text-slate-400 font-medium mt-2">{viewingNode.organization_or_issuer}</p>
                        </div>
                    </div>
                    
                    <div className="p-6 md:p-10 space-y-8 relative z-20">
                        {viewingNode.tag_or_skills_mapped && (
                            <div className="flex flex-wrap gap-2">
                                {viewingNode.tag_or_skills_mapped.split(',').map((skill, i) => (
                                    <span key={i} className="text-slate-400 text-[11px] font-mono border border-white/5 bg-white/[0.02] px-3 py-1 rounded-full">
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="prose prose-invert max-w-none text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                            {viewingNode.description}
                        </div>

                        {viewingNode?.image_urls?.length > 1 && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500">Supporting Assets</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {viewingNode.image_urls.slice(1).map((img, idx) => (
                                        <a href={img} target="_blank" rel="noreferrer" key={idx} className="block aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 pt-6 border-t border-white/[0.04]">
                            {viewingNode.smart_links?.map((link, idx) => (
                                <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-white hover:text-slate-300 text-sm font-medium transition-colors inline-flex items-center gap-1.5 border border-white/10 px-5 py-2.5 rounded-full">
                                    {link.label} ↗
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* MAIN DESKTOP WORKSPACE */}
          <main className="max-w-6xl mx-auto px-5 md:px-12 pt-28 md:pt-40 pb-24 relative z-10">
            {currentView === 'portfolio' ? (
              <div className="space-y-24 md:space-y-36 animate-fadeIn">
                
                {/* 🚀 HERO SECTION (NO BOXES, CIRCULAR DP, CLEAN TEXT LINKS) 🚀 */}
                <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-12 md:gap-16 pt-4">
                  
                  <div className="flex-1 space-y-8 text-center md:text-left">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
                          {backendData?.profile_core?.full_name || "Md Salik Ubair"}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-base md:text-xl text-slate-300 font-medium">
                          <span>{backendData?.profile_core?.professional_title || "AI Systems Engineer"}</span>
                          {backendData?.profile_core?.location && (
                              <span className="text-slate-500 font-mono text-xs md:text-sm font-normal">— {backendData.profile_core.location}</span>
                          )}
                        </div>
                    </div>

                    {backendData?.profile_core?.profile_summary && (
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto md:mx-0 font-normal">
                            {backendData.profile_core.profile_summary}
                        </p>
                    )}

                    {/* CLEAN TEXT LINKS (NO BOXES) */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 pt-4">
                      {backendData?.profile_core?.phone_number && (
                          <span className="inline-flex items-center gap-2 text-slate-400 text-xs md:text-sm font-mono cursor-default">
                              <span className="opacity-70">📞</span> {backendData.profile_core.phone_number}
                          </span>
                      )}
                      {backendData?.social_channels?.email && (
                          <a href={`mailto:${backendData.social_channels.email}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-all text-xs md:text-sm group">
                              <span className="opacity-70 group-hover:opacity-100 transition-opacity">✉️</span> 
                              <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white/100 transition-all">Email</span>
                          </a>
                      )}
                      {backendData?.social_channels?.linkedin && (
                          <a href={backendData.social_channels.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-all text-xs md:text-sm group">
                              <span className="opacity-70 group-hover:opacity-100 transition-opacity">🔗</span> 
                              <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white/100 transition-all">LinkedIn</span>
                          </a>
                      )}
                      {backendData?.social_channels?.github && (
                          <a href={backendData.social_channels.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-all text-xs md:text-sm group">
                              <span className="opacity-70 group-hover:opacity-100 transition-opacity">💻</span> 
                              <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white/100 transition-all">GitHub</span>
                          </a>
                      )}
                      {backendData?.social_channels?.instagram && (
                          <a href={backendData.social_channels.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-all text-xs md:text-sm group">
                              <span className="opacity-70 group-hover:opacity-100 transition-opacity">📸</span> 
                              <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white/100 transition-all">Instagram</span>
                          </a>
                      )}
                      {backendData?.profile_core?.whatsapp_link && (
                          <a href={backendData.profile_core.whatsapp_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-all text-xs md:text-sm group">
                              <span className="opacity-70 group-hover:opacity-100 transition-opacity">💬</span> 
                              <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white/100 transition-all">WhatsApp</span>
                          </a>
                      )}
                      {backendData?.profile_core?.master_cv_url && (
                          <a href={backendData.profile_core.master_cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-white font-semibold transition-all text-xs md:text-sm group ml-2">
                              <span>📄</span> 
                              <span className="underline underline-offset-4 decoration-white/40 group-hover:decoration-white/100 transition-all">Resume ↗</span>
                          </a>
                      )}
                    </div>
                  </div>

                  {/* FOUNDER-LEVEL CIRCULAR AVATAR WITH SOFT GLOW */}
                  <div className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 shrink-0 mx-auto md:mx-0">
                      <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/10 to-indigo-400/10 rounded-full blur-2xl -z-10"></div>
                      <img src={backendData?.profile_core?.display_picture_url || avatarImg} alt="Profile" className="w-full h-full object-cover rounded-full border border-white/5 shadow-2xl relative z-10" />
                  </div>
                </div>

                {/* 🚀 CORE SKILLS (PILL TAGS, ORGANIZED & CLEAN) 🚀 */}
                <div className="space-y-6 pt-4">
                  <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500">
                    Core Proficiencies
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    {backendData?.profile_core?.skills_list ? (
                      backendData.profile_core.skills_list.split(',').filter(s => s.trim() !== "").map((skill, index) => (
                        <div key={index} className="inline-flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] text-slate-300 text-xs md:text-sm px-4 py-2 rounded-full font-mono cursor-default transition-colors hover:bg-white/[0.04]">
                          <img 
                              src={getSkillIconUrl(skill)} 
                              alt="" 
                              className="w-4 h-4 object-contain"
                              onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          {skill.trim()}
                        </div>
                      ))
                    ) : <span className="text-xs text-slate-500 font-mono">Loading data...</span>}
                  </div>
                </div>

                {/* 🚀 CONTENT SECTIONS (GHOST CARDS, NO HARSH BOXES) 🚀 */}
                {['experiences', 'projects', 'education', 'certifications_and_achievements'].map((sec) => {
                  if (!backendData || !backendData[sec] || backendData[sec].length === 0) return null;
                  const displayTitle = sec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <div key={sec} id={`section-${sec}`} className="space-y-8 scroll-mt-32">
                      <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/[0.04] pb-4">
                        {displayTitle}
                      </h2>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                        {(backendData[sec] || []).map((item) => {
                          return (
                            <div 
                                key={item.id} 
                                onClick={() => setViewingNode({...item, _category: sec})}
                                className="group cursor-pointer bg-transparent border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.01] rounded-3xl p-6 md:p-8 transition-all duration-300 flex flex-col justify-between"
                            >
                              <div className="space-y-4 pointer-events-none">
                                {item.image_urls && item.image_urls.length > 0 && (
                                  <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden mb-5 border border-white/[0.04] bg-[#070707]">
                                      <img src={item.image_urls[0]} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                                  </div>
                                )}
                                <div className="flex items-start justify-between gap-4">
                                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-slate-200 transition-colors leading-snug">{item.title}</h3>
                                  <span className="text-[10px] sm:text-xs font-mono text-slate-500 shrink-0 text-right">{item.duration_or_date}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-400">{item.organization_or_issuer}</p>
                                
                                {item.tag_or_skills_mapped && (
                                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
                                        {item.tag_or_skills_mapped.split(',').slice(0, 4).map((skill, i) => (
                                            <span key={i} className="text-slate-500 text-[11px] font-mono flex items-center">
                                                {skill.trim()} {i !== 3 && i !== item.tag_or_skills_mapped.split(',').length - 1 && <span className="ml-3 opacity-30">•</span>}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 pt-2">{item.description}</p>
                              </div>
                              
                              <div className="mt-6 flex justify-start pt-4 border-t border-white/[0.03] pointer-events-none">
                                  <span className="text-xs font-medium text-slate-500 group-hover:text-white transition-colors flex items-center gap-2">Read Document <span className="group-hover:translate-x-1 transition-transform">→</span></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {/* 🚀 EXECUTIVE DIRECT CONTACT & FOOTER 🚀 */}
                <footer className="pt-24 md:pt-32 pb-8 text-center space-y-12">
                    <div className="max-w-2xl mx-auto space-y-4">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Let's connect.</h2>
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                            Open to advanced systems engineering roles, production architectures, and technical consultations.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {backendData?.social_channels?.email && (
                            <a href={`mailto:${backendData.social_channels.email}`} className="bg-white hover:bg-slate-200 text-black font-semibold px-8 py-3.5 rounded-full transition-all text-sm font-medium">
                                Send Email
                            </a>
                        )}
                        {backendData?.social_channels?.linkedin && (
                            <a href={backendData.social_channels.linkedin} target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-full transition-all text-sm font-medium border border-white/5">
                                LinkedIn Profile
                            </a>
                        )}
                    </div>

                    <div className="pt-16 flex flex-col items-center justify-center text-xs font-mono text-slate-600 gap-4">
                        <span>© {new Date().getFullYear()} Md Salik Ubair.</span>
                    </div>
                </footer>

              </div>
            ) : !isAuthenticated ? (
              
              <div className="max-w-md mx-auto my-20 border border-white/5 bg-[#0a0a0a] rounded-3xl p-8 md:p-10 shadow-2xl">
                <div className="text-center space-y-1 mb-8">
                  <h2 className="text-base font-bold text-white font-mono">Admin Authorization</h2>
                  <p className="text-xs text-slate-500 font-mono">Enter security credentials to access hub</p>
                </div>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <input type="text" value={username} required onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-white/30 outline-none font-mono" />
                  <input type="password" value={password} required onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-white/30 outline-none font-mono" />
                  <button type="submit" className="w-full bg-white text-black hover:bg-slate-200 font-bold text-xs py-3.5 rounded-xl transition-colors font-mono uppercase tracking-wider">Access Hub</button>
                </form>
              </div>
            ) : (
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                 <div className="lg:col-span-1 space-y-6">
                   <div className="border border-white/5 bg-[#0a0a0a] rounded-3xl p-6 space-y-6">
                     <h2 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Master Profile Record</h2>
                     <div className="p-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] text-center space-y-3">
                        <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border border-white/20">
                            {profileForm.display_picture_url ? <img src={profileForm.display_picture_url} alt="DP" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black flex items-center justify-center text-xl">👤</div>}
                        </div>
                        <div>
                            <label className="cursor-pointer bg-white text-black text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg inline-block font-mono">
                                {isUploadingDP ? "Uploading..." : "Replace Avatar"}
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'dp')} className="hidden" disabled={isUploadingDP} />
                            </label>
                        </div>
                     </div>

                     <form onSubmit={handleProfileSubmit} className="space-y-4">
                       <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                           <h3 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">Resume Corpus</h3>
                           <input type="text" placeholder="CV Download Link" value={profileForm.master_cv_url || ''} onChange={(e) => setProfileForm({...profileForm, master_cv_url: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-white/30 outline-none font-mono" />
                           <textarea rows={3} placeholder="Paste raw CV text for vector ingestion..." value={profileForm.master_cv_text || ''} onChange={(e) => setProfileForm({...profileForm, master_cv_text: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-white/30 outline-none resize-none font-mono" />
                       </div>

                       {['full_name', 'professional_title', 'location', 'phone_number', 'whatsapp_link', 'skills_list'].map((field) => (
                         <div key={field} className="space-y-1">
                           <label className="text-[10px] font-mono text-slate-500 uppercase">{field.replace(/_/g, ' ')}</label>
                           <input type="text" value={profileForm[field] || ''} onChange={(e) => setProfileForm({...profileForm, [field]: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-white/30 outline-none font-mono" />
                         </div>
                       ))}
                       
                       <div className="space-y-3 pt-2">
                           <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">Channels</h3>
                           {['email', 'linkedin', 'github', 'instagram'].map((chan) => (
                               <div key={chan} className="space-y-1">
                                   <label className="text-[10px] font-mono text-slate-500 uppercase">{chan}</label>
                                   <input type="text" value={socialForm[chan] || ''} onChange={(e) => setSocialForm({...socialForm, [chan]: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-white/30 outline-none font-mono" />
                               </div>
                           ))}
                       </div>

                       <textarea rows={4} value={profileForm.profile_summary || ''} onChange={(e) => setProfileForm({...profileForm, profile_summary: e.target.value})} placeholder="Professional Summary" className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-white/30 outline-none resize-none font-mono" />
                       
                       <button type="submit" className="w-full bg-white text-black font-bold text-xs py-3 rounded-xl hover:bg-slate-200 transition-colors font-mono uppercase tracking-wider">Save Changes</button>
                     </form>
                   </div>
                 </div>

                 <div className="lg:col-span-2 space-y-6">
                    <div className="border border-white/5 bg-[#0a0a0a] rounded-3xl p-6 md:p-8 space-y-6">
                      <div className="flex items-center justify-between">
                          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                              {editingNode ? "Editing Record" : "Add Portfolio Entry"}
                          </h2>
                          {editingNode && <button type="button" onClick={cancelEdit} className="text-[10px] font-mono text-slate-400 hover:text-white bg-white/5 px-2.5 py-1 rounded-md">Cancel ✕</button>}
                      </div>
                      
                      <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select value={itemForm.category} disabled={editingNode} onChange={(e) => setItemForm({...itemForm, category: e.target.value})} className="md:col-span-2 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono">
                          <option value="projects">Engineering Projects</option>
                          <option value="experiences">Professional Experience</option>
                          <option value="education">Academic Qualifications</option>
                          <option value="certifications_and_achievements">Certifications & Awards</option>
                        </select>
                        
                        <div className="md:col-span-2 bg-black/40 p-4 rounded-xl border border-dashed border-white/10 space-y-3">
                            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                <span>Images</span>
                                <label className="cursor-pointer bg-white text-black text-[10px] font-bold px-2.5 py-1 rounded">
                                    {isUploadingItemImg ? "Uploading..." : "+ Add"}
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'item')} className="hidden" disabled={isUploadingItemImg} />
                                </label>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {itemForm.image_urls && itemForm.image_urls.length > 0 ? (
                                    itemForm.image_urls.map((imgUrl, idx) => (
                                        <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/20 group">
                                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeUploadedImage(idx)} className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">✕</button>
                                        </div>
                                    ))
                                ) : <p className="text-[11px] text-slate-600 font-mono">No images attached.</p>}
                            </div>
                        </div>

                        <input type="text" placeholder="Title" value={itemForm.title} required onChange={(e) => setItemForm({...itemForm, title: e.target.value})} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono" />
                        <input type="text" placeholder="Organization / Issuer" value={itemForm.organization_or_issuer} onChange={(e) => setItemForm({...itemForm, organization_or_issuer: e.target.value})} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono" />
                        <input type="text" placeholder="Duration" value={itemForm.duration_or_date} onChange={(e) => setItemForm({...itemForm, duration_or_date: e.target.value})} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono" />
                        <input type="text" placeholder="Skills Mapped" value={itemForm.tag_or_skills_mapped} onChange={(e) => setItemForm({...itemForm, tag_or_skills_mapped: e.target.value})} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono" />
                        <textarea rows={4} placeholder="Public Description" value={itemForm.description} onChange={(e) => setItemForm({...itemForm, description: e.target.value})} className="md:col-span-2 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none resize-none font-mono" />
                        
                        <textarea rows={3} placeholder="Internal Readme Context (AI Vector Ingestion Only)" value={itemForm.hidden_readme || ''} onChange={(e) => setItemForm({...itemForm, hidden_readme: e.target.value})} className="md:col-span-2 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none resize-none font-mono" />

                        <div className="md:col-span-2 bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
                            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Links</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Label" value={tempLink.label} onChange={(e) => setTempLink({...tempLink, label: e.target.value})} className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono" />
                                <input type="url" placeholder="URL" value={tempLink.url} onChange={(e) => setTempLink({...tempLink, url: e.target.value})} className="flex-[2] bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono" />
                                <button type="button" onClick={addSmartLink} className="bg-white text-black font-bold px-4 py-2 rounded-xl text-xs font-mono">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {itemForm.smart_links && itemForm.smart_links.map((lnk, idx) => (
                                    <span key={idx} className="flex items-center gap-2 bg-white/5 text-slate-300 text-xs px-3 py-1 rounded-full border border-white/10 font-mono">
                                        {lnk.label} <button type="button" onClick={() => removeSmartLink(idx)} className="text-red-400">✕</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="md:col-span-2 bg-white text-black font-bold text-xs py-3.5 rounded-xl transition-colors font-mono uppercase tracking-wider">
                            {editingNode ? "Update Entry" : "Add Entry"}
                        </button>
                      </form>
                    </div>

                    <div className="border border-white/5 bg-[#0a0a0a] rounded-3xl p-6 md:p-8 space-y-4">
                      <h2 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Existing Records</h2>
                      {['education', 'projects', 'experiences', 'certifications_and_achievements'].map((category) => {
                        if (!backendData || !backendData[category] || backendData[category].length === 0) return null;
                        return (
                          <div key={`manage-${category}`} className="space-y-2 pt-2 border-t border-white/5">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">{category.replace(/_/g, ' ')}</span>
                            <div className="space-y-1.5">
                              {backendData[category].map((node, index) => (
                                <div key={node.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black p-3.5 rounded-xl border border-white/5 gap-2">
                                  <div className="truncate w-full sm:max-w-[65%]">
                                      <p className="text-xs text-slate-200 font-medium truncate font-mono">{node.title}</p>
                                      <p className="text-[10px] text-slate-500 truncate font-mono">{node.organization_or_issuer}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                    <button type="button" onClick={(e) => handleMoveNode(category, index, -1, e)} disabled={index === 0} className="text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 disabled:opacity-30 text-xs">↑</button>
                                    <button type="button" onClick={(e) => handleMoveNode(category, index, 1, e)} disabled={index === backendData[category].length - 1} className="text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 disabled:opacity-30 text-xs">↓</button>
                                    <button type="button" onClick={(e) => triggerEditNode(category, node, e)} className="text-slate-300 hover:text-white border border-white/10 px-2.5 py-1 rounded text-xs font-mono ml-2">Edit</button>
                                    <button type="button" onClick={(e) => handleDeleteNode(category, node.id, e)} className="text-red-400 hover:text-white border border-red-900/40 px-2.5 py-1 rounded text-xs font-mono">Del</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>
              </div>
            )}
          </main>

          {/* CHAT LAUNCHER BUTTON */}
          {!isChatOpen && currentView === 'portfolio' && (
             <div className="fixed bottom-6 right-6 z-[100] animate-fadeIn">
                 <button onClick={() => setIsChatOpen(true)} className="bg-white hover:bg-slate-200 text-black px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 transition-transform hover:scale-105">
                     <span className="text-lg">💬</span>
                 </button>
             </div>
          )}

          {/* 🚀 AI ASSISTANT MODAL (RESPONSIVE: MOBILE STACKED, DESKTOP SIDE-BY-SIDE) 🚀 */}
          <div className={`fixed z-[200] transform transition-all duration-300 flex flex-col bg-[#050505]
              ${isChatOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 pointer-events-none translate-y-8'}
              inset-0 w-full h-[100dvh] rounded-none overflow-hidden
              md:inset-auto md:bottom-8 md:right-8 md:w-[760px] md:h-[500px] md:border md:border-white/10 md:rounded-3xl shadow-2xl`}>
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a0a0a] shrink-0 z-50">
                  <span className="text-sm font-semibold text-white tracking-wide">Assistant</span>
                  <div className="flex items-center gap-1.5">
                      {['intro', 'answering'].includes(aiState) && (
                          <button onClick={handleStopResponse} title="Stop voice" className="w-7 h-7 flex items-center justify-center text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                              ■
                          </button>
                      )}
                      <button onClick={toggleAudio} className={`w-7 h-7 flex items-center justify-center text-sm rounded-full transition-colors ${!isAudioEnabled ? 'text-slate-500' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
                          {isAudioEnabled ? '🔊' : '🔇'}
                      </button>
                      <button onClick={() => setIsChatOpen(false)} title="Close (Esc)" className="w-7 h-7 flex items-center justify-center text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                          ✕
                      </button>
                  </div>
              </div>
              
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                  {/* Fixed Avatar Viewport (Mobile: Top 35%, Desktop: Left Side 280px Vertical) */}
                  <div className="w-full h-[35dvh] md:w-[280px] md:h-full bg-black border-b md:border-b-0 md:border-r border-white/10 relative shrink-0">
                      <video src={idleVideo} autoPlay loop muted playsInline className={`absolute inset-0 w-full h-full object-cover object-top md:object-center transition-opacity duration-300 ${showIdle ? 'opacity-100' : 'opacity-0'}`} />
                      <video ref={thinkingRef} src={thinkingVideo} preload="none" loop={false} playsInline onEnded={handleThinkingEnded} className={`absolute inset-0 w-full h-full object-cover object-top md:object-center transition-opacity duration-300 ${showThinking ? 'opacity-100' : 'opacity-0'}`} />
                      <video ref={speakingRef} src={speakingVideo} preload="none" loop={aiState === 'answering'} playsInline onEnded={handleSpeakingEnded} className={`absolute inset-0 w-full h-full object-cover object-top md:object-center transition-opacity duration-200 ${showSpeaking ? 'opacity-100' : 'opacity-0'}`} />
                  </div>

                  {/* Scrollable Chat Viewport (Mobile: Bottom 65%, Desktop: Flex Right Side) */}
                  <div className="flex-1 flex flex-col h-[65dvh] md:h-full bg-[#050505] overflow-hidden">
                      <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          {aiState === 'standby' && (
                              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-40">
                                  <span className="text-2xl">✨</span>
                                  <p className="text-sm text-slate-400">Ready to assist.</p>
                              </div>
                          )}
                          {chatHistory.map((chat, idx) => (
                              <div key={idx} className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${chat.role === 'user' ? 'bg-white text-black self-end ml-auto font-medium' : 'bg-[#111] border border-white/5 text-slate-200 self-start mr-auto'}`}>
                                  {chat.role === 'ai' ? (
                                      <ReactMarkdown
                                          components={{
                                              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                              li: ({node, ...props}) => <li className="text-slate-300" {...props} />,
                                              strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />
                                          }}
                                      >
                                          {chat.text}
                                      </ReactMarkdown>
                                  ) : (
                                      chat.text
                                  )}
                              </div>
                          ))}
                          {aiState === 'thinking' && (
                              <div className="max-w-[85%] bg-transparent p-2 text-sm text-slate-500 mr-auto flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-ping"></span>
                                 <span>Synthesizing...</span>
                              </div>
                          )}
                          <div ref={chatEndRef} />
                      </div>

                      {/* Input Dock */}
                      <div className="p-4 bg-[#0a0a0a] shrink-0 border-t border-white/5">
                          {aiState === 'standby' ? (
                              <button onClick={startIntroSequence} className="w-full bg-white text-black font-semibold text-sm py-3 rounded-xl transition-colors">
                                  Start Conversation
                              </button>
                          ) : (
                              <form onSubmit={triggerAiQuery} className="relative flex items-center">
                                  <input 
                                      type="text" 
                                      value={userQuery} 
                                      onChange={(e) => setUserQuery(e.target.value)} 
                                      disabled={['intro', 'thinking'].includes(aiState) || isChatLoading} 
                                      placeholder={isChatLoading ? "Thinking..." : "Ask a question..."} 
                                      className="w-full bg-[#111] border border-white/10 focus:border-white/30 rounded-xl pl-4 pr-12 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 disabled:opacity-50" 
                                  />
                                  <button 
                                      type="submit" 
                                      disabled={!userQuery.trim() || ['intro', 'thinking'].includes(aiState) || isChatLoading} 
                                      className="absolute right-2 w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center hover:bg-slate-200 transition-all disabled:opacity-0"
                                  >
                                      <span className="font-bold text-sm">↗</span>
                                  </button>
                              </form>
                          )}
                      </div>
                  </div>
              </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;