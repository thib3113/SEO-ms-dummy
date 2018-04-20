import fs              from "fs";
import path            from "path";
import winston         from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import mongoose from "mongoose";

let rootPath = __dirname;

let isProduction = process.env.node_env === "production";

// logger = new winston.Logger();
let logPath = path.join(__dirname, "logs");

if (!fs.existsSync(logPath)) {
    // Create the directory if it does not exist
    fs.mkdirSync(logPath);
}

const WINSTON_LOG_LEVEL = {
    emerg  : "emerg",//0,
    alert  : "alert",//1,
    crit   : "crit",//2,
    error  : "error",//3,
    warning: "warning",//4,
    notice : "notice",//5,
    info   : "info",//6,
    debug  : "debug",//7
};

winston.configure({
                      transports: [
                          new DailyRotateFile({
                                                  filename     : path.join(logPath, "application-%DATE%.log"),
                                                  datePattern  : isProduction ? WINSTON_LOG_LEVEL.warning
                                                                              : WINSTON_LOG_LEVEL.debug + "YYYY-MM-DD",
                                                  prepend      : true,
                                                  level        : isProduction ? WINSTON_LOG_LEVEL.warning
                                                                              : WINSTON_LOG_LEVEL.debug,
                                                  zippedArchive: true
                                              })
                      ]
                  });

// Override the built-in console methods with winston hooks
switch ((process.env.NODE_ENV || "").toLowerCase()) {
    case "production":
        winston.add(winston.transports.File, {
            filename        : path.join(logPath, "app.log"),
            handleExceptions: true,
            exitOnError     : false,
            level           : WINSTON_LOG_LEVEL.warning
        });
        break;
    case (process.env.NODE_ENV || "").toLowerCase() === "test":
        // Don't set up the logger overrides
        break;
    default:
        winston.add(winston.transports.Console, {
            filename : path.join(logPath, "app.log"),
            colorize : true,
            timestamp: true,
            level    : WINSTON_LOG_LEVEL.debug
        });
        break;
}

let newConsole = {};

newConsole.log = (...args) => winston.info(...args);
newConsole.info = (...args) => winston.info(...args);
newConsole.debug = (...args) => winston.debug(...args);
newConsole.warn = (...args) => winston.warn(...args);
newConsole.error = (...args) => winston.error(...args);

function exitHandler(options, err) {
    if (options.cleanup) {
        console.log("close mongo");
        if(mongoose && mongoose.connection)
            mongoose.connection.close();
    }
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, {exit: true}));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, {exit: true}));
process.on("SIGUSR2", exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, {exit: true}));

export {newConsole as console, isProduction, rootPath};
