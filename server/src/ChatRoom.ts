import ChatRoomData from "./ChatRoomData";
import ChatRequest from "./ChatRequest";

class ChatRoom {
    private chatRoomdata:ChatRoomData;
    private queue:ChatRequest[] = [];

    public queueLength() {
        return this.queue.length;
    }

    public peekQueue() {
        return this.queue[0];
    }

    public popQueue() {
        return this.queue.shift();
    }

    public addQueue(request:ChatRequest) {
        this.queue.push(request);
    }

    constructor(chatRoomdata:ChatRoomData) {
        this.chatRoomdata = chatRoomdata;
    }

    public get id() {
        return this.chatRoomdata.id;
    }

    public get model() {
        return this.chatRoomdata.model;
    }

    public get tokenPerMsg() {
        return this.chatRoomdata.tokenPerMsg;
    }

    public get lastTokenLeft() {
        return this.chatRoomdata.tokenLeft;
    }

    public updateTokenLeft(tokenLeft:number) {
        this.chatRoomdata.tokenPerMsg = tokenLeft;
    }
}

export default ChatRoom;