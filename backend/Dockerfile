FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

ARG CACHE_BUST=4

COPY . .

EXPOSE 5000

CMD ["npm", "start"]