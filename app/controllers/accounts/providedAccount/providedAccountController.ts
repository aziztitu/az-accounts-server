import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponseData } from '../../apiController';
import { AccountModel, Account, AccountRole, ReservedUsername } from '../../../models/Account';
import Lodash from 'lodash';
import { helperUtils } from '../../../tools/utils/helperUtils';
import bcrypt from 'bcrypt';

export const providedAccountController = Router({ mergeParams: true });

providedAccountController.use(validateProvidedAccount);

providedAccountController.get('/info/basic', getBasicInfo);
providedAccountController.put('/info', allowOnlySelfOrAdmin, updateAccountInfo);
providedAccountController.put('/password', allowOnlySelfOrAdmin, updatePassword);

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

    const loggedInAccountData = req.apiTokenPayload!.accountData;
    const providedAccount = req.routeData.accounts.providedAccount!;

    let { username, name, role, password } = req.body;

    if (username && username !== providedAccount.username) {
        username = username.trim();

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
            res.json(apiResponseData);
            return;
        }

        providedAccount.username = username;
    }

    if (name && name !== providedAccount.name) {
        name = name.trim();

        if (name === '') {
            apiResponseData = {
                success: false,
                message: 'Name is empty',
            };
            res.json(apiResponseData);
            return;
        }

        providedAccount.name = name;
    }

    if (role && role !== providedAccount.role) {
        if (!helperUtils.enumContains(AccountRole, role)) {
            apiResponseData = {
                success: false,
                message: `Invalid role provided.`,
            };
            res.json(apiResponseData);
            return;
        }

        if (loggedInAccountData.role !== AccountRole.Admin) {
            apiResponseData = {
                success: false,
                message: `You are not authorized to modify this user's role. Contact Admin for more info.`,
            };
            res.json(apiResponseData);
            return;
        }

        if (providedAccount.role === AccountRole.Admin) {
            let adminCount = await AccountModel.count({ role: AccountRole.Admin }).exec();

            if (adminCount <= 1) {
                apiResponseData = {
                    success: false,
                    message: `This is the only admin account. Hence you cannot change the role for this account.`,
                };
                res.json(apiResponseData);
                return;
            }
        }

        providedAccount.role = role;
    }

    if (password) {
        password = password.trim();
        if (password !== '') {
            if (loggedInAccountData.role !== AccountRole.Admin) {
                apiResponseData = {
                    success: false,
                    message: `You don't have the permission to change password for this user.`,
                };
                res.json(apiResponseData);
                return;
            }

            if (loggedInAccountData.id === providedAccount.id) {
                apiResponseData = {
                    success: false,
                    message: `You cannot force update your own password. Please change your password through 'My Account'`,
                };
                res.json(apiResponseData);
                return;
            }

            providedAccount.password = password;
        }
        // If the password is empty, we ignore it (caz it means, no new password was force updated).
    }

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

    res.json(apiResponseData);
}

async function updatePassword(req: Request, res: Response, next: NextFunction) {
    let apiResponseData: ApiResponseData = {
        success: false,
        message: 'Unknown Error',
    };

    const loggedInAccountData = req.apiTokenPayload!.accountData;
    const providedAccount = req.routeData.accounts.providedAccount!;

    let { curPassword, newPassword } = req.body;

    if (!curPassword || !newPassword) {
        apiResponseData = {
            success: false,
            message: 'Password not provided',
        };
        res.json(apiResponseData);
        return;
    }

    newPassword = newPassword.trim();
    if (newPassword === '') {
        apiResponseData = {
            success: false,
            message: 'Password is empty',
        };
        res.json(apiResponseData);
        return;
    }

    try {
        const match = await bcrypt.compare(curPassword, providedAccount.password);
        if (match) {
            providedAccount.password = newPassword;

            try {
                await providedAccount.save();
                apiResponseData = {
                    success: true,
                    message: 'Password updated successfully',
                };
            } catch (err) {
                if (err) {
                    apiResponseData = {
                        success: false,
                        message: 'Could not update the password',
                        errorReport: err,
                    };
                }
            }
        } else {
            apiResponseData = {
                success: false,
                message: 'Incorrect current password',
            };
        }
    } catch (err) {
        apiResponseData = {
            success: false,
            message: 'Error validating current password',
            errorReport: err,
        };
    }

    res.json(apiResponseData);
}
