import { Request, Response, NextFunction } from 'express';
import { devUtils } from '@/tools/utils/devUtils';
import onFinished from 'on-finished';
import { helperUtils, StringDecoration } from '@/tools/utils/helperUtils';

export default {
    logRequestStart(req: Request, res: Response, next: NextFunction) {
        devUtils.log();
        devUtils.log(' +--------------------------+ ', StringDecoration.CONTENT_BOUNDARY);
        devUtils.log(' |   New Incoming Request   | ', StringDecoration.CONTENT_BOUNDARY);
        devUtils.log(' +--------------------------+ ', StringDecoration.CONTENT_BOUNDARY);
        devUtils.log();
        devUtils.log('Request Body:', StringDecoration.HIGHLIGHT, StringDecoration.UNDERLINE);
        devUtils.log(`${helperUtils.getPrettyJSON(req.body)}`, StringDecoration.HIGHLIGHT);
        devUtils.log();

        next();
    },

    logRequestEnd(req: Request, res: Response, next: NextFunction) {
        var originalSend = res.send;

        let responseBody: any;
        res.send = function sendOverride(body?) {
            const response = originalSend.call(this, body);
            responseBody = body;

            return response;
        };

        onFinished(res, (err, res) => {
            devUtils.log();
            devUtils.log('Response Body:', StringDecoration.HIGHLIGHT, StringDecoration.UNDERLINE);
            devUtils.log(
                `${helperUtils.getPrettyJSON(JSON.parse(responseBody))}`,
                StringDecoration.HIGHLIGHT
            );
            devUtils.log();
            devUtils.log(' +-------------------------+ ', StringDecoration.CONTENT_BOUNDARY);
            devUtils.log(' |      Request Ended      | ', StringDecoration.CONTENT_BOUNDARY);
            devUtils.log(' +-------------------------+ ', StringDecoration.CONTENT_BOUNDARY);
            devUtils.log();
        });

        next();
    },
};
