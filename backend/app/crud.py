from sqlalchemy.orm import Session
from . import models, schemas
from .auth import get_password_hash
from datetime import datetime


# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Video CRUD operations
def get_video(db: Session, video_id: int):
    return db.query(models.Video).filter(models.Video.id == video_id).first()


def get_user_videos(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Video)
        .filter(models.Video.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_video(db: Session, video: schemas.VideoCreate, user_id: int):
    db_video = models.Video(**video.model_dump(), user_id=user_id)
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video


def update_video(db: Session, video_id: int, video_update: schemas.VideoUpdate):
    db_video = db.query(models.Video).filter(models.Video.id == video_id).first()

    # Update only provided fields
    update_data = video_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_video, key, value)

    db_video.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_video)
    return db_video


def update_video_status(
    db: Session,
    video_id: int,
    status: str,
    result_path: str = None,
    json_result_path: str = None,
    error_message: str = None,
):
    db_video = db.query(models.Video).filter(models.Video.id == video_id).first()
    db_video.status = status
    if result_path:
        db_video.result_path = result_path
    if json_result_path:
        db_video.json_result_path = json_result_path
    if error_message:
        db_video.error_message = error_message
    db_video.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_video)
    return db_video


def delete_video(db: Session, video_id: int):
    db_video = db.query(models.Video).filter(models.Video.id == video_id).first()
    db.delete(db_video)
    db.commit()
    return db_video
