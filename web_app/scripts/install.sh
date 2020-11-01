pwd=$(aws ecr get-login-password)
docker container stop $(docker container ls -aq)
cp iic2173-proyecto-semestral-grupo20/web_app/pg-init-scripts/data-base.env iic2173-proyecto-semestral-grupo20/data-base.env
cp iic2173-proyecto-semestral-grupo20/web_app/.env iic2173-proyecto-semestral-grupo20/.env
docker login -u AWS -p $pwd https://161618437221.dkr.ecr.us-east-2.amazonaws.com
docker pull 161618437221.dkr.ecr.us-east-2.amazonaws.com/ass_g20
mv iic2173-proyecto-semestral-grupo20/data-base.env iic2173-proyecto-semestral-grupo20/web_app/pg-init-scripts/data-base.env
mv iic2173-proyecto-semestral-grupo20/.env iic2173-proyecto-semestral-grupo20/web_app/.env
