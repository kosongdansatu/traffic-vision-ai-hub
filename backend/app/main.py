
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Optional
import shutil
import os
import uuid
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from . import models, schemas, crud, auth
from .database import engine, get_db
from .ai import process_video

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Traffic Vision AI API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads and results directories if they don't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("results", exist_ok=True)

# Mount static directories
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/results", StaticFiles(directory="results"), name="results")

# Authentication endpoints
@app.post("/api/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/api/token")
def login_for_access_token(form_data: schemas.TokenData, db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Video processing endpoints
@app.post("/api/videos/upload")
async def upload_video(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.webm')):
        return JSONResponse(
            status_code=400,
            content={"message": "Only video files are allowed"}
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    video_path = f"uploads/{file_id}{file_extension}"
    
    # Save uploaded file
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create video entry in database
    video = crud.create_video(
        db=db,
        video=schemas.VideoCreate(
            name=name,
            description=description,
            original_filename=file.filename,
            file_path=video_path,
            status="pending"
        ),
        user_id=current_user.id
    )
    
    # Start video processing (this would normally be a background task)
    # For simplicity, we're processing synchronously here
    try:
        result_path, json_path = process_video(video_path, file_id)
        # Update video with results
        crud.update_video_status(
            db=db,
            video_id=video.id,
            status="completed",
            result_path=result_path,
            json_result_path=json_path
        )
        return {"id": video.id, "status": "completed", "message": "Video processed successfully"}
    except Exception as e:
        crud.update_video_status(db=db, video_id=video.id, status="failed")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error processing video: {str(e)}"}
        )

@app.get("/api/videos", response_model=List[schemas.Video])
def get_videos(
    skip: int = 0,
    limit: int = 10,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    videos = crud.get_user_videos(db, user_id=current_user.id, skip=skip, limit=limit)
    return videos

@app.get("/api/videos/{video_id}", response_model=schemas.Video)
def get_video(
    video_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    video = crud.get_video(db, video_id=video_id)
    if video is None or video.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

@app.delete("/api/videos/{video_id}")
def delete_video(
    video_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    video = crud.get_video(db, video_id=video_id)
    if video is None or video.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Delete video files
    if os.path.exists(video.file_path):
        os.remove(video.file_path)
    if video.result_path and os.path.exists(video.result_path):
        os.remove(video.result_path)
    if video.json_result_path and os.path.exists(video.json_result_path):
        os.remove(video.json_result_path)
    
    # Delete from database
    crud.delete_video(db, video_id=video_id)
    return {"message": "Video deleted successfully"}

@app.get("/api/videos/{video_id}/download")
def download_processed_video(
    video_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    video = crud.get_video(db, video_id=video_id)
    if video is None or video.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.status != "completed" or not video.result_path:
        raise HTTPException(status_code=400, detail="Video processing not completed")
    
    return FileResponse(video.result_path, filename=f"{video.name}_processed.mp4")

@app.get("/api/videos/{video_id}/results")
def get_video_results(
    video_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    video = crud.get_video(db, video_id=video_id)
    if video is None or video.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.status != "completed" or not video.json_result_path:
        raise HTTPException(status_code=400, detail="Video processing not completed")
    
    # Read and return JSON results
    with open(video.json_result_path, "r") as f:
        results = json.load(f)
    
    return results

@app.put("/api/videos/{video_id}")
def update_video(
    video_id: int,
    video_update: schemas.VideoUpdate,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    video = crud.get_video(db, video_id=video_id)
    if video is None or video.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")
    
    updated_video = crud.update_video(db, video_id=video_id, video_update=video_update)
    return updated_video

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
