from fastapi import APIRouter, Request, Depends, Form, HTTPException

router = APIRouter(
  prefix="/apis",
  tags=['apis'],
  responses={404: {"description": "Not found"}}
)