FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm config set strict-ssl false
RUN npm install --omit=dev
COPY index.js ./
EXPOSE 80
CMD ["node", "index.js"]