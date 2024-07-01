const wsLink = 'ws://localhost:8080';
let socket;

let CURRENTSTATE = 0;
// contains pairs of [alias,key];
let SESSION_CLIENTS = []; // Excluding self
let ALIAS = '';

connectWS();
function connectWS() {
    console.log(`WS connected at: ${wsLink}`);
    socket = new WebSocket(wsLink);
    CURRENTSTATE = 1;

    // WebSocket event listeners
    socket.addEventListener('open', function (event) {
        console.log('WebSocket connection established.');
        
        sendM1(socket);
        CURRENTSTATE = 2;
    });

    socket.addEventListener('message', function (event) {
        let message = JSON.parse(event.data);
        console.log('Message from server:', message);
        let command = message.command;
        switch (CURRENTSTATE) {
            case 2:
                if (command != 'A-JN' && command != 'F-JN' && command != 'E-JN') {
                    console.log('unexpected response from the server (102)');
                    displayNotification('Server mesbehaving (102)');
                    return;
                }
                handleStateChangeFrom2(message);
                break;
            case 3:
                if (command != 'JOIN') {
                    console.log('unexpected response from the server (103)');
                    displayNotification('Server mesbehaving (103)');
                    return;
                }
                handleStateChangeFrom3(message);
                break;
            case 4:
                if (command != 'MESG' && command != 'LEAV' && command != 'JOIN') {
                    console.log('unexpected response from the server (104)');
                    displayNotification('Server mesbehaving (104)');
                    return;
                }
                handleStateChangeFrom4(message);
                break;
            default:
            
                console.log('unexpected or unimplemented command received');
                displayNotification(`unexpected or unimplemented command received`);
                break;
        }
    });

    socket.addEventListener('close', function (event) {
        console.log('WebSocket connection closed.');
    });

    socket.addEventListener('error', function (event) {
        console.error('WebSocket encountered an error:', event);
    });

}

function displayNotification(msg) {
    document.getElementById('display-notification').innerHTML = msg;
}

function closeWS() {
    socket.close();
    console.log("socket Closed");
}

function exitPage() {
    closeWS();
    window.location.href = "/";
}

function sendM1(socket) {
    let random = Math.floor(Math.random()*100);
    ALIAS = `alice${random}`;
    let message = {
        command: 'JOIN',
        sessionId: 990011,
        key: `abc${random}`,
        alias: ALIAS
    }

    socket.send(JSON.stringify(message));
}

function sendM2() {
    if (CURRENTSTATE == 4) {
        const text = document.getElementById('input-text-area').value
        let message = {
            command: 'MESG',
            payload: generateEncryptedPayload(text)
        }
        socket.send(JSON.stringify(message));
        console.log(`sent message ${message}`);
        displayNotification(`message sent`);
        addMessage('you',text);
    } else {
        displayNotification('Not in state 4, hence cannot send message');
    }
}

function generateEncryptedPayload(text) {
    let payload = [];
    for (let index = 0; index < SESSION_CLIENTS.length; index++) {
        const pair = SESSION_CLIENTS[index];
        payload.push({
            alias: pair[0],
            message: text       // Modify later to be encrypted by the user's public key
        })
    }
    return payload;
}

function sendM3Join(alias) {
    let message = {
        command: 'A-JN',
        alias: alias
    }

    socket.send(JSON.stringify(message));
    addMessage('SERVER',`${alias} has joined the chat`);
}

function handleStateChangeFrom4(message) { 
    // Check the message TODO !!!
    switch (message.command) {
        case 'MESG':  // R5
            // decrypt the messge and display with timestam and alias
            addMessage(message.from,message.message);
            console.log('received a message');
            displayNotification(`received a message from ${message.from}`);
            // No change in state
            break;
        case 'JOIN': // R6J
            // TODO !!! new client joined
            CURRENTSTATE = 5;
            SESSION_CLIENTS.push([message.alias,message.key]);
            console.log('MESAGE JOIN received');
            displayNotification(`received join message, ${message.alias} joined`);
            sendM3Join(message.alias);
            CURRENTSTATE = 4;
            break;
        case 'LEAV':// R6L
            // TODO !!!
            console.log('MESAGE LEAV received');
            displayNotification(`received leave message`);
            break;
    
        default:
            
            console.log('unexpected message in state 4');
            displayNotification(`unexpected message in state 4`);
            break;
    }   
    
}

function handleStateChangeFrom3(message) { 
    // Check the message TODO !!!
    SESSION_CLIENTS.push([message.alias,message.key]);
    displayNotification(`user joined with alias: ${message.alias}`);
    CURRENTSTATE = 4;
}

function handleStateChangeFrom2(message) {
    switch (message.command) {
        case 'F-JN': // Check the message TODO !!!
            // ERROR in M1, try to connect again
            console.log('Try to connect again');
            displayNotification('Failed to connect, please try again');
            // TODO !!!
            CURRENTSTATE = 1;
            break;
        case 'A-JN': // Check the message TODO !!!
            // Wait for user
            console.log('waiting for users to join');
            displayNotification('Alone in the session, waiting for users to join');
            addMessage('SERVER',`joined as ${ALIAS}`);
            // TODO !!!
            CURRENTSTATE = 3
            break;
        case 'E-JN': // Check the message TODO !!!
            // joined a session with other people
            addMessage('SERVER',`joined as ${ALIAS}`);
            let userAliases = '';
            for (let index = 0; index < message['payload'].length; index++) {
                const pair = message['payload'][index];
                SESSION_CLIENTS.push([pair.alias,pair.key]);
                userAliases += pair.alias + ', ';
            }
            addMessage('SERVER',`existing users are: ${userAliases}`);
            displayNotification(`joined session with ${message['payload'].length} users`);
            console.log(SESSION_CLIENTS);
            CURRENTSTATE = 4;
            break;
    
        default:
            break;
    }
}

function addMessage(from,msg) {
    let now = new Date();
    document.getElementById('chat-display').innerHTML += `${now.getHours()}:${now.getMinutes()}<br><u>${from}</u>:${msg} <br>`;
}
