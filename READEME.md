# what is this
Leon created this by practicing openai api and streaming communication between frontend to node.js backend.

# Http single response vs SSE
- the function `sendMsg` is used for listen post router '/' and await the whole response to web client
- the function `sendMsgStream` is used for listen event from server side which is transferred as stream mode

# How to run
This is created by 
1. `npm create vite@latest client --template vanilla`
2. `npm init -y` && `npm install cors dotenv express nodemon openai`
pls note nodemon is watching the changes for node js server.js so that it can make the changes happen
3. touch the .env file and OPENAI_API_KEY='your-api-key'

Go to server folder run `npm run server`
Go to client folder run `npm run dev`