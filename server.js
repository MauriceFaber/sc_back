const express = require("express");
var fs = require("fs");
const app = express();
var path = require("path");
const fastFolderSize = require("fast-folder-size");
var cors = require('cors')

require("dotenv").config();

const PORT = process.env.PORT || 3000;
app.use(cors())

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


// app.get("/stream", function (req, res) {
//   const camName = req.query.name;
//   const videoName = req.query.video;
//   //   console.log("looking for stream for camera: " + camName);
//   const dirpath = dataPath + "/" + camName;
//   const filePath = dirpath + "/" + videoName;

//   const videoSize = fs.statSync(filePath).size;

//   const range = req.headers.range;
// //   console.log(req.headers)
//   if(range){
// 	console.log("GivenRange: ", range);
//   }
// //   if (!range) {
// //     res.writeHead(416, { "Content-Range": `bytes */${videoSize}` });
// //     return res.end();
// //   }

//    let parts = range.split('=')[1]
//    let start = Number(parts.split('-')[0])
//    let end = Number(parts.split('-')[1])

//    //For Chrome
//    if (!end) {
//        const CHUNK_SIZE = 10 ** 6
//        end = Math.min(start + CHUNK_SIZE, videoSize - 1)
//    } 

//   const contentLength = end - start + 1;
//   const videoStream = fs.createReadStream(filePath, { start, end });

//   const headers = {
// 	"Content-Range": `bytes ${start}-${end}/${videoSize}`,
// 	"Accept-Ranges": "bytes",
// 	"Content-Length": contentLength,
// 	"Content-Type": "video/mp4",
//   };

//   if(req.method === "HEAD") {
// 	console.log("HEADING!");
//   	res.writeHead(200, headers);
//   	res.end();
//   }else {
// 	res.writeHead(206, headers);
// 	console.log("responding: ", start, end);
//   	videoStream.pipe(res);
// 	}
// });

app.get('/stream', (req, res) => {

	const camName = req.query.name;
	const videoName = req.query.video;
	//   console.log("looking for stream for camera: " + camName);
	const dirpath = dataPath + "/" + camName;
	const filePath = dirpath + "/" + videoName;

    // Listing 3.
    const options = {};

    let start;
    let end;

    const range = req.headers.range;
    if (range) {
        const bytesPrefix = "bytes=";
        if (range.startsWith(bytesPrefix)) {
            const bytesRange = range.substring(bytesPrefix.length);
            const parts = bytesRange.split("-");
            if (parts.length === 2) {
                const rangeStart = parts[0] && parts[0].trim();
                if (rangeStart && rangeStart.length > 0) {
                    options.start = start = parseInt(rangeStart);
                }
                const rangeEnd = parts[1] && parts[1].trim();
                if (rangeEnd && rangeEnd.length > 0) {
                    options.end = end = parseInt(rangeEnd);
                }
            }
        }
    }

    res.setHeader("content-type", "video/mp4");

    fs.stat(filePath, (err, stat) => {
        if (err) {
            console.error(`File stat error for ${filePath}.`);
            console.error(err);
            res.sendStatus(500);
            return;
        }

        let contentLength = stat.size;

        // Listing 4.
        if (req.method === "HEAD") {
            res.statusCode = 200;
            res.setHeader("accept-ranges", "bytes");
            res.setHeader("content-length", contentLength);
            res.end();
        }
        else {       
            // Listing 5.
            let retrievedLength;
            if (start !== undefined && end !== undefined) {
                retrievedLength = (end+1) - start;
            }
            else if (start !== undefined) {
                retrievedLength = contentLength - start;
            }
            else if (end !== undefined) {
                retrievedLength = (end+1);
            }
            else {
                retrievedLength = contentLength;
            }

            // Listing 6.
            res.statusCode = start !== undefined || end !== undefined ? 206 : 200;

            res.setHeader("content-length", retrievedLength);

            if (range !== undefined) {  
                res.setHeader("content-range", `bytes ${start || 0}-${end || (contentLength-1)}/${contentLength}`);
                res.setHeader("accept-ranges", "bytes");
            }

            // Listing 7.
            const fileStream = fs.createReadStream(filePath, options);
            fileStream.on("error", error => {
                console.log(`Error reading file ${filePath}.`);
                console.log(error);
                res.sendStatus(500);
            });


            fileStream.pipe(res);
        }
    });
});

// setInterval(incNumber, 5000);
