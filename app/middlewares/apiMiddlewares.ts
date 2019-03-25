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
    multipartPreprocessor(req: Request, res: Response, next: NextFunction) {
        let contentType = req.header('content-type');
        console.log(`Content Type: ${contentType}`);

        if (contentType && contentType.startsWith('multipart/form-data')) {
            console.log('Multipart data found');
            console.log(req.body);
            if (req.body._default) {
                console.log('Default found');
                let _default = JSON.parse(req.body._default);
                for (let key in _default) {
                    console.log(key);

                    req.body[key] = _default[key];
                }
            }
        }

        next();
    },
};
