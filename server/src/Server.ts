import express, { Request, Response } from 'express';
import SocketServer from './SocketServer';
import ChatRoom from './ChatRoom';
import ChatResponse from './ChatResponse';

class Server {
  private socketServer: SocketServer;
  private httpServer: express.Express;
  private roomList: Map<string, ChatRoom[]> = new Map();
 
  constructor(ip: string, port: number, httpPort: number) {
    this.socketServer = new SocketServer(ip, port);
    this.registerEvents();
    this.httpServer = express();
    this.initHttpServer(httpPort);
  }

  private registerEvents() {
    this.socketServer.onRegisterChatRoom((chatRoom) => {
      const name = chatRoom.id.split("-")[0];
      if(!this.roomList.has(name)){
        this.roomList.set(name, []);
      }
      this.roomList.get(name)?.push(chatRoom);
      console.log("ChatRoom registered id:" + chatRoom.id);
    });

    this.socketServer.onUnregisterChatRoom((chatRoomID) => {
      const name = chatRoomID.split("-")[0];
      const roomList = this.roomList.get(name);
      if(roomList){
        const index = roomList.findIndex((chatRoom) => chatRoom.id === chatRoomID);
        if(index > -1){
          roomList.splice(index, 1);
        }
      }
      if(roomList?.length === 0){
        this.roomList.delete(name);
      }
      console.log("ChatRoom unregistered id:"+chatRoomID);
    });
  }

  private balanceChat(id:string, msg:string, callback:(Response:ChatResponse)=>void):boolean{
    const rooms = this.roomList.get(id);
    if(!rooms){
      return false;
    }

    let shortestRoom: ChatRoom | null = null;
    let shortestLength = 9999
    for(const room of rooms){
      if(room.queueLength() < shortestLength){
        shortestRoom = room;
        shortestLength = room.queueLength();
      }
    }
    if(shortestRoom){
      this.socketServer.requestMsg(shortestRoom.id, msg, callback);
    }
    return true;
  }

  private initHttpServer(port:number){
    const app = this.httpServer;
    app.get('/list', (req: Request, res: Response) => {
      res.send(JSON.stringify(Array.from(this.roomList.keys())));
    });

    app.get('/chat/:id/:msg', (req: Request, res: Response) => {
      const chatId = req.params.id;
      const chatMsg = req.params.msg;

      const chatRoom = this.roomList.get(chatId);
      if (chatRoom) {
        const result = this.balanceChat(chatId, chatMsg, (response) => {
          res.send(JSON.stringify(response));
        });
        if(!result){
          res.status(404).send('Balancing error, Room not found');
        }
      } else {
        res.status(404).send('Chat room not found');
      }
    });
    
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  }

}

export default Server;