# app/models/models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships to access a user's resumes and jobs easily
    resumes = relationship("Resume", back_populates="owner")
    jobs = relationship("JobDescription", back_populates="owner")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String, nullable=False)  # Where the file is stored locally or in cloud
    extracted_text = Column(Text)               # The raw text we parse from the PDF
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="resumes")
    reports = relationship("AnalysisReport", back_populates="resume")

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    job_title = Column(String, nullable=False)
    job_text = Column(Text, nullable=False)     # The actual job requirements
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="jobs")
    reports = relationship("AnalysisReport", back_populates="job")

class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    job_id = Column(Integer, ForeignKey("job_descriptions.id"))
    match_score = Column(Float)                 # E.g., 85.5%
    missing_skills = Column(JSON)               # Storing the AI's list of missing skills
    feedback = Column(Text)                     # General AI feedback

    resume = relationship("Resume", back_populates="reports")
    job = relationship("JobDescription", back_populates="reports")