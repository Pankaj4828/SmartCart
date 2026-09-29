git diff --check

python -m compileall backend/app

npm --prefix frontend run lint

npm --prefix frontend run build

docker compose --env-file .env -f docker/compose.yml config