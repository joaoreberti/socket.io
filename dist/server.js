"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cluster = require("cluster");
const http = require("http");
const { Server } = require("socket.io");
const numCPUs = require("os").cpus().length;
const { setupMaster, setupWorker } = require("@socket.io/sticky");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");
const express = require("express");
const path = require("path");
let counter = 0;
const app = express();
app.set("port", process.env.PORT || 3000);
if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    const httpServer = http.createServer();
    // setup sticky sessions
    setupMaster(httpServer, {
        loadBalancingMethod: "least-connection",
    });
    // setup connections between the workers
    setupPrimary();
    // needed for packets containing buffers (you can ignore it if you only send plaintext objects)
    // Node.js < 16.0.0
    cluster.setupMaster({
        serialization: "advanced",
    });
    // Node.js > 16.0.0
    // cluster.setupPrimary({
    //   serialization: "advanced",
    // });
    httpServer.listen(3000);
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on("exit", (worker) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });
}
else {
    console.log(`Worker ${process.pid} started`);
    let http = require("http").Server(app);
    let io = require("socket.io")(http);
    app.get("/", (req, res) => {
        res.sendFile(path.resolve("./client/index.html"));
    });
    app.get("/socket.io.js", (req, res) => {
        res.sendFile(path.resolve("./client/socket.io.js"));
    });
    app.get("/create-task", (req, res) => {
    });
    // use the cluster adapter
    io.adapter(createAdapter());
    // setup connection with the primary process
    setupWorker(io);
    io.on("connection", function (socket, cenas) {
        //conexão com o serviço
        // a partir daqui é preciso distribuir pelas diferentes "salas"
        counter++;
        /*
        console.log("a user connected", { counter }, { pid: process.pid });
        socket.emit("message", 'user connected on pid'+process.pid);
    
        // whenever we receive a 'message' we log it out
        socket.on("message", function (message: any) {
          
          io.emit("message", `emitted from pid ${process.pid}`);
          counter++
          
          console.log(message, { counter }, { pid: process.pid });
          // echo the message back down the
          // websocket connection
          //socket.emit("message", message);
        }); */
        console.log("a user connected", { counter }, { pid: process.pid });
        socket.on("client to server event", (data) => {
            console.log('client event');
            socket.emit("server to client event", 'cenas');
        });
    });
}
//# sourceMappingURL=server.js.map