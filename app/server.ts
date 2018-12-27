// Registers module alisases (Needed for aliases to work in Node)
import 'module-alias/register';

// Imports and configures all the environment variables from .env file into the process.env object.
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import serverConfig, { ServerMode } from '@/tools/serverConfig';
import { AccountModel } from '@/models/Account';
import { apiController } from '@/controllers/apiController';
import session from 'express-session';

import connectMongoDbSession from 'connect-mongodb-session';
import { devUtils } from './tools/utils/devUtils';
import debugMiddlewares from './middlewares/debugMiddlewares';
import { StringDecoration, helperUtils } from './tools/utils/helperUtils';
const MongoDBStore = connectMongoDbSession(session);

class Server {
    readonly app: express.Application = express();

    private db: mongoose.Connection | null = null;

    public constructor() {}

    public init() {
        helperUtils.log();
        helperUtils.log('Initializing Server...');

        // Although not needed, adding this if condition just to make it clear
        if (serverConfig.isDev) {
            devUtils.log(`Running in Development Mode...`);
            devUtils.log();
            devUtils.log('Server Config:', StringDecoration.UNDERLINE);
            devUtils.log(`${JSON.stringify(serverConfig, null, 4)}`);
        }

        helperUtils.log();

        this.initExpressServer();
        this.initDatabaseConnection();
    }

    private initExpressServer() {
        this.app.use(bodyParser.json());
        this.app.use(
            cors({
                origin: serverConfig.http.cors.origin,
                credentials: true,
            })
        );

        if (serverConfig.isDev) {
            this.app.use(debugMiddlewares.logRequestStart);
            this.app.use(debugMiddlewares.logRequestEnd);

            this.app.use(
                morgan('combined', {
                    immediate: true,
                })
            );
        }

        const sessionStore = new MongoDBStore(
            {
                uri: serverConfig.mongo.uri,
                collection: serverConfig.mongo.sessionCollection,
            },
            err => {
                if (err) {
                    helperUtils.error('Cannot initialize Session Store:');
                    helperUtils.error(JSON.stringify(err, null, 4));
                }
            }
        );

        sessionStore.on('error', err => {
            if (err) {
                helperUtils.error('Error in Session Store:');
                helperUtils.error(JSON.stringify(err, null, 4));
            }
        });

        this.app.use(
            session({
                secret: serverConfig.auth.session.secret,
                store: sessionStore,
                resave: true,
                saveUninitialized: true,
            })
        );

        this.app.use('/', apiController);

        this.app.listen(serverConfig.http.port, () => {
            helperUtils.log(
                `Listening at ${helperUtils.decorate(
                    `http://localhost:${serverConfig.http.port}/`,
                    StringDecoration.HIGHLIGHT,
                    StringDecoration.UNDERLINE
                )}`,
                StringDecoration.SUCCESS
            );
        });
    }

    private initDatabaseConnection() {
        helperUtils.log('Initializing connection to database...\n');

        mongoose.connect(
            serverConfig.mongo.uri,
            {
                useNewUrlParser: true,
            },
            err => {
                if (err) {
                    helperUtils.error(
                        'Error: Cannot connect to the database...'
                    );
                    helperUtils.error(err.stack);
                }
            }
        );

        this.db = mongoose.connection;
        this.db.once('open', () => {
            helperUtils.log('Connected to the database successfully!\n', StringDecoration.SUCCESS);

            AccountModel.addAdminIfMissing();
        });
    }
}

export const server = new Server();
server.init();
