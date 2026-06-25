# 🧠 Assistant IA pour Analyse de Documents PDF

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991?logo=openai)
![FAISS](https://img.shields.io/badge/FAISS-RAG-orange)
![License](https://img.shields.io/badge/Licence-MIT-green)

> **Projet n°6 — Module Modélisation Avancée des Logiciels — SupMTI 2025-2026**

Application Full-Stack intelligente permettant d'analyser des documents PDF via un pipeline RAG (Retrieval-Augmented Generation), avec streaming WebSocket en temps réel, dashboard analytique et back office d'administration complet.

---

## 📸 Aperçu

| Dashboard | Chat Streaming | Mind Map |
|:---------:|:--------------:|:--------:|
| Stats & graphiques temps réel | Réponses token par token | Carte mentale interactive SVG |

---

## ✨ Fonctionnalités

### 👤 Espace Utilisateur
- 🔐 **Authentification JWT** — Inscription, connexion, refresh token automatique
- 📤 **Upload PDF** — Drag & drop, détection automatique natif/scanné (OCR), barre de progression
- ⚡ **Chat Streaming** — Réponses en temps réel via WebSocket (effet ChatGPT), citations de pages sources
- 💬 **Historique** — Toutes les conversations sauvegardées et rechargeables
- 📄 **Résumé Intelligent** — 3 niveaux : Flash (5 lignes) / Standard / Détaillé
- 🧠 **Quiz Interactif** — QCM auto-généré avec timer 45s, barre de progression, score
- 🏷️ **Extraction d'Entités** — Personnes, organisations, lieux, dates, montants, mots-clés
- 🗺️ **Mind Map Interactive** — Graphe SVG des concepts avec export
- 📊 **Dashboard** — Statistiques personnelles, bar chart, pie chart, tokens consommés

### 🛡️ Back Office Admin
- 📈 Stats globales (utilisateurs, documents, tokens, coût OpenAI estimé)
- 👥 Gestion des utilisateurs — activation/désactivation, changement de rôle via dropdown
- 📁 Vue de tous les documents avec métadonnées et suppression
- 💬 Inspection du contenu des conversations de tous les utilisateurs

---

## 🏗️ Architecture

```
assistant-pdf-ia/
├── backend/                    # API FastAPI (Python 3.11)
│   ├── main.py                 # Point d'entrée
│   ├── .env.example            # Variables d'environnement à configurer
│   ├── requirements.txt        # Dépendances Python
│   └── app/
│       ├── core/               # Config, Database, Security (JWT)
│       ├── models/             # User, Document, Conversation, Message, Quiz, Analytics
│       ├── schemas/            # Validation Pydantic
│       ├── services/           # PDF, RAG (FAISS), OpenAI, Analytics
│       └── api/                # Routes : auth, documents, chat, quiz, summary, entities, admin
│
└── frontend/                   # Application React 18 + TypeScript
    └── src/
        ├── App.tsx             # Routeur avec routes protégées
        ├── types/              # Interfaces TypeScript
        ├── services/           # Appels API (axios) + WebSocket
        ├── store/              # État global Zustand
        ├── components/         # Layout, UI, Documents
        └── pages/              # Login, Register, Dashboard, Chat, Quiz, Summary...
```

---

## 🚀 Installation

### Prérequis
- Python **3.11** — https://www.python.org/downloads/release/python-3119/
- Node.js **18+** — https://nodejs.org/
- Une clé API **OpenAI** — https://platform.openai.com/api-keys

---

### 1. Cloner le dépôt

```bash
git clone https://github.com/tahirou212/assistant-pdf-ia.git
cd assistant-pdf-ia
```

---

### 2. Configurer le Backend

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv

# Activer le venv
# Windows :
venv\Scripts\activate
# Mac/Linux :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

**Configurer les variables d'environnement :**

```bash
# Copier le fichier exemple
cp .env.example .env
```

Ouvrir `.env` et renseigner votre clé OpenAI :

```env
OPENAI_API_KEY=sk-votre-cle-openai-ici
DATABASE_URL=sqlite:///./assistant_pdf.db
SECRET_KEY=assistant-pdf-jwt-secret-2025
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
APP_NAME=Assistant PDF IA
DEBUG=True
MAX_FILE_SIZE_MB=20
MAX_DOCUMENTS_PER_USER=10
LLM_MODEL=gpt-3.5-turbo
EMBEDDING_MODEL=text-embedding-3-small
```

**Lancer le backend :**

```bash
uvicorn main:app --reload --port 8000
```

Le backend est disponible sur : http://127.0.0.1:8000
Documentation Swagger : http://127.0.0.1:8000/docs

---

### 3. Configurer le Frontend

Ouvrir un **nouveau terminal** :

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le frontend
npm run dev
```

L'application est disponible sur : http://localhost:5173

---

### 4. Créer un compte Admin (optionnel)

Avec le backend actif, exécuter dans le dossier `backend` (venv activé) :

```bash
python -c "
from app.core.database import SessionLocal
from app.models.user import User
import bcrypt
db = SessionLocal()
admin = User(
    email='admin@pdf.com',
    username='Admin',
    password_hash=bcrypt.hashpw('admin123'.encode(), bcrypt.gensalt()).decode(),
    role='admin'
)
db.add(admin)
db.commit()
print('Compte admin créé : admin@pdf.com / admin123')
"
```

---

## 🔬 Pipeline RAG — Fonctionnement

```
PDF uploadé
    │
    ▼ Détection automatique
    ├── PDF natif  ──► PyMuPDF  (extraction directe)
    └── PDF scanné ──► EasyOCR  (reconnaissance optique)
                            │
                            ▼
                    Chunking (500 tokens, overlap 50)
                            │
                            ▼
                    Embeddings OpenAI (text-embedding-3-small)
                            │
                            ▼
                    Index FAISS (persisté sur disque)
                            │
                    ┌───────┴────────┐
                    │   Question     │
                    ▼               │
              Embedding requête     │
                    │               │
                    ▼               │
         Recherche k=5 chunks ◄─────┘
                    │
                    ▼
         Injection contexte + GPT-3.5-turbo
                    │
                    ▼
         Streaming WebSocket token par token
```

---

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| State | Zustand + Framer Motion |
| Charts | Recharts |
| Backend | FastAPI (Python 3.11) |
| Base de données | SQLite (dev) / PostgreSQL (prod) |
| ORM | SQLAlchemy + Alembic |
| RAG | LangChain + FAISS |
| LLM | OpenAI GPT-3.5-turbo |
| Embeddings | text-embedding-3-small |
| PDF natif | PyMuPDF (fitz) |
| PDF scanné | EasyOCR |
| Auth | JWT (python-jose) + bcrypt |
| Streaming | WebSockets natifs |

---

## 📡 Endpoints API principaux

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion → tokens JWT |
| POST | `/api/documents/upload` | Upload PDF |
| GET | `/api/documents/` | Liste des documents |
| GET | `/api/documents/{id}/mindmap` | Générer une mind map |
| POST | `/api/chat/{id}/ask` | Poser une question (HTTP) |
| WS | `/api/chat/{id}/stream` | Chat streaming WebSocket |
| POST | `/api/summary/{id}` | Générer un résumé |
| POST | `/api/quiz/{id}/generate` | Générer un quiz |
| GET | `/api/entities/{id}` | Extraire les entités |
| GET | `/api/analytics/me` | Stats utilisateur |
| GET | `/api/admin/stats` | Stats globales (admin) |
| GET | `/api/admin/users` | Tous les utilisateurs (admin) |
| GET | `/api/admin/conversations` | Toutes les conversations (admin) |

---

## 👤 Auteur

**Tahirou** — Étudiant SupMTI  
Module : Modélisation Avancée des Logiciels  
Année : 2025-2026

---

## 📄 Licence

Ce projet est développé dans un cadre académique — SupMTI 2025-2026.
