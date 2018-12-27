import { Router, Request, Response } from 'express';
import { UserModel, User } from '@/models/user';
import { ApiResponseData } from '@/controllers/apiController';
import authMiddlewares from '@/middlewares/authMiddlewares';

export const usersController: Router = Router();

usersController
    .route('/')
    .get(authMiddlewares.allowOnlyAdmin, getAllUsers)
    .post(addNewUser);

/**
 * Method: GET
 * Retrieves a list of users
 */
function getAllUsers(req: Request, res: Response) {
    let resData: ApiResponseData;

    UserModel.find()
        .select('username name role')
        .sort({ _id: 1 })
        .exec((err, users) => {
            if (err) {
                resData = {
                    success: false,
                    message: `Error retrieving users`,
                    errorReport: err,
                };

                console.log(`${resData.message}: ${err.message}`);
            } else {
                resData = {
                    success: true,
                    message: `Retrieved users successfully`,
                    users: users,
                };
            }

            res.json(resData);
        });
}

/**
 * Method: POST
 * Creates a new user
 */
async function addNewUser(req: Request, res: Response) {
    const { username, password, name } = req.body;

    const resData: ApiResponseData = await UserModel.addNewUser({
        username: username,
        password: password,
        name: name,
    } as User);

    res.json(resData);
}
