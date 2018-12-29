import { Request, Response, NextFunction } from 'express';
import { devUtils } from '@/tools/utils/devUtils';
import onFinished from 'on-finished';
import { helperUtils, StringDecoration } from '@/tools/utils/helperUtils';
import serverConfig from '@/tools/serverConfig';

import colors from 'colors/safe';

const wait = require('wait-for-stuff');

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
                `${helperUtils.getPrettyJSON(JSON.parse(responseBody || '{}'))}`,
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

    fakeResponseDelay(req: Request, res: Response, next: NextFunction) {
        const fakeDelay = serverConfig.http.fakeDelayOrigins.some((fakeDelayOrigin) => {
            if (fakeDelayOrigin === req.headers.origin) {
                return true;
            }

            return false;
        });

        if (fakeDelay) {
            var originalSend = res.send;

            res.send = function sendOverride(body?) {
                console.log(colors.yellow('Faking Response Delay...'));
                wait.for.time(serverConfig.http.fakeDelayTime);

                return originalSend.call(this, body);
            };
        }

        next();
    },
};
