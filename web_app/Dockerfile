FROM node:12-alpine

RUN mkdir /app
WORKDIR /app

COPY package.json ./
RUN npm install
COPY . ./app

EXPOSE 3000

COPY ./node-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]