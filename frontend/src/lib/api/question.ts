import { graphqlRequest } from './client';

export interface CreateQuestionInput {
  content: string;
  roomId: number;
  userId: number;
}

export interface Question {
  id: number;
  content: string;
  voteCount: number;
  isAnswered: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  room: {
    id: number;
    code: string;
    title: string;
  };
  // Additional properties for frontend state
  hasVoted?: boolean;
}

const CREATE_QUESTION_MUTATION = `
  mutation CreateQuestion($createQuestionInput: CreateQuestionInput!) {
    createQuestion(createQuestionInput: $createQuestionInput) {
      id
      content
      voteCount
      isAnswered
      isDeleted
      createdAt
      updatedAt
      user {
        id
        firstName
        lastName
        email
        avatarUrl
      }
      room {
        id
        code
        title
      }
    }
  }
`;

const GET_QUESTIONS_QUERY = `
  query GetQuestions {
    questions {
      id
      content
      voteCount
      isAnswered
      isDeleted
      createdAt
      updatedAt
      user {
        id
        firstName
        lastName
        email
        avatarUrl
      }
      room {
        id
        code
        title
      }
    }
  }
`;

const GET_QUESTION_BY_ID_QUERY = `
  query GetQuestion($id: Int!) {
    question(id: $id) {
      id
      content
      voteCount
      isAnswered
      isDeleted
      createdAt
      updatedAt
      user {
        id
        firstName
        lastName
        email
        avatarUrl
      }
      room {
        id
        code
        title
      }
    }
  }
`;

const GET_QUESTIONS_BY_ROOM_QUERY = `
  query GetQuestionsByRoom($roomId: Int!) {
    questionsByRoom(roomId: $roomId) {
      id
      content
      voteCount
      isAnswered
      isDeleted
      createdAt
      updatedAt
      user {
        id
        firstName
        lastName
        email
        avatarUrl
      }
      room {
        id
        code
        title
      }
    }
  }
`;

export const questionApi = {
  async createQuestion(input: CreateQuestionInput): Promise<Question> {
    const response = await graphqlRequest<{ createQuestion: Question }>(CREATE_QUESTION_MUTATION, {
      createQuestionInput: input
    });
    return response.createQuestion;
  },

  async getQuestions(): Promise<Question[]> {
    const response = await graphqlRequest<{ questions: Question[] }>(GET_QUESTIONS_QUERY);
    return response.questions;
  },

  async getQuestionById(id: number): Promise<Question> {
    const response = await graphqlRequest<{ question: Question }>(GET_QUESTION_BY_ID_QUERY, { id });
    return response.question;
  },

  async getQuestionsByRoom(roomId: number): Promise<Question[]> {
    const response = await graphqlRequest<{ questionsByRoom: Question[] }>(GET_QUESTIONS_BY_ROOM_QUERY, { roomId });
    return response.questionsByRoom;
  }
};
