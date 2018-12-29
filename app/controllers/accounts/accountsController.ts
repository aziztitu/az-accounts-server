import { Router, Request, Response, NextFunction } from 'express';
import { AccountModel, Account } from '@/models/Account';
import { ApiResponseData } from '@/controllers/apiController';
import authMiddlewares from '@/middlewares/authMiddlewares';
import { providedAccountController } from './providedAccount/providedAccountController';
import { AccountRole } from '../../models/Account';

export const accountsController: Router = Router();

accountsController.use(authMiddlewares.allowOnlyWithToken);

accountsController.get('/all', authMiddlewares.allowOnlyAdmin, getAllAccounts);
accountsController.post('/new', authMiddlewares.allowOnlyAdmin, addNewAccount);

accountsController.get('/roles', getAllRoles);

accountsController.use('/:accountId', providedAccountController);

/**
 * Method: GET
 * Retrieves a list of accounts
 */
function getAllAccounts(req: Request, res: Response) {
    let resData: ApiResponseData;

    AccountModel.find()
        .select('username name role')
        .sort({ _id: 1 })
        .exec((err, accounts) => {
            if (err) {
                resData = {
                    success: false,
                    message: `Error retrieving accounts`,
                    errorReport: err,
                };

                console.log(`${resData.message}: ${err.message}`);
            } else {
                resData = {
                    success: true,
                    message: `Retrieved accounts successfully`,
                    accounts: accounts,
                };
            }

            res.json(resData);
        });
}

/**
 * Method: POST
 * Creates a new account
 */
async function addNewAccount(req: Request, res: Response) {
    const { username, password, name } = req.body;

    const resData: ApiResponseData = await AccountModel.addNewAccount({
        username: username,
        password: password,
        name: name,
    } as Account);

    res.json(resData);
}

function getAllRoles(req: Request, res: Response, next: NextFunction) {
    const roles = [];
    for (const roleId in AccountRole) {
        roles.push({
            name: roleId,
            value: AccountRole[roleId],
        });
    }

    res.json({
        success: true,
        message: 'Successfully retrieved the roles',
        roles: roles,
    } as ApiResponseData);
}
