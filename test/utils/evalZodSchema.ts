import { z } from "zod";

const evalSchema = (code: string) => {
	const fn = new Function("z", `return ${code}`);
	return fn(z);
};

export { evalSchema };
