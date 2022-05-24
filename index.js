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

server.listen(process.env.PORT || PORT, () =>{
    console.log("http://127.0.0.1:" + PORT + "/");
});

const maps = [
  [[0, 0, 600, 10], [0, 0, 10, 600], [590, 0, 10, 600], [0, 590, 600, 10], [10, 56, 100, 10], [46, 119, 100, 10], [10, 212, 100, 10], [146, 10, 15, 189], [159, 80, 377, 15], [493, 95, 15, 150], [78, 422, 14, 168], [92, 422, 137, 16], [212, 438, 17, 124], [92, 505, 90, 15], [311, 217, 22, 344], [333, 335, 71, 15], [435, 335, 165, 14], [362, 405, 228, 12], [333, 453, 224, 17], [358, 500, 232, 14], [333, 546, 182, 15]],
  [[0, 0, 600, 10], [0, 0, 10, 600], [590, 0, 10, 600], [0, 590, 600, 10], [261, 108, -91, -17], [259, 108, 16, 63], [174, 113, -9, 66], [153, 198, -53, 3], [83, 196, -15, -9], [89, 213, 5, 25], [92, 229, 142, 3], [214, 304, -139, -18], [172, 420, 15, -59], [179, 366, 137, 13], [197, 181, 22, 23], [7, 10, 117, 133], [318, 11, 30, 144], [434, 137, 162, 43], [438, 143, 21, -69], [456, 78, 57, 20], [429, 374, 24, -151], [429, 223, -71, 19], [428, 290, -58, 16], [432, 373, -66, -12], [369, 373, 33, 144], [369, 515.7619051933289, -138, -15], [234, 504.76190519332886, 19, -68], [251, 442.76190519332886, 53, 16], [73, 302.76190519332886, 24, 211], [11, 567.7619051933289, 189, 23], [458, 437.76190519332886, 75, 118], [521, 275.76190519332886, 5, 109], [274, 293.76190519332886, 26, -25], [283, 574.7619051933289, 110, 14]],
  [[0, 0, 600, 10], [0, 0, 10, 600], [590, 0, 10, 600], [0, 590, 600, 10], [46, 81, 122, 206], [515, 141, -222, 231], [299, 66, 343, -22], [203, 323, 14, 150], [416, 495, -94, -81], [27, 395, 48, 103], [210, 357, -130, 3], [103, 95, 57, -53], [591, 481, -117, 95], [469, 545, -219, -4], [219, 433, 44, -8]],
  [[0, 0, 600, 10], [0, 0, 10, 600], [590, 0, 10, 600], [0, 590, 600, 10], [106, 102, 215, 10], [316, 112, -33, 68], [94, 130, 0, 4], [87, 126, 2, 4], [71, 147, 19, 122], [72, 330, 21, 102], [55, 544.1904907226562, 317, -19], [420, 536.1904907226562, 17, -255], [593, 318.19049072265625, -119, 15], [417, 260.19049072265625, 17, -28], [431, 176.76190948486328, -75, 16], [323, 105.76190948486328, 217, 7], [480, 260.7619094848633, 37, -94], [266, 8, 19, 51], [319, 103, 19, -41], [229, 101, -57, -34], [100, 11, 7, 52], [65, 89, -41, -44], [9, 255, 30, -11], [73, 205, -29, -58], [140, 161.76190519332886, 98, 162], [132, 480.76190519332886, 21, -109], [237, 472.76190519332886, 123, -21], [353, 453.76190519332886, -24, -212], [229, 319.76190519332886, 56, -26], [437, 502.76190519332886, 134, -23], [216, 381.76190519332886, 54, 13], [475, 105.76190519332886, 69, -31]],
  [[0, 0, 600, 10], [0, 0, 10, 600], [590, 0, 10, 600], [0, 590, 600, 10], [65, 94, 384, 12], [319, 105, 13, 189], [58, 420, 288, 11], [512, 277, 11, 200], [110, 167, -53, 11], [57, 177, 11, 118], [67, 254, 142, 12], [123, 262, 16, 102], [325, 180, 174, 14], [268, 427, 12, 114], [251, 423, -15, -82], [271, 514, -236, -15]]
];

let map = {};
let players = {};
let matchStart = {};

const matchTime = 30000;

io.on("connection", (socket) => {
  socket.on("getData", (data) => {
    if (map[data.id] == undefined) {
      start(data.lobby);
    }
    socket.emit("getData", {
      lobby: data.lobby,
      id: socket.id,
      map: map[data.lobby],
      players: players[data.lobby]
    });
  });

  socket.on("start", (data) => {start(data.lobby)});

  socket.on("move", (data) => {
    socket.broadcast.emit("move", data);

    if (players[data.lobby] == undefined) {
      players[data.lobby] = [];
    }

    let p = players[data.lobby].find((elem) => {
      return (elem.id == data.id);
    });
    if (p != undefined)
      p.pos = data.pos;
  });

  socket.on("shoot", (data) => {
    socket.broadcast.emit("shoot", data);
  });

  socket.on("ded", (data) => {
    socket.broadcast.emit("ded", data);
    players[data.lobby].find((elem) => {
      return (elem.id == data.id);
    }).alive = false;
  });
});

function start(lobby) {
  let lobbyIndex = Math.floor(Math.random() * maps.length);
  console.log(lobby + " started with map " + lobbyIndex);
  map[lobby] = maps[lobbyIndex];

  players[lobby] = [];
  io.fetchSockets().then(users => {
    for (let i = 0; i < users.length; i++) {
      let full = users[i].handshake.headers.referer.split("/");
      let uLobby = "/" + full[full.length - 1];

      if (uLobby == lobby) {
        players[lobby].push({
          id: users[i].id,
          pos: getNewPos(map[lobby]),
          a: Math.random() * 6.28318530718,
          col: getColorFromId(users[i].id),
          alive: true
        });
      }
    }

    io.sockets.emit("start", {
      map: map[lobby],
      players: players[lobby],
      lobby: lobby
    });
  });
  matchStart[lobby] = new Date().getTime();
}

setInterval(() => {
  for (lobby in matchStart) {
    if (new Date().getTime() - matchStart[lobby] > matchTime || getAliveCount(lobby) < 2) {
      start(lobby);
    }
  }
}, 1000);

function getNewPos(map) {
  let x = Math.floor(Math.random() * 600);
  let y = Math.floor(Math.random() * 600);

  if (inWall(map, x, y, 10)) {
    return getNewPos(map);
  }
  return {
    x: x,
    y: y
  };
}

function getAliveCount(lobby) {
  let num = 0;
  for (let i = 0; i < players[lobby].length; i++) {
    if (players[lobby][i].alive)
      num++;
  }
  return num;
}

function inWall(map, x, y, rad) {
  for (let i = 0; i < map.length; i++) {
    let r = map[i];

    let w = r[2];
    let h = r[3];
    let x0 = r[0];
    let y0 = r[1];
    if (w < 0) {
      w *= -1;
      x0 -= w;
    }
    if (h < 0) {
      h *= -1;
      y0 -= h;
    }
    let x1 = r[0] + w;
    let y1 = r[1] + h;

    if (x > x0 - rad && y > y0 - rad && x < x1 + rad && y < y1 + rad) {
      return true;
    }
  }
  return false;
}

function getColorFromId(id) {
  let charCodes = "";
  for (let i = 0; i < id.length; i++)
    charCodes  += id.charCodeAt(i)
  let c = [];
  for (let i = 0; i < 3; i++) {
    c[i] = parseInt(charCodes[i * 3] + charCodes[i * 3 + 1] + charCodes[i * 3 + 2]) % 255;
  }
  return c;
}
