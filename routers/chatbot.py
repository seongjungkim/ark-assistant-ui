from fastapi import APIRouter, Request, Depends, Form
from fastapi.responses import HTMLResponse, Response, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.encoders import jsonable_encoder
from core import schemas

# Dummy Data
import routers.dummy as dummy

import json

router = APIRouter(
  prefix="/chatbot",
  tags=['chatbot'],
  responses={404: {"description": "Not found"}}
)

templates = Jinja2Templates(directory="templates")

@router.post("/init", response_class=JSONResponse)
async def init(request: Request):
    print('/chatbot/init')
    response = {
        "sessionId": "d052d79c458d4769a452756f2edaa6ca",
        "result": {
            "source": "dialogflow",
            "score": 0.0
        },
        "status": {
            "code": 200
        },
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIiwic2Vzc2lvbklkIjoiZDA1MmQ3OWM0NThkNDc2OWE0NTI3NTZmMmVkYWE2Y2EiLCJleHAiOjE3MTkwNDcyMTMsInVzZXJJZCI6Im1lZExNMjQwNjIyMDczNjUzaFllUUxSIn0.Z_ncaT9i-7wfJDpbHf-BHsBW5RZdE3BcPRxvVzVYFX4",
        "eventTags": [],
        "userId": "medLM240622073653hYeQLR",
        "debug": "false"
    }

    return JSONResponse(content=jsonable_encoder(response))

@router.post("/query", response_class=JSONResponse)
async def init(request: Request, req: schemas.QueryRequest):
    print('/chatbot/init')
    print(req)
    
    if req.query == 'welcome':
        response = dummy.welcome_json
    elif req.query == 'GenAI Assistant Guide':
        response = dummy.assistant_guide_json
    elif req.query == 'test':
        response = dummy.test_json
    elif req.query == 'basic card':
        response = dummy.basic_card_json
    elif req.query == 'browse carousel':
        response = dummy.browse_carousel_json
    elif req.query == 'carousel select':
        response = dummy.carousel_select_json
    else:
        response = {
            "result": {
                "source": "dialogflow",
                "score": 0.0,
                "simpleResponses": {
                    "simpleResponses": [
                        {
                            "textToSpeech": "오류가 발생했습니다.",
                            "ssml": "",
                            "displayText": "오류가 발생했습니다."
                        }
                    ]
                }
            },
            "status": {
                "code": 200
            },
            "genAi": True,
            "eventTags": []
        }

    return JSONResponse(content=jsonable_encoder(response))
