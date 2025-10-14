import type { Service } from "..";
import { authenticateToken } from "../auth";
import {
	type MaterialsForProjectPayload,
	type OneOnePayload,
	type OneOneResponse,
	predictDirectMatch,
	predictMaterialsForProject,
} from "./api";

export const service: Service = {
	path: "/v1/kaerr",
	fetch: async (
		request: Request,
		env: Env,
		// biome-ignore lint/correctness/noUnusedFunctionParameters: cloudflare funciton definition
		ctx: ExecutionContext,
		subPath: string,
	): Promise<Response | undefined> => {
		const authContext = await authenticateToken(request.headers, env);

		//if (authContext instanceof Response) return authContext;

		console.log("subPath: ", subPath);

		switch (subPath) {
			case "/one-one": {
				const payload = await request.json<OneOnePayload>();

				const result: OneOneResponse = await predictDirectMatch(payload);
				const status = result.error ? 400 : 200;

				return new Response(JSON.stringify(result), {
					status: status,
					headers: { "Content-Type": "application/json" },
				});
			}

			case "/materials-for-project": {
				const payload = await request.json<MaterialsForProjectPayload>();

				const result = await predictMaterialsForProject(payload);
				const status = result.error ? 400 : 200;

				return new Response(JSON.stringify(result), {
					status: status,
					headers: { "Content-Type": "application/json" },
				});
			}
		}
	},
};
