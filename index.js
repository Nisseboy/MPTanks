const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" }});

const PORT = 8080;

app.use(express.static('home'));
app.use(express.static('public'));

app.get("/*", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

server.listen(PORT, () =>{
    console.log("http://127.0.0.1:" + PORT + "/");
});

io.on("connection", (socket) => {
  socket.on("move", (data) => {
    socket.broadcast.emit("move", data);
  });
  socket.on("shoot", (data) => {
    socket.broadcast.emit("shoot", data);
  });
  socket.on("ded", (data) => {
    socket.broadcast.emit("ded", data);
  });
  socket.on("restart", (data) => {
    socket.broadcast.emit("restart", data);
  });
});
