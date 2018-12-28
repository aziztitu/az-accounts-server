import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponseData } from '../../apiController';
import { AccountModel, Account } from '../../../models/Account';
import Lodash from 'lodash';

export const providedAccountController = Router({ mergeParams: true });

providedAccountController.use(validateProvidedAccount);

providedAccountController.get('/info/basic', getBasicInfo);

/**
 * (Middleware)
 * Validates the provided account from the url. If account is valid, assigns the account id in the route data for future route handlers.
 */
function validateProvidedAccount(req: Request, res: Response, next: NextFunction) {
    let accountId = req.params.accountId;

    if (!accountId) {
        res.json({
            success: false,
            message: 'Account Not Provided',
        } as ApiResponseData);

        return;
    }

    if (accountId === 'me') {
        accountId = req.apiTokenPayload!.accountData.id;
    }

    AccountModel.findById(accountId, (err, acc) => {
        if (!err && acc) {
            req.routeData.accounts.providedAccount = acc;
            next();
        } else {
            res.json({
                success: false,
                message: 'Account Not Found',
            } as ApiResponseData);

            return;
        }
    });
}

/**
 * Retrieves the basic information about the provided account.
 */
function getBasicInfo(req: Request, res: Response, next: NextFunction) {
    const apiResponseData = {
        success: true,
        message: 'Basic info collected successfully',
        accountInfo: Lodash.pick(req.routeData.accounts.providedAccount, [
            'id',
            'username',
            'name',
            'role',
        ]),
    } as ApiResponseData;

    res.json(apiResponseData);
}
