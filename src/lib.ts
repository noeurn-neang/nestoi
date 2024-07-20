import express, { Express, Response, Request } from 'express';
import _rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { IAppConfig } from './types';
import { extractAppConfig } from './api-docs';

/**
 * nestoi is a bootstrap function of our node application
 *
 * @params configs {IAppConfig} - nestoi configations
 *
 * @returns {Express} app
 */
const nestoi = (
  configs: IAppConfig = {
    rateLimit: { limit: 100, limitTime: 15 },
    swagger: {
      disabled: false,
    },
  },
): Express => {
  const { title, routePrefix, logFormat, middlewares, rateLimit, swagger } =
    configs;

  // Intializing the express app
  const app = express();

  // Rate Limit
  const limiter = _rateLimit({
    windowMs: rateLimit?.limitTime! * 60 * 1000, // 15 minutes
    limit: rateLimit?.limit || 100,
  });
  app.use(limiter);

  // Add common middlewares for restful api
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan(logFormat || 'combined'));

  // Add extra middlewares
  if (middlewares) app.use(...middlewares);

  // Extract api document for swagger and router for express app
  const { apiDocs, router } = extractAppConfig(configs);

  // API documents
  if (!swagger?.disabled) {
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(apiDocs, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      }),
    );
  }

  // Register all routes for express app
  if (routePrefix) {
    app.use(routePrefix, router);
  } else {
    app.use(router);
  }

  // Starter route that can naviate to api docs
  app.get('/', (req: Request, res: Response) => {
    res.send(`
      <center>
        <br />
        <h1>Welcome to ${title}</h1>
        <a href="/api-docs"><h2>Swagger API Docs</h2></a> 
      </center>
    `);
  });

  return app;
};

export default nestoi;
