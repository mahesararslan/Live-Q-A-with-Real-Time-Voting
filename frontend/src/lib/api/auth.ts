import { graphqlRequest, API_BASE_URL } from './client';

// Types based on backend DTOs
export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  avatarUrl?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  userId: number;
  token: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

// GraphQL mutations
const SIGN_UP_MUTATION = `
  mutation SignUp($input: CreateUserInput!) {
    signUp(input: $input) {
      id
      firstName
      lastName
      email
      avatarUrl
    }
  }
`;

const SIGN_IN_MUTATION = `
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      userId
      token
    }
  }
`;

const GET_USER_QUERY = `
  query GetUser($id: Int!) {
    getUser(id: $id) {
      id
      firstName
      lastName
      email
      avatarUrl
    }
  }
`;

export const authApi = {
  // Sign up with email/password
  signUp: async (input: SignUpInput): Promise<User> => {
    const response = await graphqlRequest<{ signUp: User }>(SIGN_UP_MUTATION, { input });
    console.log(response);
    return response.signUp;
  },

  // Sign in with email/password  
  signIn: async (input: SignInInput): Promise<AuthPayload> => {
    const response = await graphqlRequest<{ signIn: AuthPayload }>(SIGN_IN_MUTATION, { input });
    return response.signIn;
  },

  // Google OAuth login redirect
  googleLogin: () => {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  },

  // Logout
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
  },

  // Get stored auth data
  getStoredAuth: (): { token: string | null; userId: string | null } => {
    if (typeof window === 'undefined') {
      return { token: null, userId: null };
    }
    return {
      token: localStorage.getItem('token'),
      userId: localStorage.getItem('userId'),
    };
  },

  // Store auth data
  storeAuth: (payload: AuthPayload) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', payload.token);
      localStorage.setItem('userId', payload.userId.toString());
    }
  },

  // Get user details by ID
  getUserDetails: async (id: number): Promise<User> => {
    const response = await graphqlRequest<{ getUser: User }>(GET_USER_QUERY, { id });
    return response.getUser;
  },
};
