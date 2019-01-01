import { Router, Request, Response } from 'express';
import { ApiResponseData } from '@/controllers/apiController';
import { AccountModel, Account } from '@/models/Account';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import serverConfig from '@/tools/serverConfig';
import { ApiTokenPayload } from '../../tools/types/auth/index';
import { apiMiddlewares } from '../../middlewares/apiMiddlewares';

export const authController = Router();

authController.post('/login', login);
authController.post('/signup', apiMiddlewares.disallowFeature, signup);
authController.post('/validateAPIToken', validateApiToken);
authController.post('/logoutSession', logoutSession);

/**
 * Validates account credentials, and sends back a JWT (JSON Web Token).
 */
function login(req: Request, res: Response) {
    let resData: ApiResponseData;

    const { username, password, storeApiTokenInSession } = req.body;

    if (!username || !password) {
        resData = {
            success: false,
            message: `${!username ? 'Username' : 'Password'} is required!`,
        };

        res.json(resData);
        return;
    }

    AccountModel.findOne({ username: username })
        .select('username password role')
        .exec((err, account) => {
            if (err) {
                resData = {
                    success: false,
                    message: `Error retrieving the account`,
                    errorReport: err,
                };

                res.json(resData);
            } else {
                if (!account) {
                    resData = {
                        success: false,
                        message: `Invalid Username`,
                    };

                    res.json(resData);
                } else {
                    bcrypt.compare(password, account.password, (err, same) => {
                        if (err) {
                            resData = {
                                success: false,
                                message: `Error validating password`,
                                errorReport: err,
                            };
                        } else {
                            if (!same) {
                                resData = {
                                    success: false,
                                    message: `Invalid Password`,
                                };
                            } else {
                                const payload: ApiTokenPayload = {
                                    accountData: {
                                        id: account.id,
                                        username: account.username,
                                        role: account.role,
                                    },
                                };
                                const apiToken = jwt.sign(
                                    payload,
                                    serverConfig.auth.jwt.secret,
                                    serverConfig.auth.jwt.options
                                );

                                resData = {
                                    success: true,
                                    message: `Login Successful`,
                                };

                                if (storeApiTokenInSession) {
                                    if (req.session) {
                                        req.session.apiToken = apiToken;
                                    } else {
                                        resData = {
                                            success: false,
                                            message: `Error storing api token`,
                                        };
                                    }
                                } else {
                                    if (req.session) {
                                        req.session.apiToken = undefined;
                                    }
                                    resData.apiToken = apiToken;
                                }
                            }
                        }

                        res.json(resData);
                    });
                }
            }
        });
}

/**
 * Creates new account
 */
async function signup(req: Request, res: Response) {
    const { username, password, name } = req.body;

    const resData: ApiResponseData = await AccountModel.addNewAccount({
        username: username,
        password: password,
        name: name,
    } as Account);

    res.json(resData);
}

/**
 * Validates the API Token in the current request.
 */
async function validateApiToken(req: Request, res: Response) {
    let resData = {
        success: false,
        message: 'Your API Token is invalid',
    };

    if (req.apiTokenPayload) {
        const account = await AccountModel.findById(req.apiTokenPayload.accountData.id).exec();
        if (account) {
            resData = {
                success: true,
                message: 'Your API Token is valid',
            };
        }
    }

    res.json(resData);
}

/**
 * Removes the API Token, if it exists, from the session.
 */
function logoutSession(req: Request, res: Response) {
    if (req.session) {
        req.session.apiToken = undefined;
    }

    const resData: ApiResponseData = {
        success: true,
        message: 'Successfully logged out from the session',
    };

    res.json(resData);
}
