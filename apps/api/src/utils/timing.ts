export function startTimer() { 
  const s = process.hrtime.bigint(); 
  return () => Number((process.hrtime.bigint() - s) / 1000000n); 
}

export type Timed<T> = { result: T; durationMs: number };

export async function timed<T>(fn: () => Promise<T>): Promise<Timed<T>> { 
  const stop = startTimer(); 
  const result = await fn(); 
  return { result, durationMs: stop() }; 
}