import { Typegoose, prop, staticMethod, ModelType, pre, InstanceType } from 'typegoose';
import bcrypt from 'bcrypt';
import { MongooseDocument } from 'mongoose';
import serverConfig from '@/tools/serverConfig';
import { ApiResponseData } from '@/controllers/apiController';
import { helperUtils } from '@/tools/utils/helperUtils';
import fs from 'fs';

export enum AccountRole {
    Admin = 'admin',
    User = 'user',
}

export enum ReservedUsername {
    Empty = '',
    Admin = 'admin',
}

@pre('save', function(next) {
    const account = this as MongooseDocument & Account;

    if (account.isModified('password')) {
        // console.log("Hashing password...");

        bcrypt.hash(
            account.password,
            serverConfig.mongo.passwordHash.saltingRounds,
            (err, hash) => {
                if (err) {
                    console.log('Error hashing password!');
                    next(err);
                } else {
                    account.password = hash;
                    next();
                }
            }
        );
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

    @prop({
        required: true,
    })
    email!: string;

    @prop()
    profilePicture!: string;

    @staticMethod
    static async addAdminIfMissing(this: ModelType<Account> & Account) {
        try {
            const account = await this.findOne({ role: AccountRole.Admin }).exec();
            if (!account) {
                console.log('Admin Account is missing...');
                console.log('Creating Admin Account...');

                const adminAccountModel = new AccountModel({
                    username: 'admin',
                    password: serverConfig.mongo.defaultAdminPassword,
                    name: 'Admin',
                    role: AccountRole.Admin,
                } as Account);

                try {
                    await adminAccountModel.save();
                    console.log('Admin Account created successfully!\n');
                } catch (err) {
                    if (err) {
                        console.log('Error saving admin account!\n');
                        return false;
                    }
                }
            }
        } catch (err) {
            if (err) {
                console.log('Error retrieving admin account!\n');
                return false;
            }
        }

        return true;
    }

    @staticMethod
    static addNewAccount(
        this: ModelType<Account> & Account,
        accountDoc: Account,
        profilePictureBuffer?: Buffer
    ) {
        return new Promise<ApiResponseData>((resolve, reject) => {
            let resData: ApiResponseData;

            const newAccountModel = new AccountModel(accountDoc);

            for (const reservedUsernameId in ReservedUsername) {
                if (accountDoc.username === ReservedUsername[reservedUsernameId]) {
                    resData = {
                        success: false,
                        message: `Username '${
                            accountDoc.username
                        }' is reserved. Use a different username.`,
                    };

                    resolve(resData);
                    return;
                }
            }

            newAccountModel.save((err) => {
                if (err) {
                    resData = {
                        success: false,
                        message: `Error creating the account!`,
                        errorReport: err,
                    };
                } else {
                    if (profilePictureBuffer) {
                        let imageFilePath = helperUtils.getPathSafe(
                            `${serverConfig.paths.images}/accounts/${newAccountModel._id}/profilePicture`,
                            false
                        );
                        console.log(imageFilePath);

                        let stream = fs.createWriteStream(imageFilePath);
                        stream.write(profilePictureBuffer);
                        stream.end();
                    }

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
