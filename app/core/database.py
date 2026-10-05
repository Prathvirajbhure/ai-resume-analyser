# app/core/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env

# Fetch the database URL from the environment
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# The engine is the starting point for any SQLAlchemy application
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# SessionLocal will be used to create individual database sessions for each request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the class that all our database models will inherit from
Base = declarative_base()

# Dependency function to get the database session in our API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()