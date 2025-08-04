FROM node:24-alpine
RUN apk update && apk add --no-cache sqlite-libs
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tailwindcss -i ./src/main.css -o ./src/assets/styles.css --minify
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]