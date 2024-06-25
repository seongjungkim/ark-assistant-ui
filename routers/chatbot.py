from fastapi import APIRouter, Request, Depends, Form
from fastapi.responses import HTMLResponse, Response, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.encoders import jsonable_encoder
from core import schemas

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
        # https://github.com/dialogflow/fulfillment-webhook-json/blob/master/responses/v2/ActionsOnGoogle/RichResponses/SimpleResponse.json
        # https://github.com/dialogflow/fulfillment-webhook-json/blob/master/responses/v2/ActionsOnGoogle/RichResponses/SimpleResponseSsml.json
        # https://github.com/dialogflow/fulfillment-webhook-json/blob/master/responses/v2/ActionsOnGoogle/RichResponses/SimpleResponseSsml.json
        # https://github.com/dialogflow/fulfillment-webhook-json/blob/master/responses/v2/ActionsOnGoogle/RichResponses/SimpleResponseTts.json

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
        "genAi": True,
        "eventTags": []
        }
    elif req.query == 'MedLM Assistant Guide':
        response = {
            "id": "b61b74b83ed144edb39cf27bb7a99322",
            "result": {
                "source": "dialogflow",
                "score": 1.0,
                "simpleResponses": {
                    "simpleResponses": [
                        {
                            "textToSpeech": "MedLM 챗봇은 의료 분야에 특화된 대화형 인공지능으로, 주로 질문 및 답변(Q\u0026A)과 정보 요약에 최적화되어 있습니다. \n사용자가 제공한 정보가 구체적이고 명확할수록, MedLM은 더 정확하고 유용한 답변을 제공할 수 있습니다.\n\n예를 들어, 좋은 질문은 \n\"이름, 나이, 과거병력, 복용중인 약물, 현재 불편한 곳을 포함한 환자 정보를 한 문단으로 요약해주세요.\"\n와 같이 특정 상황을 명확하게 설명합니다. \n반면, 불명확한 질문은 \"요약해주세요\"와 같이 너무 포괄적인 질문을 말합니다.\n\n질문은 구체적이고 명확하며, 한 번에 하나의 요청을 보내는 것이 좋습니다.\n\n\n답변을 이전 질문 (혹은 정보)를 참조하지 않고 새로 시작하려면, Reset 혹은 초기화라고 입력해주세요.\n원하지 않는 이전 내용을 포함한다면 Reset 혹은 초기화라고 입력해주세요.\n\n\n채팅 간 최근 4번의 채팅까지 현재 인지 및 참조해서 답변하도록 설계되어있습니다. (Reset의 경우 초기화) \n\n\n질문의 경우, 한글과 영어 두가지 모두 사용가능합니다.\n다만 답변의 경우, 영어로 답변하는 경향이 커, 한글로 받고 싶으시다면 추가로 \"Translate it in Korean\" 혹은 \"한글로 번역해주세요.\" 라고 입력해주세요. \n\n\n\n질문예시 1 :\nMedical Information : \n나이 : 55세 \n인종 : 백인\n성별 : 여성\n병력 : 5년 전 진단된 유방암, 현재 관해 중\n현재 약물 : 매일 타목시펜 20mg과 레트로졸 2.5mg을 복용중\n\n위 환자가 오른쪽 상단 가슴의 강한 통증을 느끼고 있습니다.\n환자의 정보와 통증 정도를 보았을때 가장 의심스러운 질병은 어떤 것인가요?\n\n질문예시 2 :\nWhat causes you to get ringworm?\n\n질문예시 3:\nQuestion 1: Which medication causes the maximum increase in prolactin level?\n(A) Risperidone\n(B) Clozapine\n(C) Olanzapine\n(D) Aripiprazole\n\n*질문예시 4:\nQ1) 환자는 52세 남성으로, 기존 질환인 2형 당뇨와 고혈압으로 인해 합병증이 의심되는 증상을 보이고 있습니다. 최근에는 피로감이 증가하고 시력 문제를 호소했습니다. 어떤 검사를 권장하나요?\nQ2) 심혈관 합병증 위험을 추가로 평가하기 위해 어떤 질문을 해야 할까요?\nQ3) 내용을 제 노트에 간단히 요약해 줄 수 있을까요?\n\n질문예시 4의 순서와 같이 진행할 경우에, 답변받은 내용과 입력한 내용에 대해서 노트의 형식으로 요약받을 수도 있습니다.",
                            "displayText": "MedLM 챗봇은 의료 분야에 특화된 대화형 인공지능으로, 주로 질문 및 답변(Q\u0026A)과 정보 요약에 최적화되어 있습니다. \n사용자가 제공한 정보가 구체적이고 명확할수록, MedLM은 더 정확하고 유용한 답변을 제공할 수 있습니다.\n\n예를 들어, 좋은 질문은 \n\"이름, 나이, 과거병력, 복용중인 약물, 현재 불편한 곳을 포함한 환자 정보를 한 문단으로 요약해주세요.\"\n와 같이 특정 상황을 명확하게 설명합니다. \n반면, 불명확한 질문은 \"요약해주세요\"와 같이 너무 포괄적인 질문을 말합니다.\n\n질문은 구체적이고 명확하며, 한 번에 하나의 요청을 보내는 것이 좋습니다.\n\n\n답변을 이전 질문 (혹은 정보)를 참조하지 않고 새로 시작하려면, Reset 혹은 초기화라고 입력해주세요.\n원하지 않는 이전 내용을 포함한다면 Reset 혹은 초기화라고 입력해주세요.\n\n\n채팅 간 최근 4번의 채팅까지 현재 인지 및 참조해서 답변하도록 설계되어있습니다. (Reset의 경우 초기화) \n\n\n질문의 경우, 한글과 영어 두가지 모두 사용가능합니다.\n다만 답변의 경우, 영어로 답변하는 경향이 커, 한글로 받고 싶으시다면 추가로 \"Translate it in Korean\" 혹은 \"한글로 번역해주세요.\" 라고 입력해주세요. \n\n\n\n질문예시 1 :\nMedical Information : \n나이 : 55세 \n인종 : 백인\n성별 : 여성\n병력 : 5년 전 진단된 유방암, 현재 관해 중\n현재 약물 : 매일 타목시펜 20mg과 레트로졸 2.5mg을 복용중\n\n위 환자가 오른쪽 상단 가슴의 강한 통증을 느끼고 있습니다.\n환자의 정보와 통증 정도를 보았을때 가장 의심스러운 질병은 어떤 것인가요?\n\n질문예시 2 :\nWhat causes you to get ringworm?\n\n질문예시 3:\nQuestion 1: Which medication causes the maximum increase in prolactin level?\n(A) Risperidone\n(B) Clozapine\n(C) Olanzapine\n(D) Aripiprazole\n\n*질문예시 4:\nQ1) 환자는 52세 남성으로, 기존 질환인 2형 당뇨와 고혈압으로 인해 합병증이 의심되는 증상을 보이고 있습니다. 최근에는 피로감이 증가하고 시력 문제를 호소했습니다. 어떤 검사를 권장하나요?\nQ2) 심혈관 합병증 위험을 추가로 평가하기 위해 어떤 질문을 해야 할까요?\nQ3) 내용을 제 노트에 간단히 요약해 줄 수 있을까요?\n\n질문예시 4의 순서와 같이 진행할 경우에, 답변받은 내용과 입력한 내용에 대해서 노트의 형식으로 요약받을 수도 있습니다."
                        }
                    ]
                },
                "payload": {
                    "intentName": "chatbot_guide",
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
    elif req.query == 'test':
        response = {
            "result": {
                "source": "dialogflow",
                "score": 0.0,
                "simpleResponses": {
                    "simpleResponses": [
                        {
                            "textToSpeech": " As a medical chatbot, I am designed to provide information and answer questions related to medical topics. If you have a specific medical question or concern, I can try to help you find the information you need.",
                            "ssml": "",
                            "displayText": " As a medical chatbot, I am designed to provide information and answer questions related to medical topics. If you have a specific medical question or concern, I can try to help you find the information you need."
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
    elif req.query == 'basic card':
        # https://github.com/dialogflow/fulfillment-webhook-json/blob/master/responses/v2/ActionsOnGoogle/RichResponses/BasicCard.json
        # https://github.com/dialogflow/fulfillment-webhook-json/blob/master/responses/v2/ActionsOnGoogle/RichResponses/Suggestions.json
        # https://developers.google.com/assistant/df-asdk/rich-responses?hl=ko#BasicCardSamples

        response = {
            "result": {
                "source": "dialogflow",
                "score": 0.0,
                "simpleResponses": {
                    "simpleResponses": [
                        {
                            "textToSpeech": "기본 카드는 주로 디스플레이용으로 사용합니다. 간결하고 사용자에게 핵심 (또는 요약) 정보를 제시하며 개발자가 선택할 경우 사용자가 자세히 알아볼 수 있도록 설계되었습니다 (웹링크 사용).",
                            "ssml": "",
                            "displayText": "기본 카드는 주로 디스플레이용으로 사용합니다. 간결하고 사용자에게 핵심 (또는 요약) 정보를 제시하며 개발자가 선택할 경우 사용자가 자세히 알아볼 수 있도록 설계되었습니다 (웹링크 사용)."
                        }
                    ]
                },
                "basicCard": {
                    "title": "베이직카드 타이틀",
                    "subtitle": "베이직카드 서브타이틀",
                    "formattedText": "This is a basic card.  Text in a basic card can include \"quotes\" and\n    most other unicode characters including emojis.  Basic cards also support\n    some markdown formatting like *emphasis* or _italics_, **strong** or\n    __bold__, and ***bold itallic*** or ___strong emphasis___ as well as other\n    things like line  \nbreaks",
                    "image": {
                        "imageUri": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
                        "accessibilityText": "Google Logo"
                    },
                    "buttons": [
                        {
                            "title": "Button Title",
                            "openUriAction": {
                                "uri": "https://developers.google.com/assistant/df-asdk/rich-responses?hl=ko#basic_card"
                            }
                        }
                    ]
                },
                "suggestions": [
                    {
                        "title": "25"
                    },
                    {
                        "title": "45"
                    },
                    {
                        "title": "Never mind"
                    }
                ],
                "linkOutSuggestion": {
                    "destinationName": "Website",
                    "url": "https://assistant.google.com"
                }
            },
            "status": {
                "code": 200
            },
            "genAi": True,
            "eventTags": []
        }
    elif req.query == 'browse carousel':
        # https://github.com/dialogflow/fulfillment-webhook-json/blob/master/responses/v2/ActionsOnGoogle/RichResponses/BrowseCarousel.json
        # https://github.com/dialogflow/fulfillment-webhook-json/blob/master/responses/v2/ActionsOnGoogle/RichResponses/Suggestions.json
        # https://developers.google.com/assistant/df-asdk/rich-responses?hl=ko#BrowsingCarouselSamples

        response = {
            "result": {
                "source": "dialogflow",
                "score": 0.0,
                "simpleResponses": {
                    "simpleResponses": [
                        {
                            "textToSpeech": "탐색 캐러셀은 사용자가 세로로 스크롤하고 컬렉션의 타일을 선택할 수 있는 리치 응답입니다. 탐색 캐러셀은 웹브라우저 (또는 모든 타일이 AMP를 지원하는 경우 AMP 브라우저)에서 선택한 타일을 열어 웹 콘텐츠용으로 특별히 설계되었습니다. 탐색 캐러셀은 나중에 찾아볼 수 있도록 사용자의 어시스턴트 표시 경로에도 유지됩니다.",
                            "ssml": "",
                            "displayText": "탐색 캐러셀은 사용자가 세로로 스크롤하고 컬렉션의 타일을 선택할 수 있는 리치 응답입니다. 탐색 캐러셀은 웹브라우저 (또는 모든 타일이 AMP를 지원하는 경우 AMP 브라우저)에서 선택한 타일을 열어 웹 콘텐츠용으로 특별히 설계되었습니다. 탐색 캐러셀은 나중에 찾아볼 수 있도록 사용자의 어시스턴트 표시 경로에도 유지됩니다."
                        }
                    ]
                },
                "browseCarousel": {
                    "items": [
                        {
                            "title": "케라셀 타이틀1",
                            "openUrlAction": {
                                "url": "https://developers.google.com/assistant/df-asdk/rich-responses?hl=ko#BrowsingCarouselSamples"
                            },
                            "description": "Description of item 1",
                            "footer": "Item 1 footer",
                            "image": {
                                "imageUri": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
                                "accessibilityText": "Google Logo"
                            }
                        },
                        {
                            "title": "케라셀 타이틀2",
                            "openUrlAction": {
                                "url": "https://developers.google.com/assistant/df-asdk/rich-responses?hl=ko#BrowsingCarouselSamples"
                            },
                            "description": "Description of item 2",
                            "footer": "Item 2 footer",
                            "image": {
                                "imageUri": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
                                "accessibilityText": "Google Logo"
                            }
                        }
                    ]
                },
                "suggestions": [
                    {
                        "title": "25"
                    },
                    {
                        "title": "45"
                    },
                    {
                        "title": "Never mind"
                    }
                ],
                "linkOutSuggestion": {
                    "destinationName": "Website",
                    "url": "https://assistant.google.com"
                }
            },
            "status": {
                "code": 200
            },
            "genAi": True,
            "eventTags": []
        }
    elif req.query == 'carousel select':
        # https://github.com/dialogflow/fulfillment-webhook-json/blob/master/responses/v2/ActionsOnGoogle/RichResponses/BrowseCarousel.json
        # https://github.com/dialogflow/fulfillment-webhook-json/blob/master/responses/v2/ActionsOnGoogle/RichResponses/Suggestions.json
        # https://developers.google.com/assistant/df-asdk/rich-responses?hl=ko#BrowsingCarouselSamples

        response = {
            "result": {
                "source": "dialogflow",
                "score": 0.0,
                "simpleResponses": {
                    "simpleResponses": [
                        {
                            "textToSpeech": "탐색 캐러셀은 사용자가 세로로 스크롤하고 컬렉션의 타일을 선택할 수 있는 리치 응답입니다. 탐색 캐러셀은 웹브라우저 (또는 모든 타일이 AMP를 지원하는 경우 AMP 브라우저)에서 선택한 타일을 열어 웹 콘텐츠용으로 특별히 설계되었습니다. 탐색 캐러셀은 나중에 찾아볼 수 있도록 사용자의 어시스턴트 표시 경로에도 유지됩니다.",
                            "ssml": "",
                            "displayText": "탐색 캐러셀은 사용자가 세로로 스크롤하고 컬렉션의 타일을 선택할 수 있는 리치 응답입니다. 탐색 캐러셀은 웹브라우저 (또는 모든 타일이 AMP를 지원하는 경우 AMP 브라우저)에서 선택한 타일을 열어 웹 콘텐츠용으로 특별히 설계되었습니다. 탐색 캐러셀은 나중에 찾아볼 수 있도록 사용자의 어시스턴트 표시 경로에도 유지됩니다."
                        }
                    ]
                },
                "carouselSelect": {
                    "items": [
                        {
                            "title": "케라셀 타이틀1",
                            "openUrlAction": {
                                "url": "https://developers.google.com/assistant/df-asdk/rich-responses?hl=ko#BrowsingCarouselSamples"
                            },
                            "description": "Description of item 1",
                            "footer": "Item 1 footer",
                            "image": {
                                "imageUri": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
                                "accessibilityText": "Google Logo"
                            }
                        },
                        {
                            "title": "케라셀 타이틀2",
                            "openUrlAction": {
                                "url": "https://developers.google.com/assistant/df-asdk/rich-responses?hl=ko#BrowsingCarouselSamples"
                            },
                            "description": "Description of item 2",
                            "footer": "Item 2 footer",
                            "image": {
                                "imageUri": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
                                "accessibilityText": "Google Logo"
                            }
                        }
                    ]
                },
                "suggestions": [
                    {
                        "title": "25"
                    },
                    {
                        "title": "45"
                    },
                    {
                        "title": "Never mind"
                    }
                ],
                "linkOutSuggestion": {
                    "destinationName": "Website",
                    "url": "https://assistant.google.com"
                }
            },
            "status": {
                "code": 200
            },
            "genAi": True,
            "eventTags": []
        }
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
