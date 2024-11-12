const path = require("path");
const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const socketio = require("socket.io");

const app = express();

const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000/");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const clientDirectoryPath = path.join(__dirname, "../client");

app.use(express.static(clientDirectoryPath));

const time = () => new Date().getTime();

const user_sockets = {},
  users = [];

io.on("connection", (socket) => {
  let badName = false;
  socket.on("new user", (username) => {
    if (!(username in user_sockets)) {
      socket.username = username;
      // add socket id value to key username in user_sockets
      user_sockets[username] = socket.id;
      // push new username in users array
      users.push(username);
      socket.emit("login error", users);
      socket.broadcast.emit("user joined", { username, time: time() }, users);
      setInterval(() => {
        socket.emit("socket_io_counter", users);
      }, 3000);
      setInterval(() => {
        socket.emit("refresh sidebar", users);
      }, 15000);
    } else {
      const error =
        "Username currently unavailable,please click OK and choose other one.Thank you.";
      socket.emit("login error", users, error);
    }
  });

  socket.on("public message", ({ message, username }) => {
    let name;
    name = username;
    io.emit("public msg from server", {
      message,
      name,
      time: time(),
    });
  });

  socket.on("disconnect", () => {
    const user = socket.username;
    console.log(`User ${user} disconnected!`);
    if (socket.username in user_sockets) {
      socket.emit("user clear list", user);
      delete user_sockets[socket.username];
      users.splice(users.indexOf(socket.username), 1);
      socket.broadcast.emit("user left", {
        userLeft: user,
        time: time(),
        users,
      });
    }

    if (undefined) {
      socket.broadcast.emit("user left", {
        userLeft: "BAD-NICKNAME",
        time: time(),
        users,
      });
    }

    socket.emit("socket_io_counter", users);
  });
});

server.listen(port, () => {
  console.log(`Server running at ${port}`);
});
