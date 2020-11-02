which aws
aws --version
pwd=$(aws ecr get-login-password --region us-east-2 --no-include-email)
$pwd
docker container stop $(docker container ls -aq)
docker login -u AWS -p $pwd https://161618437221.dkr.ecr.us-east-2.amazonaws.com
docker pull 161618437221.dkr.ecr.us-east-2.amazonaws.com/ass_g20
