# main.py

import datetime
import io
import os
import uuid

from PIL import Image, UnidentifiedImageError

from fastapi import FastAPI, File, UploadFile
from fastapi.staticfiles import StaticFiles
from routers import auth, apis, views, chatbot

from google.cloud import storage

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

@app.post("/uploadFile")
async def uploadFile(file: UploadFile):

    contents = await file.read()
    bucket_name = "rubicon-data"
    dest_blob_name = "upload/" + str(uuid.uuid1())

    try:
        image = Image.open(io.BytesIO(contents))
    except UnidentifiedImageError as e:
        print(e)
        return {"filename": "No"}
    
    print("format:", image.format)
    thumbnail_blob_name = dest_blob_name + "_thumbnail.png"
    if image.format == "PNG":
        dest_blob_name += ".png"
    elif image.format == "JPEG":
        dest_blob_name += ".jpg"
    
    width, height = image.size
    print("width:", width, ", height:", height)
    if width >= height:
        size_thumb = 450, int((height * 450)/width)
    else:
        size_thumb = int((width * 450)/height), 450

    print("size:", size_thumb)
    image_thumb = image.resize(size_thumb, Image.Resampling.LANCZOS)
    print(image_thumb)

    img_byte_arr = io.BytesIO()
    image_thumb.save(img_byte_arr, format='PNG')
    image_thumb_bytes = img_byte_arr.getvalue()

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(dest_blob_name)

    blob.upload_from_string(contents)

    blob = bucket.blob(thumbnail_blob_name)
    blob.upload_from_string(image_thumb_bytes)

    url = f"https://storage.googleapis.com/{bucket_name}/{dest_blob_name}"
    """
    url = blob.generate_signed_url(
        expiration=datetime.timedelta(minutes=60),
        method="PUT", version="v4"
    )
    """
    
    return {"filename": dest_blob_name}
