import os
from typing import Callable, Tuple, Optional

# This module exposes get_llm and get_embeddings factories.
# Optional heavy ML/LLM libraries are imported lazily. If you see
# "reportMissingImports" from your editor (Pylance), install the
# optional packages into the project's virtualenv or configure the
# Python interpreter in your editor to use `.venv`.

def get_openai_clients():
    try:
        from langchain import OpenAI
        from langchain.embeddings import OpenAIEmbeddings
    except Exception:
        OpenAI = None
        OpenAIEmbeddings = None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    embed_model = os.getenv("OPENAI_EMBEDDING", "text-embedding-3-small")

    def llm_generate(prompt: str):
        if OpenAI is None:
            raise RuntimeError("OpenAI/langchain packages not installed")
        llm = OpenAI(model_name=model, openai_api_key=os.getenv("OPENAI_API_KEY"))
        return llm(prompt)

    def embed_texts(texts):
        if OpenAIEmbeddings is None:
            raise RuntimeError("OpenAI/langchain packages not installed")
        emb = OpenAIEmbeddings(model=embed_model, openai_api_key=os.getenv("OPENAI_API_KEY"))
        return emb.embed_documents(texts)

    return llm_generate, embed_texts


def get_gemini_clients():
    """Return (llm_generate, embed_texts) for Google Gemini.

    Env vars:
      - GEMINI_API_KEY or GOOGLE_API_KEY
      - GEMINI_MODEL (default: gemini-1.5-flash)
    """
    try:
        import google.generativeai as genai  # type: ignore
    except Exception:
        genai = None

    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    def _configure():
        if genai is None:
            raise RuntimeError("google-generativeai not installed or configured")
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY/GOOGLE_API_KEY not set")
        genai.configure(api_key=api_key)

    def llm_generate(prompt: str):
        _configure()
        model = genai.GenerativeModel(model_name)
        resp = model.generate_content(prompt)
        # Prefer .text if available else join parts
        if hasattr(resp, "text") and resp.text:
            return resp.text
        # Fallback join
        try:
            parts = []
            for cand in getattr(resp, "candidates", []) or []:
                for part in getattr(cand, "content", {}).get("parts", []) or []:
                    parts.append(str(getattr(part, "text", part)))
            return "\n".join(parts) if parts else ""
        except Exception:
            return ""

    def embed_texts(texts):
        # Keep lightweight fallback embedding to avoid heavy deps by default
        dim = int(os.getenv("LOCAL_EMBED_DIM", "384"))
        vectors = []
        for t in texts:
            v = [0] * dim
            for i, ch in enumerate(t.encode("utf-8")):
                v[i % dim] = (v[i % dim] + ch) % 1000
            vectors.append([float(x) for x in v])
        return vectors

    return llm_generate, embed_texts


def get_local_clients():
    provider = os.getenv("LOCAL_LLM_TYPE", "llama_cpp")

    if provider == "llama_cpp":
        try:
            from llama_cpp import Llama  # type: ignore
        except Exception:
            Llama = None

        model_path = os.getenv("LOCAL_LLM_PATH", "./models/ggml-model.bin")

        def llm_generate(prompt: str):
            if Llama is None:
                raise RuntimeError("llama_cpp not installed")
            llm = Llama(model_path=model_path)
            res = llm.create(prompt=prompt, max_tokens=512)
            return res["choices"][0]["text"]

    elif provider == "tgi":
        import requests
        tgi_url = os.getenv("LOCAL_LLM_URL", "http://localhost:8080/v1/models/model:predict")

        def llm_generate(prompt: str):
            r = requests.post(tgi_url, json={"inputs": prompt, "parameters": {"max_new_tokens": 512}})
            r.raise_for_status()
            return r.json()

    else:
        raise RuntimeError(f"Unsupported LOCAL_LLM_TYPE={provider}")

    # embeddings using sentence-transformers
    def embed_texts(texts):
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
            model = SentenceTransformer(os.getenv("LOCAL_EMBED_MODEL", "all-MiniLM-L6-v2"))
            return [m.tolist() for m in model.encode(texts)]
        except Exception:
            # cheap deterministic fallback embedding (no external deps)
            dim = int(os.getenv("LOCAL_EMBED_DIM", "384"))
            vectors = []
            for t in texts:
                v = [0] * dim
                for i, ch in enumerate(t.encode("utf-8")):
                    v[i % dim] = (v[i % dim] + ch) % 1000
                vectors.append([float(x) for x in v])
            return vectors

    return llm_generate, embed_texts


def get_llm_and_embeddings() -> Tuple[Callable[[str], str], Callable]:
    provider = os.getenv("LLM_PROVIDER", "local").lower()
    if provider == "openai":
        return get_openai_clients()
    if provider == "gemini":
        return get_gemini_clients()
    if provider == "local":
        return get_local_clients()
    raise RuntimeError(f"Unknown LLM_PROVIDER={provider}")
