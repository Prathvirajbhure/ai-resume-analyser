# app/api/resumes.py
import io
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pdfminer.high_level import extract_text
from app.core.database import get_db
from app.models import models
from app.api.auth import get_current_user

router = APIRouter()

@router.post("/upload-resume/")
async def upload_resume(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Authentication required
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        content = await file.read()
        text = extract_text(io.BytesIO(content))
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text.")

        # CRITICAL FIX: Link the resume to the currently logged-in user!
        new_resume = models.Resume(
            user_id=current_user.id, 
            file_path=file.filename,
            extracted_text=text.strip()
        )
        db.add(new_resume)
        db.commit()
        db.refresh(new_resume)
        
        return {
            "message": "Resume uploaded successfully!",
            "resume_id": new_resume.id,
            "extracted_length": len(text)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")