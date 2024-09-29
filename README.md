# what is this
Leon created this by practicing openai api and streaming communication between frontend to node.js backend.

# Http single response vs SSE
- the function `sendMsg` is used for listen post router '/' and await the whole response to web client
- the function `sendMsgStream` is used for listen event from server side which is transferred as stream mode
