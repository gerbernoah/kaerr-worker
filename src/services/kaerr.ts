import type { Service } from ".";
import { authenticateToken } from "./auth";

export const service: Service = {
	path: "/v1/kaerr/",
	fetch: async (
		request: Request,
		env: Env,
		// biome-ignore lint/correctness/noUnusedFunctionParameters: cloudflare funciton definition
		ctx: ExecutionContext,
		subPath: string,
	): Promise<Response | undefined> => {
		const authContext = await authenticateToken(request.headers, env);

		if (authContext instanceof Response) return authContext;

		switch (subPath) {
			case "/":
				return new Response("Hello from Kaerr service", { status: 200 });
		}
	},
};
