from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import List
from fastapi.staticfiles import StaticFiles
from pptx import Presentation
from pdf2image import convert_from_path
import pdfplumber
import shutil
import os
import pythoncom
import comtypes.client
from fastapi.responses import FileResponse

app = FastAPI()

# Allow all origins for development, restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
SLIDE_DIR = UPLOAD_DIR / "slides"
UPLOAD_DIR.mkdir(exist_ok=True)
SLIDE_DIR.mkdir(exist_ok=True)

def clear_slide_directory():
    """Clears the slide directory before processing a new file."""
    for file in SLIDE_DIR.iterdir():
        if file.is_file():
            file.unlink()

def process_pptx(file_path: Path) -> List[str]:
    """Extract slide images from a .pptx file."""
    pythoncom.CoInitialize()  # Initialize COM
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

def extract_text_from_pptx(file_path: Path) -> List[str]:
    """Extract text from each slide in a .pptx file."""
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

def process_pdf(file_path: Path) -> List[str]:
    """Convert PDF pages to images."""
    try:
        slides = convert_from_path(file_path, dpi=150, output_folder=SLIDE_DIR, fmt="png")
        return [f"/uploads/slides/{Path(slide.filename).name}" for slide in slides]
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return []

def extract_text_from_pdf(file_path: Path) -> List[str]:
    """Extract text from each page in a PDF."""
    try:
        slide_texts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                slide_texts.append(page.extract_text() or "")
        return slide_texts
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return []

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_ext = file.filename.split(".")[-1].lower()
    
    if file_ext not in ["pptx", "pdf"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a .pptx or .pdf file.")

    file_path = UPLOAD_DIR / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Clear previous slides
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

@app.get("/uploads/slides/{filename}")
async def get_slide(filename: str):
    """Serve slide images with no caching."""
    file_path = SLIDE_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(file_path, headers={"Cache-Control": "no-cache, no-store, must-revalidate"})

@app.get("/")
def root():
    return {"message": "Backend is running!"}

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
