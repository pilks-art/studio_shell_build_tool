import "colors";
import fse from "fs-extra";
import path from "node:path";
import { Buffer } from "node:buffer";

// Directory Paths
var config = "./config.json";

var templatePath = setFilePath("template");

var shellsPath = setFilePath("shells");

var imagesPath = setFilePath("images");

// Init Config JSON
var configData = getConfigValues(config);

insertConfigData(configData);
getBackupImages(configData);

async function insertConfigData(data) {
	for (const size of data.sizes) {
		try {
			const currentSizeDir = shellsPath(size);
			const insertGenCode = updateFile(currentSizeDir("index.html"));
			const insertDynamicData = updateFile(currentSizeDir("logic.js"));

			await copyToShellDirectory(templatePath()(), shellsPath()());

			await insertGenCode(
				"<!-- DYNAMIC CONTENT REPLACEMENT FLAG -->",
				data.genCode
			);
			await insertDynamicData(
				"// DYNAMIC CONTENT REPLACEMENT FLAG",
				data.dynamicData
			);
		} catch (error) {
			console.error(error);
		}
	}
}

// For Each size
// Check if an image exists
// if yes - copy to shells
// if no - inform user, image does not exist
async function getBackupImages(data) {
	try {
		const images = await fse.readdir(imagesPath()());
		console.log(images);

		for (const size of data.sizes) {
			console.log(size);
			const backup = images.filter((image) => {
				return image.includes(size);
			});

			if (backup.length === 1) {
				copyToShellDirectory(imagesPath(backup[0])(), shellsPath(size)(backup[0]))	
			} else {
				console.log(`check image for size ${size} -`.red,'you must have only 1 image with file name matching the shell size'.cyan);
				process.exit(0)
			}

		}
	} catch (error) {
		console.error(error);
	}

	
}

async function copyToShellDirectory(src, destination) {
	try {
		await fse.copy(src, destination);
	} catch (error) {
		console.error(error);
	}
}

function getConfigValues(config) {
	try {
		let data = fse.readJsonSync(config);

		if (data.sizes === undefined) {
			console.log("At least one size is required".red);
			process.exit(0);
		}

		data.genCode = decodeString(data.genCode);
		data.dynamicData = setDynamicDataString(data.dynamicData);

		return data;
	} catch (error) {
		console.error(error);
	}
}

function updateFile(filePath) {
	return async function replaceWithRegex(replacer, configData) {
		const pattern = new RegExp(replacer, "g");
		try {
			const file = await fse.readFile(filePath, "utf-8");
			const updatedFile = file.replace(pattern, configData);
			await fse.writeFile(filePath, updatedFile);
		} catch (error) {}
	};
}

function setDynamicDataString(dynamicData) {
	const concatDynamicValues = dynamicData
		.map((dataObject) => {
			const [creative, dynamicContent] = Object.entries(dataObject);
			return `${creative.join(".")} = ${dynamicContent.join(".")};\n`;
		})
		.join("  ");
	return concatDynamicValues;
}

function decodeString(encodedString) {
	return Buffer.from(encodedString, "base64").toString("utf8");
}

// Build path with currying
function setFilePath(baseDir) {
	return function addSizePath(sizeDir = "") {
		return function addFilePath(file = "") {
			return path.join(import.meta.dirname, baseDir, sizeDir, file);
		};
	};
}
