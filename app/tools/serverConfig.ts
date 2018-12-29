import jwt from 'jsonwebtoken';
export enum ServerMode {
    dev = 'dev',
    prod = 'prod',
}

const serverConfig = {
    mode: process.env.MODE as ServerMode,
    get isDev() {
        return this.mode === ServerMode.dev;
    },

    http: {
        port: +process.env.HTTP_PORT!,
        cors: {
            origin: process.env.CROSS_ORIGIN_DOMAINS!.split(' '),
        },
        get fakeDelayTime() {
            if (serverConfig.isDev) {
                return +process.env.FAKE_DELAY_TIME!;
            }

            return 0;
        },
        fakeDelayOrigins: process.env.FAKE_DELAY_ORIGINS!.split(' '),
    },

    mongo: {
        host: process.env.MONGO_HOST,
        port: +process.env.MONGO_PORT!,
        db: process.env.MONGO_DB,
        sessionCollection: process.env.MONGO_SESSION_COLLECTION!,

        get uri(): string {
            return `mongodb://${this.host}:${this.port}/${this.db}`;
        },

        defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD,
        passwordHash: {
            saltingRounds: 10,
        },
    },

    auth: {
        session: {
            secret: process.env.SESSION_SECRET!,
        },
        jwt: {
            secret: process.env.JWT_SECRET!,
            options: {
                expiresIn: '1d',
                issuer: process.env.JWT_ISSUER,
            } as jwt.SignOptions,
        },
    },
};

export default serverConfig;
