import re
import json
from typing import List, Tuple, Generator
from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def generate_answer(question: str, context_chunks: List[str], history: List[dict] = None) -> Tuple[str, str, int]:
    context = "\n\n".join(context_chunks)
    page_source = None
    for chunk in context_chunks:
        match = re.search(r"\[PAGE (\d+)\]", chunk)
        if match:
            page_source = f"Page {match.group(1)}"
            break
    system_prompt = f"""Tu es un assistant intelligent spécialisé dans l'analyse de documents PDF.
Réponds uniquement en te basant sur le contexte fourni.
Si la réponse n'est pas dans le contexte, dis-le clairement.

CONTEXTE:
{context}"""
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history[-6:])
    messages.append({"role": "user", "content": question})
    response = client.chat.completions.create(
        model=settings.LLM_MODEL, messages=messages, max_tokens=1000, temperature=0.3
    )
    return response.choices[0].message.content, page_source, response.usage.total_tokens

def stream_answer(question: str, context_chunks: List[str], history: List[dict] = None) -> Generator:
    context = "\n\n".join(context_chunks)
    system_prompt = f"""Tu es un assistant intelligent spécialisé dans l'analyse de documents PDF.
Réponds uniquement en te basant sur le contexte fourni.

CONTEXTE:
{context}"""
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history[-6:])
    messages.append({"role": "user", "content": question})
    stream = client.chat.completions.create(
        model=settings.LLM_MODEL, messages=messages, max_tokens=1000, temperature=0.3, stream=True
    )
    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content

def generate_summary(text: str, level: str = "standard") -> str:
    levels = {
        "flash":    "Résume en maximum 5 lignes les points essentiels.",
        "standard": "Fais un résumé structuré d'une page avec les points clés.",
        "detailed": "Fais un résumé très détaillé et complet."
    }
    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Tu es un expert en synthèse de documents."},
            {"role": "user",   "content": f"{levels.get(level, levels['standard'])}\n\nDOCUMENT:\n{text[:4000]}"}
        ],
        max_tokens=1500, temperature=0.3
    )
    return response.choices[0].message.content

def generate_quiz(text: str, nb_questions: int = 5, difficulty: str = "medium") -> list:
    difficulty_map = {
        "easy":   "des questions simples de compréhension directe",
        "medium": "des questions de compréhension et d'analyse",
        "hard":   "des questions complexes nécessitant une analyse approfondie"
    }
    prompt = f"""Génère {nb_questions} questions QCM ({difficulty_map.get(difficulty, difficulty_map['medium'])}).
Réponds UNIQUEMENT avec un JSON valide, sans texte autour:
[
  {{
    "question": "La question",
    "options": ["A", "B", "C", "D"],
    "correct_answer": 0,
    "explanation": "Explication",
    "page_source": "Page X"
  }}
]
DOCUMENT:
{text[:4000]}"""
    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Tu génères des QCM en JSON valide uniquement."},
            {"role": "user",   "content": prompt}
        ],
        max_tokens=2000, temperature=0.5
    )
    content = re.sub(r"^```json|^```|```$", "", response.choices[0].message.content.strip(), flags=re.MULTILINE).strip()
    return json.loads(content)

def extract_entities(text: str) -> dict:
    prompt = f"""Extrais les entités nommées. Réponds UNIQUEMENT avec un JSON valide:
{{
  "persons": [],
  "organizations": [],
  "locations": [],
  "dates": [],
  "amounts": [],
  "keywords": []
}}
DOCUMENT:
{text[:4000]}"""
    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Tu extrais des entités en JSON valide uniquement."},
            {"role": "user",   "content": prompt}
        ],
        max_tokens=1000, temperature=0.1
    )
    content = re.sub(r"^```json|^```|```$", "", response.choices[0].message.content.strip(), flags=re.MULTILINE).strip()
    return json.loads(content)

def generate_mindmap(text: str) -> dict:
    prompt = f"""Analyse ce document et génère une mind map des concepts principaux.
Réponds UNIQUEMENT avec un JSON valide, sans texte autour:
{{
  "central": "Sujet principal du document en 3 mots max",
  "branches": [
    {{
      "id": "1",
      "label": "Concept principal (3 mots max)",
      "color": "#3b82f6",
      "children": [
        {{"id": "1-1", "label": "Sous-concept (3 mots)"}},
        {{"id": "1-2", "label": "Sous-concept (3 mots)"}}
      ]
    }}
  ]
}}
Génère entre 4 et 6 branches principales, 2 à 3 enfants par branche maximum.
Utilise ces couleurs pour les branches: "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"

DOCUMENT:
{text[:4000]}"""
    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Tu génères des mind maps en JSON valide uniquement."},
            {"role": "user",   "content": prompt}
        ],
        max_tokens=1500, temperature=0.3
    )
    content = re.sub(r"^```json|^```|```$", "", response.choices[0].message.content.strip(), flags=re.MULTILINE).strip()
    return json.loads(content)
