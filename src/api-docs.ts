import { Router } from 'express';
import Joi from 'joi';
import {
  IAppConfig,
  IRouteMethods,
  IRouteSchema,
  IRouteTag,
  ISchema,
  SecuritySchemes,
} from './types';
import { joiToJson } from './json-joi-converter';
import { transformPath, validateBody, validateQuery } from './utils';

/**
 * Generate swagger body propterty
 * For swagger we set only type and example,
 * other is no useful in swagger.
 * It's useful only in joi validation
 *
 * @param {ISchema} parameterSchema
 *
 * @returns
 */
const generateRequestBody = (parameterSchema: ISchema) => {
  const { type, example } = parameterSchema;
  return {
    type,
    example,
  };
};

/**
 * Generate swagger parameter
 *
 * @param {ISchema} parameterSchema
 * @param {string} parameterName - Exmaple: name, age, gender
 * @param {string} parameterTypeIn - What place to put this parameter in query string or params
 * @param {boolean} isRequired
 *
 * @returns
 */
const generateParameter = (
  parameterSchema: ISchema,
  parameterName: string,
  parameterTypeIn: string,
  isRequired: boolean,
) => {
  return {
    name: parameterName,
    in: parameterTypeIn,
    required: isRequired,
    explode: true,
    description: parameterSchema.description,
    schema: {
      type: parameterSchema.type,
      example: parameterSchema.example,
    },
  };
};

/**
 * Setup routes for express method, url, handlers
 *
 * @param {enum} method - post, put, delete, patch and for default is get
 * @param {string} routePath - Example: /users or /product/list
 * @param {RequestHandler} handlers  - Can be Middleware, Validations, Controller
 * @param {Router} router
 *
 * @returns void
 */
const setupExpressRouter = (
  method: any,
  routePath: string,
  handlers: any,
  router: Router,
) => {
  const methodString = `${method}`;
  switch (methodString) {
    case 'post':
      router.post(routePath, ...handlers);
      break;
    case 'put':
      router.put(routePath, ...handlers);
      break;
    case 'delete':
      router.delete(routePath, ...handlers);
      break;
    case 'patch':
      router.patch(routePath, ...handlers);
      break;
    default:
      router.get(routePath, ...handlers);
  }
};

/**
 * Get swagger tags and routes from routeTags array
 *
 * @param {IRouteTag[]} routeTags Root routes, it's like a group of route
 * @param {Record<string, any>} parameterSchemas Parameter schema it's converted from joi schema (below param) for use in swagger
 * @param {Record<string, any>} joiSchemas Joi schema use in express validation middlewares
 * @param {SecuritySchemes} securitySchemes Security schemes can been bearerAuth or apiKey for authentication
 *
 * @returns
 */
const routesExtractor = (
  routeTags: IRouteTag[],
  parameterSchemas: Record<string, any>,
  joiSchemas: Record<string, any>,
  securitySchemes: SecuritySchemes,
) => {
  const tags: any = [];
  const paths: any = {};
  const router: Router = Router();
  (routeTags || []).forEach((rt: IRouteTag) => {
    const { name, description, routes } = rt;
    tags.push({
      name,
      description,
    });

    Object.keys(routes).forEach((key) => {
      const route: IRouteMethods = routes[key];

      // Loop through methods: get, post, delete, patch
      Object.keys(route).forEach((method) => {
        const { handler, middlewares, schema, summary } = route[method]!;
        if (!paths[key]) paths[key] = {};
        if (!paths[key][method]) paths[key][method] = {};

        /**
         * Define parameters, requestBody, joi validation
         */
        let parameters: any = [];
        let requestBody: any = {};
        let joiParameters: any = {};
        let joiRequestBody: any = {};
        if (schema) {
          let requestBodyProperties: any = {};
          Object.keys(schema).forEach((schemaKey) => {
            const routeSchema = schemaKey as keyof IRouteSchema;
            const fields = schema[routeSchema];

            /**
             * Check if schema key is params we need to put it in path
             * Bec in swagger we call path but in node express we call params
             */
            const parameterTypeIn = schemaKey === 'params' ? 'path' : schemaKey;

            /**
             * Loop all fields add add it to parameters if routeSchema = params or query
             * and add it to requestBody if routeSchema = body
             */
            fields?.forEach((field: string) => {
              // Check if have sign (*) this field is required
              const isRequired = field.indexOf('*') > -1;

              /**
               * Remove sign (*) from field
               * and get field information detail from schemas list
               * If not found assign default with type string
               * */
              const parameterName = field.replace('*', '');
              const parameterSchema: ISchema = parameterSchemas[
                parameterName
              ] || { type: 'string' };
              let joiSchema = joiSchemas[parameterName];

              /**
               * By default all joi schema is optional
               * So we need to check if field is required by this sign (*)
               */
              if (isRequired && joiSchema) joiSchema = joiSchema.required();

              if (routeSchema === 'body') {
                requestBodyProperties[parameterName] =
                  generateRequestBody(parameterSchema);
                joiRequestBody[parameterName] = joiSchema;
              } else {
                parameters.push(
                  generateParameter(
                    parameterSchema,
                    parameterName,
                    parameterTypeIn,
                    isRequired,
                  ),
                );

                // We validate only body and query string
                // For param no need bec it's already included in url path
                if (routeSchema === 'query') {
                  joiParameters[parameterName] = joiSchema;
                }
              }
            });

            if (routeSchema === 'body') {
              requestBody = {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: requestBodyProperties,
                    },
                  },
                },
                required: true,
              };
            }
          });
        }

        // Setup swagger api routes
        paths[key][method] = {
          tags: [name],
          summary,
          parameters,
          requestBody,
          responses: {
            '400': {
              description: 'Validation or execution failed',
            },
            '401': {
              description: 'Unauthorized',
            },
          },
          security: Object.keys(securitySchemes).map((securityKey: string) => {
            const security: any = {};
            security[securityKey] = [];
            return security;
          }),
        };

        const validationMiddlewares = [];

        // Add query validation middleware
        if (Object.keys(joiParameters).length > 0) {
          validationMiddlewares.push(validateQuery(Joi.object(joiParameters)));
        }

        // Add query validation middleware
        if (Object.keys(joiRequestBody).length > 0) {
          validationMiddlewares.push(validateBody(Joi.object(joiRequestBody)));
        }

        // Setup express routes
        const routePath = transformPath(key);
        const handlers = [
          ...validationMiddlewares,
          ...(rt.middlewares || []),
          ...(middlewares || []),
        ];
        if (handler) handlers.push(handler);
        setupExpressRouter(method, routePath, handlers, router);
      });
    });
  });

  return {
    tags,
    paths,
    router: router,
  };
};

/**
 * Extract app config for build swagger document and express router
 *
 * @param {IAppConfig} configs whole application configurations
 *
 * @returns {obect: {apiDocs, router}}
 */
export const extractAppConfig = (
  configs: IAppConfig,
): { apiDocs: any; router: Router } => {
  const { routeTags, joiSchemas, swagger } = configs;
  const { servers } = swagger!;

  let securitySchemes: SecuritySchemes = swagger!.securitySchemes || {};
  if (Object.keys(securitySchemes).length === 0) {
    securitySchemes = {};
    securitySchemes.bearerAuth = {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    };
  }

  // Convert joi schema to json schema
  const { properties } = joiToJson(Joi.object(joiSchemas));

  const { tags, paths, router } = routesExtractor(
    routeTags || [],
    properties || {},
    joiSchemas || {},
    securitySchemes,
  );

  return {
    apiDocs: {
      openapi: swagger?.openapiVersion || '3.0.3',
      info: {
        title: configs.title || 'Restful API Documents',
        description: configs.description,
        version: configs.version || '1.0.0',
      },
      servers: (servers || []).map((url) => ({
        url,
      })),
      tags,
      paths,
      components: {
        schemas: {
          ...properties,
        },
        securitySchemes,
      },
    },
    router,
  };
};
