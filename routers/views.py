from fastapi import APIRouter, Request, Depends, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(
  prefix="",
  tags=['views'],
  responses={404: {"description": "Not found"}}
)

templates = Jinja2Templates(directory="templates")

@router.get("/main", response_class=HTMLResponse)
async def home_view(request: Request):
    template_data = {"request": request, "basicCard": None, "contextPath": "/resource"}

    response = templates.TemplateResponse("main.html", template_data)
    return response
