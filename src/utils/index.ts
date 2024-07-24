import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

/**
 * Tranfor path of swagger route to express route
 *
 * @param {string} path - /users/{id}
 *
 * @returns {string} - /users/:id
 */
export const transformPath = (path: string): string => {
  return path.replace(/{(\w+)}/g, ':$1');
};

/**
 * Validate query request using Joi
 *
 * @param {Joi.ObjectSchema<any>} schema
 *
 * @returns
 */
export const validateQuery = (schema: Joi.ObjectSchema<any>) => {
  return function (req: Request, res: Response, next: NextFunction) {
    const { error } = schema.validate(req.query);
    if (error) {
      res.status(400).json({
        success: 0,
        msg: error.message,
      });
    } else {
      next();
    }
  };
};

/**
 * Validate body request using Joi
 *
 * @param {Joi.ObjectSchema<any>} schema
 *
 * @returns
 */
export const validateBody = (schema: Joi.ObjectSchema<any>) => {
  return function (req: Request, res: Response, next: NextFunction) {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: 0,
        msg: error.message,
      });
    } else {
      next();
    }
  };
};
