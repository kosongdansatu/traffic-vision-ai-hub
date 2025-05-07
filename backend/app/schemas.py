from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


# User schemas
class UserBase(BaseModel):
    email: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Video schemas
class VideoBase(BaseModel):
    name: str
    description: Optional[str] = None


class VideoCreate(VideoBase):
    original_filename: str
    file_path: str
    status: str
    model_size: Optional[str] = "nano"


class VideoUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    model_size: Optional[str] = None


class Video(VideoBase):
    id: int
    original_filename: str
    file_path: str
    status: str
    result_path: Optional[str] = None
    json_result_path: Optional[str] = None
    model_size: Optional[str] = "nano"
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user_id: int

    class Config:
        from_attributes = True


# Token schemas
class TokenData(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
