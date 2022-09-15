const express = require("express");
var fs = require("fs");
const app = express();

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

const cameraConfigPath = "~/webcams/data/cameras.json";

function getCameraConfig() {
  let rawdata = fs.readFileSync(cameraConfigPath);
  return JSON.parse(rawdata);
}

app.get("/cameras", (req, res) => {
  console.log("Incoming Request on cameras");
  res.send(getCameraConfig());
});

setInterval(incNumber, 2000);
