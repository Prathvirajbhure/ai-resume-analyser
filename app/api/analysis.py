# app/api/analysis.py
import os
import json
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import models
from app.schemas import schemas

# Fix 1: Add the missing import for authentication
from app.api.auth import get_current_user 

# Fix 2: Use the NEW Google GenAI SDK
from google import genai 

router = APIRouter()

# Initialize the new SDK Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/analyze/")
def analyze_resume(
    request: schemas.AnalysisRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Require auth
):
    # Fetch data
    resume = db.query(models.Resume).filter(models.Resume.id == request.resume_id, models.Resume.user_id == current_user.id).first()
    job = db.query(models.JobDescription).filter(models.JobDescription.id == request.job_id, models.JobDescription.user_id == current_user.id).first()

    if not resume or not job:
        raise HTTPException(status_code=404, detail="Resume or Job not found or unauthorized")

    prompt = f"""
    You are an expert technical recruiter. Compare the following Resume to the Job Description.
    Provide a match score out of 100, a list of missing skills, and brief feedback.
    
    Respond STRICTLY in the following JSON format, with no markdown formatting or extra text:
    {{
        "match_score": 85.5,
        "missing_skills": ["Docker", "Kubernetes"],
        "feedback": "The candidate has strong Python skills but lacks containerization experience."
    }}

    Resume Text: {resume.extracted_text}
    
    Job Description ({job.job_title}): {job.job_text}
    """

    try:
        max_retries = 3
        response = None
        
        # Retry loop for 503 Server Unavailable errors
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model='gemini-3.8-flash', 
                    contents=prompt
                )
                break # If successful, exit the retry loop
                
            except Exception as e:
                if "503" in str(e) and attempt < max_retries - 1:
                    print(f"API overloaded. Retrying in {2 ** attempt} seconds...")
                    time.sleep(2 ** attempt) # Waits 1s, then 2s, then 4s
                    continue
                else:
                    raise e # Raise the error if it's not a 503 or we run out of retries

        if not response:
            raise HTTPException(status_code=500, detail="Failed to get a response from the AI after retries.")

        # Parse the JSON response
        raw_text = response.text.replace('```json', '').replace('```', '').strip()
        ai_result = json.loads(raw_text)

        new_report = models.AnalysisReport(
            resume_id=resume.id,
            job_id=job.id,
            match_score=ai_result.get("match_score", 0.0),
            missing_skills=ai_result.get("missing_skills", []),
            feedback=ai_result.get("feedback", "No feedback provided.")
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_report)

        return ai_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")


@router.get("/analyze/history/")
def get_user_history(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reports = db.query(models.AnalysisReport)\
        .join(models.Resume)\
        .join(models.JobDescription)\
        .filter(models.Resume.user_id == current_user.id)\
        .order_by(models.AnalysisReport.id.desc())\
        .all()
    
    history_data = []
    for report in reports:
        history_data.append({
            "id": report.id,
            "job_title": report.job.job_title,
            "match_score": report.match_score,
            "missing_skills": report.missing_skills,
            "date": report.resume.uploaded_at.strftime("%Y-%m-%d")
        })
        
    return history_data