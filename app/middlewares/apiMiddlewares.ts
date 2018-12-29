import { Request, Response, NextFunction } from 'express';
import { ApiResponseData } from '@/controllers/apiController';

export const apiMiddlewares = {
    disallowFeature(req: Request, res: Response, next: NextFunction) {
        const resData: ApiResponseData = {
            success: false,
            message: 'This feature is currently not allowed. Contact the admin for more details.',
        };

        res.json(resData);
    },
};
