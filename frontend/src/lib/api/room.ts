import { graphqlRequest } from './client';

// Types for room operations
export interface CreateRoomInput {
  title: string;
  description?: string;
}

export interface Room {
  id: number;
  code: string;
  title: string;
  description?: string;
  isActive: boolean;
  isEnded: boolean;
  createdAt: string;
  admin: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  participants?: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }[];
}

// GraphQL mutations and queries
const CREATE_ROOM_MUTATION = `
  mutation CreateRoom($createRoomInput: CreateRoomInput!) {
    createRoom(createRoomInput: $createRoomInput) {
      id
      code
      title
      description
      isActive
      admin {
        id
        firstName
        lastName
        avatarUrl
      }
      createdAt
    }
  }
`;

const JOIN_ROOM_MUTATION = `
  mutation JoinRoom($roomCode: String!) {
    joinRoom(roomCode: $roomCode) {
      id
      code
      title
      description
      isActive
      admin {
        id
        firstName
        lastName
        avatarUrl
      }
      participants {
        id
        firstName
        lastName
        avatarUrl
      }
    }
  }
`;

const LEAVE_ROOM_MUTATION = `
  mutation LeaveRoom($roomCode: String!) {
    leaveRoom(roomCode: $roomCode) {
      id
      code
      participants {
        id
        firstName
        lastName
        avatarUrl
      }
    }
  }
`;

const GET_ROOM_BY_CODE_QUERY = `
  query RoomByCode($code: String!) {
    roomByCode(code: $code) {
      id
      code
      title
      description
      isActive
      isEnded
      admin {
        id
        firstName
        lastName
        avatarUrl
      }
      participants {
        id
        firstName
        lastName
        avatarUrl
      }
      createdAt
    }
  }
`;

const GET_PARTICIPANT_COUNT_QUERY = `
  query ParticipantCount($roomCode: String!) {
    participantCount(roomCode: $roomCode)
  }
`;

// API functions
export const createRoom = async (roomData: CreateRoomInput): Promise<Room> => {
  const response = await graphqlRequest(CREATE_ROOM_MUTATION, {
    createRoomInput: roomData,
  }) as { createRoom: Room };
  return response.createRoom;
};

export const joinRoom = async (roomCode: string): Promise<Room> => {
  const response = await graphqlRequest(JOIN_ROOM_MUTATION, {
    roomCode,
  }) as { joinRoom: Room };
  return response.joinRoom;
};

export const leaveRoom = async (roomCode: string): Promise<Room> => {
  const response = await graphqlRequest(LEAVE_ROOM_MUTATION, {
    roomCode,
  }) as { leaveRoom: Room };
  return response.leaveRoom;
};

export const getRoomByCode = async (code: string): Promise<Room> => {
  const response = await graphqlRequest(GET_ROOM_BY_CODE_QUERY, {
    code,
  }) as { roomByCode: Room };
  return response.roomByCode;
};

export const getParticipantCount = async (roomCode: string): Promise<number> => {
  const response = await graphqlRequest(GET_PARTICIPANT_COUNT_QUERY, {
    roomCode,
  }) as { participantCount: number };
  return response.participantCount;
};
