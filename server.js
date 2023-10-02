const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { WebcastPushConnection } = require("tiktok-live-connector");

const app = express();
app.use(express.static("public"));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = 3000;

let giff = "gif yok henüz";
let giffid =0;
let gonderen ="henüz yok";
let adet =0;
// Create a new wrapper object and pass the TikTok username of the streamer
const tiktokUsername = "yazilimci.oyunda";

const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

// Connect to the TikTok live stream
tiktokLiveConnection
  .connect()
  .then((state) => {
    console.info(`Connected to roomId ${state.roomId}`);
  })
  .catch((err) => {
    console.error("Failed to connect", err);
  });

tiktokLiveConnection.on("gift", (data) => {
  
  giff=data.giftName;
  giffid=data.giftId;
  let gonderen =data.uniqueId;
  let adet =data.repeatCount+"X" ;

  if (data.giftType === 1 && !data.repeatEnd) {
    // Streak in progress => show only temporary
    console.log(
      `${data.uniqueId} is sending gift ${data.giftName} x${data.repeatCount}`
    );
  } else {
    // Streak ended or non-streakable gift => process the gift with final repeat_count
    console.log(
      `${data.uniqueId} has sent gift ${data.giftName} x${data.repeatCount} + ${data.giftId}`
    );
        //  connected clients (frontend) for all gift IDs
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
       
      // burası gönderiyor
        client.send(
          JSON.stringify({ type: "UGURTAS", tiktokUsername, giff,giffid,gonderen,adet  })
        );
      }
     
    });
  }
});

// Serve the HTML file
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.use('/gifler', express.static(__dirname + '/Gifler'));

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("Client connected");
 
  ws.send(JSON.stringify({ type: "UGURTAS", tiktokUsername, giff,giffid,gonderen,adet }));

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});


// Serve your frontend files (CSS, JavaScript, etc.)
app.use(express.static("../frontend"));

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
