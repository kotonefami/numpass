import { createServer } from "http";
import { readFileSync, writeFileSync } from "fs";
import WebSocket, { WebSocketServer } from "ws";

try {
    var count = parseInt(readFileSync("count.txt"));
} catch {
    var count = 0;
}

const config = JSON.parse(readFileSync("config.json"));
const htmlData = readFileSync("front.html").toString()
    .replaceAll("((title))", config.title)
    .replaceAll("((description))", config.description)
    .replaceAll("((buttonLabel))", config.buttonLabel)
    .replaceAll("((accentColor))", config.accentColor)
    .replaceAll("((accentColorDarken))", config.accentColorDarken)
    .replaceAll("((backgroundPosition))", config.backgroundPosition)
    .replaceAll("((websocketUrl))", config.websocketUrl)
    .replaceAll("((favicon))",
        /^https?:\/\//g.exec(config.favicon) !== null ?
            config.favicon:
            "data:image/x-icon;base64," + readFileSync(config.favicon).toString("base64")
    )
    .replaceAll("((sound))",
        /^https?:\/\//g.exec(config.sound) !== null ?
            config.sound:
            "data:audio/mpeg;base64," + readFileSync(config.sound).toString("base64")
    )
    .replaceAll("((backgroundImage))",
        /^https?:\/\//g.exec(config.backgroundImage) !== null ?
            config.backgroundImage:
            "data:image/png;base64," + readFileSync(config.backgroundImage).toString("base64")
    );
const httpServer = createServer((request, response) => {
    if (request.url === "/") {
        response.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"}).end(htmlData);
    } else if (request.url === "/ws") {
        response.writeHead(200, {"Content-Type": "text/html"}).end("Please connect to this endpoint on WebSocket");
    } else {
        response.writeHead(404).end();
    }
});
const wsServer = new WebSocketServer({noServer: true});

wsServer.on("connection", (client) => {
    client.send("c" + count);
    client.on("message", (data) => {
        if (data.toString()[0] === "i") {
            count++;
            wsServer.clients.forEach(c => {
                if (c.readyState === WebSocket.OPEN) {
                    c.send("c" + count);
                }
            });
        }
    });
});

httpServer.on("upgrade", (request, socket, head) => {
    if (request.url === "/ws") {
        wsServer.handleUpgrade(request, socket, head, (ws) => {
            wsServer.emit("connection", ws, request);
        });
    } else {
        socket.destroy();
    }
});

process.on("SIGINT", () => {
    writeFileSync("count.txt", count.toString());
    process.exit();
});

// ぱすー（8200）
httpServer.listen(8200);