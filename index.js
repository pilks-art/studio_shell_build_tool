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

await insertConfigData(configData);
await getBackupImages(configData);

async function insertConfigData(data) {
	for (const size of data.sizes) {
		try {
			// console.log(size);
			const insertGenCode = updateFile(shellsPath(size, "index.html"));
			const insertDynamicData = updateFile(shellsPath(size, "logic.js"));
			await copyToShellDirectory(templatePath(), shellsPath(size));

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

async function getBackupImages(data) {
	try {
		const images = await fse.readdir(imagesPath());
		// console.log(images);

		for (const size of data.sizes) {
			const backup = images.filter((image) => {
				return image.includes(size);
			});

			if (backup.length === 1) {
				copyToShellDirectory(
					imagesPath(backup[0]),
					shellsPath(size, backup[0])
				);
			} else {
				console.log(
					`check image for size ${size} -`.red,
					"you must have only 1 image with file name matching the shell size"
						.cyan
				);
				process.exit(0);
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

		if (
			data.sizes.length === 0 ||
			data.sizes.some((size) => /^[^a-zA-Z0-9]*$/.test(size))
		) {
			console.log("All sizes must be valid and at least one is required".red);
			process.exit(0);
		}

		data.genCode = validateGenCodeString(data.genCode);
		data.dynamicData = setDynamicDataString(data.dynamicData);

		return data;
	} catch (error) {
		throw new Error(error);
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
	console.log(dynamicData);
	const concatDynamicValues = dynamicData
		.map((dataObject) => {
			const [creative, dynamicContent] = Object.entries(dataObject);

			console.log(dataObject);
			console.log(creative, dynamicContent);
			if (!creative || !dynamicContent)
				throw new Error(
					"Both creative and dynamicContent properties must be present".yellow
				);

			return `${creative.join(".")} = ${dynamicContent.join(".")};\n`;
		})
		.join("  ");

	return concatDynamicValues;
}

function validateGenCodeString(encodedString) {
	const base64Regex =
		/^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)?$/;

	if (typeof encodedString !== "string") {
		throw new Error("Gen code should be a valid string");
	} else if (base64Regex.test(encodedString)) {
		return Buffer.from(encodedString, "base64").toString("utf8");
	} else {
		return encodedString;
	}
}

// Build path with partial application
function setFilePath(baseDir) {
	return function addPath(sizeDir = "", file = "") {
		return path.join(import.meta.dirname, baseDir, sizeDir, file);
	};
}

export { validateGenCodeString, setDynamicDataString, getConfigValues };

// ToDo
// set up tests
// setDynamicDataString, getConfigValues & setFilePath
// =========================
// setDynamicDataString - Work on handling errors for use case with
// 1. no data - use typescript
//
// getConfigValues - check that no empty values are given
// *********
// setFilePath - use cases for baseDir, sizeDir, file


// =========================
// add zip file functionality

// Read me - Must use node v21.4.0
// npm test
// node index
