import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// Original Video & Image Assets Restored
import avatarImg from './assets/avatar.jpg';
import idleVideo from './assets/idle.mp4';
import speakingVideo from './assets/speaking.mp4';
import thinkingVideo from './assets/thinking.mp4';

// Backend URL (LIVE RENDER SERVER)
const API_BASE_URL = 'https://salik-portfolio-backend.onrender.com';

// ==========================================
// FULL CINEMATIC APP (VIRTUAL PRESENCE & LIVE CAPTIONS)
// ==========================================
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

  // Modal States
  const [viewingNode, setViewingNode] = useState(null); 
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // Custom Toast Notification System
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
      setToast(message);
      setTimeout(() => setToast(null), 3000);
  };
  
  // OUTREACH SYNTHESIZER STATES
  const [draftContext, setDraftContext] = useState('');
  const [draftedMessage, setDraftedMessage] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Upload & Admin States
  const [isUploadingDP, setIsUploadingDP] = useState(false);
  const [isUploadingItemImg, setIsUploadingItemImg] = useState(false);
  const [editingNode, setEditingNode] = useState(null); 

  // Dynamic Boot Loader State
  const [bootLogs, setBootLogs] = useState([]);
  const [bootProgress, setBootProgress] = useState(0);

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

  // ---------------------------------------------------------
  // GOD-TIER TERMINAL BOOT SEQUENCE
  // ---------------------------------------------------------
  useEffect(() => {
    if (!loading) return;
    const sequences = [
        "Initiating master handshake with backend server...",
        "Waking up worker processes (Thread count: 4)...",
        "[AUTH] Verifying secure environment payloads...",
        "Connecting to Google Generative AI Embeddings API...",
        "Loading FAISS Vector Database into memory buffer...",
        "Validating Cosine Similarity parameters (L2 Distance)...",
        "Establishing LangChain retrieval augmented generation pipeline...",
        "Fetching dynamically routed UI payloads...",
        "System successfully mounted. Bypassing cold start latency..."
    ];
    
    let i = 0;
    const interval = setInterval(() => {
        if (i < sequences.length) {
            setBootLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1].slice(0,8)}] ${sequences[i]}`]);
            setBootProgress(Math.floor(((i + 1) / sequences.length) * 100));
            i++;
        }
    }, 500); 
    
    return () => clearInterval(interval);
  }, [loading]);

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
        } else if (isContactModalOpen) {
            e.preventDefault();
            setIsContactModalOpen(false);
        } else if (isChatOpen) {
            e.preventDefault();
            setIsChatOpen(false); 
        }
    };
    
    if (viewingNode || isChatOpen || isContactModalOpen) {
        window.history.pushState(null, "", window.location.href);
    }
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewingNode, isChatOpen, isContactModalOpen]);


  // ---------------------------------------------------------
  // CORE API FETCHING 
  // ---------------------------------------------------------
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
        setTimeout(() => setLoading(false), 2000); 
      })
      .catch(err => {
        console.error("Database connection failure.", err);
        setBootLogs(prev => [...prev, `[ERROR] CRITICAL: Handshake failed. System offline.`]);
        setTimeout(() => setLoading(false), 3000);
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
      else showToast("Login Failed: " + data.error);
    }).catch(() => showToast("Server unreachable."));
  };

  // ---------------------------------------------------------
  // FORMS & DATA SUBMISSION 
  // ---------------------------------------------------------
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
            showToast("✅ Profile Photo Uploaded!");
        } else {
            setItemForm({ ...itemForm, image_urls: [...(itemForm.image_urls || []), data.data.url] });
        }
      } else { showToast("Upload Failed."); }
    } catch (err) { showToast("Network Error during upload."); }

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
                showToast("✅ Master Details Saved! RAG Brain Updating..."); 
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
    .then(res => res.json()).then(resData => { if (resData.success) { showToast(`Saved & Pushed to RAG Engine.`); cancelEdit(); refreshPortfolioData(); } });
  };

  const handleDeleteNode = (category, id, e) => {
    if(e) e.stopPropagation();
    if (!window.confirm("Delete this entry permanently?")) return;
    fetch(`${API_BASE_URL}/api/portfolio/item/${category}/${id}`, { method: 'DELETE' }).then(res => res.json()).then(resData => { if (resData.success) refreshPortfolioData(); });
  };

  // 11/10 INSTANT & SMOOTH NODE REORDERING SYSTEM
  const handleMoveNode = (category, index, direction, e) => {
      if(e) e.stopPropagation();
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= backendData[category].length) return;
      
      const newData = [...backendData[category]];
      const temp = newData[index];
      newData[index] = newData[newIndex];
      newData[newIndex] = temp;
      
      // INSTANT Optimistic UI Update (Buttery Smooth)
      setBackendData({...backendData, [category]: newData});
      showToast(`Position shifted. Syncing to matrix...`);
      
      // Push to backend endpoint silently
      fetch(`${API_BASE_URL}/api/portfolio/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, items: newData.map(item => item.id) })
      }).then(res => res.json()).then(data => {
          if(!data.success) {
              showToast("Server sync failed. Awaiting backend deployment.");
          }
      }).catch(() => {
          // Suppress error alert so UI feels premium, just log it. Backend needs to be built.
          console.log("Reorder API not ready yet. Local state updated.");
      });
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

  const handleSmartScroll = (text) => {
      const lowerText = text.toLowerCase();
      if(lowerText.includes('project') || lowerText.includes('projects')) {
          const section = document.getElementById('section-projects');
          if(section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (lowerText.includes('experience') || lowerText.includes('worked')) {
          const section = document.getElementById('section-experiences');
          if(section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (lowerText.includes('education') || lowerText.includes('degree') || lowerText.includes('study')) {
          const section = document.getElementById('section-education');
          if(section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (lowerText.includes('certification') || lowerText.includes('award')) {
          const section = document.getElementById('section-certifications_and_achievements');
          if(section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  }

  // ==========================================
  // VIRTUAL PRESENCE ENGINE
  // ==========================================
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
        setAiState('idle'); 
        setChatHistory(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'ai') {
                const updatedChat = [...prev];
                updatedChat[updatedChat.length - 1] = {
                    ...lastMsg,
                    text: lastMsg.text + "\n\n*(Response interrupted by user)*"
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
    const introText = "Hello! I'm the AI Digital Twin of Md Salik Ubair. I represent his professional knowledge, engineering experience, projects, and technical interests. I can answer questions about his portfolio, explain technical concepts, discuss AI, software engineering, and related technologies, while responding in a clear, structured, and professional manner aligned with his expertise.";
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
    const responseText = data.ai_response || "Connection established.";
    const audioUrl = data.audio_url;
    const cleanSub = responseText.replace(/[*#`]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
    
    if (audioUrl) {
        const fullAudioUrl = `${API_BASE_URL}${audioUrl}?t=${new Date().getTime()}`; 
        const newAudio = new Audio(fullAudioUrl);
        audioRef.current = newAudio; 
        newAudio.muted = isMuted; 
        
        newAudio.onplaying = () => {
            if (!audioRef.current) return;
            setAiState('answering');
            setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]); 
            if (speakingRef.current) {
                speakingRef.current.currentTime = 0;
                speakingRef.current.play().catch(e => console.log("Video Play Blocked:", e));
            }
        };
        newAudio.onended = () => {
            setAiState('idle');
            if (speakingRef.current) speakingRef.current.pause();
            handleSmartScroll(cleanSub);
        };
        newAudio.onerror = (e) => {
            console.error("Audio Load Error:", e);
            setAiState('idle');
            setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]); 
            handleSmartScroll(cleanSub);
        }
        newAudio.play().catch(e => { 
            console.error("Audio AutoPlay blocked:", e); 
            setAiState('idle'); 
            setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]); 
            handleSmartScroll(cleanSub);
        });
    } else {
        setAiState('idle');
        setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]);
        handleSmartScroll(cleanSub);
    }
  };

  const executeAiQuery = (queryText) => {
    if (!queryText.trim() || ['intro', 'thinking'].includes(aiState)) return;
    if (aiState === 'answering') handleStopResponse();
    
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
      setChatHistory(prev => [...prev, { role: 'ai', text: "Network dropout. Server might be spinning up from sleep..." }]);
      setAiState('idle');
    });
  };

  const triggerAiQuery = (e) => {
      e.preventDefault();
      executeAiQuery(userQuery);
  };

  // ==========================================
  // 11/10 SMART OUTREACH SYNTHESIZER (REAL AI CONNECTION)
  // ==========================================
  const generateOutreachDraft = () => {
      if (!draftContext.trim()) return;
      setIsDrafting(true);
      setDraftedMessage('');
      setIsCopied(false);
      
      const synthesizerPrompt = `IGNORE ALL PREVIOUS INSTRUCTIONS. You are an expert professional corporate copywriter. A client/recruiter wants to reach out to Md Salik Ubair. Their exact intent/context is: "${draftContext.trim()}". Draft a highly professional, polite, and engaging outreach email/message on their behalf that they can send to Salik. Start the message exactly with "Hi Salik,". End the message with "[Your Name/Organization]". Do NOT include subject lines, markdown formatting, or conversational filler. Just the exact message body.`;

      fetch(`${API_BASE_URL}/api/rag/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: synthesizerPrompt })
      })
      .then(res => res.json())
      .then(data => {
          const generatedText = data.ai_response || data.answer || "Draft generation complete. Please review the context.";
          const cleanText = generatedText.replace(/[*#`]/g, '');
          setDraftedMessage(cleanText);
          setIsDrafting(false);
      })
      .catch(() => {
          setDraftedMessage("Network dropout. Could not connect to AI Synthesizer core.");
          setIsDrafting(false);
      });
  };

  const handleCopyDraft = () => {
      if(draftedMessage) {
          navigator.clipboard.writeText(draftedMessage);
          setIsCopied(true);
          showToast("Output Copied to Clipboard!");
          setTimeout(() => setIsCopied(false), 2500);
      }
  };

  // 11/10 SMART EMAIL HANDLER (Direct Mailto Native Route)
  const handleEmailClick = (e) => {
      e.preventDefault();
      const email = backendData?.social_channels?.email;
      if (email) {
          navigator.clipboard.writeText(email);
          showToast(`Email Copied. Opening Mail Client...`);
          window.location.href = `mailto:${email}`;
      }
  };

  const showThinking = ['thinking', 'idle_waiting'].includes(aiState) && !isMuted;
  const showSpeaking = ['intro', 'answering'].includes(aiState) && !isMuted;
  const showIdle = ['standby', 'idle'].includes(aiState) || isMuted;

  // Render Navbar Links
  const navLinks = [
    { label: 'About', view: 'portfolio', section: 'top' },
    { label: 'Experience', view: 'portfolio', section: 'section-experiences' },
    { label: 'Projects', view: 'portfolio', section: 'section-projects' },
    { label: 'Education', view: 'portfolio', section: 'section-education' },
    { label: 'Certifications', view: 'portfolio', section: 'section-certifications_and_achievements' },
    { label: 'Admin Hub', view: 'admin-hub', section: null },
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
  }

  return (
    <div className="min-h-screen bg-[#020202] text-slate-100 font-sans antialiased overflow-x-hidden relative selection:bg-sky-500/30 scroll-smooth">
      
      {/* 🚀 CUSTOM GLOBAL TOAST NOTIFICATION 🚀 */}
      {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] animate-fadeIn">
              <div className="bg-black/90 border border-emerald-500/50 text-emerald-400 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  {toast}
              </div>
          </div>
      )}

      {/* Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>

      {/* 🚀 PRO-ENGINEER NAVBAR & LOGO 🚀 */}
      <nav className="fixed w-full border-b border-white/5 bg-[#020202]/80 backdrop-blur-2xl z-50 px-4 md:px-8 py-3 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => handleNavClick('portfolio', 'top')}>
          <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-white text-black rounded-sm group-hover:bg-sky-500 transition-colors duration-300">
             <span className="font-sans font-black tracking-tighter text-sm md:text-base">SU.</span>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xs md:text-sm font-bold tracking-[0.15em] text-slate-100 uppercase">
              Md Salik <span className="text-sky-500">Ubair</span>
            </span>
            <span className="text-[8px] md:text-[9px] text-slate-500 uppercase tracking-[0.2em] font-mono mt-0.5">
              AI Engineer System
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, idx) => (
                <button 
                    key={idx}
                    onClick={() => handleNavClick(link.view, link.section)}
                    className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400 hover:text-sky-400 transition-colors"
                >
                    {link.label}
                </button>
            ))}
            {/* TOP NAVBAR PRIORITY CTA */}
            {currentView === 'portfolio' && (
                <button onClick={() => setIsContactModalOpen(true)} className="ml-4 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative bg-black border border-white/10 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest group-hover:text-sky-300 transition-colors flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"></div> Initiate Outreach
                    </div>
                </button>
            )}
        </div>

        <div className="lg:hidden flex items-center gap-4">
             {currentView === 'portfolio' && (
                 <button onClick={() => setIsContactModalOpen(true)} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full blur opacity-50"></div>
                    <div className="relative bg-black text-white px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-1 h-1 bg-sky-500 rounded-full animate-pulse"></div> Outreach
                    </div>
                 </button>
             )}
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 text-xl hover:text-sky-400 transition-colors">
                 {isMobileMenuOpen ? '✕' : '☰'}
             </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
          <div className="fixed top-[64px] left-0 w-full bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 z-40 lg:hidden flex flex-col p-4 space-y-2 shadow-2xl animate-fadeIn">
              {navLinks.map((link, idx) => (
                  <button 
                      key={idx}
                      onClick={() => handleNavClick(link.view, link.section)}
                      className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300 hover:text-white hover:bg-white/5 w-full text-left py-4 px-4 rounded-xl transition-all border border-transparent hover:border-white/10"
                  >
                      {link.label}
                  </button>
              ))}
          </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 REAL AI OUTREACH SYNTHESIZER MODAL 🚀 */}
      {/* ========================================================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn" onClick={() => setIsContactModalOpen(false)}>
            <div className="bg-[#050505] border border-white/10 w-full max-w-4xl rounded-2xl shadow-[0_0_80px_rgba(14,165,233,0.15)] relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500"></div>
                <button onClick={() => setIsContactModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-20">✕</button>
                
                <div className="p-5 md:p-8 border-b border-white/5 bg-[#0a0a0a] flex-shrink-0">
                    <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide">Outreach Synthesizer</h3>
                    <p className="text-[10px] md:text-xs text-slate-400 mt-2 leading-relaxed max-w-2xl">
                        Provide a brief context or objective below. The core AI Engine will dynamically construct a polished, professional outreach draft explicitly tailored to your scenario, which you can then send via direct official channels.
                    </p>
                </div>

                <div className="p-5 md:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* Left: Input & Generator */}
                    <div className="flex-1 flex flex-col space-y-4">
                        <label className="text-[10px] text-sky-400 font-mono tracking-widest uppercase flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></div> Context Input
                        </label>
                        <textarea 
                            rows={4} 
                            placeholder="e.g., 'Draft a message to invite him to interview for an AI Engineer role at our Deloitte team...'" 
                            value={draftContext} 
                            onChange={e => setDraftContext(e.target.value)} 
                            className="w-full flex-1 min-h-[120px] bg-[#111] border border-white/5 focus:border-sky-500/50 rounded-xl px-4 py-4 text-xs md:text-sm text-white outline-none resize-none transition-all placeholder:text-slate-600 shadow-inner" 
                        />
                        <button 
                            onClick={generateOutreachDraft} 
                            disabled={!draftContext.trim() || isDrafting} 
                            className="w-full bg-white text-black font-bold text-[10px] md:text-xs py-3.5 rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest disabled:opacity-50 flex-shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        >
                            {isDrafting ? 'Synthesizing with AI Core...' : 'Generate Professional Message'}
                        </button>
                    </div>

                    {/* Right: Output & Channels */}
                    <div className="flex-1 flex flex-col space-y-4">
                        <label className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center justify-between">
                            <span>Generated Output</span>
                            {isCopied && <span className="text-emerald-400 animate-fadeIn font-bold">Copied to Clipboard! ✓</span>}
                        </label>
                        
                        <div className="flex-1 bg-[#111] border border-white/5 rounded-xl p-5 relative group min-h-[160px] flex flex-col shadow-inner">
                            {isDrafting ? (
                                <div className="h-full w-full flex flex-col items-center justify-center text-sky-500/50 font-mono space-y-3">
                                    <div className="w-5 h-5 border-2 border-t-transparent border-sky-500 rounded-full animate-spin"></div>
                                    <span className="text-xs animate-pulse">Analyzing context & routing to LLM...</span>
                                </div>
                            ) : draftedMessage ? (
                                <>
                                    <div className="text-xs md:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed pb-10 flex-1 overflow-y-auto scrollbar-hide">{draftedMessage}</div>
                                    <button onClick={handleCopyDraft} className="absolute bottom-4 right-4 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-lg shadow-sky-500/20">Copy Text</button>
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 text-[10px] md:text-xs font-mono text-center px-4">
                                    Awaiting context to synthesize a highly formatted outreach message.
                                </div>
                            )}
                        </div>

                        {/* Direct Routing Channels */}
                        <div className="pt-2 flex-shrink-0">
                            <label className="text-[9px] md:text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-3 block">Route via Official Channels</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {backendData?.social_channels?.linkedin && (
                                    <a href={backendData.social_channels.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-3 bg-[#0a66c2]/10 border border-[#0a66c2]/30 hover:bg-[#0a66c2]/20 text-[#0a66c2] rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                        LinkedIn
                                    </a>
                                )}
                                {backendData?.social_channels?.email && (
                                    <button onClick={handleEmailClick} className="flex items-center justify-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                        Email
                                    </button>
                                )}
                                {backendData?.profile_core?.whatsapp_link && (
                                    <a href={backendData.profile_core.whatsapp_link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                        WhatsApp
                                    </a>
                                )}
                                {backendData?.social_channels?.instagram && (
                                    <a href={backendData.social_channels.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-3 bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 text-pink-400 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                        Instagram
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 CINEMATIC MODAL POPUP FOR NODES 🚀 */}
      {/* ========================================================= */}
      {viewingNode && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-10 bg-black/90 backdrop-blur-2xl animate-fadeIn" onClick={() => setViewingNode(null)}>
            <div className="bg-[#050505] border border-white/10 w-full h-full md:w-full md:max-w-4xl md:h-auto md:max-h-[90vh] md:rounded-3xl overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,1)] relative scrollbar-hide" onClick={e => e.stopPropagation()}>
                <button onClick={() => setViewingNode(null)} className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center border border-white/20 transition-colors z-50 font-bold backdrop-blur-xl">✕</button>
                
                <div className="w-full h-56 md:h-80 relative bg-black flex items-end">
                    {viewingNode?.image_urls?.length > 0 && (
                        <img src={viewingNode.image_urls[0]} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-50 blur-[2px]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent z-10" />
                    
                    <div className="relative z-20 p-6 md:p-12 w-full translate-y-6">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                            <span className="bg-sky-500/20 text-sky-400 text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-sky-500/30">{viewingNode._category?.replace(/_/g, ' ')}</span>
                            <span className="text-xs md:text-sm font-mono text-slate-400 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">{viewingNode.duration_or_date}</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">{viewingNode.title}</h2>
                        <p className="text-base md:text-xl text-indigo-300 font-medium mt-2">{viewingNode.organization_or_issuer}</p>
                    </div>
                </div>
                
                <div className="p-6 md:p-12 pt-10 md:pt-16 space-y-6 md:space-y-8 relative z-20">
                    {viewingNode.tag_or_skills_mapped && (
                        <div className="flex flex-wrap gap-2">
                            {viewingNode.tag_or_skills_mapped.split(',').map((skill, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-200 text-[10px] md:text-xs font-medium px-3 py-1.5 rounded-full">
                                    <img src={getSkillIconUrl(skill)} alt="" className="w-3 h-3 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                                    {skill.trim()}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="prose prose-invert max-w-none text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                        {viewingNode.description}
                    </div>

                    {viewingNode?.image_urls?.length > 1 && (
                        <div className="mt-8 space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Additional Assets / Certificates</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {viewingNode.image_urls.slice(1).map((img, idx) => (
                                    <a href={img} target="_blank" rel="noreferrer" key={idx} className="block aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-sky-500 transition-colors">
                                        <img src={img} alt="Certificate/Asset" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3 md:gap-4 pt-6 md:pt-8 border-t border-white/10">
                        {viewingNode.smart_links?.map((link, idx) => (
                            <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white text-black hover:bg-sky-400 text-xs md:text-sm font-bold px-5 py-2.5 md:px-6 md:py-3 rounded-xl transition-transform hover:-translate-y-1 shadow-[0_5px_15px_rgba(255,255,255,0.1)]">
                                {link.label} ↗
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-8 pt-24 md:pt-32 pb-16 relative z-10">
        {loading ? (
          
          /* 🚀 THE "GOD-TIER" MATRIX BOOT SEQUENCE 🚀 */
          <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 animate-fadeIn">
            <div className="w-full max-w-4xl bg-[#050505] border border-white/10 rounded-2xl shadow-[0_0_100px_rgba(14,165,233,0.15)] overflow-hidden flex flex-col md:flex-row relative">
                
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent animate-pulse"></div>

                {/* Left Fake Sidebar (Pro Tech Details) */}
                <div className="hidden md:flex md:w-64 bg-[#0a0a0a] border-r border-white/5 p-6 flex-col justify-between relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-sm font-black text-xs">SU.</div>
                            <span className="text-[10px] text-white tracking-[0.2em] font-bold uppercase">AI.Core_v2</span>
                        </div>
                        <div className="space-y-4 font-mono text-[9px] text-slate-500 tracking-widest uppercase">
                            <div>
                                <p className="text-sky-500 mb-1">Architecture</p>
                                <p className="text-slate-300">RAG Vector Pipeline</p>
                            </div>
                            <div>
                                <p className="text-sky-500 mb-1">Similarity Metric</p>
                                <p className="text-slate-300">Cosine (L2)</p>
                            </div>
                            <div>
                                <p className="text-sky-500 mb-1">Embeddings</p>
                                <p className="text-slate-300">Google Gemini 768-D</p>
                            </div>
                        </div>
                    </div>
                    <div className="font-mono text-[9px] text-slate-500">System Booting...</div>
                </div>

                {/* Right Main Terminal */}
                <div className="flex-1 p-6 md:p-10 flex flex-col relative z-10 min-h-[400px]">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80 animate-pulse"></div>
                        </div>
                        <span className="text-[9px] md:text-[10px] text-slate-500 font-mono tracking-widest uppercase">root@salik-cloud-instance:~</span>
                    </div>

                    <div className="flex-1 space-y-3 font-mono text-[10px] md:text-[12px] flex flex-col justify-end overflow-hidden">
                        {bootLogs.map((log, idx) => (
                            <div key={idx} className={`${idx === bootLogs.length - 1 ? 'text-emerald-400' : 'text-slate-500'} animate-fadeIn`}>
                                {log}
                            </div>
                        ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-8">
                        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                            <div className="bg-sky-500 h-full transition-all duration-300 ease-out" style={{ width: `${bootProgress}%` }}></div>
                        </div>
                        <div className="flex justify-between mt-2 font-mono text-[8px] md:text-[9px] text-slate-500">
                            <span>Establishing Connections...</span>
                            <span>{bootProgress}%</span>
                        </div>
                    </div>
                </div>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            </div>
          </div>

        ) : currentView === 'portfolio' ? (
          
          <div className="space-y-12 md:space-y-16 animate-fadeIn">
            
            {/* HERO SECTION */}
            <div className="relative flex flex-col-reverse lg:flex-row items-center justify-between gap-8 md:gap-12 p-6 md:p-12 border border-white/10 bg-white/[0.02] rounded-[2rem] md:rounded-[2.5rem] backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-sky-400 to-indigo-600" />
              
              <div className="flex-1 space-y-5 md:space-y-6 relative z-10 w-full text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter text-white">
                  {backendData?.profile_core?.full_name || "Md Salik Ubair"}
                </h1>
                
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-2 text-base md:text-xl text-sky-400 font-medium tracking-wide lg:border-l-2 lg:border-indigo-500 lg:pl-4">
                  <span>{backendData?.profile_core?.professional_title || "Update Title in Dashboard"}</span>
                  {backendData?.profile_core?.location && (
                      <div className="flex items-center gap-2">
                          <span className="hidden lg:inline text-slate-500">•</span>
                          <span className="text-slate-300 text-xs md:text-sm bg-white/5 lg:bg-transparent px-3 py-1 lg:px-0 lg:py-0 rounded-full">{backendData.profile_core.location}</span>
                      </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-3 text-xs md:text-sm mt-4">
                  {backendData?.profile_core?.phone_number && <span className="bg-white/5 border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-lg text-slate-300">📞 {backendData.profile_core.phone_number}</span>}
                  {backendData?.social_channels?.email && <a href={`mailto:${backendData.social_channels.email}`} target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">✉️ Email</a>}
                  {backendData?.social_channels?.linkedin && <a href={backendData.social_channels.linkedin} target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-lg text-sky-400 hover:bg-white/10 transition-colors">LinkedIn ↗</a>}
                  {backendData?.social_channels?.github && <a href={backendData.social_channels.github} target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">GitHub ↗</a>}
                  
                  {backendData?.profile_core?.whatsapp_link && (
                    <a href={backendData.profile_core.whatsapp_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 md:px-4 md:py-2 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        💬 WhatsApp
                    </a>
                  )}

                  {backendData?.social_channels?.instagram && (
                    <a href={backendData.social_channels.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:opacity-90 transition-opacity font-bold shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                        📸 Instagram
                    </a>
                  )}

                  {backendData?.profile_core?.master_cv_url && <a href={backendData.profile_core.master_cv_url} target="_blank" rel="noreferrer" className="bg-sky-500 text-black font-bold px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-sky-400 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.3)]">📄 View Full Resume</a>}
                </div>

                {backendData?.profile_core?.profile_summary && (
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-2xl lg:border-t lg:border-white/5 lg:pt-4 lg:mt-4 mx-auto lg:mx-0">
                        {backendData.profile_core.profile_summary}
                    </p>
                )}
              </div>

              {/* 🚀 FIXED: PRO HERO GLOW 🚀 */}
              <div className="relative w-40 md:w-[250px] lg:w-[300px] flex-shrink-0 z-20 mx-auto group">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-700 animate-pulse"></div>
                  <div className="relative w-full aspect-[4/5] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/10 bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                      <img src={backendData?.profile_core?.display_picture_url || avatarImg} alt="Profile" className="w-full h-full object-cover" />
                  </div>
              </div>
            </div>

            {/* 🚀 PREMIUM SMART SKILLS SECTION 🚀 */}
            <div className="border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-3xl p-6 md:p-8 space-y-6">
              <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">Engineering Stack & Proficiencies</h3>
              <div className="flex flex-wrap gap-3 md:gap-4">
                {backendData?.profile_core?.skills_list ? (
                  backendData.profile_core.skills_list.split(',').filter(s => s.trim() !== "").map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 bg-black border border-white/10 text-slate-200 text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg hover:border-sky-500/50 hover:bg-white/[0.04] transition-all cursor-default group">
                      <img 
                          src={getSkillIconUrl(skill)} 
                          alt="" 
                          className="w-4 h-4 md:w-5 md:h-5 object-contain group-hover:scale-110 transition-transform"
                          onError={(e) => {
                              e.target.onerror = null; 
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2338bdf8'%3E%3Ccircle cx='12' cy='12' r='8'/%3E%3C/svg%3E";
                              e.target.className = "w-2 h-2 opacity-50";
                          }}
                      />
                      {skill.trim()}
                    </div>
                  ))
                ) : <span className="text-[10px] md:text-xs text-slate-600">No skills added yet.</span>}
              </div>
            </div>

            {/* 🚀 FIXED: PROFESSIONAL GRID LISTS WITH IN-CARD SKILL ICONS & ADAPTIVE MOBILE SCROLL 🚀 */}
            {['experiences', 'projects', 'education', 'certifications_and_achievements'].map((sec) => {
              if (!backendData || !backendData[sec] || backendData[sec].length === 0) return null;
              const displayTitle = sec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={sec} id={`section-${sec}`} className="space-y-4 md:space-y-6 relative w-full scroll-mt-24">
                  <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-widest border-b border-white/10 pb-3 md:pb-4 flex items-center gap-3">
                     <div className="w-2 h-2 bg-sky-500 rounded-full" /> {displayTitle}
                  </h2>
                  
                  <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-2 gap-4 md:gap-6 pb-6 md:pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {(backendData[sec] || []).map((item) => {
                      return (
                        <div 
                            key={item.id} 
                            onClick={() => setViewingNode({...item, _category: sec})}
                            className="min-w-[85vw] md:min-w-0 snap-center shrink-0 group cursor-pointer border border-white/10 bg-white/[0.02] backdrop-blur-md rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-sky-500/50 hover:bg-white/[0.04] transition-all duration-300 shadow-xl hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(14,165,233,0.15)] flex flex-col justify-between"
                        >
                          <div className="space-y-3 md:space-y-4 pointer-events-none">
                            {item.image_urls && item.image_urls.length > 0 && (
                              <div className="w-full h-40 md:h-48 rounded-xl overflow-hidden mb-3 md:mb-4 border border-white/10 relative bg-[#050505]">
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                  <img src={item.image_urls[0]} alt="Project Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-3 md:gap-4">
                              <h3 className="text-base md:text-xl font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-2">{item.title}</h3>
                              <span className="text-[9px] md:text-[10px] font-mono bg-white/10 px-2 py-1 md:px-3 md:py-1 rounded-full text-slate-300 whitespace-nowrap flex-shrink-0">{item.duration_or_date}</span>
                            </div>
                            <p className="text-xs md:text-sm font-semibold text-indigo-400">{item.organization_or_issuer}</p>
                            
                            {/* 🚀 INJECTED SKILL ICONS INSIDE CARDS 🚀 */}
                            {item.tag_or_skills_mapped && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {item.tag_or_skills_mapped.split(',').slice(0, 5).map((skill, i) => (
                                        <div key={i} className="flex items-center gap-1 bg-black/50 border border-white/10 px-2 py-1 rounded-md">
                                            <img src={getSkillIconUrl(skill)} alt="" className="w-3 h-3 object-contain" onError={(e) => { e.target.style.display='none' }} />
                                            <span className="text-[9px] text-slate-300 font-medium">{skill.trim()}</span>
                                        </div>
                                    ))}
                                    {item.tag_or_skills_mapped.split(',').length > 5 && <span className="text-[9px] text-slate-500 flex items-center px-1">+{item.tag_or_skills_mapped.split(',').length - 5}</span>}
                                </div>
                            )}

                            <p className="text-xs md:text-sm text-slate-400 leading-relaxed line-clamp-3 mt-2">{item.description}</p>
                          </div>
                          
                          <div className="mt-4 md:mt-6 flex justify-end pt-3 md:pt-4 border-t border-white/5 pointer-events-none">
                              <span className="text-[10px] md:text-xs font-bold text-sky-500 group-hover:translate-x-2 transition-transform">View Details ↗</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
            
            {/* 🚀 FIXED: PRO FOOTER CTA 🚀 */}
            <div className="mt-20 pt-12 md:pt-16 border-t border-white/5 text-center space-y-6 md:space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-sky-500/30 to-transparent"></div>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">Ready to build the future?</h2>
                <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
                   Use the Outreach Synthesizer to draft a customized professional message, or chat directly with my Digital Twin regarding AI architecture and backend engineering.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                    <button onClick={() => setIsContactModalOpen(true)} className="relative group w-full sm:w-auto">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-xl blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
                        <div className="relative bg-black border border-white/10 hover:bg-sky-900/20 text-white font-bold px-8 py-3.5 rounded-xl transition-all text-xs md:text-sm uppercase tracking-widest text-center flex items-center justify-center gap-2">
                            <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"></div> Initiate Outreach
                        </div>
                    </button>
                    <button onClick={() => setIsChatOpen(true)} className="w-full sm:w-auto bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold px-8 py-3.5 rounded-xl transition-all text-xs md:text-sm uppercase tracking-widest">Chat with AI Twin</button>
                </div>
            </div>

          </div>
        ) : !isAuthenticated ? (
          
          /* ================= VIEW 2: LOGIN ================= */
          <div className="max-w-md mx-auto my-20 md:my-32 border border-white/10 bg-[#050505]/80 rounded-[2rem] p-8 md:p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />
            <div className="text-center space-y-2 mb-8 md:mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">System Login</h2>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4 md:space-y-5">
              <input type="text" value={username} required onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 md:py-3.5 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
              <input type="password" value={password} required onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 md:py-3.5 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
              <button type="submit" className="w-full bg-white text-black hover:bg-slate-200 font-bold text-xs md:text-sm py-3.5 md:py-4 rounded-xl transition-colors mt-2 md:mt-4">Authorize Access</button>
            </form>
          </div>
        ) : (
          
          /* ================= VIEW 3: ADMIN HUB ================= */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-fadeIn relative z-10">
             <div className="lg:col-span-1 space-y-6">
               <div className="border border-white/10 bg-[#050505]/60 backdrop-blur-2xl rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-6 shadow-xl">
                 <h2 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">Profile Matrix</h2>
                 <div className="p-4 border border-dashed border-white/20 rounded-2xl bg-white/[0.02] text-center space-y-3">
                    <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full overflow-hidden border-2 border-sky-500/30">
                        {profileForm.display_picture_url ? <img src={profileForm.display_picture_url} alt="DP" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black flex items-center justify-center text-xl md:text-2xl">👤</div>}
                    </div>
                    <div>
                        <label className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors inline-block">
                            {isUploadingDP ? "Uploading..." : "Upload New Photo"}
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'dp')} className="hidden" disabled={isUploadingDP} />
                        </label>
                    </div>
                 </div>

                 <form onSubmit={handleProfileSubmit} className="space-y-4">
                   <div className="p-3 md:p-4 bg-sky-900/10 border border-sky-500/30 rounded-xl space-y-3">
                       <h3 className="text-[9px] md:text-[10px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></div>Master CV Details</h3>
                       <input type="text" placeholder="CV Download Link (e.g. Google Drive)" value={profileForm.master_cv_url || ''} onChange={(e) => setProfileForm({...profileForm, master_cv_url: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
                       <textarea rows={3} placeholder="Paste raw CV Text here for RAG Brain ingestion..." value={profileForm.master_cv_text || ''} onChange={(e) => setProfileForm({...profileForm, master_cv_text: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none resize-none transition-colors" />
                   </div>

                   {['full_name', 'professional_title', 'location', 'phone_number', 'whatsapp_link', 'skills_list'].map((field) => (
                     <div key={field} className="space-y-1">
                       <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">{field.replace(/_/g, ' ')}</label>
                       <input type="text" value={profileForm[field] || ''} onChange={(e) => setProfileForm({...profileForm, [field]: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
                     </div>
                   ))}
                   
                   <div className="space-y-3 pt-2">
                       <h3 className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2">Social & Contact Links</h3>
                       
                       <div className="space-y-1">
                           <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                           <input type="email" value={socialForm.email || ''} onChange={(e) => setSocialForm({...socialForm, email: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
                       </div>
                       
                       <div className="space-y-1">
                           <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">LinkedIn Profile</label>
                           <input type="url" value={socialForm.linkedin || ''} onChange={(e) => setSocialForm({...socialForm, linkedin: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
                       </div>
                       
                       <div className="space-y-1">
                           <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">GitHub Profile</label>
                           <input type="url" value={socialForm.github || ''} onChange={(e) => setSocialForm({...socialForm, github: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
                       </div>

                       <div className="space-y-1">
                           <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Instagram Link</label>
                           <input type="url" value={socialForm.instagram || ''} onChange={(e) => setSocialForm({...socialForm, instagram: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
                       </div>
                   </div>

                   <textarea rows={4} value={profileForm.profile_summary || ''} onChange={(e) => setProfileForm({...profileForm, profile_summary: e.target.value})} placeholder="Professional Summary" className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none resize-none transition-colors" />
                   
                   <div className="p-3 md:p-4 bg-indigo-900/10 border border-indigo-500/30 rounded-xl space-y-3">
                       <h3 className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>Family & Private Narrative</h3>
                       <textarea rows={3} value={profileForm.family_narrative || ''} onChange={(e) => setProfileForm({...profileForm, family_narrative: e.target.value})} placeholder="Enter Family Details & Background Narrative here..." className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-indigo-500 outline-none resize-none transition-colors" />
                   </div>

                   <button type="submit" className="w-full bg-white text-black font-bold text-xs md:text-sm py-2.5 md:py-3 rounded-lg md:rounded-xl hover:bg-slate-200 transition-colors">Sync Master Data</button>
                 </form>
               </div>
             </div>

             <div className="lg:col-span-2 space-y-6 md:space-y-8 relative z-10">
                <div className={`border border-white/10 ${editingNode ? 'bg-sky-900/10 border-sky-500/50' : 'bg-[#050505]/60'} backdrop-blur-2xl rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-5 md:space-y-6 shadow-xl transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                      <h2 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          {editingNode ? <><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Editing Mode</> : 'Add New Portfolio Entry'}
                      </h2>
                      {editingNode && <button type="button" onClick={cancelEdit} className="text-[10px] md:text-xs font-bold text-slate-400 hover:text-white transition-colors bg-white/5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-white/10">Cancel Edit ✕</button>}
                  </div>
                  
                  <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 relative z-20">
                    <select value={itemForm.category} disabled={editingNode} onChange={(e) => setItemForm({...itemForm, category: e.target.value})} className="md:col-span-2 bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors disabled:opacity-50">
                      <option value="projects">Engineering Projects</option>
                      <option value="experiences">Professional Experience</option>
                      <option value="education">Academic Qualifications</option>
                      <option value="certifications_and_achievements">Certifications & Awards</option>
                    </select>
                    
                    <div className="md:col-span-2 bg-black/40 p-4 md:p-5 rounded-xl md:rounded-2xl border border-dashed border-white/20 space-y-3 md:space-y-4">
                        <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div> Attach Visual Assets
                            </div>
                            <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white text-[9px] md:text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-lg transition-colors">
                                {isUploadingItemImg ? "Uploading..." : "+ Upload Image"}
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'item')} className="hidden" disabled={isUploadingItemImg} />
                            </label>
                        </label>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                            {itemForm.image_urls && itemForm.image_urls.length > 0 ? (
                                itemForm.image_urls.map((imgUrl, idx) => (
                                    <div key={idx} className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-white/20 group">
                                        <img src={imgUrl} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeUploadedImage(idx)} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] md:text-xs font-bold">Remove</button>
                                    </div>
                                ))
                            ) : <p className="text-[10px] md:text-xs text-slate-500 font-mono">No images attached yet.</p>}
                        </div>
                    </div>

                    <input type="text" placeholder="Title" value={itemForm.title} required onChange={(e) => setItemForm({...itemForm, title: e.target.value})} className="bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <input type="text" placeholder="Organization / Issuer" value={itemForm.organization_or_issuer} onChange={(e) => setItemForm({...itemForm, organization_or_issuer: e.target.value})} className="bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <input type="text" placeholder="Duration (e.g., 2023 - Present)" value={itemForm.duration_or_date} onChange={(e) => setItemForm({...itemForm, duration_or_date: e.target.value})} className="bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <input type="text" placeholder="Skills Mapped" value={itemForm.tag_or_skills_mapped} onChange={(e) => setItemForm({...itemForm, tag_or_skills_mapped: e.target.value})} className="bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <textarea rows={4} placeholder="Detailed Description Block (Public)" value={itemForm.description} onChange={(e) => setItemForm({...itemForm, description: e.target.value})} className="md:col-span-2 bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 resize-none transition-colors" />
                    
                    {/* HIDDEN README FIELD */}
                    <textarea rows={3} placeholder="Hidden Readme Context (Only for AI Brain)" value={itemForm.hidden_readme || ''} onChange={(e) => setItemForm({...itemForm, hidden_readme: e.target.value})} className="md:col-span-2 bg-sky-900/10 border border-sky-500/30 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-sky-100 outline-none focus:border-sky-500 resize-none transition-colors" />

                    <div className="md:col-span-2 bg-black/40 p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/5 space-y-3 md:space-y-4">
                        <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Smart Links Configuration
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="text" placeholder="Label (e.g. GitHub)" value={tempLink.label} onChange={(e) => setTempLink({...tempLink, label: e.target.value})} className="flex-1 bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                            <input type="url" placeholder="URL Link" value={tempLink.url} onChange={(e) => setTempLink({...tempLink, url: e.target.value})} className="flex-[2] bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                            <button type="button" onClick={addSmartLink} className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl transition-colors">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {itemForm.smart_links && itemForm.smart_links.map((lnk, idx) => (
                                <span key={idx} className="flex items-center gap-2 bg-white/5 text-slate-200 text-[10px] md:text-xs font-semibold px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-white/10 group cursor-pointer" title="Click 'X' to remove">
                                    {lnk.label} <button type="button" onClick={() => removeSmartLink(idx)} className="text-red-400 hover:text-red-300 ml-1 font-bold group-hover:scale-125 transition-transform">✕</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className={`md:col-span-2 ${editingNode ? 'bg-amber-500 hover:bg-amber-400' : 'bg-sky-600 hover:bg-sky-500'} text-white font-bold text-xs md:text-sm py-3.5 md:py-4 rounded-lg md:rounded-xl transition-colors`}>
                        {editingNode ? "Save Edited Entry" : "Save New Entry"}
                    </button>
                  </form>
                </div>

                <div className="border border-white/10 bg-[#050505]/60 backdrop-blur-2xl rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-5 md:space-y-6 shadow-xl relative z-20">
                  <h2 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest flex items-center justify-between">
                      Manage Portfolio Content
                      <span className="text-[9px] md:text-[10px] text-slate-500">Edit / Reorder / Remove</span>
                  </h2>
                  {['education', 'projects', 'experiences', 'certifications_and_achievements'].map((category) => {
                    if (!backendData || !backendData[category] || backendData[category].length === 0) return null;
                    return (
                      <div key={`manage-${category}`} className="space-y-2 md:space-y-3 pt-3 md:pt-4 border-t border-white/5">
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sky-500">{category.replace(/_/g, ' ')}</span>
                        <div className="space-y-2">
                          {backendData[category].map((node, index) => (
                            <div key={node.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black p-3 md:p-4 rounded-xl border border-white/5 group hover:border-sky-500/30 transition-colors gap-2 md:gap-3">
                              <div className="truncate w-full sm:max-w-[65%]">
                                  <p className="text-xs md:text-sm text-slate-200 font-bold truncate">{node.title}</p>
                                  <p className="text-[9px] md:text-[10px] text-slate-500 truncate font-mono">{node.organization_or_issuer}</p>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                {/* 🚀 FIXED: ADMIN REORDER BUTTONS 🚀 */}
                                <button type="button" onClick={(e) => handleMoveNode(category, index, -1, e)} disabled={index === 0} className="text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 disabled:opacity-30 transition-colors">↑</button>
                                <button type="button" onClick={(e) => handleMoveNode(category, index, 1, e)} disabled={index === backendData[category].length - 1} className="text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 disabled:opacity-30 transition-colors">↓</button>
                                
                                <button type="button" onClick={(e) => triggerEditNode(category, node, e)} className="flex-1 sm:flex-none text-amber-400 hover:text-white border border-amber-900/50 hover:bg-amber-900/50 px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-colors ml-2">Edit</button>
                                <button type="button" onClick={(e) => handleDeleteNode(category, node.id, e)} className="flex-1 sm:flex-none text-red-400 hover:text-white border border-red-900/50 hover:bg-red-900 px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-colors">Remove</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
             </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 🚀 FIXED: FLOATING AI TOGGLE BUTTON WITH IMPRESSIVE CTA 🚀 */}
      {/* ========================================================= */}
      {!isChatOpen && currentView === 'portfolio' && (
         <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] flex items-center gap-3 md:gap-4 animate-fadeIn">
             <div className="flex bg-sky-500/10 border border-sky-500/30 text-sky-400 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(14,165,233,0.3)] animate-pulse shadow-sky-500/20">
                 Consult Digital Twin →
             </div>
             <button onClick={() => setIsChatOpen(true)} className="bg-sky-600 hover:bg-sky-500 text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.5)] flex items-center justify-center transition-transform hover:scale-110 border border-white/20">
                 <span className="text-xl md:text-2xl">💬</span>
             </button>
         </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 RESPONSIVE PREMIUM WIDGET (PC: Split View, Mobile: Fullscreen Fixed Top Avatar) 🚀 */}
      {/* ========================================================= */}
      <div className={`fixed z-[200] transform transition-all duration-300 flex flex-col bg-[#050505]/95 backdrop-blur-3xl 
          ${isChatOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 pointer-events-none translate-y-10'}
          /* MOBILE: Fullscreen Fixed Layout */
          inset-0 w-full h-full rounded-none overflow-hidden
          /* DESKTOP: Bottom Right Split Window */
          md:inset-auto md:bottom-10 md:right-10 md:w-[650px] md:h-[450px] md:border md:border-white/10 md:rounded-2xl shadow-[0_10px_80px_rgba(14,165,233,0.2)]`}>
          
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 z-50"></div>

          {/* Header Row */}
          <div className="flex items-center justify-between p-3 md:p-3 border-b border-white/10 bg-[#0a0a0a] flex-shrink-0 h-12 md:h-12 relative z-50">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                  <span className="text-[10px] md:text-xs font-bold text-white tracking-widest uppercase">Digital Twin Agent</span>
              </div>
              <div className="flex items-center gap-2">
                  {['intro', 'answering'].includes(aiState) && (
                      <button onClick={handleStopResponse} title="Stop ongoing response" className="flex items-center justify-center w-7 h-7 bg-red-950/30 text-red-400 rounded-md transition-colors border border-red-500/30 hover:bg-red-500 hover:text-white hover:border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                          <span className="text-sm">■</span>
                      </button>
                  )}

                  <button onClick={toggleAudio} className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors border ${!isAudioEnabled ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                      {isAudioEnabled ? '🔊' : '🔇'}
                  </button>
                  <button onClick={() => setIsChatOpen(false)} className="flex items-center justify-center w-7 h-7 bg-white/5 hover:bg-red-500/80 text-white rounded-md transition-colors border border-white/10">
                      ✕
                  </button>
              </div>
          </div>
          
          {/* RESPONSIVE FLEX LAYOUT CONTAINER */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
              
              {/* FIXED AVATAR AREA */}
              <div className="w-full h-[45vh] min-h-[300px] md:w-[260px] md:h-full bg-black border-b md:border-b-0 md:border-r border-white/10 relative flex-shrink-0">
                  <video src={idleVideo} autoPlay loop muted playsInline className={`absolute w-full h-full object-cover object-top md:object-center transition-opacity duration-700 ${showIdle ? 'opacity-100' : 'opacity-0'}`} />
                  <video ref={thinkingRef} src={thinkingVideo} preload="none" loop={false} playsInline onEnded={handleThinkingEnded} className={`absolute w-full h-full object-cover object-top md:object-center transition-opacity duration-500 ${showThinking ? 'opacity-100' : 'opacity-0'}`} />
                  <video ref={speakingRef} src={speakingVideo} preload="none" loop={aiState === 'answering'} playsInline onEnded={handleSpeakingEnded} className={`absolute w-full h-full object-cover object-top md:object-center transition-opacity duration-200 ${showSpeaking ? 'opacity-100' : 'opacity-0'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent pointer-events-none z-10" />
              </div>

              {/* CHAT INTERFACE AREA */}
              <div className="flex-1 flex flex-col h-[calc(100vh-45vh-3rem)] md:h-full bg-[#050505]">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#050505]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {aiState === 'standby' && (
                          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 md:space-y-3 opacity-60">
                              <span className="text-2xl md:text-3xl">✨</span>
                              <p className="text-[10px] md:text-[11px] font-medium text-slate-300 leading-relaxed px-4">
                                  Digital Twin Offline.<br/>
                                  <span className="text-slate-500 text-[9px] md:text-[10px]">Tap 'Start Session' to initiate AI interaction.</span>
                              </p>
                          </div>
                      )}
                      {chatHistory.map((chat, idx) => (
                          <div key={idx} className={`max-w-[90%] rounded-xl p-3 text-[11px] md:text-[12px] leading-relaxed shadow-lg ${chat.role === 'user' ? 'bg-sky-600 text-white self-end rounded-br-sm ml-auto' : 'bg-[#151515] border border-white/5 text-slate-200 self-start rounded-bl-sm mr-auto'}`}>
                              {chat.role === 'ai' ? (
                                  <ReactMarkdown
                                      components={{
                                          p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed whitespace-pre-line" {...props} />,
                                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                          li: ({node, ...props}) => <li className="text-slate-300" {...props} />,
                                          strong: ({node, ...props}) => <strong className="text-sky-400 font-bold" {...props} />
                                      }}
                                  >
                                      {chat.text}
                                  </ReactMarkdown>
                              ) : (
                                  chat.text
                              )}
                          </div>
                      ))}
                      
                      {/* 🚀 FIXED: RAG ENGINE INLINE VISUALIZER 🚀 */}
                      {aiState === 'thinking' && (
                          <div className="max-w-[90%] bg-[#0a0a0a] border border-sky-500/20 rounded-xl p-3 text-[10px] mr-auto flex flex-col gap-2 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                             <div className="flex items-center gap-2 text-sky-400 font-mono font-bold uppercase tracking-widest border-b border-sky-500/20 pb-2">
                                 <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span> Neural Retrieval Active
                             </div>
                             <div className="flex flex-col gap-1 text-slate-400 font-mono">
                                 <span className="animate-[pulse_1.5s_ease-in-out_infinite]">{">"} Vectorizing spatial query...</span>
                                 <span className="animate-[pulse_1.5s_ease-in-out_0.5s_infinite]">{">"} Executing FAISS semantic search...</span>
                                 <span className="animate-[pulse_1.5s_ease-in-out_1s_infinite]">{">"} Synthesizing contextual prompt...</span>
                             </div>
                          </div>
                      )}
                      <div ref={chatEndRef} />
                  </div>

                  {/* Input Block */}
                  <div className="p-3 md:p-4 border-t border-white/10 bg-[#0a0a0a] flex-shrink-0">
                      {aiState === 'standby' ? (
                          <button onClick={startIntroSequence} className="w-full bg-sky-500 hover:bg-sky-400 text-black font-extrabold uppercase tracking-widest text-[11px] py-3.5 rounded-lg shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all">
                              Start Session
                          </button>
                      ) : (
                          <form onSubmit={triggerAiQuery} className="relative flex items-center">
                              <input type="text" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} disabled={['intro', 'thinking'].includes(aiState)} placeholder="Ask Salik's Twin..." className="w-full bg-[#111] border border-white/10 focus:border-sky-500/50 rounded-lg pl-4 pr-12 py-3 text-xs text-white outline-none transition-all placeholder:text-slate-600 disabled:opacity-50" />
                              <button type="submit" disabled={!userQuery.trim() || ['intro', 'thinking'].includes(aiState)} className="absolute right-1.5 w-8 h-8 rounded-md bg-sky-500/10 text-sky-400 flex items-center justify-center hover:bg-sky-500 hover:text-black transition-all disabled:opacity-0">
                                  <span className="font-bold text-base">↗</span>
                              </button>
                          </form>
                      )}
                  </div>
              </div>

          </div>
      </div>
      
    </div>
  );
}

export default App;