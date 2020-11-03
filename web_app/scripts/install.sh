sudo rm -r /home/ubuntu/iic2173-proyecto-semestral-grupo20/web_app/pg-init-scripts
sudo rm -r /home/ubuntu/iic2173-proyecto-semestral-grupo20/web_app/nginx-conf
sudo rm /home/ubuntu/iic2173-proyecto-semestral-grupo20/web_app/yarn.lock
sudo rm /home/ubuntu/iic2173-proyecto-semestral-grupo20/web_app/package-lock.json
sudo rm /home/ubuntu/iic2173-proyecto-semestral-grupo20/web_app/package.json
sudo rm /home/ubuntu/iic2173-proyecto-semestral-grupo20/web_app/node-entrypoint.sh
sudo rm /home/ubuntu/iic2173-proyecto-semestral-grupo20/web_app/index.js
sudo rm /home/ubuntu/iic2173-proyecto-semestral-grupo20/web_app/Dockerfile
sudo rm /home/ubuntu/iic2173-proyecto-semestral-grupo20/web_app/readme.md
sudo rm -r /home/ubuntu/iic2173-proyecto-semestral-grupo20/web_app/src
sudo rm /home/ubuntu/iic2173-proyecto-semestral-grupo20/web_app/docker-compose.yml
pip3 install --user awscli # install aws cli w/o sudo
export PATH=$PATH:$HOME/.local/bin # put aws in the path
pwd=$(aws ecr get-login-password --region us-east-2)
docker container stop $(docker container ls -aq)
docker login -u AWS -p $pwd https://161618437221.dkr.ecr.us-east-2.amazonaws.com
docker pull 161618437221.dkr.ecr.us-east-2.amazonaws.com/ass_g20
