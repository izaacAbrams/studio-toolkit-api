require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const path = require('path')
const fs = require('fs')
const ytdl = require('ytdl-core')
const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.get("/url", (req, res) => {

  res.send(ytdl('https://www.youtube.com/watch?v=IBDgHaTy_wU')
  .pipe(fs.createWriteStream('C:/Users/izaac/Downloads/music.mp3')))
}) 

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.log(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});
module.exports = app;
