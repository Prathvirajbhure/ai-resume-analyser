# AI Resume & Job Matching Platform

Built a full-stack app using Google Gemini AI to evaluate PDF resumes against job descriptions, extracting match scores and skill gaps via strict JSON prompts.
Developed a secure FastAPI REST API with JWT authentication, in-memory PDF parsing, and exponential backoff for API rate-limit resilience.
Designed a responsive React and Tailwind CSS frontend to manage multi-part file uploads, asynchronous state, and a user history dashboard.

## Tech Stack
* **Frontend:** React, Vite, Tailwind CSS
* **Backend:** FastAPI, Python 3.13, SQLAlchemy, JWT Authentication
* **Database:** PostgreSQL
* **AI Integration:** Google GenAI SDK (Gemini 3.8 Flash)

## How to Run Locally

### 1. Backend and Frontend Setup
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Create a .env file and add GEMINI_API_KEY=your_key
python -m uvicorn app.main:app --reload

cd frontend
npm install
npm run dev
