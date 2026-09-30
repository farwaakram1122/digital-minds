FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm install

ARG CACHE_BUST=3

COPY backend ./
COPY frontend /app/frontend
COPY CSS /app/CSS
COPY JS /app/JS
COPY images /app/images

EXPOSE 5000

CMD ["npm", "start"]