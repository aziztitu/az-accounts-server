import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponseData } from '../../apiController';
import { AccountModel, Account, AccountRole, ReservedUsername } from '../../../models/Account';
import Lodash from 'lodash';

export const providedAccountController = Router({ mergeParams: true });

providedAccountController.use(validateProvidedAccount);

providedAccountController.get('/info/basic', getBasicInfo);
providedAccountController.put('/info', allowOnlySelfOrAdmin, updateAccountInfo);

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

function allowOnlySelfOrAdmin(req: Request, res: Response, next: NextFunction) {
    if (
        req.apiTokenPayload!.accountData.id === req.routeData.accounts.providedAccount!.id ||
        req.apiTokenPayload!.accountData.role === AccountRole.Admin
    ) {
        next();
        return;
    }

    res.json({
        success: false,
        message: `You don't have the permission to perform this action`,
    } as ApiResponseData);
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

async function updateAccountInfo(req: Request, res: Response, next: NextFunction) {
    let apiResponseData: ApiResponseData = {
        success: false,
        message: 'Unknown Error',
    };

    const { username, name } = req.body;

    if (username && name) {
        const providedAccount = req.routeData.accounts.providedAccount!;

        let isUsernameAllowed = true;

        for (const reservedUsernameId in ReservedUsername) {
            if (username === ReservedUsername[reservedUsernameId]) {
                switch (username) {
                    case ReservedUsername.Admin:
                        if (providedAccount.role === AccountRole.Admin) {
                            continue;
                        }
                        break;
                }

                isUsernameAllowed = false;
                break;
            }
        }

        if (!isUsernameAllowed) {
            apiResponseData = {
                success: false,
                message: 'This username is reserved. Try a different username',
            };
        } else {
            providedAccount.username = username;
            providedAccount.name = name;

            try {
                await providedAccount.save();
                apiResponseData = {
                    success: true,
                    message: 'Account info updated successfully',
                };
            } catch (err) {
                apiResponseData = {
                    success: false,
                    message: 'Error updating account info',
                    errorReport: err,
                };
            }
        }
    } else {
        apiResponseData = {
            success: false,
            message: 'Please provide all required data.',
        };
    }

    res.json(apiResponseData);
}
