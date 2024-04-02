import ChatRoomData from './ChatRoomData';
type Status = 'fail' | 'success';

interface ChatResponse {
    requestID : string;
    status : Status;
    msg: string;
    chatRoomData : ChatRoomData;
}

export default ChatResponse;