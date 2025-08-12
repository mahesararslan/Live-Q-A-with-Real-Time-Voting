import { Question } from "src/entities/question.entity";


export interface ServerToClientEvents {
  newMessage: (payload: Question) => void;
}