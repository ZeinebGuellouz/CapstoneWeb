from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from main import Base, engine

# ✅ Recreate the database tables
print("Dropping existing tables...")
Base.metadata.drop_all(bind=engine)  # Clears the previous schema

print("Creating new tables...")
Base.metadata.create_all(bind=engine)  # Recreates the schema

print("Database reset successful!")
