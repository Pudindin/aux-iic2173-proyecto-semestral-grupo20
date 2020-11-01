docker-compose -f iic2173-proyecto-semestral-grupo20/web_app/docker-compose.yml down
docker stop $(docker ps -a -q)
