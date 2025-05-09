export class UnsupportedZodTypeError extends Error {
	constructor(typeName: string) {
		super(`Unsupported Zod type: ${typeName}. This type is not supported by the code generator.`);
		this.name = "UnsupportedZodTypeError";
	}
}

export class UnsupportedZodFunctionError extends Error {
	constructor(functionName: string) {
		super(`Unsupported Zod function: ${functionName}. This function is not supported by the code generator.`);
		this.name = "UnsupportedZodFunctionError";
	}
}

export class UnsupportedZodEffectError extends Error {
	constructor(effectType: string) {
		super(`Unsupported Zod effect type: ${effectType}. This effect type is not supported by the code generator.`);
		this.name = "UnsupportedZodEffectError";
	}
}
