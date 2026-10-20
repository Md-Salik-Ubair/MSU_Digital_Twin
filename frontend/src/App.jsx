import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

import avatarImg from './assets/avatar.jpg';
import idleVideo from './assets/idle.mp4';
import speakingVideo from './assets/speaking.mp4';
import thinkingVideo from './assets/thinking.mp4';

const API_BASE_URL = 'https://salik-portfolio-backend.onrender.com';

const DEVICON_MAP = {
  'python': { slug: 'python/python-original.svg', invert: false },
  'fastapi': { slug: 'fastapi/fastapi-original.svg', invert: false },
  'next.js': { slug: 'nextjs/nextjs-original.svg', invert: true },
  'nextjs': { slug: 'nextjs/nextjs-original.svg', invert: true },
  'typescript': { slug: 'typescript/typescript-original.svg', invert: false },
  'flask': { slug: 'flask/flask-original.svg', invert: true },
  'react.js': { slug: 'react/react-original.svg', invert: false },
  'react': { slug: 'react/react-original.svg', invert: false },
  'reactjs': { slug: 'react/react-original.svg', invert: false },
  'node.js': { slug: 'nodejs/nodejs-original.svg', invert: false },
  'nodejs': { slug: 'nodejs/nodejs-original.svg', invert: false },
  'javascript': { slug: 'javascript/javascript-original.svg', invert: false },
  'js': { slug: 'javascript/javascript-original.svg', invert: false },
  'tailwind css': { slug: 'tailwindcss/tailwindcss-original.svg', invert: false },
  'tailwindcss': { slug: 'tailwindcss/tailwindcss-original.svg', invert: false },
  'sql': { slug: 'postgresql/postgresql-original.svg', invert: false },
  'mysql': { slug: 'postgresql/postgresql-original.svg', invert: false },
  'postgresql': { slug: 'postgresql/postgresql-original.svg', invert: false },
  'supabase pgvector': { slug: 'supabase/supabase-original.svg', invert: false },
  'supabase': { slug: 'supabase/supabase-original.svg', invert: false },
  'c': { slug: 'c/c-original.svg', invert: false },
  'c++': { slug: 'cplusplus/cplusplus-original.svg', invert: false },
  'java': { slug: 'java/java-original.svg', invert: false },
  'redis': { slug: 'redis/redis-original.svg', invert: false },
  'mongodb': { slug: 'mongodb/mongodb-original.svg', invert: false },
  'mongo': { slug: 'mongodb/mongodb-original.svg', invert: false },
  'numpy': { slug: 'numpy/numpy-original.svg', invert: false },
  'pandas': { slug: 'pandas/pandas-original.svg', invert: true },
  'tensorflow': { slug: 'tensorflow/tensorflow-original.svg', invert: false },
  'scikit-learn': { slug: 'scikitlearn/scikitlearn-original.svg', invert: false },
  'docker': { slug: 'docker/docker-original.svg', invert: false },
  'git': { slug: 'git/git-original.svg', invert: false },
  'github': { slug: 'github/github-original.svg', invert: true },
  'linux': { slug: 'linux/linux-original.svg', invert: false },
  'html': { slug: 'html5/html5-original.svg', invert: false },
  'css': { slug: 'css3/css3-original.svg', invert: false }
};

function App() {
  const [currentView, setCurrentView] = useState('portfolio');
  const [backendData, setBackendData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const idleRef = useRef(null);
  const speakingRef = useRef(null);
  const thinkingRef = useRef(null);
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);

  const ttsActiveRef = useRef(false);
  const hasChunkStartedRef = useRef(false);
  const chunkStartTimestampRef = useRef(0);
  const silenceTicksRef = useRef(0);
  const lastCancelTimeRef = useRef(0);
  const ttsWatcherRef = useRef(null);
  const aiStateRef = useRef('standby');

  const [aiState, setAiState] = useState('standby');
  const [isMouthMoving, setIsMouthMoving] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);

  const [viewingNode, setViewingNode] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    aiStateRef.current = aiState;
  }, [aiState]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const [isUploadingDP, setIsUploadingDP] = useState(false);
  const [isUploadingItemImg, setIsUploadingItemImg] = useState(false);
  const [editingNode, setEditingNode] = useState(null);

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
    description: '', hidden_readme: '', tag_or_skills_mapped: '', is_new: false, smart_links: [], image_urls: []
  });
  const [tempLink, setTempLink] = useState({ label: '', url: '' });

  const isMuted = !isAudioEnabled;

  // Helper: Detects if a portfolio node is marked as NEW (via boolean prop or persisted [NEW] tag marker)
  const isItemMarkedNew = (item) => {
    if (!item) return false;
    if (Boolean(item.is_new)) return true;
    const rawTags = item.tag_or_skills_mapped || '';
    return rawTags.split(',').some((t) => t.trim().toUpperCase() === '[NEW]');
  };

  // Helper: Returns clean skills array without the internal [NEW] marker
  const getCleanMappedSkills = (tagString) => {
    if (!tagString) return [];
    return tagString
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '' && s.toUpperCase() !== '[NEW]');
  };

  // Pre-warm browser speech voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // 100% Verified Male-Only Voice Pool (Strictly Whitelisted Male Voices Only — Zero Female Possible)
  const selectBestMaleVoice = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return [];

    const isFemaleVoice = (v) =>
      /Zira|Heera|Neerja|Swara|Kalpana|Aria|Jenny|Sara|Sonia|Libby|Natasha|Clara|Molly|Ana|Michelle|Hazel|Susan|Catherine|Linda|Heather|Samantha|Victoria|Karen|Moira|Tessa|Veena|Lekha|Nirmala|Cortana|Eva|Ava|Emma|Salli|Joanna|Kendra|kimberly|Ivy|Amy|Olivia|May|Serena| Martha|Fiona|Kate|Alice|Alva|Amelie|Anna|Carmit|Damayanti|Ellen|Ioana|Joana|Kanya|Kyoko|Laura|Luciana|Mariska|Mei-Jia|Melina|Milena|Monica|Nora|Paulina|Satu|Sin-ji|Ting-Ting|Yelda|Yuna|Zosia|Zuzana|Female|Woman|Girl|Google US English|Google UK English Female|हिन्दी|Hindi/i.test(
        `${v.name} ${v.voiceURI}`
      );

    const candidateVoices = voices.filter((v) => /en/i.test(v.lang) && !isFemaleVoice(v));
    const pool = [];

    // 1. Instant Local Hardware Male Voices (0ms latency, never stalls)
    const localMalePatterns = [
      /Microsoft (Ravi|Prabhat)/i,
      /Microsoft (David|Mark|George|James|Richard)/i,
      /\b(Ravi|Prabhat|David|Mark|George|Guy|Ryan|Andrew|Brian|Daniel|Alex|Oliver|Rishi|Aaron|Fred|Christopher|Eric|Steffan|Roger|Thomas|Lee|Gordon|Arthur|ichi)\b/i
    ];
    for (const pattern of localMalePatterns) {
      for (const v of candidateVoices) {
        if (v.localService && pattern.test(`${v.name} ${v.voiceURI}`) && !pool.includes(v)) {
          pool.push(v);
        }
      }
    }

    // 2. High-Clarity Online/Neural Male Voices (Protected by 750ms Watchdog)
    const onlineMalePatterns = [
      /Microsoft (Andrew|Brian|Guy|Prabhat|Ryan|Christopher|Eric|Steffan|Roger)/i,
      /Google UK English Male/i,
      /\b(Prabhat|Ravi|Guy|Ryan|Andrew|Brian|Christopher|Eric|Steffan|Roger|George|Mark|David|James|Richard|Daniel|Alex|Oliver|Rishi|Aaron|Fred|Male)\b/i
    ];
    for (const pattern of onlineMalePatterns) {
      for (const v of candidateVoices) {
        if (pattern.test(`${v.name} ${v.voiceURI}`) && !pool.includes(v)) {
          pool.push(v);
        }
      }
    }

    return pool;
  }, []);

  // Starts muted visual mouth movement ONLY when voice/audio is actively emitting sound
  const startMutedLipSync = useCallback(() => {
    hasChunkStartedRef.current = true;
    silenceTicksRef.current = 0;
    setIsMouthMoving(true);
    if (speakingRef.current && aiStateRef.current !== 'intro') {
      const vid = speakingRef.current;
      vid.defaultMuted = true;
      vid.muted = true;
      vid.loop = true;
      if (vid.paused) {
        vid.play().catch(() => {});
      }
    }
  }, []);

  // Immediately freezes mouth movement & returns visual to idle.mp4
  const stopLipSync = useCallback(() => {
    hasChunkStartedRef.current = false;
    setIsMouthMoving(false);
    if (speakingRef.current && aiStateRef.current !== 'intro' && !speakingRef.current.paused) {
      speakingRef.current.pause();
    }
  }, []);

  // 45ms Hardware Audio-Visual Sync Poller (Strictly couples mouth movement to actual sound output)
  useEffect(() => {
    if (!isChatOpen) return;

    const syncTimer = setInterval(() => {
      const browserSpeaking =
        typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        window.speechSynthesis.speaking &&
        !window.speechSynthesis.paused;

      if (
        ttsActiveRef.current &&
        browserSpeaking &&
        !hasChunkStartedRef.current &&
        chunkStartTimestampRef.current > 0 &&
        Date.now() - chunkStartTimestampRef.current > 220
      ) {
        hasChunkStartedRef.current = true;
      }

      const ttsSpeakingNow =
        ttsActiveRef.current && hasChunkStartedRef.current && browserSpeaking;

      const backendAudioPlayingNow =
        Boolean(
          audioRef.current &&
          !audioRef.current.paused &&
          !audioRef.current.ended &&
          audioRef.current.currentTime > 0 &&
          audioRef.current.readyState >= 2
        );

      const introVideoPlayingNow =
        Boolean(
          aiStateRef.current === 'intro' &&
          speakingRef.current &&
          !speakingRef.current.paused &&
          !speakingRef.current.ended &&
          speakingRef.current.currentTime > 0
        );

      const isSoundActive = !isMuted && (ttsSpeakingNow || backendAudioPlayingNow || introVideoPlayingNow);

      if (isSoundActive) {
        silenceTicksRef.current = 0;
        setIsMouthMoving(true);
        if (aiStateRef.current !== 'intro' && speakingRef.current) {
          speakingRef.current.defaultMuted = true;
          speakingRef.current.muted = true;
          speakingRef.current.loop = true;
          if (speakingRef.current.paused) {
            speakingRef.current.play().catch(() => {});
          }
        }
      } else {
        if (ttsActiveRef.current && hasChunkStartedRef.current && !browserSpeaking && !window.speechSynthesis?.pending) {
          silenceTicksRef.current += 1;
          if (silenceTicksRef.current >= 8) {
            ttsActiveRef.current = false;
            hasChunkStartedRef.current = false;
            utteranceRef.current = null;
            setSpeakingMsgIdx(null);
            setAiState('idle');
          }
        }
        if (aiStateRef.current !== 'intro') {
          setIsMouthMoving(false);
          if (speakingRef.current && !speakingRef.current.paused) {
            speakingRef.current.pause();
          }
        }
      }
    }, 45);

    return () => clearInterval(syncTimer);
  }, [isChatOpen, isMuted]);

  // Stops all audio streams, TTS, thinking video, and resets speaking state immediately
  const stopAllAudio = useCallback(() => {
    ttsActiveRef.current = false;
    hasChunkStartedRef.current = false;
    chunkStartTimestampRef.current = 0;
    silenceTicksRef.current = 0;
    utteranceRef.current = null;
    setSpeakingMsgIdx(null);
    setIsMouthMoving(false);

    if (ttsWatcherRef.current) {
      clearTimeout(ttsWatcherRef.current);
      ttsWatcherRef.current = null;
    }

    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      (window.speechSynthesis.speaking || window.speechSynthesis.pending || window.speechSynthesis.paused)
    ) {
      lastCancelTimeRef.current = Date.now();
      window.speechSynthesis.cancel();
    }

    if (audioRef.current) {
      audioRef.current.onplaying = null;
      audioRef.current.onpause = null;
      audioRef.current.onwaiting = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    if (speakingRef.current) {
      speakingRef.current.onplaying = null;
      speakingRef.current.pause();
      speakingRef.current.defaultMuted = true;
      speakingRef.current.muted = true;
      speakingRef.current.loop = true;
      speakingRef.current.currentTime = 0;
    }

    if (thinkingRef.current) {
      thinkingRef.current.pause();
      thinkingRef.current.muted = true;
      thinkingRef.current.currentTime = 0;
    }
  }, []);

  const closeChatModal = useCallback(() => {
    stopAllAudio();
    aiStateRef.current = 'idle';
    setAiState('idle');
    setIsChatLoading(false);
    setIsChatOpen(false);
  }, [stopAllAudio]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (viewingNode) setViewingNode(null);
        if (isChatOpen) closeChatModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingNode, isChatOpen, closeChatModal]);

  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }, 40);
    }
  }, [chatHistory.length, isChatLoading]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (viewingNode) {
        e.preventDefault();
        setViewingNode(null);
      } else if (isChatOpen) {
        e.preventDefault();
        closeChatModal();
      }
    };

    if (viewingNode || isChatOpen) {
      window.history.pushState(null, '', window.location.href);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewingNode, isChatOpen, closeChatModal]);

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
        console.error('Database connection failure.', err);
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
      else showToast('Login Failed');
    }).catch(() => showToast('Server unreachable'));
  };

  const handleImageUpload = async (e, type = 'dp') => {
    const file = e.target.files[0];
    if (!file) return;
    const IMGBB_API_KEY = '67a2f496c1625f298a33f240d8366100';

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
          showToast('Profile Photo Updated');
        } else {
          setItemForm({ ...itemForm, image_urls: [...(itemForm.image_urls || []), data.data.url] });
        }
      } else { showToast('Upload Failed'); }
    } catch (err) { showToast('Network Error during upload'); }

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
            showToast('Data Synced to Core');
            refreshPortfolioData();
          });
        });
      }
    });
  };

  const addSmartLink = (e) => {
    e.preventDefault();
    if (tempLink.label.trim() && tempLink.url.trim()) {
      setItemForm({ ...itemForm, smart_links: [...(itemForm.smart_links || []), tempLink] });
      setTempLink({ label: '', url: '' });
    }
  };

  const removeSmartLink = (index) => {
    const newLinks = [...(itemForm.smart_links || [])];
    newLinks.splice(index, 1);
    setItemForm({ ...itemForm, smart_links: newLinks });
  };

  const triggerEditNode = (category, node, e) => {
    if (e) e.stopPropagation();
    let loadedSmartLinks = node.smart_links ? [...node.smart_links] : [];
    if (node.external_redirection_link && loadedSmartLinks.length === 0) {
      loadedSmartLinks.push({ label: 'Project Link', url: node.external_redirection_link });
    }
    const cleanSkills = getCleanMappedSkills(node.tag_or_skills_mapped).join(', ');
    setEditingNode({ category, id: node.id });
    setItemForm({
      category: category,
      title: node.title || '',
      organization_or_issuer: node.organization_or_issuer || '',
      duration_or_date: node.duration_or_date || '',
      description: node.description || '',
      hidden_readme: node.hidden_readme || '',
      tag_or_skills_mapped: cleanSkills,
      is_new: isItemMarkedNew(node),
      smart_links: loadedSmartLinks,
      image_urls: node.image_urls || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingNode(null);
    setItemForm({
      category: 'projects', title: '', organization_or_issuer: '', duration_or_date: '',
      description: '', hidden_readme: '', tag_or_skills_mapped: '', is_new: false, smart_links: [], image_urls: []
    });
  };

  const handleItemSubmit = (e) => {
    e.preventDefault();
    const cleanSkillsArr = getCleanMappedSkills(itemForm.tag_or_skills_mapped);
    if (itemForm.is_new) {
      cleanSkillsArr.push('[NEW]');
    }
    const payload = {
      ...itemForm,
      is_new: Boolean(itemForm.is_new),
      tag_or_skills_mapped: cleanSkillsArr.join(', ')
    };

    const url = editingNode
      ? `${API_BASE_URL}/api/portfolio/item/${editingNode.category}/${editingNode.id}`
      : `${API_BASE_URL}/api/portfolio/item/${itemForm.category}`;

    fetch(url, {
      method: editingNode ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          showToast('Node Saved');
          cancelEdit();
          refreshPortfolioData();
        }
      });
  };

  const handleDeleteNode = (category, id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this entry permanently?')) return;
    fetch(`${API_BASE_URL}/api/portfolio/item/${category}/${id}`, { method: 'DELETE' })
      .then(res => res.json()).then(resData => { if (resData.success) refreshPortfolioData(); });
  };

  const handleMoveNode = (category, index, direction, e) => {
    if (e) e.stopPropagation();
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= backendData[category].length) return;

    const newData = [...backendData[category]];
    const temp = newData[index];
    newData[index] = newData[newIndex];
    newData[newIndex] = temp;

    setBackendData({ ...backendData, [category]: newData });

    fetch(`${API_BASE_URL}/api/portfolio/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, items: newData.map(item => item.id) })
    }).catch(() => {});
  };

  const getSkillIconInfo = (skillName) => {
    if (!skillName) return null;
    const s = skillName.toLowerCase().trim();
    const entry = DEVICON_MAP[s];
    if (!entry) return null;
    return {
      url: `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${entry.slug}`,
      invert: entry.invert
    };
  };

  // Converts raw markdown/bullets into natural, conversational human speaker phrasing
  const cleanTextForSpeech = (rawText) => {
    if (!rawText) return '';
    return rawText
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/^#+\s*(.+)$/gm, '$1. ')
      .replace(/^[•\-*+]\s*\*\*([^*]+)\*\*\s*[:–—-]\s*/gm, '$1, ')
      .replace(/^[•\-*+]\s*/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/\bAI\/ML\b/gi, 'A I and Machine Learning')
      .replace(/\bCI\/CD\b/gi, 'C I C D')
      .replace(/\bUI\/UX\b/gi, 'U I and U X')
      .replace(/\s+\/\s+/g, ' and ')
      .replace(/\s*[—–]\s*/g, ', ')
      .replace(/:\s+/g, ', ')
      .replace(/\bMd\b/gi, 'M D')
      .replace(/\bUbair\b/gi, 'Ubair')
      .replace(/\bB\.Tech\b/gi, 'B Tech')
      .replace(/\bLLMs\b/g, 'L L Ms')
      .replace(/\bLLM\b/g, 'L L M')
      .replace(/\bRAG\b/g, 'RAG')
      .replace(/\bAPIs\b/g, 'A P Is')
      .replace(/\bAPI\b/g, 'A P I')
      .replace(/\bSSE\b/g, 'S S E')
      .replace(/\bSQL\b/gi, 'S Q L')
      .replace(/\bFastAPI\b/gi, 'Fast A P I')
      .replace(/\bNext\.js\b/gi, 'Next J S')
      .replace(/\bReact\.js\b/gi, 'React J S')
      .replace(/\bNode\.js\b/gi, 'Node J S')
      .replace(/\bpgvector\b/gi, 'P G Vector')
      .replace(/\bChromaDB\b/gi, 'Chroma D B')
      .replace(/\bMongoDB\b/gi, 'Mongo D B')
      .replace(/\bNumPy\b/gi, 'Num Pie')
      .replace(/\n+/g, '. ')
      .replace(/([.,!?])\s*\1+/g, '$1 ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // Human-Cadence Male Speech Engine with 750ms Watchdog Failover (100% Male Locked)
  const speakWithBrowserTTS = useCallback((text, msgIdx = null, forceUnmute = false) => {
    const currentlyMuted = isMuted && !forceUnmute;
    if (currentlyMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      stopLipSync();
      aiStateRef.current = 'idle';
      setAiState('idle');
      setSpeakingMsgIdx(null);
      return;
    }

    if (ttsWatcherRef.current) {
      clearTimeout(ttsWatcherRef.current);
      ttsWatcherRef.current = null;
    }

    lastCancelTimeRef.current = Date.now();
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) {
      stopLipSync();
      aiStateRef.current = 'idle';
      setAiState('idle');
      setSpeakingMsgIdx(null);
      return;
    }

    const rawSentences = (cleanText.match(/[^.!?]+[.!?]*/g) || [cleanText])
      .map(s => s.trim())
      .filter(s => /[a-zA-Z0-9]/.test(s));

    const chunks = [];
    let currentChunk = '';
    for (const s of rawSentences) {
      if ((currentChunk + ' ' + s).trim().length <= 170) {
        currentChunk = (currentChunk + ' ' + s).trim();
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = s;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    if (chunks.length === 0) chunks.push(cleanText);

    ttsActiveRef.current = true;
    hasChunkStartedRef.current = false;
    silenceTicksRef.current = 0;
    setSpeakingMsgIdx(msgIdx);
    aiStateRef.current = 'answering';
    setAiState('answering');

    let currentIdx = 0;
    let voiceRetryCount = 0;

    const finishSpeech = () => {
      if (ttsWatcherRef.current) {
        clearTimeout(ttsWatcherRef.current);
        ttsWatcherRef.current = null;
      }
      ttsActiveRef.current = false;
      hasChunkStartedRef.current = false;
      chunkStartTimestampRef.current = 0;
      silenceTicksRef.current = 0;
      utteranceRef.current = null;
      stopLipSync();
      setSpeakingMsgIdx(null);
      aiStateRef.current = 'idle';
      setAiState('idle');
    };

    const speakNextChunk = (voiceFailoverIdx = 0) => {
      if (!ttsActiveRef.current || currentIdx >= chunks.length) {
        finishSpeech();
        return;
      }

      const malePool = selectBestMaleVoice();

      if (malePool.length === 0) {
        if (voiceRetryCount < 12) {
          voiceRetryCount += 1;
          window.speechSynthesis.getVoices();
          ttsWatcherRef.current = setTimeout(() => {
            if (ttsActiveRef.current) speakNextChunk(voiceFailoverIdx);
          }, 55);
          return;
        }
        // Strictly refuse to speak if no verified male voice exists on the device
        finishSpeech();
        return;
      }

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const chosenMaleVoice = malePool[voiceFailoverIdx] || malePool[0];
      if (!chosenMaleVoice) {
        finishSpeech();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[currentIdx]);
      utteranceRef.current = utterance;
      chunkStartTimestampRef.current = Date.now();
      let chunkStarted = false;

      utterance.voice = chosenMaleVoice;
      utterance.lang = chosenMaleVoice.lang || 'en-US';
      utterance.rate = 0.99;
      utterance.pitch = 0.96;
      utterance.volume = 1.0;

      // 750ms Watchdog: if an online male voice stalls, immediately failover to the next male voice
      if (ttsWatcherRef.current) clearTimeout(ttsWatcherRef.current);
      ttsWatcherRef.current = setTimeout(() => {
        if (!ttsActiveRef.current || utteranceRef.current !== utterance || chunkStarted) return;
        if (window.speechSynthesis.speaking) {
          chunkStarted = true;
          startMutedLipSync();
          return;
        }
        window.speechSynthesis.cancel();
        if (voiceFailoverIdx + 1 < malePool.length) {
          speakNextChunk(voiceFailoverIdx + 1);
        } else {
          finishSpeech();
        }
      }, 750);

      utterance.onstart = () => {
        if (utteranceRef.current !== utterance || !ttsActiveRef.current) return;
        chunkStarted = true;
        startMutedLipSync();
      };

      utterance.onboundary = () => {
        if (utteranceRef.current !== utterance || !ttsActiveRef.current) return;
        chunkStarted = true;
        startMutedLipSync();
      };

      utterance.onpause = () => {
        if (utteranceRef.current !== utterance) return;
        stopLipSync();
      };

      utterance.onresume = () => {
        if (utteranceRef.current !== utterance || !ttsActiveRef.current) return;
        startMutedLipSync();
      };

      utterance.onend = () => {
        if (utteranceRef.current !== utterance) return;
        if (ttsWatcherRef.current) clearTimeout(ttsWatcherRef.current);
        if (!ttsActiveRef.current) {
          finishSpeech();
          return;
        }
        currentIdx += 1;
        if (currentIdx < chunks.length) {
          ttsWatcherRef.current = setTimeout(() => {
            if (ttsActiveRef.current) speakNextChunk(voiceFailoverIdx);
          }, 70);
        } else {
          finishSpeech();
        }
      };

      utterance.onerror = (e) => {
        if (utteranceRef.current !== utterance) return;
        if (ttsWatcherRef.current) clearTimeout(ttsWatcherRef.current);
        if (e && (e.error === 'canceled' || e.error === 'interrupted')) {
          return;
        }
        const currentPool = selectBestMaleVoice();
        if (ttsActiveRef.current && voiceFailoverIdx + 1 < currentPool.length) {
          speakNextChunk(voiceFailoverIdx + 1);
          return;
        }
        finishSpeech();
      };

      window.speechSynthesis.speak(utterance);
    };

    ttsWatcherRef.current = setTimeout(() => {
      if (ttsActiveRef.current) {
        speakNextChunk(0);
      }
    }, 65);
  }, [isMuted, selectBestMaleVoice, startMutedLipSync, stopLipSync]);

  const handleStopResponse = () => {
    stopAllAudio();
    setIsChatLoading(false);
    aiStateRef.current = 'idle';
    setAiState('idle');
  };

  const toggleAudio = () => {
    setIsAudioEnabled(prev => {
      const nextState = !prev;
      const willBeMuted = !nextState;
      if (willBeMuted) {
        stopAllAudio();
        aiStateRef.current = 'idle';
        setAiState('idle');
      } else {
        if (audioRef.current) audioRef.current.muted = false;
      }
      return nextState;
    });
  };

  // ROLE A: Intro Sequence (Plays speaking.mp4 with its own recorded audio track)
  const startIntroSequence = () => {
    stopAllAudio();
    const introText = 'Hello. I am the AI representation of Md Salik Ubair. I can provide insights into his engineering background, technical projects, and systems architecture experience. How can I assist you today?';
    setChatHistory([{ role: 'ai', text: introText }]);

    if (isMuted) {
      aiStateRef.current = 'idle';
      setAiState('idle');
      return;
    }

    aiStateRef.current = 'intro';
    setAiState('intro');
    setSpeakingMsgIdx(0);

    if (speakingRef.current) {
      const vid = speakingRef.current;
      vid.loop = false;
      vid.defaultMuted = false;
      vid.muted = false;
      vid.volume = 1.0;
      vid.currentTime = 0;

      vid.onplaying = () => {
        setIsMouthMoving(true);
      };

      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          vid.onplaying = null;
          vid.defaultMuted = true;
          vid.muted = true;
          vid.loop = true;
          speakWithBrowserTTS(introText, 0);
        });
      }
    } else {
      speakWithBrowserTTS(introText, 0);
    }
  };

  const handleSpeakingEnded = () => {
    if (aiStateRef.current === 'intro') {
      setIsMouthMoving(false);
      if (speakingRef.current) {
        speakingRef.current.onplaying = null;
        speakingRef.current.pause();
        speakingRef.current.defaultMuted = true;
        speakingRef.current.muted = true;
        speakingRef.current.loop = true;
        speakingRef.current.currentTime = 0;
      }
      aiStateRef.current = 'idle';
      setAiState('idle');
      setSpeakingMsgIdx(null);
    }
  };

  const handleThinkingEnded = () => {
    if (thinkingRef.current) {
      thinkingRef.current.pause();
      thinkingRef.current.muted = true;
    }
    if (aiStateRef.current === 'thinking') {
      aiStateRef.current = 'idle_waiting';
      setAiState('idle_waiting');
    }
  };

  // ROLE B: Answering Mode (speaking.mp4 is muted & locked to active voice output)
  const playBackendStream = (data, newMsgIdx) => {
    stopAllAudio();
    const responseText = data.ai_response || data.answer || data.response || 'Connection verified.';
    const audioUrl = data.audio_url;

    setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]);
    setIsChatLoading(false);

    if (isMuted) {
      aiStateRef.current = 'idle';
      setAiState('idle');
      return;
    }

    aiStateRef.current = 'answering';
    setAiState('answering');
    setSpeakingMsgIdx(newMsgIdx);

    if (audioUrl) {
      const fullAudioUrl = audioUrl.startsWith('http')
        ? audioUrl
        : `${API_BASE_URL}${audioUrl}${audioUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

      const audioEl = audioRef.current || new Audio();
      audioRef.current = audioEl;
      audioEl.src = fullAudioUrl;
      audioEl.muted = false;
      audioEl.volume = 1.0;

      audioEl.onplaying = () => {
        startMutedLipSync();
      };

      audioEl.onpause = () => {
        stopLipSync();
      };

      audioEl.onwaiting = () => {
        stopLipSync();
      };

      audioEl.onended = () => {
        stopLipSync();
        aiStateRef.current = 'idle';
        setAiState('idle');
        setSpeakingMsgIdx(null);
      };

      audioEl.onerror = () => {
        stopLipSync();
        speakWithBrowserTTS(responseText, newMsgIdx);
      };

      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          stopLipSync();
          speakWithBrowserTTS(responseText, newMsgIdx);
        });
      }
    } else {
      speakWithBrowserTTS(responseText, newMsgIdx);
    }
  };

  const executeAiQuery = (queryText) => {
    if (!queryText.trim() || ['intro', 'thinking'].includes(aiState) || isChatLoading) return;

    stopAllAudio();

    if (!audioRef.current && typeof Audio !== 'undefined') {
      audioRef.current = new Audio();
    }

    const nextAiMsgIdx = chatHistory.length + 1;
    setIsChatLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', text: queryText }]);
    setUserQuery('');
    aiStateRef.current = 'thinking';
    setAiState('thinking');

    if (thinkingRef.current) {
      const tVid = thinkingRef.current;
      tVid.currentTime = 0;
      tVid.loop = false;
      tVid.muted = isMuted;
      tVid.volume = 1.0;
      const p = tVid.play();
      if (p !== undefined) {
        p.catch(() => {
          tVid.muted = true;
          tVid.play().catch(() => {});
        });
      }
    }

    fetch(`${API_BASE_URL}/api/rag/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: queryText })
    })
      .then(res => res.json())
      .then(data => playBackendStream(data, nextAiMsgIdx))
      .catch(() => {
        stopAllAudio();
        const errMsg = 'The backend instance is currently unavailable or experiencing high load. Please try again momentarily.';
        setChatHistory(prev => [...prev, { role: 'ai', text: errMsg }]);
        aiStateRef.current = 'idle';
        setAiState('idle');
        setIsChatLoading(false);
      });
  };

  const triggerAiQuery = (e) => {
    e.preventDefault();
    executeAiQuery(userQuery);
  };

  const handleReplayMessage = (text, idx) => {
    if (speakingMsgIdx === idx && (['answering', 'intro'].includes(aiState) || isMouthMoving)) {
      handleStopResponse();
      return;
    }
    if (!isAudioEnabled) {
      setIsAudioEnabled(true);
    }
    stopAllAudio();
    speakWithBrowserTTS(text, idx, true);
  };

  const showThinking = aiState === 'thinking';
  const showSpeaking = isMouthMoving && !showThinking;
  const showIdle = !showThinking && !showSpeaking;

  const navLinks = [
    { label: 'About', view: 'portfolio', section: 'top' },
    { label: 'Experience', view: 'portfolio', section: 'section-experiences' },
    { label: 'Projects', view: 'portfolio', section: 'section-projects' },
    { label: 'Education', view: 'portfolio', section: 'section-education' },
    { label: 'Certifications', view: 'portfolio', section: 'section-certifications_and_achievements' },
    { label: 'Get This Portfolio', view: 'portfolio', section: 'section-deploy-service', isCta: true },
    { label: 'Admin', view: 'admin-hub', section: null },
  ];

  const handleNavClick = (view, sectionId) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    if (sectionId && view === 'portfolio') {
      setTimeout(() => {
        if (sectionId === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const element = document.getElementById(sectionId);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const portfolioServiceWhatsappUrl = `https://wa.me/91${(backendData?.profile_core?.phone_number || '9337179991').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
    'Hi Salik! I saw your AI Digital Twin Portfolio and want to get my own custom Admin-Controlled AI Portfolio deployed (₹1,999 Managed Setup).'
  )}`;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans antialiased selection:bg-white/20 scroll-smooth">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] animate-fadeIn">
          <div className="bg-[#111]/95 border border-white/15 text-white px-5 py-2.5 rounded-full text-xs font-mono tracking-wide backdrop-blur-2xl shadow-2xl flex items-center gap-2">
            {toast}
          </div>
        </div>
      )}

      {/* Atmospheric Background Lighting */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-gradient-to-b from-sky-500/[0.04] via-indigo-500/[0.02] to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Minimalist Loader */}
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
        <>
          {/* NAVIGATION BAR */}
          <nav className="fixed w-full border-b border-white/[0.04] bg-[#050505]/80 backdrop-blur-2xl z-50 px-6 md:px-12 py-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => handleNavClick('portfolio', 'top')}>
              <span className="font-mono text-xs font-semibold tracking-widest text-slate-300 hover:text-white transition-colors">
                MSU
              </span>
            </div>

            <div className="hidden md:flex items-center gap-7">
              {navLinks.map((link, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleNavClick(link.view, link.section)}
                  className={
                    link.isCta
                      ? 'text-[11px] font-mono font-semibold tracking-wider text-white bg-white/[0.06] hover:bg-white hover:text-black border border-white/15 px-3.5 py-1.5 rounded-full transition-all outline-none cursor-pointer'
                      : 'text-xs font-medium tracking-wider text-slate-400 hover:text-white transition-colors outline-none focus:outline-none cursor-pointer'
                  }
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white p-2 text-lg hover:text-slate-300 transition-colors outline-none focus:outline-none"
              >
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
                  type="button"
                  onClick={() => handleNavClick(link.view, link.section)}
                  className={`text-sm font-medium tracking-widest py-2 text-left transition-all outline-none focus:outline-none ${
                    link.isCta ? 'text-sky-400 font-mono font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}

          {/* ITEM PREVIEW MODAL */}
          {viewingNode && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-10 bg-black/90 backdrop-blur-xl animate-fadeIn" onClick={() => setViewingNode(null)}>
              <div className="bg-[#0a0a0a] border border-white/[0.06] w-full h-full md:w-full md:max-w-3xl md:h-auto md:max-h-[85vh] md:rounded-3xl overflow-y-auto shadow-2xl relative scrollbar-hide" onClick={e => e.stopPropagation()}>
                <button onClick={() => setViewingNode(null)} className="absolute top-5 right-5 w-8 h-8 bg-black/60 hover:bg-white/10 text-white rounded-full flex items-center justify-center border border-white/10 transition-colors z-50 text-sm outline-none">✕</button>

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
                      {isItemMarkedNew(viewingNode) && (
                        <span className="bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[10px] font-mono font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">{viewingNode.title}</h2>
                    <p className="text-sm md:text-base text-slate-400 font-medium mt-2">{viewingNode.organization_or_issuer}</p>
                  </div>
                </div>

                <div className="p-6 md:p-10 space-y-8 relative z-20">
                  {getCleanMappedSkills(viewingNode.tag_or_skills_mapped).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getCleanMappedSkills(viewingNode.tag_or_skills_mapped).map((skill, i) => (
                        <span key={i} className="text-slate-400 text-[11px] font-mono border border-white/5 bg-white/[0.02] px-3 py-1 rounded-full">
                          {skill}
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

          {/* MAIN WORKSPACE */}
          <main className="max-w-6xl mx-auto px-5 md:px-12 pt-28 md:pt-40 pb-24 relative z-10">
            {currentView === 'portfolio' ? (
              <div className="space-y-24 md:space-y-36 animate-fadeIn">

                {/* HERO SECTION */}
                <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-12 md:gap-16 pt-4">
                  <div className="flex-1 space-y-8 text-center md:text-left">
                    <div className="space-y-4">
                      <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
                        {backendData?.profile_core?.full_name || 'Md Salik Ubair'}
                      </h1>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-base md:text-xl text-slate-300 font-medium">
                        <span>{backendData?.profile_core?.professional_title || 'Full Stack AI Engineer'}</span>
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

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 pt-4">
                      {backendData?.profile_core?.phone_number && (
                        <span className="inline-flex items-center gap-2 text-slate-400 text-xs md:text-sm font-mono cursor-default">
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          {backendData.profile_core.phone_number}
                        </span>
                      )}
                      {backendData?.social_channels?.email && (
                        <a href={`mailto:${backendData.social_channels.email}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-all text-xs md:text-sm group">
                          <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white transition-all">Email</span>
                        </a>
                      )}
                      {backendData?.social_channels?.linkedin && (
                        <a href={backendData.social_channels.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-all text-xs md:text-sm group">
                          <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                          </svg>
                          <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white transition-all">LinkedIn</span>
                        </a>
                      )}
                      {backendData?.social_channels?.github && (
                        <a href={backendData.social_channels.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-all text-xs md:text-sm group">
                          <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                          </svg>
                          <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white transition-all">GitHub</span>
                        </a>
                      )}
                      {backendData?.social_channels?.instagram && (
                        <a href={backendData.social_channels.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-all text-xs md:text-sm group">
                          <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <rect x="3" y="3" width="18" height="18" rx="5" />
                            <circle cx="12" cy="12" r="4" />
                            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                          </svg>
                          <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white transition-all">Instagram</span>
                        </a>
                      )}
                      {backendData?.profile_core?.whatsapp_link && (
                        <a href={backendData.profile_core.whatsapp_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-all text-xs md:text-sm group">
                          <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                          </svg>
                          <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-white transition-all">WhatsApp</span>
                        </a>
                      )}
                      {backendData?.profile_core?.master_cv_url && (
                        <a href={backendData.profile_core.master_cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-white font-semibold transition-all text-xs md:text-sm group">
                          <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-white transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span className="underline underline-offset-4 decoration-white/40 group-hover:decoration-white transition-all">Resume</span>
                          <svg className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 shrink-0 mx-auto md:mx-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/10 to-indigo-400/10 rounded-full blur-2xl -z-10"></div>
                    <img src={backendData?.profile_core?.display_picture_url || avatarImg} alt="Profile" className="w-full h-full object-cover rounded-full border border-white/10 shadow-2xl relative z-10" />
                  </div>
                </div>

                {/* CORE PROFICIENCIES — FINAL POLISHED ARCHITECTURAL SPINE */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500">
                      Core Proficiencies
                    </h2>
                  </div>

                  {(() => {
                    const rawSkills = backendData?.profile_core?.skills_list
                      ? backendData.profile_core.skills_list.split(',').map(s => s.trim()).filter(Boolean)
                      : [];

                    if (rawSkills.length === 0) {
                      return <span className="text-xs text-slate-500 font-mono">Loading proficiencies...</span>;
                    }

                    const branches = [
                      {
                        index: '01',
                        title: 'AI & RAG Architecture',
                        match: /rag|retrieval|orchestrat|semantic|embedding|rerank|cohere|jina|tavily|langchain|llamaindex|agent|knowledge/i,
                        items: []
                      },
                      {
                        index: '02',
                        title: 'LLMs & Inference',
                        match: /groq|gemini|mistral|openrouter|cerebras|ollama|llama|whisper|openai|claude|machine learning|computer vision|deep learning|nlp|tensorflow|pytorch|scikit/i,
                        items: []
                      },
                      {
                        index: '03',
                        title: 'Backend & Vector Stores',
                        match: /python|fastapi|flask|django|node|chromadb|chroma|supabase|pgvector|postgres|sql|mysql|redis|mongo|sse|streaming|numpy|pandas|docker|linux|aws/i,
                        items: []
                      },
                      {
                        index: '04',
                        title: 'Frontend & Languages',
                        match: /next|react|typescript|javascript|\bjs\b|\bc\b|c\+\+|\bjava\b|tailwind|html|css|git|github|vite|vercel|figma/i,
                        items: []
                      }
                    ];

                    rawSkills.forEach((skill) => {
                      const target = branches.find(b => b.match.test(skill)) || branches[2];
                      target.items.push(skill);
                    });

                    const renderCustomSvgIcon = (skillName, branchIndex) => {
                      const s = skillName.toLowerCase();
                      if (s.includes('gemini')) {
                        return (
                          <svg className="w-3.5 h-3.5 text-sky-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C12.5 7.5 16.5 11.5 22 12C16.5 12.5 12.5 16.5 12 22C11.5 16.5 7.5 12.5 2 12C7.5 11.5 11.5 7.5 12 2Z" />
                          </svg>
                        );
                      }
                      if (s.includes('openai') || s.includes('whisper')) {
                        return (
                          <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="8" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        );
                      }
                      if (s.includes('groq') || s.includes('cerebras') || s.includes('mistral') || s.includes('sse')) {
                        return (
                          <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />
                          </svg>
                        );
                      }
                      if (s.includes('ollama') || s.includes('llama') || s.includes('openrouter')) {
                        return (
                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            <polyline points="2 17 12 22 22 17" />
                            <polyline points="2 12 12 17 22 12" />
                          </svg>
                        );
                      }
                      if (s.includes('chroma') || s.includes('embedding') || s.includes('semantic') || s.includes('rerank')) {
                        return (
                          <svg className="w-3.5 h-3.5 text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <ellipse cx="12" cy="5" rx="8" ry="3" />
                            <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
                            <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
                          </svg>
                        );
                      }
                      if (branchIndex === '01') {
                        return (
                          <svg className="w-3.5 h-3.5 text-sky-400/90 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <circle cx="6" cy="6" r="2.5" />
                            <circle cx="18" cy="6" r="2.5" />
                            <circle cx="12" cy="18" r="2.5" />
                            <path d="M8 7.5l3 8.5m5-8.5l-3 8.5M8.5 6h7" />
                          </svg>
                        );
                      }
                      return (
                        <svg className="w-3.5 h-3.5 text-indigo-400/90 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                          <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" />
                        </svg>
                      );
                    };

                    return (
                      <div className="relative pl-5 md:pl-7">
                        {/* Continuous Vertical Root Spine */}
                        <div className="absolute left-[5px] md:left-[7px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-white/25 via-white/10 to-white/5" />

                        <div className="divide-y divide-white/[0.05]">
                          {branches.filter(b => b.items.length > 0).map((branch) => (
                            <div
                              key={branch.index}
                              className="group relative py-5 first:pt-2 last:pb-2 flex flex-col md:flex-row md:items-start gap-3.5 md:gap-8"
                            >
                              {/* Left Branch Label with Perfectly Centered Spine Dot */}
                              <div className="relative md:w-52 shrink-0 flex items-center md:h-[30px]">
                                <span className="absolute -left-5 md:-left-7 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#050505] border border-white/35 group-hover:border-white group-hover:bg-white transition-all" />
                                <h3 className="text-xs md:text-sm font-semibold text-slate-300 group-hover:text-white tracking-tight transition-colors">
                                  {branch.title}
                                </h3>
                              </div>

                              {/* Right Skills Stream */}
                              <div className="flex-1 flex flex-wrap items-center gap-2">
                                {branch.items.map((skill, idx) => {
                                  const iconInfo = getSkillIconInfo(skill);
                                  const displayLabel = skill.toLowerCase() === 'c' ? 'C Language' : skill;

                                  return (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-2 bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/20 text-slate-200 hover:text-white text-xs font-mono px-3.5 py-1.5 rounded-full transition-all duration-200 cursor-default"
                                    >
                                      {iconInfo ? (
                                        <img
                                          src={iconInfo.url}
                                          alt=""
                                          className={`w-3.5 h-3.5 object-contain shrink-0 ${iconInfo.invert ? 'invert brightness-200' : ''}`}
                                        />
                                      ) : (
                                        renderCustomSvgIcon(skill, branch.index)
                                      )}
                                      <span>{displayLabel}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* CONTENT SECTIONS */}
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
                          const isNewItem = isItemMarkedNew(item);
                          const cleanSkills = getCleanMappedSkills(item.tag_or_skills_mapped);

                          return (
                            <div
                              key={item.id}
                              onClick={() => setViewingNode({ ...item, _category: sec })}
                              className="group cursor-pointer bg-transparent border border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.015] rounded-3xl p-6 md:p-8 transition-all duration-300 flex flex-col justify-between relative"
                            >
                              <div className="space-y-4 pointer-events-none">
                                {item.image_urls && item.image_urls.length > 0 && (
                                  <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden mb-5 border border-white/[0.04] bg-[#070707]">
                                    <img src={item.image_urls[0]} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                                    {isNewItem && (
                                      <span className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-sky-400/40 text-sky-300 text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-slate-200 transition-colors leading-snug">
                                      {item.title}
                                    </h3>
                                    {isNewItem && (!item.image_urls || item.image_urls.length === 0) && (
                                      <span className="bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] sm:text-xs font-mono text-slate-500 shrink-0 text-right">{item.duration_or_date}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-400">{item.organization_or_issuer}</p>

                                {cleanSkills.length > 0 && (
                                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
                                    {cleanSkills.slice(0, 4).map((skill, i) => (
                                      <span key={i} className="text-slate-500 text-[11px] font-mono flex items-center">
                                        {skill} {i !== 3 && i !== cleanSkills.length - 1 && <span className="ml-3 opacity-30">•</span>}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 pt-2">{item.description}</p>
                              </div>

                              <div className="mt-6 flex justify-start pt-4 border-t border-white/[0.03] pointer-events-none">
                                <span className="text-xs font-medium text-slate-500 group-hover:text-white transition-colors flex items-center gap-2">
                                  Read Document <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* TURNKEY AI PORTFOLIO DEPLOYMENT SERVICE SECTION */}
                <div id="section-deploy-service" className="scroll-mt-32 pt-8">
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-7 md:p-12">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/[0.06] pb-8">
                      <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-sky-400">
                          <span>Turnkey Cloud Deployment Service</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                          Want an AI Digital Twin Portfolio Like This?
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                          Get this exact executive portfolio architecture—complete with your own interactive AI Digital Twin, RAG vector engine, and full Admin CMS Hub—deployed live on your cloud infrastructure without touching a single line of code.
                        </p>
                      </div>

                      <div className="shrink-0 bg-[#0a0a0d] border border-white/10 rounded-2xl p-5 md:p-6 text-left lg:text-right space-y-1.5">
                        <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                          Complete Managed Setup
                        </div>
                        <div className="flex items-baseline lg:justify-end gap-2.5">
                          <span className="text-xs font-mono text-slate-500 line-through">₹3,999</span>
                          <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">₹1,999</span>
                          <span className="text-xs font-mono text-slate-400">/ one-time</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400">
                          Live Deployment • Custom Admin Hub
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-b border-white/[0.06]">
                      <div className="space-y-2">
                        <div className="text-xs font-mono text-sky-400 font-semibold uppercase tracking-wider">
                          01 // Self-Service Admin CMS
                        </div>
                        <h4 className="text-sm font-bold text-white">Full Control Over Your Data</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Update your bio, resume corpus, projects, internships, skills, and photos anytime from your private Admin Hub—no coding required.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-mono text-indigo-400 font-semibold uppercase tracking-wider">
                          02 // Your Own Cloud & Database
                        </div>
                        <h4 className="text-sm font-bold text-white">Dedicated MongoDB & Render Setup</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          We configure and deploy the backend and frontend directly with your MongoDB database and cloud hosting for 100% data ownership.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                          03 // Managed Production License
                        </div>
                        <h4 className="text-sm font-bold text-white">Turnkey Live Deployment</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Delivered as a ready-to-use live web application managed by our core engine (proprietary source files remain protected).
                        </p>
                      </div>
                    </div>

                    <div className="pt-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <p className="text-xs font-mono text-slate-400">
                        Ready in 24–48 hours • Includes AI RAG setup & custom avatar video integration
                      </p>
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <a
                          href={portfolioServiceWhatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto text-center bg-white hover:bg-slate-200 text-black font-semibold text-xs md:text-sm px-6 py-3 rounded-full transition-all shadow-lg"
                        >
                          Book Your Deployment (₹1,999) ↗
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <footer className="pt-20 md:pt-28 pb-8 text-center space-y-12">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Let's connect.</h2>
                    <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                      Open to advanced systems engineering roles, production architectures, and technical consultations.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {backendData?.social_channels?.email && (
                      <a href={`mailto:${backendData.social_channels.email}`} className="bg-white hover:bg-slate-200 text-black font-semibold px-8 py-3.5 rounded-full transition-all text-sm">
                        Send Email
                      </a>
                    )}
                    {backendData?.social_channels?.linkedin && (
                      <a href={backendData.social_channels.linkedin} target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-full transition-all text-sm border border-white/5">
                        LinkedIn Profile
                      </a>
                    )}
                  </div>

                  <div className="pt-16 pb-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-4 pr-0 lg:pr-24">
                    <span>© {new Date().getFullYear()} Md Salik Ubair. All systems operational.</span>
                    <button
                      type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer hover:-translate-y-1 transform duration-200 outline-none"
                    >
                      Back to top ↑
                    </button>
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
                          {isUploadingDP ? 'Uploading...' : 'Replace Avatar'}
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'dp')} className="hidden" disabled={isUploadingDP} />
                        </label>
                      </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                        <h3 className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest">Resume Corpus</h3>
                        <input type="text" placeholder="CV Download Link" value={profileForm.master_cv_url || ''} onChange={(e) => setProfileForm({ ...profileForm, master_cv_url: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-white/30 outline-none font-mono" />
                        <textarea rows={3} placeholder="Paste raw CV text for vector ingestion..." value={profileForm.master_cv_text || ''} onChange={(e) => setProfileForm({ ...profileForm, master_cv_text: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-white/30 outline-none resize-none font-mono" />
                      </div>

                      {['full_name', 'professional_title', 'location', 'phone_number', 'whatsapp_link', 'skills_list'].map((field) => (
                        <div key={field} className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-500 uppercase">{field.replace(/_/g, ' ')}</label>
                          <input type="text" value={profileForm[field] || ''} onChange={(e) => setProfileForm({ ...profileForm, [field]: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-white/30 outline-none font-mono" />
                        </div>
                      ))}

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Family Narrative / Background (AI RAG Corpus)</label>
                        <textarea
                          rows={3}
                          value={profileForm.family_narrative || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, family_narrative: e.target.value })}
                          placeholder="Enter family background or personal meta context for RAG..."
                          className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-white/30 outline-none resize-none font-mono"
                        />
                      </div>

                      <div className="space-y-3 pt-2">
                        <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">Channels</h3>
                        {['email', 'linkedin', 'github', 'instagram'].map((chan) => (
                          <div key={chan} className="space-y-1">
                            <label className="text-[10px] font-mono text-slate-500 uppercase">{chan}</label>
                            <input type="text" value={socialForm[chan] || ''} onChange={(e) => setSocialForm({ ...socialForm, [chan]: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-white/30 outline-none font-mono" />
                          </div>
                        ))}
                      </div>

                      <textarea rows={4} value={profileForm.profile_summary || ''} onChange={(e) => setProfileForm({ ...profileForm, profile_summary: e.target.value })} placeholder="Professional Summary" className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-white/30 outline-none resize-none font-mono" />

                      <button type="submit" className="w-full bg-white text-black font-bold text-xs py-3 rounded-xl hover:bg-slate-200 transition-colors font-mono uppercase tracking-wider">Save Changes</button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="border border-white/5 bg-[#0a0a0a] rounded-3xl p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                        {editingNode ? 'Editing Record' : 'Add Portfolio Entry'}
                      </h2>
                      {editingNode && <button type="button" onClick={cancelEdit} className="text-[10px] font-mono text-slate-400 hover:text-white bg-white/5 px-2.5 py-1 rounded-md">Cancel ✕</button>}
                    </div>

                    <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select value={itemForm.category} disabled={editingNode} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className="md:col-span-2 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono">
                        <option value="projects">Engineering Projects</option>
                        <option value="experiences">Professional Experience</option>
                        <option value="education">Academic Qualifications</option>
                        <option value="certifications_and_achievements">Certifications & Awards</option>
                      </select>

                      {/* NEW Badge Toggle Switch */}
                      <div className="md:col-span-2 flex items-center justify-between bg-black/60 border border-white/10 rounded-xl px-4 py-3">
                        <div className="space-y-0.5">
                          <span className="text-xs font-mono font-semibold text-white block">Highlight with "NEW" Badge</span>
                          <span className="text-[10px] font-mono text-slate-500 block">Displays a sleek NEW tag on this card in the public portfolio</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setItemForm({ ...itemForm, is_new: !itemForm.is_new })}
                          className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            itemForm.is_new
                              ? 'bg-sky-500/20 border border-sky-400/50 text-sky-300'
                              : 'bg-white/5 border border-white/10 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {itemForm.is_new ? '★ NEW Enabled' : 'Enable NEW'}
                        </button>
                      </div>

                      <div className="md:col-span-2 bg-black/40 p-4 rounded-xl border border-dashed border-white/10 space-y-3">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center justify-between">
                          <span>Images</span>
                          <label className="cursor-pointer bg-white text-black text-[10px] font-bold px-2.5 py-1 rounded">
                            {isUploadingItemImg ? 'Uploading...' : '+ Add'}
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

                      <input type="text" placeholder="Title" value={itemForm.title} required onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono" />
                      <input type="text" placeholder="Organization / Issuer" value={itemForm.organization_or_issuer} onChange={(e) => setItemForm({ ...itemForm, organization_or_issuer: e.target.value })} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono" />
                      <input type="text" placeholder="Duration" value={itemForm.duration_or_date} onChange={(e) => setItemForm({ ...itemForm, duration_or_date: e.target.value })} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono" />
                      <input type="text" placeholder="Skills Mapped (comma separated)" value={itemForm.tag_or_skills_mapped} onChange={(e) => setItemForm({ ...itemForm, tag_or_skills_mapped: e.target.value })} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono" />
                      <textarea rows={4} placeholder="Public Description" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="md:col-span-2 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none resize-none font-mono" />

                      <textarea rows={3} placeholder="Internal Readme Context (AI Vector Ingestion Only)" value={itemForm.hidden_readme || ''} onChange={(e) => setItemForm({ ...itemForm, hidden_readme: e.target.value })} className="md:col-span-2 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none resize-none font-mono" />

                      <div className="md:col-span-2 bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Links</label>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Label" value={tempLink.label} onChange={(e) => setTempLink({ ...tempLink, label: e.target.value })} className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono" />
                          <input type="url" placeholder="URL" value={tempLink.url} onChange={(e) => setTempLink({ ...tempLink, url: e.target.value })} className="flex-[2] bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono" />
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
                        {editingNode ? 'Update Entry' : 'Add Entry'}
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
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-200 font-medium truncate font-mono">{node.title}</p>
                                    {isItemMarkedNew(node) && (
                                      <span className="bg-sky-500/15 border border-sky-400/30 text-sky-300 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full shrink-0">
                                        NEW
                                      </span>
                                    )}
                                  </div>
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

          {/* EXECUTIVE AI DIGITAL TWIN LAUNCHER (High-Contrast Minimal Trigger) */}
          {!isChatOpen && currentView === 'portfolio' && (
            <div className="fixed bottom-6 right-6 z-[100] animate-fadeIn">
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                title="Interact with Salik's Digital Twin"
                className="group flex items-center gap-2.5 bg-white hover:bg-slate-200 text-black px-5 py-3 rounded-full shadow-[0_10px_35px_rgba(255,255,255,0.15)] transition-all duration-200 hover:-translate-y-0.5 outline-none cursor-pointer"
              >
                <svg className="w-4 h-4 text-black transition-transform duration-300 group-hover:rotate-45" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                </svg>
                <span className="text-xs font-semibold tracking-tight">
                  Digital Twin
                </span>
              </button>
            </div>
          )}

          {/* BACKDROP OVERLAY */}
          {isChatOpen && (
            <div
              onClick={closeChatModal}
              className="fixed inset-0 z-[190] bg-black/70 backdrop-blur-sm transition-opacity animate-fadeIn"
            />
          )}

          {/* AI DIGITAL TWIN MODAL */}
          <div
            className={`fixed z-[200] transform transition-all duration-300 flex flex-col bg-[#08080a]/95 backdrop-blur-3xl
              ${isChatOpen ? 'scale-100 opacity-100 translate-y-0 shadow-[0_25px_90px_rgba(0,0,0,0.95)]' : 'scale-95 opacity-0 pointer-events-none translate-y-8'}
              inset-0 w-full h-[100dvh] rounded-none overflow-hidden
              md:inset-auto md:bottom-6 md:right-6 md:w-[840px] md:h-[550px] md:max-h-[86vh] md:border md:border-white/15 md:rounded-3xl`}
          >
            {/* Header (Zero Green Dots) */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07] bg-[#0c0c0e] shrink-0 z-50">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.3 8.7L21 11L14.3 13.3L12 20L9.7 13.3L3 11L9.7 8.7L12 2Z" />
                </svg>
                <span className="text-xs font-mono font-semibold text-white tracking-wider">Digital Twin</span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  {isMouthMoving ? '— Speaking' : aiState === 'thinking' || isChatLoading ? '— Synthesizing' : ''}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {(['intro', 'answering'].includes(aiState) || isMouthMoving) && (
                  <button
                    type="button"
                    onClick={handleStopResponse}
                    title="Stop speaking"
                    className="px-2.5 h-7 flex items-center gap-1.5 text-[11px] font-mono text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-full transition-colors outline-none cursor-pointer"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                    <span>Stop</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleAudio}
                  title={isAudioEnabled ? 'Mute Voice' : 'Unmute Voice'}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors outline-none cursor-pointer ${!isAudioEnabled ? 'text-slate-500 hover:text-slate-300 bg-white/[0.03]' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}
                >
                  {isAudioEnabled ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={closeChatModal}
                  title="Close"
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors outline-none cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
              {/* Framed 3-Layer Avatar Viewport */}
              <div className="w-full h-[34dvh] md:w-[295px] md:h-full bg-[#08080a] p-3 md:p-4 border-b md:border-b-0 md:border-r border-white/[0.07] shrink-0 flex flex-col select-none">
                <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-inner select-none">
                  {/* Layer 1: Idle Video */}
                  <video
                    ref={idleRef}
                    src={idleVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    disablePictureInPicture
                    controlsList="nodownload nofullscreen noremoteplayback"
                    className={`absolute inset-0 w-full h-full object-cover object-top md:object-center pointer-events-none select-none transition-opacity duration-100 ${showIdle ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  />
                  {/* Layer 2: Thinking Video */}
                  <video
                    ref={thinkingRef}
                    src={thinkingVideo}
                    preload="auto"
                    muted
                    playsInline
                    disablePictureInPicture
                    controlsList="nodownload nofullscreen noremoteplayback"
                    onEnded={handleThinkingEnded}
                    className={`absolute inset-0 w-full h-full object-cover object-top md:object-center pointer-events-none select-none transition-opacity duration-100 ${showThinking ? 'opacity-100 z-20' : 'opacity-0 z-0'}`}
                  />
                  {/* Layer 3: Speaking Video */}
                  <video
                    ref={speakingRef}
                    src={speakingVideo}
                    preload="auto"
                    muted
                    playsInline
                    disablePictureInPicture
                    controlsList="nodownload nofullscreen noremoteplayback"
                    onEnded={handleSpeakingEnded}
                    className={`absolute inset-0 w-full h-full object-cover object-top md:object-center pointer-events-none select-none transition-opacity duration-75 ${showSpeaking ? 'opacity-100 z-30' : 'opacity-0 z-0'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15 pointer-events-none z-40" />
                </div>
              </div>

              {/* Scrollable Chat Viewport */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#050507] overflow-hidden">
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.12) transparent' }}
                >
                  {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-5 px-2 my-auto">
                      <div className="space-y-2">
                        <div className="w-11 h-11 mx-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] animate-pulse text-white opacity-85">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                            <path d="M5.5 4.5L6.5 7L9 8L6.5 9L5.5 11.5L4.5 9L2 8L4.5 7L5.5 4.5Z" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-semibold text-white tracking-wide">Ask Salik's Digital Twin</h4>
                        <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed opacity-80">
                          Grounded on verified engineering projects, tech stack, and systems architecture.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 w-full max-w-xs pt-1">
                        {[
                          'What is your core tech stack?',
                          'Explain your RAG architecture',
                          'Tell me about your background'
                        ].map((promptText, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => executeAiQuery(promptText)}
                            className="text-left text-xs text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 rounded-xl px-3.5 py-2.5 transition-all flex items-center justify-between group cursor-pointer outline-none"
                          >
                            <span>{promptText}</span>
                            <span className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">↗</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {chatHistory.map((chat, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`w-fit max-w-[85%] rounded-2xl text-sm leading-relaxed ${
                          chat.role === 'user'
                            ? 'bg-white text-black px-4 py-2.5 font-medium shadow-md rounded-br-sm'
                            : 'bg-[#111114] border border-white/[0.08] text-slate-200 p-4 rounded-bl-sm'
                        }`}
                      >
                        {chat.role === 'ai' ? (
                          <div>
                            <ReactMarkdown
                              components={{
                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                li: ({ node, ...props }) => <li className="text-slate-300" {...props} />,
                                strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />
                              }}
                            >
                              {chat.text}
                            </ReactMarkdown>

                            <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleReplayMessage(chat.text, idx)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-white transition-colors outline-none cursor-pointer"
                              >
                                {speakingMsgIdx === idx && isMouthMoving ? (
                                  <>
                                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                      <rect x="4" y="4" width="16" height="16" rx="2" />
                                    </svg>
                                    <span className="text-white font-semibold">Stop Reading</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                                    </svg>
                                    <span>Read Aloud</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          chat.text
                        )}
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="max-w-[85%] bg-transparent p-2 text-slate-400 mr-auto flex items-center gap-2 font-mono text-xs">
                      <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-ping"></span>
                      <span>Synthesizing response...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Dock */}
                <div className="p-4 bg-[#0a0a0d] shrink-0 border-t border-white/[0.07] space-y-2.5">
                  {chatHistory.length === 0 && (
                    <button
                      type="button"
                      onClick={startIntroSequence}
                      className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/10 font-mono text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                      <span>Play Recorded Audio Intro</span>
                    </button>
                  )}

                  <form onSubmit={triggerAiQuery} className="relative flex items-center">
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      disabled={['intro', 'thinking'].includes(aiState) || isChatLoading}
                      placeholder={isChatLoading ? 'Synthesizing...' : 'Ask a technical question...'}
                      className="w-full bg-[#121216] border border-white/10 focus:border-white/30 rounded-xl pl-4 pr-12 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!userQuery.trim() || ['intro', 'thinking'].includes(aiState) || isChatLoading}
                      title="Send question"
                      className={`absolute right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all outline-none ${
                        userQuery.trim() && !['intro', 'thinking'].includes(aiState) && !isChatLoading
                          ? 'bg-white text-black hover:bg-slate-200 cursor-pointer shadow-sm'
                          : 'bg-white/5 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                      </svg>
                    </button>
                  </form>
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