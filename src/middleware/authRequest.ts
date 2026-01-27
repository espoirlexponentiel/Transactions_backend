// src/middleware/authRequest.ts
import { Request } from "express";
import { UserRole } from "../types/auth";
import { ParsedQs } from "qs";

// On définit AuthRequest correctement avec les génériques d'Express
export interface AuthRequest<
    BodyType = any,
    ParamsType extends Record<string, any> = Record<string, any>,
    QueryType = ParsedQs
> extends Request<ParamsType, any, BodyType, QueryType> {
    user?: {
        id: number;
        role: UserRole;
        name: string;
    };
}
