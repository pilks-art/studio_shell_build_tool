import test from "node:test";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decodeString, setDynamicDataString } from "./index.js";

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
			}
		]);

		assert.equal(
			dynamicValueString,
			'creative.data.url = dynamicContent.data[0].Data_Url;\n'
		);
	});
});

describe("integration tests", function () {
    it("", function (){

    })
})
