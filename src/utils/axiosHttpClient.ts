import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Options for the HTTP request
 */
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Response from an HTTP request
 */
export interface HttpResponse {
  status: number;
  headers: Record<string, string | string[]>;
  data: string;
}

/**
 * Axios-based HTTP client utility
 */
export class AxiosHttpClient {
  /**
   * Make an HTTP request
   * @param method - HTTP method (GET, POST, etc.)
   * @param url - URL to make the request to
   * @param data - Data to send in the request body
   * @param options - Additional options for the request
   * @returns Promise with the response
   */
  static async request(
    method: string,
    url: string,
    data?: string | object | null,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse> {
    try {
      const config: AxiosRequestConfig = {
        method: method,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: options.timeout || 30000, // Default 30s timeout
        data: data
      };
      
      const response: AxiosResponse = await axios(config);
      
      // Convert Axios headers to compatible format
      const normalizedHeaders: Record<string, string | string[]> = {};
      
      // Handle the headers object from Axios
      if (response.headers) {
        Object.entries(response.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            normalizedHeaders[key] = value;
          }
        });
      }
      
      return {
        status: response.status,
        headers: normalizedHeaders,
        data: typeof response.data === 'string' 
          ? response.data 
          : JSON.stringify(response.data)
      };
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`Request failed with status ${error.response.status}: ${error.message}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error(`No response received: ${error.message}`);
      } else {
        // Something happened in setting up the request
        throw new Error(`Error setting up request: ${error.message}`);
      }
    }
  }
  
  /**
   * Make a GET request
   * @param url - URL to make the request to
   * @param options - Additional options for the request
   * @returns Promise with the response
   */
  static async get(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    return this.request('GET', url, null, options);
  }
  
  /**
   * Make a POST request
   * @param url - URL to make the request to
   * @param data - Data to send in the request body
   * @param options - Additional options for the request
   * @returns Promise with the response
   */
  static async post(url: string, data: string | object, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    return this.request('POST', url, data, options);
  }
  
  /**
   * Make a PUT request
   * @param url - URL to make the request to
   * @param data - Data to send in the request body
   * @param options - Additional options for the request
   * @returns Promise with the response
   */
  static async put(url: string, data: string | object, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    return this.request('PUT', url, data, options);
  }
  
  /**
   * Make a DELETE request
   * @param url - URL to make the request to
   * @param options - Additional options for the request
   * @returns Promise with the response
   */
  static async delete(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    return this.request('DELETE', url, null, options);
  }
} 