let socketConnection = {};
socketConnection.connected = false;
socketConnection.socket = null;

socketConnection.connect = function connect(ip, port, callback) {
    const wsUrl = "ws://" + ip + ":" + port;
    const socket = new WebSocket(wsUrl);
    socketConnection.socket = socket;
    this.connected = 1;
    socket.addEventListener("open", () => {
        console.log("connected");
        this.connected = 2;
        if (callback) {
            callback(true);
        }
    });

    socket.addEventListener("message", (event) => {
        console.log("message receive ", event.data)
        const data = JSON.parse(event.data);
        const type = data.type;

        if (type == "chat_request") {
            const roomID = data.room;
            const prompt = data.prompt;
            const requestID = data.requestID;
            sendRequest(roomID, prompt, requestID);
        }
    });

    socket.addEventListener("close", () => {
        console.log("closed");
        this.connected = 0;
        if (callback) {
            callback(false);
        }
    });
}

socketConnection.sendRegister = (chatroomdata) => {
    const data = { type: "register", data: chatroomdata };
    socketConnection.socket.send(JSON.stringify(data));
}

socketConnection.sendUnregister = (chatRoomID) => {
    const data = { type: "unregister", data: chatRoomID };
    socketConnection.socket.send(JSON.stringify(data));
}

socketConnection.sendResponse = (response) => {
    const data = { type: "response", data: response };
    socketConnection.socket.send(JSON.stringify(data));
}



let chatManager = {};
chatManager.rooms = new Map();

function sendRequest(roomID, prompt, requestID) {
    browser.tabs.sendMessage(chatManager.rooms.get(roomID), { action: "con_request", prompt, requestID });
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "back_isConnected":
            sendResponse(socketConnection.connected);
            break;
        case "back_connect":
            console.log("connect:", request.ip, request.port);
            socketConnection.connect(request.ip, request.port, (suc) => {
                let data;
                if (suc) {
                    data = { action: "pop_connected" };
                }
                else {
                    data = { action: "pop_closed" };
                }
                browser.runtime.sendMessage(data);
            });
            break;
        case "back_register":
            console.log("register:", request.name);
            chatManager.rooms.set(request.name, request.tabID);
            socketConnection.sendRegister(request.chatRoomData);
            sendResponse("ok");
            break;
        case "back_unregister":
            console.log("unregister:", request.name);
            chatManager.rooms.delete(request.name);
            socketConnection.sendUnregister(request.name);
            sendResponse("ok");
            break;
        case "back_response":
            console.log("response:", request.data);
            socketConnection.sendResponse(request.data);
            break;
    }
});


