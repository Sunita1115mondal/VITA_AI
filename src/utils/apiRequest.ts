/**
 * Makes an HTTP request using the specified method, endpoint, payload, and query parameters.
 *
 * @template T - The expected type of the response data.
 * @param {Method} method - The HTTP method to use for the request (e.g., 'GET', 'POST', 'PUT', 'PATCH', 'DELETE').
 * @param {string} endpoint - The API endpoint to send the request to.
 * @param {object} [payload] - The request body, used for methods like POST, PUT, and PATCH.
 * @param {object} [params] - Query parameters, used for GET requests.
 * @returns {Promise<T>} - A promise that resolves to the response data of type `T`.
 * @throws {Error} - Throws an error if the request fails.
 *
 * @example
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 * }
 *
 * const user = await apiRequest<User>('GET', '/users/1');
 * console.log(user.name);
 * ```
 */
import { AxiosError } from 'axios';
import api from '../config/Axios.config';

// Define HTTP methods
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const apiRequest = async <T>(
  method: Method,
  endpoint: string,
  payload?: object,
  params?: object
): Promise<T> => {
  try {
    const response = await api({
      method,
      url: endpoint,
      data: payload, // Used for POST, PUT, PATCH
      params, // Used for GET requests with query params
      headers:
        payload instanceof FormData
          ? {
              'Content-Type': 'multipart/form-data',
            }
          : { 'Content-Type': 'application/json' },
    });

    const { result } = response.data;
    return result; // Return only the data, not full response
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error(
        `API Error (${method} ${endpoint}):`,
        error.response?.data || error.message
      );
      throw new AxiosError(
        error.response?.data?.message ?? error.message ?? 'Unknown API error',
        error.code,
        error.config,
        error.request,
        error.response
      );
    } else {
      throw { status: 500, message: 'Unexpected error' };
    }
  }
};
