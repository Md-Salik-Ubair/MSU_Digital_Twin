
import urllib.request
import json
import urllib.error

# ==========================================
# 🔑 YAHAN APNI DONO API KEYS PASTE KAR:
# ==========================================
GROQ_API_KEY = "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"
GEMINI_API_KEY = "AQ.Ab8RN6LCfntSKa-4T5Fsf0_K0RysM9CPx0PchXbAkzC8If_ESQ"
# ==========================================

print("=" * 60)
print("📡 FETCHING LIVE SERVER DATA & API STATUS")
print("=" * 60)

# ---------------------------------------------------------
# 1. GROQ: KEY CHECK & ALLOWED MODELS LIST
# ---------------------------------------------------------
print("\n[1/2] Checking Groq API Key & Allowed Models...")
if "PASTE_" in GROQ_API_KEY or not GROQ_API_KEY.strip():
    print("❌ Groq Key missing in script!")
else:
    req = urllib.request.Request("https://api.groq.com/openai/v1/models")
    req.add_header("Authorization", f"Bearer {GROQ_API_KEY.strip()}")
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print("✅ GROQ API KEY IS VALID! You have access to the following models:")
            for model in data.get("data", []):
                print(f"   ↳ {model['id']}")
            print("\n💡 ACTION: Copy any ONE name from the list above and update it in your backend rag_service.py!")
    except urllib.error.HTTPError as e:
        print(f"❌ GROQ KEY FAILED! HTTP Error: {e.code} - {e.reason}")
        print(f"   ↳ Response: {e.read().decode()}")
    except Exception as e:
        print(f"❌ Groq System Error: {e}")

# ---------------------------------------------------------
# 2. GEMINI: DIRECT API KEY CHECK
# ---------------------------------------------------------
print("\n[2/2] Checking Google Gemini API Key Validation...")
if "PASTE_" in GEMINI_API_KEY or not GEMINI_API_KEY.strip():
    print("❌ Gemini Key missing in script!")
else:
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY.strip()}"
    try:
        with urllib.request.urlopen(url) as response:
            print("✅ GEMINI API KEY IS 100% VALID AND ACTIVE!")
    except urllib.error.HTTPError as e:
        print(f"❌ GEMINI KEY FAILED! HTTP Error: {e.code} - {e.reason}")
        print(f"   ↳ Response: {e.read().decode()}")
    except Exception as e:
        print(f"❌ Gemini System Error: {e}")

print("\n" + "=" * 60)