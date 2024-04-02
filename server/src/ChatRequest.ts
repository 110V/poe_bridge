import ChatResponse from "./ChatResponse";

interface ChatRequest {
    requestID : string;
    targetID : string;
    prompt : string;
    callback: (response:ChatResponse) => void;
}

export default ChatRequest;