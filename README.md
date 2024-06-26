#

```bash
uvicorn main:app --host 0.0.0.0 --port 8080
```

```bash
git remote add tpcg https://source.developers.google.com/p/tpcg-datacollector/r/ark-ai-assistant
git remote add git-ark https://github.com/seongjungkim/ark-assistant-ui
```

```bash
git remote -v                                        
git-ark https://github.com/seongjungkim/ark-assistant-ui.git (fetch)
git-ark https://github.com/seongjungkim/ark-assistant-ui.git (push)
tpcg    https://source.developers.google.com/p/tpcg-datacollector/r/ark-ai-assistant (fetch)
tpcg    https://source.developers.google.com/p/tpcg-datacollector/r/ark-ai-assistant (push)
```

```bash
git branch -v
  main   a7b2a80 Initialize
* master c66ac0c Suggestions 관련 수정
```

```bash
git status
git add routers/chatbot.py README.md routers/dummy.py
git commit -m "dummy.py 파일 추가"
git push -u tpcg master
```

```bash
PROJECT_ID=tpcg-datacollector
REGION=asia-northeast3
APP=chat
TAG=gcr.io/$PROJECT_ID/$APP
```

```bash
gcloud builds submit --project=$PROJECT_ID --tag $TAG
```

```bash
gcloud run deploy $APP \
--project $PROJECT_ID \
--image $TAG \
--platform managed \
--region $REGION \
--allow-unauthenticated
```

https://chat-phdovlv6aa-du.a.run.app/main
