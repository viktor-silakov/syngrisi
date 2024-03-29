const winston = require('winston');
require('winston-mongodb');
const {
    blue,
    gray,
    magenta,
} = require('chalk');
const formatISO9075 = require('date-fns/formatISO9075');
const { parseISO } = require('date-fns');

module.exports.Logger = class Logger {
    constructor(opts) {
        this.connectionString = opts.connectionString;
        this.winstonLogger = winston.createLogger({
            transports: [
                new winston.transports.Console({
                    level: 'silly',
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.timestamp(),
                        winston.format.ms(),
                        winston.format.metadata(),
                        winston.format.printf((info) => {
                            const user = info.metadata.user ? blue(` <${info.metadata.user}>`) : '';
                            const ref = info.metadata.ref ? gray(` ${info.metadata.ref}`) : '';
                            const msgType = info.metadata.msgType ? ` ${info.metadata.msgType}` : '';
                            const itemType = info.metadata.itemType ? magenta(` ${info.metadata.itemType}`) : '';
                            const scope = info.metadata.scope ? magenta(` [${info.metadata.scope}] `) : '';
                            const msg = typeof info.message === 'object'
                                ? `\n${JSON.stringify(info.message, null, 2)}`
                                : info.message;

                            return `${info.level} ${scope}${formatISO9075(parseISO(info.metadata.timestamp))} `
                                + `${info.metadata.ms}${user}${ref}${msgType}${itemType} '${msg}'`;
                        }),
                        winston.format.padLevels(),
                    ),
                }),
                new winston.transports.MongoDB({
                    level: 'debug',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json(),
                        winston.format.metadata(),
                    ),
                    options: {
                        useUnifiedTopology: true,
                    },
                    db: opts.dbConnectionString,
                    collection: 'vrslogs',
                    storeHost: true,
                    meta: true,
                }),
            ],
        });
    }

    static merge(meta, context) {
        if ((meta?.ref) && (typeof meta?.ref) !== 'string') {
            // eslint-disable-next-line no-param-reassign
            meta.ref = meta.ref.toString();
        }
        if (context?.logMeta) {
            // return Object.assign(context.logMeta, meta);
            return { ...context.logMeta, ...meta };
        }
        return meta;
    }

    error(msg, context, meta) {
        this.winstonLogger.error(`${msg}\n stacktrace: ${new Error().stack}`, Logger.merge(meta, context));
    }

    warn(msg, context, meta) {
        this.winstonLogger.warn(`${msg}\n stacktrace: ${new Error().stack}`, Logger.merge(meta, context));
    }

    info(msg, context, meta) {
        this.winstonLogger.info(msg, Logger.merge(meta, context));
    }

    verbose(msg, context, meta) {
        this.winstonLogger.verbose(msg, Logger.merge(meta, context));
    }

    debug(msg, context, meta) {
        this.winstonLogger.debug(msg, Logger.merge(meta, context));
    }

    silly(msg, meta, context) {
        this.winstonLogger.silly(msg, Logger.merge(meta, context));
    }
};
