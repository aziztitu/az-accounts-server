import { Request, Response, NextFunction } from 'express';
import { ApiResponseData } from '../controllers/apiController';
import { UserRole } from '../models/user';

const authMiddlewares = {
    allowOnlyWithToken(req: Request, res: Response, next: NextFunction) {
        if (req.apiTokenPayload) {
            next();
        } else {
            const resData: ApiResponseData = {
                success: false,
                message: 'Authorization error. Token Required.',
            };

            res.json(resData);
        }
    },
    allowOnlyAdmin(req: Request, res: Response, next: NextFunction) {
        if (req.apiTokenPayload && req.apiTokenPayload.userData.role === UserRole.ADMIN) {
            next();
        } else {
            const resData: ApiResponseData = {
                success: false,
                message: 'Authorization error. Insufficient permissions.',
            };

            res.json(resData);
        }
    },
};

export default authMiddlewares;
