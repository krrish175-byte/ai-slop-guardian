const validLevels = ["trace", "debug", "info", "warn", "error", "fatal"];
export function validateLogLevel(value) {
    if (typeof value !== "string" || !validLevels.includes(value)) {
        throw new Error(`Invalid log level`);
    }
}
