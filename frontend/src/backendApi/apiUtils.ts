export const API_URL = "http://127.0.0.1:1022";

export const HEADER_COMMON = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Rough implementation. Untested.
export function timeout(ms: number, promise: Promise<Response>) {  
  return new Promise<Response>(function(resolve, reject) {
    setTimeout(function() {
      reject(new Error("timeout"))
    }, ms)
    promise.then(resolve, reject)
  })
};


export function handleFetch(response: Response) {
  if (!response.ok) {
    throw Error(`error with status ${response.status}`);
  }
  
  return response.json();
};