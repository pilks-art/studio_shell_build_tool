import test from "node:test";
import { describe, it, after, before, mock } from "node:test";
import assert from "node:assert/strict";
import fse from "fs-extra";
import path from "node:path";
import {
	decodeString,
	setDynamicDataString,
	getConfigValues,
} from "../index.js";

var testJsonPath = path.join(import.meta.dirname, "test.json");
var invalidSizePath = path.join(import.meta.dirname, "second.json");

describe("config data unit tests", function () {
	it("should return gen code as utf8", function () {
		const decoded = decodeString("ZHluYW1pYyBkYXRhIG1vY2s=");

		assert.equal(decoded, "dynamic data mock");
	});

	it("should return dynamic data objects as strings", function () {
		const dynamicValueString = setDynamicDataString([
			{
				creative: "data.url",
				dynamicContent: "data[0].Data_Url",
			},
		]);

		assert.equal(
			dynamicValueString,
			"creative.data.url = dynamicContent.data[0].Data_Url;\n"
		);
	});

	it("should throw an error if dynamic data object does not have 2 properties", function (t) {
		assert.throws(
			function () {
				setDynamicDataString([{
					"creative" : "data.url"
				 }]);
			},
			{
				name: "Error",
				message: "\x1B[33mBoth creative and dynamicContent properties must be present\x1B[39m",
			}
		);
	});
});

describe("config data integration tests", function () {
	before(async function () {
		await fse.writeJSON(testJsonPath, {
			genCode:
				"TG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQgY29uc2VjdGV0dXIgYWRpcGlzaWNpbmcgZWxpdC4=",
			dynamicData: [
				{
					creative: "data.url",
					dynamicContent: "data[0].Data_Url",
				},
				{
					creative: "exit.url",
					dynamicContent: "data[0].Exit_Url.Url",
				},
			],
			sizes: ["300x600"],
		});

		await fse.writeJSON(invalidSizePath, {
			genCode: "TG9",
			dynamicData: [],
			sizes: ["300x600", " "],
		});
	});

	after(function () {
		fse.unlink(testJsonPath);
		fse.unlink(invalidSizePath);
	});

	it("should read json data", function () {
		const data = getConfigValues(testJsonPath);

		assert.deepEqual(data, {
			genCode: "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
			dynamicData:
				"creative.data.url = dynamicContent.data[0].Data_Url;\n  creative.exit.url = dynamicContent.data[0].Exit_Url.Url;\n",
			sizes: ["300x600"],
		});
	});

	it("should throw error if path is invalid", function () {
		assert.throws(
			function () {
				getConfigValues("./wrongpath.json");
			},
			{
				name: "Error",
				message: /no such file or directory/,
			}
		);
	});

	it("should log and exit if there is no size input", function (t) {
		t.mock.method(console, "log");

		t.mock.method(process, "exit", function throwExit() {
			throw new Error("process.exit called");
		});

		assert.throws(
			function () {
				getConfigValues(invalidSizePath);
			},
			{
				name: "Error",
				message: "Error: process.exit called",
			}
		);

		const call = console.log.mock.calls[0];
		const redConsoleLog =
			"\x1B[31mAll sizes must be valid and at least one is required\x1B[39m";

		assert.strictEqual(call.arguments[0], redConsoleLog);

		t.mock.reset();
	});
});
