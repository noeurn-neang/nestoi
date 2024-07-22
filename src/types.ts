import { RequestHandler } from 'express';

export type IDataType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'array'
  | 'object'
  | null;

export interface IRouteSchema {
  body?: string[];
  query?: string[];
  params?: string[];
}

export interface ISchema {
  type: IDataType;
  example?: any;
  description?: string;
  min?: number;
  max?: number;
  valid?: string[];
}

export interface IRouteHandler {
  summary?: string;
  schema?: IRouteSchema;
  handler?: RequestHandler;
  middlewares?: RequestHandler[];
}

export interface IRouteMethods {
  get?: IRouteHandler;
  post?: IRouteHandler;
  put?: IRouteHandler;
  delete?: IRouteHandler;
  patch?: IRouteHandler;
  [method: string]: IRouteHandler | undefined;
}

export interface IRoutes {
  [path: string]: IRouteMethods;
}

export interface IRouteTag {
  name: string;
  description: string;
  routes: IRoutes;
  middlewares?: RequestHandler[];
}

export interface IRateLimit {
  limitTime: number;
  limit: number;
}

// Swagger
export interface SecuritySchemes {
  [key: string]: SecurityScheme;
}

type SecurityScheme =
  | ApiKeySecurityScheme
  | HttpSecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme;

interface ApiKeySecurityScheme {
  type: 'apiKey';
  name: string;
  in: 'query' | 'header' | 'cookie';
  description?: string;
}

interface HttpSecurityScheme {
  type: 'http';
  scheme: 'basic' | 'bearer' | string;
  bearerFormat?: string;
  description?: string;
  in: 'query' | 'header' | 'cookie';
}

interface OAuth2SecurityScheme {
  type: 'oauth2';
  flows: OAuthFlows;
  description?: string;
}

interface OpenIdConnectSecurityScheme {
  type: 'openIdConnect';
  openIdConnectUrl: string;
  description?: string;
}

interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: { [scope: string]: string };
}

export interface ISwagger {
  disabled?: boolean;
  servers?: string[];
  securitySchemes?: SecuritySchemes;
  openapiVersion?: string;
}

/**
 * Configuration for nestoi
 *
 * @param {IRateLimit} rateLimit
 * @param middlewares {RequestHandler[]} - Number of request allowing in limit minute period
 */
export interface IAppConfig {
  title?: string;
  description?: string;
  version?: string;
  routeTags?: IRouteTag[];
  routePrefix?: string;
  joiSchemas?: Record<string, any>;
  rateLimit?: IRateLimit;
  middlewares?: RequestHandler[];
  logFormat?: 'combined' | 'common' | 'dev' | 'short' | 'tiny';
  swagger?: ISwagger;
}
