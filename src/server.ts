import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from 'apollo-server-express';
// Explicitly importing the landing page plugin for v3
import { ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import dotenv from 'dotenv';

dotenv.config();

import connectDB from './config/database';
import connectRedis from './config/redis';
import { initSocket } from './config/socket';
import logger from './utils/logger';
import { schema } from './graphql';
import { getContextFromRequest } from './middleware/auth.middleware';

const bootstrap = async (): Promise<void> => {
  const app = express();
  const httpServer = http.createServer(app);

  await connectDB();
  await connectRedis();
  initSocket(httpServer);

  // 1. Updated Helmet to bypass CSP restrictions for the GraphQL endpoint so Sandbox can load
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://embed.apollo.dev", "https://studio.apollographql.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https://apollo-server-landing-page.cdn.apollographql.com", "https://studio.apollographql.com"],
          frameSrc: ["'self'", "https://sandbox.embed.apollographql.com", "https://studio.apollographql.com"],
        },
      } : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(mongoSanitize());

  // 2. Updated CORS to explicitly permit Apollo Studio connections alongside your client domains
  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
    'https://studio.apollographql.com' // Crucial for sandbox connection
  ].filter(Boolean) as string[];

  app.use(cors({ origin: allowedOrigins, credentials: true }));

  // Rate limiting
  app.use('/graphql', rateLimit({ windowMs: 10 * 60 * 1000, max: 200 }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // File uploads via multipart (must come before Apollo)
  app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 10 }));

  if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

  // Apollo Server configuration
  const server = new ApolloServer({
    schema,
    context: ({ req }: any) => getContextFromRequest(req),
    introspection: true, // Forces schema introspection to work in production
    plugins: [
      // 3. Force Apollo to build and embed the default landing page template in production
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
    formatError: (err) => {
      logger.error(err.message);
      return {
        message: err.message,
        code: err.extensions?.code ?? 'INTERNAL_SERVER_ERROR',
        path: err.path,
      };
    },
  });

  await server.start();
  server.applyMiddleware({ app: app as any, path: '/graphql', cors: false });

  const PORT = process.env.PORT ?? 5000;
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Shuk API ready at port ${PORT}${server.graphqlPath}`);
  });

  process.on('unhandledRejection', (err: Error) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    httpServer.close(() => process.exit(1));
  });
};

bootstrap();

// import express from 'express';
// import http from 'http';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import mongoSanitize from 'express-mongo-sanitize';
// import rateLimit from 'express-rate-limit';
// import { ApolloServer } from 'apollo-server-express';
// // import { graphqlUploadExpress } from 'graphql-upload';
// import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
// import dotenv from 'dotenv';

// dotenv.config();

// import connectDB from './config/database';
// import connectRedis from './config/redis';
// import { initSocket } from './config/socket';
// import logger from './utils/logger';
// import { schema } from './graphql';
// import { getContextFromRequest } from './middleware/auth.middleware';

// const bootstrap = async (): Promise<void> => {
//   const app = express();
//   const httpServer = http.createServer(app);

//   await connectDB();
//   await connectRedis();
//   initSocket(httpServer);

//   // Security
//   app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' }));
//   app.use(mongoSanitize());
//   app.use(cors({ origin: [process.env.CLIENT_URL!, process.env.ADMIN_URL!], credentials: true }));

//   // Rate limiting
//   app.use('/graphql', rateLimit({ windowMs: 10 * 60 * 1000, max: 200 }));

//   // Body parsing
//   app.use(express.json({ limit: '10mb' }));
//   app.use(express.urlencoded({ extended: true }));

//   // File uploads via multipart (must come before Apollo)
//   app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 10 }));

//   if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//   // Health check (REST endpoint kept for infra monitoring)
//   app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

//   // Apollo Server
//   const server = new ApolloServer({
//     schema,
//     context: ({ req }: any) => getContextFromRequest(req),
//     introspection: true,
//     formatError: (err) => {
//       logger.error(err.message);
//       return {
//         message: err.message,
//         code: err.extensions?.code ?? 'INTERNAL_SERVER_ERROR',
//         path: err.path,
//       };
//     },
//   });

//   await server.start();
//   server.applyMiddleware({ app: app as any, path: '/graphql', cors: false });

//   const PORT = process.env.PORT ?? 5000;
//   httpServer.listen(PORT, () => {
//     logger.info(`🚀 Shuk API ready at http://localhost:${PORT}${server.graphqlPath}`);
//   });

//   process.on('unhandledRejection', (err: Error) => {
//     logger.error(`Unhandled Rejection: ${err.message}`);
//     httpServer.close(() => process.exit(1));
//   });
// };

// bootstrap();