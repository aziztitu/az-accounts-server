import { Router, Request, Response, NextFunction } from 'express';
import { usersController } from './users/usersController';
import { authController } from './auth/authController';
import jwt from 'jsonwebtoken';
import serverConfig, { ServerMode } from '@/tools/serverConfig';
import { ApiTokenPayload } from '../tools/types/auth/index';
import authMiddlewares from '@/middlewares/authMiddlewares';
import { devUtils } from '@/tools/utils/devUtils';
import { helperUtils, StringDecoration } from '@/tools/utils/helperUtils';

export type ApiResponseData = {
    success: boolean;
    message: string;
    errorReport?: object;
} & { [key: string]: any };

export const apiController: Router = Router();

apiController.use(extractApiToken);

apiController.use('/auth', authController);
apiController.use('/users', authMiddlewares.allowOnlyWithToken, usersController);

/**
 * Extracts ApiToken from Authorization Header and puts the ApiTokenPayload on the request for further handlers to use.
 */
function extractApiToken(req: Request, res: Response, next: NextFunction) {
    req.apiTokenPayload = undefined;

    let apiToken;

    devUtils.log();

    // Try to extract apiToken from the http authorization header
    const authHeader = req.headers.authorization;
    if (authHeader) {
        // The authHeader will be in this format: Bearer <token>
        const authHeaderWords = authHeader.split(' ');
        if (authHeaderWords.length >= 2) {
            apiToken = authHeaderWords[1];

            devUtils.log('Found api token in auth header');
        }
    }

    // Try to extract apiToken from the session
    if (!apiToken) {
        devUtils.log('Cannot find api token in auth header! Checking session instead...');

        if (req.session && req.session.apiToken) {
            apiToken = req.session.apiToken;
            devUtils.log('Found api token in session');
        } else {
            devUtils.log('Cannot find api token in session!');
        }
    }

    devUtils.log();

    if (apiToken) {
        jwt.verify(
            apiToken,
            serverConfig.auth.jwt.secret,
            serverConfig.auth.jwt.options,
            (err, decodedPayload) => {
                if (err) {
                    console.log(`Error during ApiToken Verification: ${err.stack}`);
                } else {
                    devUtils.log('Decoded API Token Payload:', StringDecoration.UNDERLINE);
                    devUtils.log(`${JSON.stringify(decodedPayload, null, 4)}\n`);
                    req.apiTokenPayload = decodedPayload as ApiTokenPayload;
                }
                next();
            }
        );
    } else {
        next();
    }
}
