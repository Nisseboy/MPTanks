const socket = io(window.location.origin);
const lobby = window.location.pathname;
const color = [Math.random() * 255, Math.random() * 255, Math.random() * 255];
const id = Math.floor(Math.random() * 10000000000);

const speed = 3;
const turnSpeed = 0.1;
const playerR = 10;
const playerBarrelLength = 15;
const idleDisconnect = 30000;
const bulletLife = 10000;
const bulletR = 5;
const bulletCooldown = 500;

const rects = [[0, 0, 600, 10], [0, 0, 10, 600], [590, 0, 10, 600], [0, 590, 600, 10], [10, 56, 100, 10], [46, 119, 100, 10], [10, 212, 100, 10], [146, 10, 15, 189], [159, 80, 377, 15], [493, 95, 15, 150], [78, 422, 14, 168], [92, 422, 137, 16], [212, 438, 17, 124], [92, 505, 90, 15], [311, 217, 22, 344], [333, 335, 71, 15], [435, 335, 165, 14], [362, 405, 228, 12], [333, 453, 224, 17], [358, 500, 232, 14], [333, 546, 182, 15]]

let players = [];
let bullets = [];
let me;
let mag = 5;

let pressedKeys = [];

function setup() {
  createCanvas(600, 600);
  me = new Player(color, id);
  players.push(me);

  emit("move", {
    x: me.pos.x,
    y: me.pos.y,
    a: me.a
  });
}

function draw() {
  background(40, 40, 50);
  let time = new Date().getTime();
  if (me.alive) {
    if (pressedKeys[38]) { //up
      move(speed);
    }
    if (pressedKeys[37]) { //left
      me.a -= turnSpeed;
      move(0);
    }
    if (pressedKeys[40]) { //down
      move(-speed);
    }
    if (pressedKeys[39]) { //right
      me.a += turnSpeed;
      move(0);
    }
  }


  fill(255);
  stroke(0);
  for (let i = 0; i < players.length; i++) {
    let player = players[i];
    let pos = player.pos;
    if (time - player.lastMoved < idleDisconnect || i == 0) {
      strokeWeight(1);
      fill(player.color);
      if (player.alive) {
        ellipse(pos.x, pos.y, playerR * 2);

        let barrelPos = pos.copy().add(createVector(cos(player.a), sin(player.a)).mult(playerBarrelLength));
        strokeWeight(5);
        line(pos.x, pos.y, barrelPos.x, barrelPos.y);
      }
    }
  }

  for (let i = 0; i < bullets.length; i++) {
    let b = bullets[i];

    if (time - b.start < bulletLife) {
      let o = b.x;
      b.x += b.vX * speed * 1.2;
      if (inWall(b.x, b.y, bulletR)) {
        b.vX *= -1;
        b.x += b.vX * speed * 1.2;
      }

      b.y += b.vY * speed * 1.2;
      if (inWall(b.x, b.y, bulletR)) {
        b.vY *= -1;
        b.y += b.vY * speed * 1.2;
      }

      if (dist(b.x, b.y, me.pos.x, me.pos.y) < bulletR + playerR) {
        me.alive = false;
        emit("ded", {});
      }

      ellipse(b.x, b.y, bulletR * 2);
    }
  }
  fill(124, 255, 155);
  noStroke();
  for (let i = 0; i < rects.length; i++) {
    rect(rects[i][0], rects[i][1], rects[i][2], rects[i][3]);
  }
}

function move(amount) {
  let change = createVector(cos(me.a), sin(me.a)).mult(amount);
  let oPos = me.pos.copy();


  me.pos.x += change.x;
  if (inWall(me.pos.x, me.pos.y, playerR)) {
    me.pos.x = oPos.x;
  }
  me.pos.y += change.y;
  if (inWall(me.pos.x, me.pos.y, playerR)) {
    me.pos.y = oPos.y;
  }

  emit("move", {
    x: me.pos.x,
    y: me.pos.y,
    a: me.a,
    lastMoved: new Date().getTime()
  });
}

function shoot() {
  let bullet = {
    x: me.pos.x + cos(me.a) * playerBarrelLength,
    y: me.pos.y + sin(me.a) * playerBarrelLength,
    vX: cos(me.a),
    vY: sin(me.a),
    start: new Date().getTime()
  }
  bullets.push(bullet);
  emit("shoot", {
    bullet: bullet
  });
}

setInterval(() => {
  mag = 5;
}, 5000);

function inWall(x, y, r) {
  let inW = false;
  for (let i = 0; i < rects.length; i++) {
    let re = rects[i];
    if (x > re[0] - r && x < re[0] + re[2] + r && y > re[1] - r && y < re[1] + re[3] + r)
      inW = true;
  }
  return inW;
}

function toCam(pos) {
  return pos.copy().sub(me.pos).add(createVector(width / 2, height / 2));
}

function keyPressed() {
  pressedKeys[keyCode] = true;
  if (keyCode == 32) { //space
    if (mag > 0) {
      mag--;
      shoot();
      move(0);
    }
  }
}

function keyReleased() {
  pressedKeys[keyCode] = false;
}

class Player {
  constructor(color, id, lastMoved = new Date().getTime(), x = "s", y = "s") {
    this.color = color;
    this.id = id;
    this.lastMoved = lastMoved;

    this.alive = true;
    if (x == "s") {
      this.pos = findPos();
    } else {
      this.pos = createVector(x, y);
    }
    this.a = random(TWO_PI);
  }
}

function findPos() {
  let pos = createVector(random(width), random(height));
  if (inWall(pos.x, pos.y, playerR)) {
    return findPos();
  } else {
    return pos;
  }
}

on("move", (data) => {
  let matched = false;
  for (let i = 0; i < players.length; i++) {
    if (data.id == players[i].id) {
      matched = true;
      players[i].pos = createVector(data.x, data.y);
      players[i].a = data.a;
      players[i].lastMoved = data.lastMoved;
    }
  }
  if (!matched) {
    players.push(new Player(data.color, data.id, data.lastMoved));
  }
});

on("shoot", (data) => {
  bullets.push(data.bullet);
  console.log(data.bullet);
});

on("ded", (data) => {
  players.find((p) => {
    if (p.id == data.id)
      p.alive = false;
  });
});

on("restart", (data) => {
  console.log(data);
  restartButton.style.backgroundColor = "rgb(" + data.color[0] + ", " + data.color[1] + ", " + data.color[2] + ")"
  restart();
});

function restart() {
  for (let i = 0; i < players.length; i++) {
    let p = players[i];
    players[i] = new Player(p.color, p.id, p.lastMoved);
  }
  me = players[0];
  bullets = [];
}

function sRestart() {
  restart();
  emit("restart", {});
}

function emit(channel, data) {
  data.lobby = lobby;
  data.color = color;
  data.id = id;

  socket.emit(channel, data);
}
function on(channel, callback) {
  socket.on(channel, (data) => {
    if (data.lobby == lobby) {
      callback(data);
    }
  });
}
