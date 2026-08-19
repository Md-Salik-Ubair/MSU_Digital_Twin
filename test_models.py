import os
import urllib.request
import json

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")

# Verified active names from your key report
test_models = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "allam-2-7b"
]

print("🔍 Dry-running exact Groq model endpoints...\n")

for model in test_models:
    payload = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": "Respond with 'SUCCESS' only."}],
        "max_tokens": 10
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY.strip()}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        }
    )

    try:
        with urllib.request.urlopen(req) as res:
            if res.status == 200:
                response_data = json.loads(res.read().decode())
                reply = response_data['choices'][0]['message']['content'].strip()
                print(f"✅ WORKING: '{model}' | Output: {reply}")
    except urllib.error.HTTPError as e:
        print(f"❌ FAILED: '{model}' -> HTTP {e.code}: {e.read().decode()}")
    except Exception as e:
        print(f"❌ ERROR: '{model}' -> {e}")