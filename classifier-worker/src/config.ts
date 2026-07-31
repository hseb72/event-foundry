export interface RedisConnection {
  host: string;
  port: number;
}

export function redisConnection(): RedisConnection {
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? '6379'),
  };
}
