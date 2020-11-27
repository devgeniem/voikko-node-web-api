FROM node:13

WORKDIR /usr/src/app

COPY . .

RUN npm install

RUN mv config.sample.js config.js

EXPOSE 30010

CMD [ "node", "index.js" ]