# app/schemas/schemas.py
from pydantic import BaseModel,EmailStr
from typing import List, Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    
# Schema for the user sending a Job Description
class JobCreate(BaseModel):
    job_title: str
    job_text: str

# Schema for the user requesting an Analysis
class AnalysisRequest(BaseModel):
    resume_id: int
    job_id: int