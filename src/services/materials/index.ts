import type { Service } from "..";
import { authenticateToken } from "../auth";
import {
	createMaterial,
	deleteMaterial,
	listMaterials,
	type MaterialCreatePayload,
	type MaterialDeletePayload,
	type MaterialUpdatePayload,
	updateMaterial,
} from "./api";

export const service: Service = {
	path: "/v1/materials",
	fetch: async (
		request: Request,
		env: Env,
		// biome-ignore lint/correctness/noUnusedFunctionParameters: cloudflare funciton definition
		ctx: ExecutionContext,
		subPath: string,
	): Promise<Response | undefined> => {
		const authContext = await authenticateToken(request.headers, env);

		if (request.method === "GET" && subPath === "/health") {
			return Response.json(
				{ message: "Materials service is up" },
				{ status: 200 },
			);
		}

		if (authContext instanceof Response) return authContext;

		switch (`${request.method} ${subPath}`) {
			case "GET /list": {
				const result = await listMaterials(env);

				if (result.error) {
					return Response.json({ message: result.message }, { status: 500 });
				}

				return Response.json({ message: result.materials }, { status: 200 });
			}
			case "POST /create": {
				const payload = await request.json<MaterialCreatePayload>();

				const result = await createMaterial(payload, env);

				if (result.error) {
					return Response.json({ message: result.message }, { status: 500 });
				}

				return Response.json({ message: result.material }, { status: 201 });
			}
			case "PUT /update": {
				const payload = await request.json<MaterialUpdatePayload>();

				const result = await updateMaterial(payload, env);

				if (result.error) {
					return Response.json({ message: result.message }, { status: 404 });
				}

				return Response.json({ message: result.material }, { status: 200 });
			}
			case "DELETE /delete": {
				const payload = await request.json<MaterialDeletePayload>();

				const result = await deleteMaterial(payload, env);

				if (result.error) {
					return Response.json({ message: result.message }, { status: 404 });
				}

				return Response.json(null, { status: 204 });
			}
		}
	},
};
