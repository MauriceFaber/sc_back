const express = require("express");
var fs = require("fs");
const app = express();
var path = require("path");
const fastFolderSize = require("fast-folder-size");

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}...`);
});

app.get("/", (req, res) => {
  console.log("Incoming Request on root");
  res.send("Hello!");
});

app.get("/message", (req, res) => {
  console.log("Incoming Request on message");
  res.send("<h1>Single Messsage here</h1>");
});

app.get("/messages", (req, res) => {
  console.log("Incoming Request on messages");
  res.send("<h1>Messsages here</h1>");
});

app.get("/json", (req, res) => {
  console.log("Incoming Request on json");
  const data = {
    name: "Maurice",
    date: "15.09.2022",
    path: "/json",
  };
  res.send(data);
});

const fileName = "number.json";

function getNumber() {
  var number = 0;
  try {
    if (fs.existsSync(fileName)) {
      let rawdata = fs.readFileSync(fileName);
      number = JSON.parse(rawdata).number;
    }
  } catch (err) {
    console.error(err);
  }
  return number;
}

function writeNumberObject(data) {
  let string = JSON.stringify(data);
  fs.writeFileSync(fileName, string);
}

function setNumber(number) {
  console.log("Set Number: " + number);
  const data = { number: number };
  writeNumberObject(data);
}

function incNumber() {
  const nr = getNumber();
  setNumber(nr + 1);
}
app.get("/number", (req, res) => {
  console.log("Incoming Request on number");
  res.send("Number is: " + getNumber());
});

const cameraConfigPath = "../data/cameras.json";
const dataPath = "/home/odroid/webcams/data";

function getCameraConfig() {
  let rawdata = fs.readFileSync(cameraConfigPath);
  return JSON.parse(rawdata);
}

function addCameraConfig(name, url) {
  var config = getCameraConfig();
  if (config.find((cam) => cam.name === name || cam.url === url)) {
    console.log("CAM ALREADY EXISTS");
    return false;
  } else {
    config.push({ name: name, url: url });
    fs.writeFileSync(cameraConfigPath, JSON.stringify(config));
    return true;
  }
}

app.get("/cameras", (req, res) => {
  console.log("Incoming Request on cameras");
  res.send(getCameraConfig());
});

app.post("/cameraConfig", (req, res) => {
  const name = req.query.name;
  const url = req.query.url;
  var result = false;
  if (name && name.length > 0 && url && url.length > 0) {
    result = addCameraConfig(name, url);
  }
  res.send(result ? { name, url } : { message: "already exists" });
});

app.get("/dirSize", function (req, res) {
  const camName = req.query.name;
  console.log("/size for camera: " + camName);
  const dirpath = dataPath + "/" + camName;
  const framespath = dirpath + "/frames";

  var size = "0 bytes";
  fastFolderSize(dirpath, (err, bytes) => {
    if (err) throw err;

    fastFolderSize(framespath, (errr, bytes2) => {
      if (errr) throw errr;

      size = Math.round(((bytes - bytes2) / 1000000.0) * 100) / 100 + " MB";

      console.log(size);
      res.send(size); // Set disposition and send it.
    });
  });
});

app.get("/videos", function (req, res) {
  const camName = req.query.name;
  //   console.log("/videos for camera: " + camName);
  const dirpath = dataPath + "/" + camName;
  const files = fs.readdirSync(dirpath).reverse();

  var toSend = [];

  for (var i in files) {
    const file = files[i];
    // console.log(file);
    if (file.includes(camName) && file.includes(".mkv_")) {
    } else if (file.includes(camName) && file.includes(".mkv")) {
      toSend.push(file);
    }
  }
  res.send(toSend); // Set disposition and send it.
});

app.get("/video.mp4", function (req, res) {
  const camName = req.query.name;
  const videoName = req.query.video;
  //   console.log("looking for video for camera: " + camName);
  const dirpath = dataPath + "/" + camName;
  const filePath = dirpath + "/" + videoName;
  res.sendFile(filePath); // Set disposition and send it.
});

app.get("/current", function (req, res) {
  const camName = req.query.name;
  console.log("looking for current frame for camera: " + camName);
  const dirpath = dataPath + "/" + camName;
  const filePath = dirpath + "/currentFrame.jpg";
  res.sendFile(filePath);
});

app.get("/stream", function (req, res) {
  const camName = req.query.name;
  const videoName = req.query.video;
  //   console.log("looking for stream for camera: " + camName);
  const dirpath = dataPath + "/" + camName;
  const filePath = dirpath + "/" + videoName;

  const videoSize = fs.statSync(filePath).size;

  const range = req.headers.range;
  if (!range) {
    res.writeHead(416, { "Content-Range": `bytes */${videoSize}` });
    return res.end();
  }

  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  const contentLength = end - start + 1;

  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };
  res.writeHead(206, headers);
  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
});

// setInterval(incNumber, 5000);
