export function getPrintableHost(host) {
    if (typeof host !== "string") {
        return "localhost";
    }
    return host.includes(":") ? `[${host}]` : host;
}
