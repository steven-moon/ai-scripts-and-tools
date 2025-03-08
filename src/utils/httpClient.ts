import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

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
  headers: http.IncomingHttpHeaders;
  data: string;
}

/**
 * Utility for making HTTP requests
 */
export class HttpClient {
  /**
   * Make an HTTP request
   * @param method - HTTP method (GET, POST, etc.)
   * @param url - URL to make the request to
   * @param data - Data to send in the request body
   * @param options - Additional options for the request
   * @returns Promise with the response
   */
  static request(
    method: string,
    url: string,
    data?: string | object | null,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      
      // Prepare request options
      const requestOptions: http.RequestOptions = {
        method: method.toUpperCase(),
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: options.timeout || 30000 // Default 30s timeout
      };
      
      // Prepare request body if any
      let requestBody: string | undefined;
      if (data) {
        requestBody = typeof data === 'string' ? data : JSON.stringify(data);
        requestOptions.headers = {
          ...requestOptions.headers,
          'Content-Length': Buffer.byteLength(requestBody).toString()
        };
      }
      
      // Create request
      const clientRequest = (isHttps ? https : http).request(
        requestOptions,
        (response) => {
          const chunks: Buffer[] = [];
          
          response.on('data', (chunk) => {
            chunks.push(Buffer.from(chunk));
          });
          
          response.on('end', () => {
            const responseData = Buffer.concat(chunks).toString('utf8');
            resolve({
              status: response.statusCode || 0,
              headers: response.headers,
              data: responseData
            });
          });
        }
      );
      
      clientRequest.on('error', (error) => {
        reject(error);
      });
      
      // Write request body if any
      if (requestBody) {
        clientRequest.write(requestBody);
      }
      
      clientRequest.end();
    });
  }
  
  /**
   * Make a GET request
   * @param url - URL to make the request to
   * @param options - Additional options for the request
   * @returns Promise with the response
   */
  static get(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    return this.request('GET', url, null, options);
  }
  
  /**
   * Make a POST request
   * @param url - URL to make the request to
   * @param data - Data to send in the request body
   * @param options - Additional options for the request
   * @returns Promise with the response
   */
  static post(url: string, data: string | object, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    return this.request('POST', url, data, options);
  }
} 