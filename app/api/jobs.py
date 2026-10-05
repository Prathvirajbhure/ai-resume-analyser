# app/api/jobs.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_user

router = APIRouter()

@router.post("/jobs/")
def create_job(
    job: schemas.JobCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Authentication required
):
    # CRITICAL FIX: Link the job description to the currently logged-in user!
    new_job = models.JobDescription(
        user_id=current_user.id, 
        job_title=job.job_title,
        job_text=job.job_text
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    return {"message": "Job saved successfully", "job_id": new_job.id}