const validFormats = ["pretty", "json"];
export function validateLogFormat(value) {
    if (typeof value !== "string" || !validFormats.includes(value)) {
        throw new Error(`Invalid log format`);
    }
}
