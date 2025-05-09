import { z } from "zod";
import { UnsupportedZodEffectError, UnsupportedZodFunctionError, UnsupportedZodTypeError } from "./errors.js";
import { zodFieldToString } from "./utils.js";

/**
 * Converts a Zod schema object into its string representation in code.
 * This function recursively processes Zod objects and their nested properties,
 * generating TypeScript/JavaScript code that recreates the same Zod schema.
 *
 * @param {z.ZodTypeAny} zodObject - The Zod schema object to convert to code
 * @param {number} [indent=0] - The current indentation level for code formatting
 * @returns {string} The string representation of the Zod schema in code
 * @throws {UnsupportedZodTypeError} When encountering an unsupported Zod type
 * @throws {UnsupportedZodFunctionError} When encountering an unsupported Zod function
 * @throws {UnsupportedZodEffectError} When encountering an unsupported Zod effect
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number()
 * });
 * const code = zodToCode(schema);
 * // Result:
 * // z.object({
 * //   name: z.string(),
 * //   age: z.number()
 * // })
 * ```
 */
export const zodToCode = (zodObject: z.ZodTypeAny, indent = 0) => {
	// If it's not an object, use zodFieldToString directly
	if (zodObject._def.typeName !== z.ZodFirstPartyTypeKind.ZodObject) {
		return zodFieldToString(zodObject, indent);
	}

	// Now we know it's a ZodObject
	const objectType = zodObject as z.ZodObject<z.ZodRawShape>;
	const shape = objectType.shape;
	const entries = Object.entries(shape).map(([key, value]) => {
		return `${"  ".repeat(indent + 1)}${key}: ${zodFieldToString(value, indent + 1)}`;
	});
	return `z.object({\n${entries.join(",\n")}\n${"  ".repeat(indent)}})`;
};

/**
 * Error thrown when encountering an unsupported Zod type during code generation.
 * @extends Error
 */
export { UnsupportedZodTypeError };

/**
 * Error thrown when encountering an unsupported Zod function during code generation.
 * @extends Error
 */
export { UnsupportedZodFunctionError };

/**
 * Error thrown when encountering an unsupported Zod effect during code generation.
 * @extends Error
 */
export { UnsupportedZodEffectError };
