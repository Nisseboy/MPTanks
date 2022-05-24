const socket = io(window.location.origin);
const lobby = window.location.pathname;
const color = [Math.random() * 255, Math.random() * 255, Math.random() * 255];
let id;

const speed = 3;
const turnSpeed = 0.1;
const playerR = 10;
const barrelLength = 15;
const bulletLife = 10000;
const bulletR = 5;

let tanks = [];
let bullets = [];
let me;
let mag = 5;

let pressedKeys = [];
let map = [];

function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(40, 40, 50);
  let time = new Date().getTime();

  if (me && me.alive) {
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

  //Tanks
  for (let i = 0; i < tanks.length; i++) {
    let t = tanks[i];
    if (!t.alive) {
      continue;
    }

    strokeWeight(1);
    stroke(0);
    fill(t.col);
    ellipse(t.pos.x, t.pos.y, playerR * 2);
    strokeWeight(5);
    line(t.pos.x, t.pos.y, t.pos.x + cos(t.a) * barrelLength, t.pos.y + sin(t.a) * barrelLength);
  }

  //Map
  noStroke();
  fill(124, 255, 155);
  for (let i = 0; i < map.length; i++) {
    let r = map[i];
    rect(r[0], r[1], r[2], r[3]);
  }

  //Bullets
  fill(255, 255, 0);
  noStroke();
  for (let i = 0; i < bullets.length; i++) {
    let b = bullets[i];
    if (time - b.shot < bulletLife) {
      b.x += b.vx * speed * 1.2;
      if (inWall(b.x, b.y, bulletR)) {
        b.vx *= -1;
        b.x += b.vx * speed * 1.2;
      }

      b.y += b.vy * speed * 1.2;
      if (inWall(b.x, b.y, bulletR)) {
        b.vy *= -1;
        b.y += b.vy * speed * 1.2;
      }

      if (me && me.alive && dist(me.pos.x, me.pos.y, b.x, b.y) < playerR + bulletR) {
        emit("ded", {});
        me.alive = false;
      }

      ellipse(b.x, b.y, bulletR * 2);
    }
  }
}

function inWall(x, y, rad) {
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
    let x1 = x0 + w;
    let y1 = y0 + h;

    if (x > x0 - rad && y > y0 - rad && x < x1 + rad && y < y1 + rad) {
      return true;
    }
  }
  return false;
}

function move(d) {
  let t = me.pos.x;
  me.pos.x += cos(me.a) * d;
  if (inWall(me.pos.x, me.pos.y, playerR))
    me.pos.x = t;

  t = me.pos.y;
  me.pos.y += sin(me.a) * d;
  if (inWall(me.pos.x, me.pos.y, playerR))
    me.pos.y = t;


  emit("move", {
    pos: me.pos,
    a: me.a
  });
}


function keyPressed() {
  pressedKeys[keyCode] = true;
  if (me && me.alive && keyCode == 32 && mag > 0) { //space
    let bullet = {
      x: me.pos.x + cos(me.a) * barrelLength,
      y: me.pos.y + sin(me.a) * barrelLength,
      vx: cos(me.a),
      vy: sin(me.a),
      shot: new Date().getTime()
    };
    bullets.push(bullet);

    emit("shoot", {
      bullet: bullet
    });
  }

  if (keyCode == 73) {
    emit("start", {});
  }
}

function keyReleased() {
  pressedKeys[keyCode] = false;
}


//Reload
setInterval(() => {
  mag = 5;
}, 10000);


emit("getData", {});
on("getData", (data) => {
  id = data.id;
  map = data.map;

  tanks = data.players;
});


on("start", (data) => {
  map = data.map;
  tanks = [];
  bullets = [];

  for (let i = 0; i < data.players.length; i++) {
    let p = data.players[i];
    tanks.push({
      id: p.id,
      pos: p.pos,
      a: p.a,
      col: p.col,
      alive: p.alive
    });

    if (p.id == id)
      me = tanks[i];
  }
});

on("move", (data) => {
  let tank = tanks.find((elem) => {
    return (elem.id == data.id)
  });
  tank.pos = data.pos;
  tank.a = data.a;
});

on("ded", (data) => {
  let tank = tanks.find((elem) => {
    return (elem.id == data.id)
  });
  tank.alive = false;
});

on("shoot", (data) => {
  bullets.push(data.bullet);
});











function emit(channel, data) {
  data.lobby = lobby;
  data.id = id;

  socket.emit(channel, data);
}

function on(channel, callback) {
  socket.on(channel, (data) => {
    if (data.channel = channel) {
      callback(data);
    }
  });
}
