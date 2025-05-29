import { expect, it } from "vitest";
import { z } from "zod";
import { zodToCode } from "../src/index.js";
import { evalSchema } from "./utils/evalZodSchema.js";
import { expectSchemaShape } from "./utils/expectSchemaShape.js";

it("should generate enum values with proper quotes", () => {
	const originalSchema = z.object({
		// Test with simple enum values
		simpleEnum: z.enum(["foo", "bar"]),
		// Test with enum values containing quotes
		quotedEnum: z.enum(['"quoted"', '"nested"']),
		// Test with enum values containing special characters
		specialEnum: z.enum(['"special"', '"chars"']),
		// Test with nested object containing enum
		nested: z.object({
			enumField: z.enum(['"nested"', '"quotes"']),
		}),
	});

	const zodCode = zodToCode(originalSchema);

	// Verify the generated code doesn't contain HTML entities
	expect(zodCode).not.toContain("&quot;");

	// Verify the generated code contains proper quotes
	expect(zodCode).toContain('["foo", "bar"]');
	expect(zodCode).toContain('["\\"quoted\\"", "\\"nested\\""]');
	expect(zodCode).toContain('["\\"special\\"", "\\"chars\\""]');
	expect(zodCode).toContain('["\\"nested\\"", "\\"quotes\\""]');

	// Verify the schema still works as expected
	const computedSchema = evalSchema(zodCode);
	expectSchemaShape(originalSchema).from(computedSchema);
});
