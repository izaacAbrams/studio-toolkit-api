require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const path = require("path");
const cp = require("child_process");
const fs = require("fs");
const ffmpeg = require("ffmpeg-static");
const ytdl = require("ytdl-core");
const ytsr = require("ytsr");
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
	const type = req.query.type;
	res.header("Content-Disposition", `attachment; filename=${title}.${type}`);
	if (req.query.type === "mp4") {
		const video = ytdl(URL, {
			format: type,
			quality: "highestvideo",
		});
		const audio = ytdl(URL, {
			format: type,
			quality: "highestaudio",
		});

		// Start the ffmpeg child process
		const ffmpegProcess = cp.spawn(
			ffmpeg,
			[
				// Remove ffmpeg's console spamming
				"-loglevel",
				"0",
				"-hide_banner",
				// 3 second audio offset
				"-itsoffset",
				"0.0",
				"-i",
				"pipe:4",
				"-i",
				"pipe:5",

				// Choose some fancy codes
				"-c:v",
				"libx264",
				"-x264-params",
				"log-level=0",
				"-c:a",
				"flac",
				// Define output container
				"-f",
				"matroska",
				"pipe:6",
			],
			{
				windowsHide: true,
				stdio: [
					/* Standard: stdin, stdout, stderr */
					"inherit",
					"inherit",
					"inherit",
					/* Custom: pipe:3, pipe:4, pipe:5, pipe:6 */
					"pipe",
					"pipe",
					"pipe",
					"pipe",
				],
			}
		);
		ffmpegProcess.on("close", () => {
			process.stdout.write("\n\n\n\n");
		});

		// Link streams
		// FFmpeg creates the transformer streams and we just have to insert / read data
		ffmpegProcess.stdio[3].on("data", (chunk) => {
			// Parse the param=value list returned by ffmpeg
			const lines = chunk.toString().trim().split("\n");
			const args = {};
			for (const l of lines) {
				const [key, value] = l.trim().split("=");
				args[key] = value;
			}
		});
		audio.pipe(ffmpegProcess.stdio[4]);
		video.pipe(ffmpegProcess.stdio[5]);
		ffmpegProcess.stdio[6].pipe(res);
	} else {
		ytdl(URL, {
			format: type,
			quality: "highestaudio",
		}).pipe(res);
	}
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
