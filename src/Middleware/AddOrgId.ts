import * as express from 'express';
import { request, response } from "express";
import { Request, Response, NextFunction } from 'express';

export const addOrgId = async (req: any, res: Response, next: NextFunction) => {

    if (req.user) {
        if (req.user["https://api.blueribbon.io/orgId"]) {
            req.user.orgId = req.user["https://api.blueribbon.io/orgId"]
            next()
        } else {
        res.status(404).json('Users org info is missing from request')
        }
    } else {
        res.status(404).json('No user')
    }
}