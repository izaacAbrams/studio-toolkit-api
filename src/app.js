require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const path = require("path");
const fs = require("fs");
const ytdl = require("ytdl-core");
const ytsr = require("ytsr");
// const createMusicStream = require("create-music-stream");
// const {
// 	MusicBeatDetector,
// 	MusicBeatScheduler,
// 	MusicGraph,
// } = require("music-beat-detector");
const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

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

app.get("/info", (req, res, next) => {
	if (req.query.URL) {
		ytdl
			.getBasicInfo(req.query.URL)
			.then((info) => res.json(info))
			.catch(next);
	}
	if (req.query.search) {
		ytsr(req.query.search, { limit: 20 })
			.then((info) => res.json(info))
			.catch(next);
	}
});

// app.get("/bpm", (req, res) => {
// 	const musicSource = "https://www.youtube.com/watch?v=rEdziKGQvYc";

// 	const musicGraph = new MusicGraph();

// 	const musicBeatScheduler = new MusicBeatScheduler((pos) => {
// 		console.log(`peak at ${pos}ms`); // your music effect goes here
// 	});

// 	const musicBeatDetector = new MusicBeatDetector({
// 		plotter: musicGraph.getPlotter(),
// 		scheduler: musicBeatScheduler.getScheduler(),
// 	});

// 	createMusicStream(musicSource)
// 		.pipe(musicBeatDetector.getAnalyzer())
// 		.on("peak-detected", (pos, bpm) =>
// 			console.log(`peak-detected at ${pos}ms, detected bpm ${bpm}`)
// 		);
// });

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
