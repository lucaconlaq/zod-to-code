import { z } from "zod";
import { UnsupportedZodEffectError, UnsupportedZodFunctionError, UnsupportedZodTypeError } from "./errors.js";
import { basicTypeGenerators } from "./generators/basic.js";
import { complexTypeGenerators } from "./generators/complex.js";
import { modifierGenerators } from "./generators/modifiers.js";
import { validationCheckGenerators } from "./generators/validation.js";

export const zodFieldToString = (field: z.ZodTypeAny, indent = 0): string => {
	let baseType = "";

	// Handle basic types
	if (field._def.typeName in basicTypeGenerators) {
		baseType = basicTypeGenerators[field._def.typeName as keyof typeof basicTypeGenerators]();
	}
	// Handle modifiers
	else if (field._def.typeName in modifierGenerators) {
		return modifierGenerators[field._def.typeName as keyof typeof modifierGenerators](field, indent);
	}
	// Handle complex types
	else if (field._def.typeName in complexTypeGenerators) {
		baseType = complexTypeGenerators[field._def.typeName as keyof typeof complexTypeGenerators](field, indent);
	}
	// Handle effects
	else if (field._def.typeName === z.ZodFirstPartyTypeKind.ZodEffects) {
		if (field._def.effect.type === "describe") {
			const innerType = zodFieldToString(field._def.innerType, indent);
			return `${innerType}.describe("${field._def.effect.description}")`;
		}
		if (field._def.effect.type === "transform") {
			throw new UnsupportedZodEffectError("transform");
		}
		if (field._def.effect.type === "refinement") {
			throw new UnsupportedZodFunctionError("refine");
		}
		throw new UnsupportedZodEffectError(field._def.effect.type);
	} else {
		throw new UnsupportedZodTypeError(field._def.typeName);
	}

	// Handle refinements
	if (field._def.checks) {
		for (const check of field._def.checks) {
			if (check.kind in validationCheckGenerators) {
				baseType += validationCheckGenerators[check.kind as keyof typeof validationCheckGenerators](
					check.value ?? check.regex,
				);
			} else {
				throw new UnsupportedZodFunctionError(check.kind);
			}
		}
	}

	return baseType;
};
