import { ApiTokenPayload } from '../auth';
import { Response } from 'express';
import { InstanceType } from 'typegoose';
import { Account } from '../../../models/Account';

declare global {
    namespace Express {
        interface Request {
            apiTokenPayload?: ApiTokenPayload;
            routeData: {
                accounts: {
                    providedAccount?: InstanceType<Account>;
                };
            };
        }

        interface SessionData {
            apiToken?: string;
        }
    }
}
