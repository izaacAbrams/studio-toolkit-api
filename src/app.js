require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const path = require("path");
const fs = require("fs");
const ytdl = require("ytdl-core");
const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.use(function (req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	next();
});
app.get("/", (req, res) => {
	res.send("Hello, world!");
});

app.get("/download", (req, res) => {
	const URL = req.query.URL;
	const title = req.query.title;
	res.header("Content-Disposition", `attachment; filename=${title}.mp3`);
	ytdl(URL, {
		format: "mp3",
	}).pipe(res);
});

app.get("/info", (req, res) => {
	ytdl.getBasicInfo(req.query.URL).then((info) => res.json(info));
});
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
