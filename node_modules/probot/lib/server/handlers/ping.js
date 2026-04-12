export const pingHandler = (req, res) => {
    if (req.method === "GET") {
        const path = req.url?.split("?")[0] || "";
        if (path === "/ping") {
            res.writeHead(200, { "content-type": "text/plain" }).end("PONG");
            return true;
        }
    }
    return false;
};
