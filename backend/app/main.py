from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status,
    File,
    UploadFile,
    Form,
    BackgroundTasks,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Optional
import shutil
import os
import uuid
import json
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import traceback

from . import models, schemas, crud, auth
from .database import engine, get_db
from .ai import process_video

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=engine)

# Define file size limit (200MB)
MAX_FILE_SIZE = 200 * 1024 * 1024  # 200MB in bytes

app = FastAPI(title="Traffic Vision AI API")

# Configure CORS for frontend - allow all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads and results directories if they don't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("results", exist_ok=True)
os.makedirs("models", exist_ok=True)

# Mount static directories
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/results", StaticFiles(directory="results"), name="results")


# Background task for video processing
def process_video_task(
    video_id: int,
    video_path: str,
    file_id: str,
    model_size: str = "nano",
    db: Session = Depends(get_db),
):
    logger.info(
        f"Starting background processing for video {video_id} with model size {model_size}"
    )
    try:
        # Update video status to processing
        db_session = next(get_db())
        crud.update_video_status(db=db_session, video_id=video_id, status="processing")

        # Create required directories if they don't exist
        os.makedirs("models", exist_ok=True)
        os.makedirs("results", exist_ok=True)

        # Process the video with specified model size
        try:
            result_path, json_path = process_video(video_path, file_id, model_size)

            # Update video with results
            crud.update_video_status(
                db=db_session,
                video_id=video_id,
                status="completed",
                result_path=result_path,
                json_result_path=json_path,
            )
            logger.info(f"Video {video_id} processed successfully")
        except Exception as e:
            # If error is related to model loading, retry with default model
            logger.error(f"Error during video processing: {str(e)}")
            logger.error(traceback.format_exc())

            if "model" in str(e).lower():
                logger.info("Attempting to process with default model")
                try:
                    result_path, json_path = process_video(video_path, file_id, "nano")

                    # Update video with results
                    crud.update_video_status(
                        db=db_session,
                        video_id=video_id,
                        status="completed",
                        result_path=result_path,
                        json_result_path=json_path,
                    )
                    logger.info(
                        f"Video {video_id} processed successfully with fallback model"
                    )
                    return
                except Exception as fallback_error:
                    logger.error(
                        f"Fallback processing also failed: {str(fallback_error)}"
                    )

            # Update video status to failed if all attempts failed
            db_session = next(get_db())
            crud.update_video_status(
                db=db_session,
                video_id=video_id,
                status="failed",
                error_message=str(e)[:200],
            )  # Store truncated error message

    except Exception as e:
        logger.error(f"Error processing video {video_id}: {str(e)}")
        logger.error(traceback.format_exc())
        try:
            db_session = next(get_db())
            crud.update_video_status(
                db=db_session,
                video_id=video_id,
                status="failed",
                error_message=str(e)[:200],
            )
        except Exception as db_error:
            logger.error(f"Error updating video status: {str(db_error)}")


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
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    model_size: str = Form("nano"),
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    # Check file type
    if not file.filename.endswith((".mp4", ".avi", ".mov", ".webm")):
        return JSONResponse(
            status_code=400, content={"message": "Only video files are allowed"}
        )

    # Check file size (read a small part to get content_length)
    content = await file.read(1024)  # Read first 1KB to force content_length to be set
    await file.seek(0)  # Reset file position

    # Get the file size from UploadFile if available
    file_size = getattr(file, "size", None)
    if file_size is None and hasattr(file, "file"):
        # Try to get size from underlying SpooledTemporaryFile
        try:
            file_size = len(file.file.read())
            await file.file.seek(0)  # Reset file position
        except Exception as e:
            logger.warning(f"Could not determine file size: {str(e)}")

    # Check file size if we were able to determine it
    if file_size and file_size > MAX_FILE_SIZE:
        return JSONResponse(
            status_code=400,
            content={
                "message": f"File too large. Maximum allowed size is {MAX_FILE_SIZE/(1024*1024)} MB"
            },
        )

    # Validate model size
    valid_sizes = ["nano", "small", "medium", "large", "x-large"]
    if model_size not in valid_sizes:
        model_size = "nano"  # Default to nano if invalid
        logger.warning(f"Invalid model size specified, using default: {model_size}")

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
            status="pending",
            model_size=model_size,
        ),
        user_id=current_user.id,
    )

    # Start video processing in background
    background_tasks.add_task(
        process_video_task, video.id, video_path, file_id, model_size, db
    )

    return {
        "id": video.id,
        "status": "pending",
        "message": f"Video uploaded successfully, processing will begin shortly using {model_size} model",
    }


@app.get("/api/videos", response_model=List[schemas.Video])
def get_videos(
    skip: int = 0,
    limit: int = 10,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    videos = crud.get_user_videos(db, user_id=current_user.id, skip=skip, limit=limit)
    return videos


@app.get("/api/videos/{video_id}", response_model=schemas.Video)
def get_video(
    video_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    video = crud.get_video(db, video_id=video_id)
    if video is None or video.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@app.delete("/api/videos/{video_id}")
def delete_video(
    video_id: int,
    current_user: schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
):
    video = crud.get_video(db, video_id=video_id)
    if video is None or video.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Video not found")

    updated_video = crud.update_video(db, video_id=video_id, video_update=video_update)
    return updated_video


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        limit_concurrency=20,  # Limit concurrent connections
        timeout_keep_alive=300,  # Increase timeout for large uploads
        limit_max_requests=None,  # No limit on max requests
    )
