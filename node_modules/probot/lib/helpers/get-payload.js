const textDecoder = new TextDecoder("utf-8", { fatal: false });
const decode = textDecoder.decode.bind(textDecoder);
function concatUint8Array(data) {
    if (data.length === 0) {
        // no data received
        return new Uint8Array(0);
    }
    let totalLength = 0;
    for (let i = 0; i < data.length; i++) {
        totalLength += data[i].length;
    }
    if (totalLength === 0) {
        // no data received
        return new Uint8Array(0);
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (let i = 0; i < data.length; i++) {
        result.set(data[i], offset);
        offset += data[i].length;
    }
    return result;
}
export async function getPayload(request) {
    if (typeof request.body === "object" &&
        "rawBody" in request &&
        request.rawBody instanceof Uint8Array) {
        // The body is already an Object and rawBody is a Buffer/Uint8Array (e.g. GCF)
        return decode(request.rawBody);
    }
    else if (typeof request.body === "string") {
        // The body is a String (e.g. Lambda)
        return request.body;
    }
    // We need to load the payload from the request (normal case of Node.js server)
    const payload = await getPayloadFromRequestStream(request);
    return decode(payload);
}
export function getPayloadFromRequestStream(request) {
    // We need to load the payload from the request (normal case of Node.js server)
    return new Promise((resolve, reject) => {
        const data = [];
        request.on("error", (error) => reject(new AggregateError([error], error.message)));
        request.on("data", data.push.bind(data));
        request.on("end", () => {
            const result = concatUint8Array(data);
            queueMicrotask(() => resolve(result));
        });
    });
}
