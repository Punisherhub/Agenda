from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()


@router.get("/me")
async def get_current_user(db: Session = Depends(get_db)):
    return {"message": "Get current user - to be implemented"}


@router.put("/me")
async def update_user(db: Session = Depends(get_db)):
    return {"message": "Update user - to be implemented"}


@router.delete("/me")
async def delete_user(db: Session = Depends(get_db)):
    return {"message": "Delete user - to be implemented"}