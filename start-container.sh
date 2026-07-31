docker run -d \
  --name ec-backend \
  --env-file .env \
  -p 5050:5000 \
  ec-backend:latest