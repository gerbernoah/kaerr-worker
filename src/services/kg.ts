import {
	getPathsForPair,
	type KGPath,
	type PathData,
} from "../util/kg-generator";
import type { Service } from ".";
import { authenticateToken } from "./auth";

type OneOnePayload = {
	materialId: string;
	projectId: string;
};
type OneOneResponse = {
	materialId: string;
	projectId: string;
	paths: KGPath[];
};

export type MaterialsForProjectPayload = {
	materialIds: string[];
	projectId: string;
};
export type MaterialsForProjectResponse = {
	materialId: string;
	projectId: string;
	paths: KGPath[];
}[];

export type ProjectsForMaterialPayload = {
	materialId: string;
	projectIds: string[];
};
export type ProjectResult = {
	materialId: string;
	projectId: string;
	paths: KGPath[];
};

type MultiMatchPayload = {
	materialIds: string[];
	projectIds: string[];
};
type MultiMatchResponse = {
	materialId: string;
	projectId: string;
	paths: KGPath[];
}[];

export const service: Service = {
	path: "/v1/kg",
	fetch: async (
		request: Request,
		env: Env,
		// biome-ignore lint/correctness/noUnusedFunctionParameters: cloudflare funciton definition
		ctx: ExecutionContext,
		subPath: string,
	): Promise<Response | undefined> => {
		const authContext = await authenticateToken(request.headers, env);

		if (request.method === "GET" && subPath === "/health") {
			return new Response("KG service is up", { status: 200 });
		}

		if (request.method === "POST") {
			if (authContext instanceof Response) return authContext;

			switch (`${subPath}`) {
				case "POST /pair": {
					const { materialId, projectId } = await request.json<OneOnePayload>();
					if (!materialId) {
						return new Response("materialId is required", { status: 400 });
					}

					if (!projectId) {
						return new Response("projectId is required", { status: 400 });
					}

					const pathData: PathData = getPathsForPair(materialId, projectId);

					const result: OneOneResponse = {
						materialId,
						projectId,
						paths: pathData.paths,
					};

					return new Response(JSON.stringify(result), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				}

				case "/materials-for-project": {
					const { projectId, materialIds } =
						await request.json<MaterialsForProjectPayload>();

					if (!materialIds || materialIds.length === 0) {
						return new Response("materialIds are required", { status: 400 });
					}

					if (!projectId) {
						return new Response("projectId is required", { status: 400 });
					}

					const results: MaterialsForProjectResponse = [];

					for (const materialId of materialIds) {
						const pathData: PathData = getPathsForPair(materialId, projectId);
						results.push({
							materialId,
							projectId,
							paths: pathData.paths,
						});
					}

					return new Response(JSON.stringify(results), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				}

				case "/projects-for-material": {
					const { materialId, projectIds } =
						await request.json<ProjectsForMaterialPayload>();

					if (!materialId) {
						return new Response("materialId is required", { status: 400 });
					}

					if (!projectIds || projectIds.length === 0) {
						return new Response("projectIds are required", { status: 400 });
					}

					const results: ProjectResult[] = [];

					for (const projectId of projectIds) {
						const pathData: PathData = getPathsForPair(materialId, projectId);
						results.push({
							materialId,
							projectId,
							paths: pathData.paths,
						});
					}

					return new Response(JSON.stringify(results), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				}

				case "/multi-pair": {
					const { materialIds, projectIds } =
						await request.json<MultiMatchPayload>();

					if (!materialIds || materialIds.length === 0) {
						return new Response("materialIds are required", { status: 400 });
					}

					if (!projectIds || projectIds.length === 0) {
						return new Response("projectIds are required", { status: 400 });
					}

					const results: MultiMatchResponse = [];

					for (const materialId of materialIds) {
						for (const projectId of projectIds) {
							const pathData: PathData = getPathsForPair(materialId, projectId);
							results.push({
								materialId,
								projectId,
								paths: pathData.paths,
							});
						}
					}

					return new Response(JSON.stringify(results), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				}
			}
		}
	},
};
