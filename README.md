# Nestoi

Nestoi is a Node.js library designed to simplify and accelerate the setup of robust and secure Express applications. It combines essential middleware and automatic documentation generation to streamline development and ensure best practices.

## Features

1. **Useful Middleware Integration:**
   - **Morgan:** HTTP request logger middleware for Node.js.
   - **Rate Limit:** Limits repeated requests to public APIs and/or endpoints to prevent abuse.
   - **Helmet:** Helps secure Express apps by setting various HTTP headers.
   - **Cors:** Enables Cross-Origin Resource Sharing, allowing the server to respond to requests from different origins.

2. **Auto-Generated Swagger Documentation:**
   - Automatically generates Swagger documentation from your route setups.
   - Utilizes Joi schemas for validation and documentation, ensuring consistency and accuracy.

## Benefits

- **Enhanced Security:** Integrates crucial security headers and rate limiting to protect your application.
- **Improved Development Efficiency:** Automates the setup of commonly used middleware.
- **Seamless API Documentation:** Provides up-to-date API documentation with minimal effort, improving developer experience and collaboration.

## Getting Started

### Installation

To install Nestoi, run:
```sh
npm install nestoi
```

### Example Usage
#### 1. Nestoi application
Setup you main nestoi application can be in `index.ts` or `app.ts`
```ts
...
import { nestoi } from 'nestoi';
import { routeTags } from 'path/to/routes';
import * as joiSchemas from 'path/to/schema';
...

const SERVER_PORT = 5555;

nestoi({
  title: 'You swagger api document title',
  routeTags: routeTags,
  routePrefix: '/api',
  swagger: {
    servers: [`http://localhost:${SERVER_PORT}/api`],
  },
  joiSchemas,
}).listen(SERVER_PORT, () => {
  console.log(`Server listen on port ${SERVER_PORT}`);
});
```

### Configuration
```ts
   export interface IAppConfig {
      title?: string; // Your restful api title
      description?: string; // Your restful api description
      version?: string; // Your restful api version
      routeTags?: IRouteTag[]; // Your application routes
      routePrefix?: string; // Route prefix like /v1 or /v2
      joiSchemas?: Record<string, any>; // Your entired application joi schema
      rateLimit?: {
         limitTime: number; // Your limit time for rate limit example only 100 request in 15 minutes.
         limit: number; // Number of request for above limit time.
      };
      middlewares?: RequestHandler[];
      logFormat?: 'combined' | 'common' | 'dev' | 'short' | 'tiny';
      swagger?: {
         disabled?: boolean; // Disabeld or enabled your swagger api document
         servers?: string[]; // Your swagger api servers like localhost, uat or production servers
         securitySchemes?: SecuritySchemes; // Your swagger api security schemes like bearerAuth, apiKey or oauth2
         openapiVersion?: string; // Your openapi version like '3.0.0'
      };
   }
```

#### 2. Routes
Setup your whole application routes here to make available in swagger document and joi valdiation
```ts
...
import { IRouteTag, Request, Response } from 'nestoi';
import {
  getUsers as getUsersSchema,
  createUser as createUserSchema,
  updateUser as updateUserSchema,
} from 'path/to/user.schema';
...

export const routeTags: IRouteTag[] = [
  {
    name: 'User',
    description: 'List, create, update and delete user.',
    middlewares: [], // Apply middleware to group of routes
    routes: {
      '/users': {
        get: {
          summary: 'Get users list',
          handler: (req: Request, res: Response) => {},
          middlewares: [], // Apply middleware a single route
          schema: {
            query: getUsersSchema,
          },
        },
        post: {
          summary: 'Create new user',
          handler: handler: (req: Request, res: Response) => {},
          schema: {
            body: createUserSchema,
          },
        },
      },
      '/users/{id}': {
        put: {
          summary: 'Update a user by id',
          handler: handler: (req: Request, res: Response) => {},
          schema: {
            params: ['*id'],
            body: updateUserSchema,
          },
        },
        delete: {
          summary: 'Delete a user by id',
          handler: handler: (req: Request, res: Response) => {},
          schema: {
            params: ['*id'],
          },
        },
      },
    },
  },
];
```

#### 3. Route Validation Schema 
Route Validation Schema is a group of keys from overall schema for validate body and query of request

All items in array is a variable that exported from overall schema. `*` is required field it will working in joi validation and swagger document.
```ts
export const getUsers: string[] = ['q', '*page', '*pageSize'];

export const createUser: string[] = [
  '*name',
  '*email',
  '*password',
  'gender',
  '*dob',
  'isActive',
];

export const updateUser: string[] = [
  '*name',
  '*email',
  '*password',
  'gender',
  '*dob',
  'isActive',
  'items',
];
```

#### 3. Overall Schema
Overall schema is joi validation schema detail that will be useful for data validation and swagger document
```ts
import { Joi } from 'nestoi';

/**
 * Note:
 * Don't do like below, It will cause export from user.schema will showing in swagger models too
 * 
 * Here: export * from './user.schema';
 */

export const q = Joi.string().description('Search string');

export const page = Joi.number()
  .min(1)
  .description('Page number for pagination.')
  .example(1);

export const pageSize = Joi.number()
  .min(1)
  .description('Page size for pagination.')
  .example(10);

export const id = Joi.number().min(1).description('Id of record.').example(1);

export const name = Joi.string()
  .min(2)
  .max(20)
  .description('Name')
  .example('John Duo');

export const email = Joi.string()
  .email()
  .min(2)
  .max(20)
  .description('Email')
  .example('example@gmail.com');

export const password = Joi.string()
  .min(6)
  .max(10)
  .description('Password')
  .example('123456');

export const gender = Joi.string()
  .valid('male', 'female')
  .description('Gender')
  .example('male');

export const items = Joi.array()
  .items(
    Joi.object({
      id: Joi.number().required(),
      name: Joi.string().required(),
      qty: Joi.number().required(),
    }),
  )
  .description('Items list')
  .example([{ id: 1, name: 'Product A', qty: 10 }]);

export const dob = Joi.string()
  .isoDate()
  .description('Date of birth')
  .example('2000-01-25');

export const isActive = Joi.boolean().description('Is Active').example(true);
```

## Conclusion

Nestoi is the perfect tool for developers looking to quickly set up an Express application with built-in security features and automatic API documentation. With its intuitive design and powerful features, Nestoi enhances productivity and ensures your application follows industry best practices.

## Contributing

We welcome contributions from the community to help make Nestoi even better. If you are interested in contributing, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

Please make sure your code adheres to our coding standards and includes appropriate tests. Feel free to open issues for suggestions, bug reports, or general discussion.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.