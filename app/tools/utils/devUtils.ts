import serverConfig from '../serverConfig';
import { helperUtils } from './helperUtils';
import { StringDecorationType } from '@/tools/utils/helperUtils';

export const devUtils = {
    log(message?: any, ...decorations: StringDecorationType[]) {
        if (serverConfig.isDev) {
            helperUtils.log(message, ...decorations);
        }
    },
};
