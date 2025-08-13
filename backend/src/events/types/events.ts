import { Question } from "src/entities/question.entity";

export interface RoomParticipant {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface ServerToClientEvents {
  newMessage: (payload: Question) => void;
  userJoined: (payload: {
    user: RoomParticipant;
    participantCount: number;
    participants: RoomParticipant[];
  }) => void;
  userLeft: (payload: {
    user: RoomParticipant;
    participantCount: number;
    participants: RoomParticipant[];
  }) => void;
  joinRoomSuccess: (payload: {
    roomId: string;
    participantCount: number;
    participants: RoomParticipant[];
  }) => void;
  joinRoomError: (payload: { message: string }) => void;
  leaveRoomSuccess: (payload: { roomId: string }) => void;
  messageError: (payload: { error: string; details?: string }) => void;
  voteUpdated: (payload: {
    questionId: number;
    userId: number;
    voteCount: number;
    hasVoted: boolean;
    action: 'added' | 'removed';
  }) => void;
  voteError: (payload: { error: string; details?: string }) => void;
  sessionEnded: (payload: { 
    roomCode: string; 
    endedBy: RoomParticipant;
    message: string;
  }) => void;
  sessionEndError: (payload: { error: string; details?: string }) => void;
}