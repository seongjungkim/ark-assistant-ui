# main.py

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from routers import auth, apis, views, chatbot #, batch

app = FastAPI()

app.mount("/resource", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(views.router)
app.include_router(apis.router)
app.include_router(chatbot.router)
#app.include_router(batch.router)

@app.get("/")
async def home():
    return {"message": "Hell World"}
