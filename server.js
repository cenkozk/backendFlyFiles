  const httpServer = require("http").createServer();
  const cors = require("cors");

  const io = require("socket.io")(httpServer);

  // Use cors middleware
  io.use(cors({ origin: "*" }));

  var usersArr = [];

  io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    //Add user to array.
    const mySocketID = socket.id;

    socket.on("join room", (payload) => {
      usersArr.push({ socketId: mySocketID, sillyName: null, myIP: payload.myIP });
      usersArr = usersArr.map((users) =>
        users.socketId === mySocketID ? { socketId: mySocketID, sillyName: payload.mySillyName, isMobile: payload.isMobile, myIP: payload.myIP } : users
      );
      console.log(payload.hasOwnProperty("signal"));
      // join the room with a combination of the IP address and socket id
      socket.join(`${payload.myIP}`);
      // send the "all users" event to the client
      socket.emit(
        "all users",
        usersArr.filter((user) => user.myIP === payload.myIP)
      );
      console.log(
        usersArr.filter((user) => user.myIP === payload.myIP),
        "sent"
      );
    });

    socket.on("sending signal", (payload) => {
      var callerID = payload.callerID;
      var signal = payload.signal;
      var sillyName = payload.mySillyName;
      var isMobile = payload.isMobile;
      socket.broadcast.to(payload.myIP).emit("user joined", { callerID, signal, sillyName, isMobile, userToSignal: payload.userToSignal });
    });

    socket.on("returning signal", (payload) => {
      var callerID = payload.callerID;
      var signal = payload.signal;
      var signalSender = socket.id;
      socket.broadcast.to(callerID).emit("receiving returned signal", { callerID, signal, signalSender });
    });

    socket.on("msg", (msg) => {
      console.log(`Message from ${socket.id}: ${msg}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(socket.id, "left because", '"' + reason + '"', io.of(socket.id).adapter.rooms);
      var index = usersArr.indexOf(socket.id);
      usersArr.splice(index, 1);
      console.log(usersArr);

      disconnectFromAll(socket.id);
    });
  });

  function disconnectFromAll(id, ip) {
    io.to(ip).emit("remove disconnected", id);
  }

  httpServer.listen(3161, console.log("listening *3161"));
