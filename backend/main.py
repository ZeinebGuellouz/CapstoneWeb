from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from typing import List
import shutil
import os
import pythoncom
import comtypes.client
from pptx import Presentation
from pdf2image import convert_from_path
import pdfplumber
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import requests
import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import Header


# ========== FASTAPI SETUP ==========
app = FastAPI()
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "presentpro-b7e76-firebase-adminsdk-fbsvc-f540aa32d5.json"

cred = credentials.Certificate("presentpro-b7e76-firebase-adminsdk-fbsvc-f540aa32d5.json")
firebase_admin.initialize_app(cred)
db = firestore.Client()

# ✅ Function to verify Firebase Token
def verify_firebase_token(token: str):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token  # Returns user data
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== SIGNUP (Handled by Firebase) ==========
class UserSignup(BaseModel):
    email: str
    password: str

@app.post("/signup")
def signup(user: UserSignup):
    try:
        # ✅ Create user in Firebase
        firebase_user = auth.create_user(email=user.email, password=user.password)
        return {"message": "User registered successfully", "uid": firebase_user.uid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ✅ API Route for OAuth Login (Google & Facebook)
@app.post("/oauth-login")
def oauth_login(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token format")

    token = authorization.split("Bearer ")[1]  # ✅ Extract the token
    user_data = verify_firebase_token(token)

    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid Firebase Token")

    return {"message": "OAuth login successful", "email": user_data.get("email")}

# ✅ PASSWORD RESET (Handled by Firebase)
@app.post("/reset-password")
def reset_password(email: str):
    try:
        auth.generate_password_reset_link(email)
        return {"message": "Password reset email sent successfully"}
    except firebase_admin.exceptions.FirebaseError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ========== DATABASE SETUP ==========
SPEECHES_DATABASE_URL = "sqlite:///./speeches.db"
speeches_engine = create_engine(SPEECHES_DATABASE_URL, connect_args={"check_same_thread": False})
SpeechesSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=speeches_engine)
SpeechesBase = declarative_base()

# ========== SPEECHES DATABASE MODEL ==========
class Speech(SpeechesBase):
    __tablename__ = "speeches"

    id = Column(Integer, primary_key=True, index=True)
    presentation_id = Column(String, index=True)
    slide_number = Column(Integer, index=True)
    generated_speech = Column(String)
    voice_tone = Column(String, default="Formal")
    speed = Column(Float, default=1.0)
    pitch = Column(Float, default=1.0)
SpeechesBase.metadata.create_all(bind=speeches_engine)

# ========== DATABASE DEPENDENCIES ==========
def process_pdf(file_path: Path) -> List[str]:
    try:
        slides = convert_from_path(file_path, dpi=150, output_folder=SLIDE_DIR, fmt="png")
        return [f"/uploads/slides/{Path(slide.filename).name}" for slide in slides]
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return []

def extract_text_from_pptx(file_path: Path) -> List[str]:
    try:
        prs = Presentation(file_path)
        slide_texts = []
        for slide in prs.slides:
            text = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    text.append(shape.text)
            slide_texts.append("\n".join(text))
        return slide_texts
    except Exception as e:
        print(f"Error extracting text from PPTX: {e}")
        return []

def extract_text_from_pdf(file_path: Path) -> List[str]:
    try:
        slide_texts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                slide_texts.append(page.extract_text() or "")
        return slide_texts
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return []

def process_pptx(file_path: Path) -> List[str]:
    pythoncom.CoInitialize()
    pptx_file = os.path.abspath(file_path)
    output_folder = os.path.abspath(SLIDE_DIR)
    os.makedirs(output_folder, exist_ok=True)

    try:
        powerpoint = comtypes.client.CreateObject("PowerPoint.Application")
        presentation = powerpoint.Presentations.Open(pptx_file, WithWindow=False)

        slide_paths = []
        for i, slide in enumerate(presentation.Slides):
            output_image = os.path.join(output_folder, f"slide_{i + 1}.png")
            slide.Export(output_image, "PNG", 1280, 720)
            slide_paths.append(f"/uploads/slides/slide_{i + 1}.png")

        presentation.Close()
        powerpoint.Quit()
        return slide_paths
    except Exception as e:
        print(f"Error processing PPTX: {e}")
        return []

def get_speeches_db():
    db = SpeechesSessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== Pydantic Models ==========
class SpeechRequest(BaseModel):
    presentation_id: str
    slide_number: int
    generated_speech: str
    voice_tone: str = "Formal"
    speed: float = 1.0
    pitch: float = 1.0

# ========== API to Generate Speech ==========
@app.post("/generate_speech/")
async def generate_speech(request: Request):
    try:
        body = await request.json()
        previous_slides = body.get("previous_slides", [])
        current_slide = body.get("current_slide", {})
        slide_index = body.get("slide_index", 0)

        if not current_slide:
            return {"error": "No current slide provided"}

        first_slide_text = previous_slides[0]["text"] if previous_slides else current_slide["text"]
        language = "French" if any(word in first_slide_text.lower() for word in ["le", "la", "les", "un", "une", "est", "avec"]) else "English"

        prompt = (
            f"You are an AI assistant generating **concise, natural-sounding** speech for a {language} presentation. "
            f"Your speech should be **short, engaging, and directly relevant to the slide**, keeping it in **{language}**.\n"
            "Avoid unnecessary introductions like 'Ladies and gentlemen' or 'Mesdames et messieurs' and repetitive information.\n\n"
        )

        if previous_slides:
            prompt += f"The previous slides covered (in {language}):\n"
            for i, slide in enumerate(previous_slides):
                prompt += f"- Slide {i+1}: {slide['text']}\n"
            prompt += "\n"

        prompt += (
            f"Now, generate **a short, clear, and engaging speech** ONLY for **Slide {slide_index+1}** in **{language}**:\n"
            f"{current_slide['text']}\n\n"
            "Keep the response concise (**3-5 sentences**), avoiding repetition of prior slides."
        )

        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "mistral",
                "prompt": prompt,
                "stream": False,
                "max_tokens": 150
            }
        )

        if response.status_code != 200:
            return {"error": f"Ollama API Error: {response.text}"}

        data = response.json()
        generated_speech = data.get("response", "").strip()

        if not generated_speech:
            return {"error": "Empty response from Mistral"}

        return {"speech": generated_speech}

    except requests.exceptions.ConnectionError:
        return {"error": "Failed to connect to Ollama. Ensure it's running."}

    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

@app.get("/uploads/slides/{filename}")
async def get_slide(filename: str):
    file_path = SLIDE_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(file_path, headers={"Cache-Control": "no-cache, no-store, must-revalidate"})

@app.post("/save_speech")
async def save_speech(request: Request, db: Session = Depends(get_speeches_db)):
    body = await request.json()
    speech = SpeechRequest(**body)

    existing_speech = db.query(Speech).filter(
        Speech.presentation_id == speech.presentation_id,
        Speech.slide_number == speech.slide_number
    ).first()

    if existing_speech:
        existing_speech.generated_speech = speech.generated_speech
        existing_speech.voice_tone = speech.voice_tone
        existing_speech.speed = speech.speed
        existing_speech.pitch = speech.pitch
    else:
        db.add(Speech(**speech.dict()))

    db.commit()
    return {"message": "Speech settings saved successfully!"}

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_ext = file.filename.split(".")[-1].lower()

    if file_ext not in ["pptx", "pdf"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a .pptx or .pdf file.")

    file_path = UPLOAD_DIR / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    clear_slide_directory()

    slide_images = []
    slide_texts = []

    try:
        if file_ext == "pptx":
            slide_images = process_pptx(file_path)
            slide_texts = extract_text_from_pptx(file_path)
        elif file_ext == "pdf":
            slide_images = process_pdf(file_path)
            slide_texts = extract_text_from_pdf(file_path)
    except Exception as e:
        print(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the file.")

    if not slide_images:
        raise HTTPException(status_code=500, detail="No slides were extracted. Please check the file format.")

    return {
        "filename": file.filename,
        "slides": [
            {"image": f"http://127.0.0.1:8000{path}", "text": text}
            for path, text in zip(slide_images, slide_texts)
        ],
    }

UPLOAD_DIR = Path("uploads")
SLIDE_DIR = UPLOAD_DIR / "slides"
UPLOAD_DIR.mkdir(exist_ok=True)
SLIDE_DIR.mkdir(exist_ok=True)

def clear_slide_directory():
    for file in SLIDE_DIR.iterdir():
        if file.is_file():
            file.unlink()

@app.get("/get_speech")
async def get_speech(presentation_id: str, slide_number: int, db: Session = Depends(get_speeches_db)):
    speech = db.query(Speech).filter(
        Speech.presentation_id == presentation_id,
        Speech.slide_number == slide_number
    ).first()

    return speech if speech else {"generated_speech": "", "voice_tone": "Formal", "speed": 1.0, "pitch": 1.0}

@app.get("/")
def root():
    return {"message": "Backend is running!"}
