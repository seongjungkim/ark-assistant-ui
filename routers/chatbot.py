from fastapi import APIRouter, Request, Depends, Form
from fastapi.responses import HTMLResponse, Response, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.encoders import jsonable_encoder

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
async def init(request: Request):
    print('/chatbot/init')
    
    response = {
        "id": "d052d79c458d4769a452756f2edaa6ca",
        "result": {
            "source": "dialogflow",
            "score": 1.0,
            "simpleResponses": {
                "simpleResponses": [
                    {
                        "textToSpeech": "TPCG Ark AI Gen MedLM Assistant 서비스 환경은 구글 Medical LLM(MedLM)을 기반으로 하고 있습니다. \r\n\r\nMedLM은 Google Healthcare에서 의료지원 목적으로 Fine Tuning한 대규모언어학습 모델입니다.\r\n정제된 의료데이터셋과 의료전문가 군의 피드백을 통해 의료정보 질의, 분석, 추론 제공을 통해 의료진의 의사결정을 지원하고 환자 관리에 필요한 정보 지원을 제공합니다.\r\n\r\n주요 사용 사례는 환자정보요약과 Q\u0026A에 특화되어 있습니다.\r\n*현재 한국어와 영어가 혼용되어 답변이 나올 수 있습니다.\r\n",
                        "displayText": "TPCG Ark AI Gen MedLM Assistant 서비스 환경은 구글 Medical LLM(MedLM)을 기반으로 하고 있습니다. \r\n\r\nMedLM은 Google Healthcare에서 의료지원 목적으로 Fine Tuning한 대규모언어학습 모델입니다.\r\n정제된 의료데이터셋과 의료전문가 군의 피드백을 통해 의료정보 질의, 분석, 추론 제공을 통해 의료진의 의사결정을 지원하고 환자 관리에 필요한 정보 지원을 제공합니다.\r\n\r\n주요 사용 사례는 환자정보요약과 Q\u0026A에 특화되어 있습니다.\r\n*현재 한국어와 영어가 혼용되어 답변이 나올 수 있습니다.\r\n"
                    }
                ]
            },
            "payload": {
                "intentName": "Default Welcome Intent",
                "currentPage": "Start Page",
                "parameters": {}
            }
        },
        "status": {
            "code": 200,
            "errorType": "success"
        },
        "eventTags": []
    }

    return JSONResponse(content=jsonable_encoder(response))
