import { expect, it, describe } from "vitest";
import { z } from "zod";
import { zodToCode } from "../src/index.js";
import { evalSchema } from "./utils/evalZodSchema.js";
import { expectSchemaShape } from "./utils/expectSchemaShape.js";

describe("Union type generation", () => {
	it("should generate valid syntax for complex unions", () => {
		// Create a complex union similar to JSON types from Drizzle
		const complexUnion = z
			.union([
				z.union([z.string(), z.number(), z.boolean(), z.null()]),
				z.record(z.string(), z.any()),
				z.array(z.any()),
			])
			.nullable();

		const generatedCode = zodToCode(complexUnion);

		// Test 1: Should not contain invalid .or() syntax with multiple arguments
		expect(generatedCode).not.toMatch(/\.or\([^)]+,[^)]+\)/);

		// Test 2: Generated code should be valid and executable
		expect(() => {
			new Function("z", `return ${generatedCode}`)(z);
		}).not.toThrow();

		// Test 3: Should use z.union([...]) syntax for multiple options
		expect(generatedCode).toMatch(/z\.union\(\[/);

		// Test 4: Verify the schema still works as expected
		const computedSchema = evalSchema(generatedCode);
		expectSchemaShape(complexUnion).from(computedSchema);
	});

	it("should handle simple unions correctly", () => {
		const simpleUnion = z.union([z.string(), z.number(), z.boolean()]);

		const generatedCode = zodToCode(simpleUnion);

		// Should not contain invalid .or() syntax with multiple arguments
		expect(generatedCode).not.toMatch(/\.or\([^)]+,[^)]+\)/);

		// Should use z.union([...]) syntax
		expect(generatedCode).toMatch(/z\.union\(\[/);

		// Generated code should be valid
		expect(() => {
			new Function("z", `return ${generatedCode}`)(z);
		}).not.toThrow();

		// Verify the schema still works as expected
		const computedSchema = evalSchema(generatedCode);
		expectSchemaShape(simpleUnion).from(computedSchema);
	});

	it("should handle nested unions correctly", () => {
		const nestedUnion = z.union([z.string(), z.union([z.number(), z.boolean()]), z.null()]);

		const generatedCode = zodToCode(nestedUnion);

		// Should not contain invalid .or() syntax with multiple arguments
		expect(generatedCode).not.toMatch(/\.or\([^)]+,[^)]+\)/);

		// Should use z.union([...]) syntax
		expect(generatedCode).toMatch(/z\.union\(\[/);

		// Generated code should be valid
		expect(() => {
			new Function("z", `return ${generatedCode}`)(z);
		}).not.toThrow();

		// Verify the schema still works as expected
		const computedSchema = evalSchema(generatedCode);
		expectSchemaShape(nestedUnion).from(computedSchema);
	});

	it("should handle union with two options using z.union syntax", () => {
		const twoOptionUnion = z.union([z.string(), z.number()]);

		const generatedCode = zodToCode(twoOptionUnion);

		// Should use z.union([...]) syntax instead of .or()
		expect(generatedCode).toMatch(/z\.union\(\[/);
		expect(generatedCode).toContain("z.string()");
		expect(generatedCode).toContain("z.number()");

		// Generated code should be valid
		expect(() => {
			new Function("z", `return ${generatedCode}`)(z);
		}).not.toThrow();

		// Verify the schema still works as expected
		const computedSchema = evalSchema(generatedCode);
		expectSchemaShape(twoOptionUnion).from(computedSchema);
	});
});
