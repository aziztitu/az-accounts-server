declare global {
    namespace Express {
        interface Request {
            apiTokenPayload?: ApiTokenPayload;
        }

        interface SessionData {
            apiToken?: string;
        }
    }
}

export type ApiTokenPayload = {
    accountData: {
        id: string;
        username: string;
        role: string;
    };
};
