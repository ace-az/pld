FROM node:20-alpine

# Install compilers for hybrid execution
RUN apk update && apk add --no-cache \
    python3 \
    gcc \
    g++ \
    make \
    openjdk17 \
    curl \
    bash \
    dotnet8-sdk

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
