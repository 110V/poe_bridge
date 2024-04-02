import WebSocket from 'ws';
import EventEmitter from 'events';
import short from 'short-uuid'
import ChatRequest from './ChatRequest';
import ChatRoom from './ChatRoom';
import ChatRoomData from './ChatRoomData';
import ChatResponse from './ChatResponse';


class SocketServer extends EventEmitter {
    private socket: WebSocket.Server;
    private clients: WebSocket[];
    private waits: ChatRequest[];
    private chatRooms: Map<WebSocket, ChatRoom[]> = new Map();


    constructor(ip: string, port: number) {
        super();
        this.clients = [];
        this.waits = [];
        this.socket = new WebSocket.Server({ host: ip, port: port });

        this.socket.on('connection', this.connected.bind(this));

        console.log(`WebSocket 서버가 ${port} 포트에서 실행 중입니다.`);
    }


    private connected(client: WebSocket) {
        this.clients.push(client);
        this.chatRooms.set(client, []);
        client.on('message', (msg)=>{
            this.recieved(client, msg.toString());
        });
        client.on('close', ()=>{
            this.disconnected(client)
        });

        console.log('새로운 클라이언트가 연결되었습니다.');
    }

    private disconnected(client: WebSocket) {
        const rooms = this.chatRooms.get(client);
        this.chatRooms.delete(client);
        rooms?.forEach(room => {
            this.unregisterChatRoom(client, room.id);
        });
        this.clients.splice(this.clients.indexOf(client), 1);
        console.log('클라이언트 연결이 종료되었습니다.');
    }

    private recieved(client: WebSocket, message: string) {
        const data = JSON.parse(message);
        console.log(`클라이언트로부터 받은 메시지: ${message}`);
        switch (data.type) {
            case 'register':
                this.registerChatRoom(client, data.data);
                break;
            case 'unregister':
                this.unregisterChatRoom(client, data.data);
                break;
            case 'response':
                this.response(client, data.data);
                break;
            default:
                break;
        }
    }

    private getRoomAndClient(id: string) {
        for (const [client, chatRooms] of this.chatRooms.entries()) {
            for (const chatRoom of chatRooms) {
                if (chatRoom.id === id) {
                    return ({ chatRoom: chatRoom, client: client });
                }
            }
        }
        return null;
    }

    private registerChatRoom(client: WebSocket, chatRoomData: ChatRoomData) {
        const newChatRoom = new ChatRoom(chatRoomData);
        this.chatRooms.get(client)?.push(newChatRoom);
        super.emit('register', newChatRoom);
    }

    public onRegisterChatRoom(listener: (chatRoom: ChatRoom) => void) {
        super.on('register', listener);
    }

    private unregisterChatRoom(client: WebSocket, chatRoomId: string) {
        const chatRooms = this.chatRooms.get(client);
        super.emit('unregister', chatRoomId);
        if (!chatRooms) {
            return;
        }
        const newList = chatRooms.filter(chatRoom => chatRoom.id !== chatRoomId);
        this.chatRooms.set(client, newList);
    }

    public onUnregisterChatRoom(listener: (chatRoomId: string) => void) {
        super.on('unregister', listener);
    }

    private response(client: WebSocket, data: ChatResponse) {
        console.log(1)
        for (const request of this.waits) {
            console.log(2)
            if (request.requestID === data.requestID) {
                console.log(3)
                this.waits.splice(this.waits.indexOf(request), 1);
                request.callback(data);
                const result = this.getRoomAndClient(request.targetID);
                if (!result) {
                    return;
                }
                result.chatRoom.popQueue();
                this.processQueue(request.targetID);
                break;
            }
        }
    }

    public requestMsg(roomID: string, prompt: string, callback: (ChatResponse:ChatResponse) => void): boolean {
        const result = this.getRoomAndClient(roomID);
        if (!result) {
            return false;
        }
        const { chatRoom, client } = result;
        const chatRequest: ChatRequest = { requestID: short.generate(), targetID: roomID, prompt: prompt, callback: callback };


        console.log(chatRequest);
        chatRoom.addQueue(chatRequest);
        if (chatRoom.queueLength() === 1) {
            this.processQueue(roomID);
        }

        return true;
    }

    private processQueue(roomID: string) {
        
        const result = this.getRoomAndClient(roomID);
        if (!result) {
            return;
        }

        const { chatRoom, client } = result;

        if (chatRoom.queueLength() === 0) {
            return;
        }
        const chatRequest = chatRoom.peekQueue();
        const data = {
            type: 'chat_request',
            room: chatRequest?.targetID,
            prompt: chatRequest?.prompt,
            requestID: chatRequest?.requestID
        };
        console.log("send",JSON.stringify(data));
        this.send(client, JSON.stringify(data));
        this.waits.push(chatRequest);
    }


    private requestRoomData(roomID: string) {
        const result = this.getRoomAndClient(roomID);
        if (!result) {
            return;
        }
        const { chatRoom, client } = result;
        this.send(client, JSON.stringify({ type: 'update', data: chatRoom }));
    }

    private send(client: WebSocket, message: string) {
        client.send(message);
    }
}

export default SocketServer;