import bot from './assets/bot.svg'
import user from './assets/user.svg'

const SERVERPATH = 'http://localhost:5174'

const form = document.querySelector('#chat_form')
const chatContainer = document.querySelector('#chat_container')

let loadInterval;

function loader(element, wait=500) {
    element.textContent = '';

    loadInterval = setInterval(()=> {
        element.textContent += '.';
        if ( element.textContent === '....') {
            element.textContent = '';
        }
    }, wait)
}

function generateUniqueId() {
    const timestamp = Date.now()
    const number = Math.random();
    const string = number.toString(16)
    return `id-${timestamp}-${string}`
}

function charStripe (isAI, value, uniqueId) {
    return (
        `
             <div class="wrapper ${isAI && 'ai'}">
                 <div class="chat">
                    <div class="profile">
                        <img 
                            src="${isAI ? bot : user}"
                            alt="${isAI ? 'bot' : 'user'}" 
                        />
                    </div>
                    <div class="message" id="${uniqueId}">${value}</div>
                </div>
            </div>         
        `
    )
}

function typeText(element, text, wait=20) {
    let index = 0

    let interval = setInterval(()=> {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index ++
        } else {
            clearInterval(interval);
        }
    }, wait)
}

async function sendMsg(path, prompt) {
    try {
        const response = await fetch(
            path,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt
                })
            }
        )
        return response
    } catch (e) {
        console.error("Fetch error:", e); // 打印错误信息，便于调试
        throw e; // 将错误抛出，以便在调用的地方处理
    }
}

async function sendMsgStream(path, prompt) {
    const response = await fetch(
        path,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt
            })
        }
    );
    return response;
}

function streamGet(messageDiv) {
    const eventSource = new EventSource(`${SERVERPATH}/events`);
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.message) {
            console.log('Received message: ', data.message);
            messageDiv.innerHTML += data.message; // 渐进式显示
        } else if (data.done) {
            console.log('Streaming complete');
            eventSource.close(); // 关闭连接
        }
    };
}

const handleSubmit = async (event, type = 'stream') => {
    event.preventDefault();

    const data = new FormData(form);
    const prompt = data.get('prompt')
    // users' chat stripe
    chatContainer.innerHTML += charStripe(false, prompt)

    form.reset();

    // gpt chat stripe
    const uniqueId = generateUniqueId()
    chatContainer.innerHTML += charStripe(true, " ", uniqueId)

    chatContainer.scrollTop = chatContainer.scrollHeight
    const messageDiv = document.getElementById(uniqueId)

    loader(messageDiv)

    const server_path = SERVERPATH

    if (type === 'stream') {
        const response = await sendMsgStream(`${SERVERPATH}/stream`, prompt);

        if (response.ok) {
            // 2. 开始监听 SSE
            streamGet(messageDiv);
        } else {
            console.error('Failed to start stream:', response.statusText);
        }
        clearInterval(loadInterval)

    } else {
        let response
        try {
            response = await sendMsg(server_path, prompt)
            clearInterval(loadInterval)
            messageDiv.innerHTML = ''

            if (response) {
                if (response.ok) {
                    const data = await response.json()
                    const parseData = data.bot.trim();

                    typeText(messageDiv, parseData)
                } else {
                    // clearInterval(loadInterval)
                    const data = await response.text()
                    messageDiv.innerHTML = `error : ${data}`
                }
            }
        } catch (error) {
            clearInterval(loadInterval); // 即使发生错误，也清除 interval
            // 处理错误情况，例如提示用户或记录日志
            console.error("Error in to get result from server:", error.stack.toString() || error.toString());
            const data = error.stack.toString() || error.toString()
            messageDiv.innerHTML = `error : ${data}`
        } finally {
            clearInterval(loadInterval); // 确保 interval 被清除
        }
    }
}

form.addEventListener('submit', handleSubmit)
form.addEventListener('keyup', (e) =>{
    if (e.keyCode === 13) {
        // which means the enter key
        handleSubmit(e)
    }
})