<div align="center">
  <img src="ReadmeAssets/01_hero.png" alt="Project Hero" width="100%" />
</div>

<h1 align="center">Production-Grade RAG Portfolio & Digital Twin</h1>

<p align="center">
  <b>Architected by Md Salik Ubair</b><br/>
  A production-grade founder portfolio featuring an <b>interactive AI Digital Twin powered by localized Retrieval-Augmented Generation (RAG)</b>, audio-visual synchronization, and a <b>Dynamic Admin Matrix</b>. Engineered to decouple heavy asynchronous AI inference and vector indexing from the frontend client, delivering an ultra-minimalist executive UX.
</p>

<div align="center">
  <img src="https://img.shields.io/badge/Architecture-RAG-sky" alt="RAG Architecture" />
  <img src="https://img.shields.io/badge/Frontend-React_18_%7C_Tailwind_CSS-blue" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Python_%7C_Flask_%7C_MongoDB-emerald" alt="Backend" />
  <img src="https://img.shields.io/badge/LLM-Groq_gpt--oss--120B_%7C_20B_Fallback-purple" alt="LLM" />
  <img src="https://img.shields.io/badge/Embeddings-Google_Gemini_Text--004-red" alt="Embeddings" />
</div>

---

## 🚀 Architectural Innovations & Core Features

### 1. The Digital Twin (Real-Time RAG Agent)
<div align="center">
  <img src="ReadmeAssets/03_rag_twin.png" alt="Digital Twin Interface" width="90%" />
</div>

*   **Inference Engine:** Utilizes Multi-Tier Groq LLM Engine (gpt-oss-120b with fallback to 20b) for ultra-low latency, intelligent response synthesis.
*   **Semantic Matrix:** Localized `ChromaDB` vector store powered by Google Generative AI Embeddings (`text-embedding-004`) with `RecursiveCharacterTextSplitter` for crash-proof data ingestion.
*   **Hidden Context Embedding:** Deep technical documentation (`hidden_readme`) is embedded per database node. The AI autonomously understands complex underlying architectures without cluttering the public UI.
*   **Synchronized Audio-Visuals:** Integrates `Edge-TTS` for real-time audio streaming. Features a hardware-accelerated video state controller mapping an avatar between idle, thinking, and speaking modes.
*   **Zero-Hallucination Guardrails:** Hardcoded ground-truth metrics (dynamic age, verified project counts) injected directly into the LLM context at runtime.

### 2. Dynamic Admin Control Hub & Matrix Synchronization
<div align="center">
  <img src="ReadmeAssets/05_admin_hub.png" alt="Admin Hub Control" width="90%" />
</div>

*   **Zero-Downtime Re-Indexing:** Secure `MongoDB` integration enabling native CRUD operations. Updating records automatically triggers background threading to re-embed and synchronize ChromaDB.
*   **O(1) Node Reordering:** Smooth, optimistic UI sequencing (`↑` / `↓` indices) dynamically synced to the persistent MongoDB schema.
*   **Master Corpus Pipeline:** Ingests raw master CV text directly into vector chunks for real-time memory expansion.

### 3. Executive Founder UI & Minimalist Architecture
<div align="center">
  <img src="ReadmeAssets/02_loader.png" alt="Minimalist System Loader" width="70%" />
</div>
<br/>
<div align="center">
  <img src="ReadmeAssets/06_mobile.png" alt="Responsive Mobile Split View" width="35%" />
</div>

*   **Minimalist Brand Loading:** Monochromatic typography loader masking cold-start backend wake-up cycles.
*   **Ghost Card Layouts:** Transparent card containers with ultra-subtle micro-borders to maintain structural visual hierarchy without boxed UI clutter.
*   **Fixed Mobile Viewport Split:** Precision-engineered 40/60 mobile modal layout keeping the avatar's portrait framing locked while allowing seamless chat log scrolling.
---

## ⚙️ System Architecture Data Flow

```text
[ Visitor / Technical Recruiter ]
        │
        ▼
[ React 18 + Tailwind Frontend Interface ]
        │
        ├───► [ Direct Inquiries ] ───► [ Official Channels: LinkedIn / Email ]
        │
        └───► [ AI Assistant Interactive Query ]
                    │
                    ▼
        [ Flask REST Backend Gateway ]
                    │
       ┌────────────┴───────────────────────────┐
       ▼                                        ▼
[ MongoDB Atlas Cloud ]               [ LangChain RAG Engine ]
 (Master Nodes Schema)                          │
       │                                        ├───► Gemini Text-Embedding-004 (768-D)
       │                                        ├───► ChromaDB Vector Similarity Search
       └────► [ Background Re-Index Worker ] ───┼───► Dynamic Ground-Truth Facts Injection
                                                │
                                                ▼
                                    [ Groq Multi-Tier Engine ]
                                  (gpt-oss-120b ➔ 20b Fallback)
                                                │
                                                ▼
                                    [ Edge-TTS Audio Engine ]
                                                │
                                                ▼
                                    [ Audio Blob + Text Payload ]
                                                │
                                                ▼
                                 [ Hardware-Accelerated Avatar Sync ]
```
# 🛠️ Core Technology Stack

## Frontend Interface Layer
- **React.js 18 (Vite)**
- **Tailwind CSS v4** (Grainy Gradients, Cyber-Aesthetics)
- **React-Markdown** (Dynamic Text Rendering)
- **Hardware-Accelerated Video Elements**

## Backend Execution Core
- **Python** (Flask, Gunicorn WSGI Gateway)
- **ChromaDB** (Vector Similarity Search)
- **MongoDB** (Persistent Storage & Structural Data)
- **LangChain** (Pipeline Orchestration)
- **Groq API** (openai/gpt-oss-120b & 20b Fallback)
- **Google Generative AI** (text-embedding-004)

---

# 💻 Local Deployment Architecture

## Prerequisites
- Node.js (v16+)
- Python 3.9+
- MongoDB Instance (Local or Cloud Atlas)

---

## 1. Backend Initialization

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

```
# Create a .env file in the backend/ root:
```bash
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```
##### Run the server:
python run.py
# 2. Frontend Initialization
cd frontend
npm install
### Create a .env file in the frontend/ root:
VITE_API_URL=http://127.0.0.1:5000
### Start the development server:
npm run dev
---
<div align="center">
  <p>Architected and Engineered by <b>Md Salik Ubair</b></p>
  <p>AI Engineer I & Data Scientist | 📍 Bhubaneswar, India</p>
  <p>
    <a href="mailto:mdsalikubair@gmail.com">Email</a> • 
    <a href="https://linkedin.com/in/md-salik-ubair">LinkedIn</a> • 
    <a href="https://portfolio-salik-live.vercel.app">Live Portfolio</a>
  </p>
</div>
