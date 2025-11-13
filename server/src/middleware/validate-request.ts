import type { Request, RequestHandler } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { ZodError, type ZodIssue, type ZodTypeAny } from 'zod';

type SchemaMap = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export const validateRequest =
  (schema: SchemaMap): RequestHandler =>
  (req, _res, next) => {
    try {
      parseAndAssign(req, schema);
      next();
    } catch (error) {
      next(error);
    }
  };

const parseAndAssign = (
  req: Request<ParamsDictionary, unknown, unknown, ParsedQs>,
  schema: SchemaMap,
) => {
  const issues: ZodIssue[] = [];

  const { body: bodySchema, query: querySchema, params: paramsSchema } = schema;

  if (bodySchema) {
    const bodyResult = bodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      issues.push(...bodyResult.error.issues);
    } else {
      req.body = bodyResult.data;
    }
  }

  if (querySchema) {
    const queryResult = querySchema.safeParse(req.query);
    if (!queryResult.success) {
      issues.push(...queryResult.error.issues);
    } else {
      req.query = queryResult.data as ParsedQs;
    }
  }

  if (paramsSchema) {
    const paramsResult = paramsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      issues.push(...paramsResult.error.issues);
    } else {
      req.params = paramsResult.data as ParamsDictionary;
    }
  }

  if (issues.length > 0) {
    const error = new ZodError(issues);
    throw error;
  }
};
