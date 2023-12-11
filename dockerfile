FROM node:18-alpine

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm ci 

COPY . .

RUN npm run build

EXPOSE 5050

CMD ["npm", "run", "start:prod"]
