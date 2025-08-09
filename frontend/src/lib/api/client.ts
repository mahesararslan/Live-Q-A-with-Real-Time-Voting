// GraphQL client configuration
const GRAPHQL_ENDPOINT = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/graphql`;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: {
      code: string;
    };
  }>;
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if token exists
        ...(typeof window !== 'undefined' && localStorage.getItem('token') && {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL request failed');
    }

    if (!result.data) {
      throw new Error('No data returned from GraphQL request');
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL request error:', error);
    throw error;
  }
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
