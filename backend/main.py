from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from typing import List
from fastapi.staticfiles import StaticFiles
from pptx import Presentation
from pdf2image import convert_from_path
import shutil
import os
import pythoncom
import comtypes.client

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
SLIDE_DIR = UPLOAD_DIR / "slides"
UPLOAD_DIR.mkdir(exist_ok=True)
SLIDE_DIR.mkdir(exist_ok=True)


def process_pptx(file_path: Path) -> List[str]:
    """Extract slides from a .pptx file using PowerPoint COM."""
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


def process_pdf(file_path: Path) -> List[str]:
    """Convert PDF pages to images."""
    pdf_file = os.path.abspath(file_path)
    output_folder = os.path.abspath(SLIDE_DIR)
    os.makedirs(output_folder, exist_ok=True)

    try:
        slides = convert_from_path(pdf_file, dpi=150, output_folder=output_folder, fmt="png")
        return [f"/uploads/slides/{slide.filename}" for slide in slides]
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return []


@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    slide_images = []
    if file.filename.endswith(".pptx"):
        slide_images = process_pptx(file_path)
    elif file.filename.endswith(".pdf"):
        slide_images = process_pdf(file_path)
    else:
        return {"error": "Unsupported file format. Please upload a .pptx or .pdf file."}

    return {"filename": file.filename, "slides": [f"http://127.0.0.1:8000{path}" for path in slide_images]}


@app.get("/")
def root():
    return {"message": "Backend is running!"}


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
