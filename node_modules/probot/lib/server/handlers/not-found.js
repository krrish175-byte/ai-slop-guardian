export const notFoundHandler = (_req, res) => {
    if (res.headersSent) {
        return false;
    }
    res.writeHead(404).end();
    return true;
};
