# app/main.py
from fastapi import FastAPI
from app.core.database import engine, Base
from app.api import resumes,jobs,analysis,auth # Import our new routes
from fastapi.middleware.cors import CORSMiddleware

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Resume Analyzer API")

# Include the resume router
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(resumes.router, prefix="/api", tags=["Resumes"])
app.include_router(jobs.router,prefix="/api",tags=["Jobs"])
app.include_router(analysis.router,prefix="/api",tags=["Analysis"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your React app's address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Resume Analyzer API"}