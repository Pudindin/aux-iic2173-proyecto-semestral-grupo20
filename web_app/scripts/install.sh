sudo install python3.6
sudo install python3-pip
pip3 install --user awscli # install aws cli w/o sudo
export PATH=$PATH:$HOME/.local/bin # put aws in the path
pwd=$(aws ecr get-login-password --region us-east-2)
docker container stop $(docker container ls -aq)
docker login -u AWS -p $pwd https://161618437221.dkr.ecr.us-east-2.amazonaws.com
docker pull 161618437221.dkr.ecr.us-east-2.amazonaws.com/ass_g20
