import { Typegoose, prop, staticMethod, ModelType, pre, InstanceType } from 'typegoose';
import bcrypt from 'bcrypt';
import { MongooseDocument } from 'mongoose';
import serverConfig from '@/tools/serverConfig';
import { ApiResponseData } from '@/controllers/apiController';

export enum AccountRole {
    Admin = 'admin',
    User = 'user',
}

export const ReservedUsernames = ['admin'];

@pre('save', function(next) {
    const account = this as MongooseDocument & Account;

    if (account.isModified('password')) {
        // console.log("Hashing password...");

        bcrypt.hash(account.password, serverConfig.mongo.passwordHash.saltingRounds, (err, hash) => {
            if (err) {
                console.log('Error hashing password!');
                next(err);
            } else {
                account.password = hash;
                next();
            }
        });
    } else {
        next();
    }
})
export class Account extends Typegoose {
    @prop({ required: true, unique: true })
    username!: string;

    @prop({ required: true })
    password!: string;

    @prop({ required: true })
    name!: string;

    @prop({ required: true, enum: AccountRole, default: AccountRole.User })
    role!: AccountRole;

    @staticMethod
    static addAdminIfMissing(this: ModelType<Account> & Account) {
        this.findOne({ role: AccountRole.Admin }, (err, account) => {
            if (err) {
                console.log('Error retrieving admin account!\n');
            } else {
                if (!account) {
                    console.log('Admin Account is missing...');
                    console.log('Creating Admin Account...');

                    const adminAccountModel = new AccountModel({
                        username: 'admin',
                        password: serverConfig.mongo.defaultAdminPassword,
                        name: 'Admin',
                        role: AccountRole.Admin,
                    } as Account);

                    adminAccountModel.save(err => {
                        if (err) {
                            console.log('Error creating admin account!\n');
                        } else {
                            console.log('Admin account created successfully!\n');
                        }
                    });
                }
            }
        });
    }

    @staticMethod
    static addNewAccount(this: ModelType<Account> & Account, accountDoc: Account) {
        return new Promise<ApiResponseData>((resolve, reject) => {
            let resData: ApiResponseData;

            const newAccountModel = new AccountModel(accountDoc);

            if (ReservedUsernames.indexOf(accountDoc.username) != -1) {
                resData = {
                    success: false,
                    message: `Username '${
                        accountDoc.username
                    }' is reserved. Use a different username.`,
                };

                resolve(resData);
                return;
            }

            newAccountModel.save(err => {
                if (err) {
                    resData = {
                        success: false,
                        message: `Error creating the account!`,
                        errorReport: err,
                    };
                } else {
                    resData = {
                        success: true,
                        message: 'Account created successfully',
                    };
                }

                resolve(resData);
            });
        });
    }
}

export const AccountModel = new Account().getModelForClass(Account);
