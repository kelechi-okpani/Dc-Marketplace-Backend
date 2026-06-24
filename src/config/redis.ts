import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';

let redisClient: RedisClientType;

const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL }) as RedisClientType;
    redisClient.on('error', (err) => logger.error(`Redis Error: ${err}`));
    await redisClient.connect();
    logger.info('Redis Connected');
  } catch (error) {
    logger.error(`Redis Connection Error: ${(error as Error).message}`);
  }
};

export const getRedisClient = (): RedisClientType => redisClient;

export default connectRedis;