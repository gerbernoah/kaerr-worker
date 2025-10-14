import { getPathsForPair } from "../../utils/knowledge_graph";
import { KAERRInference, type RankInput } from "../../utils/model";

/**
 * Predict the match of a single material-project pair
 * @param projectId The project ID
 * @param materialId The material ID
 * @returns Percentage indicating the match quality
 */
export type OneOneResponse =
	| {
			error: false;
			percentage: number;
	  }
	| {
			error: true;
			message: string;
	  };
export type OneOnePayload = {
	materialId: string;
	projectId: string;
};
export async function predictDirectMatch(
	payload: OneOnePayload,
): Promise<OneOneResponse> {
	const { materialId, projectId } = payload;

	if (!materialId) {
		return { error: true, message: "materialId is required" };
	}

	if (!projectId) {
		return { error: true, message: "projectId is required" };
	}

	const model = new KAERRInference();
	await model.initialize("kaerr_model.onnx");

	const paths: RankInput[] = [
		{
			projectId,
			materialId,
			pathData: getPathsForPair(materialId, projectId),
		},
	];

	const rankedResults = await model.rank(paths);
	const percentage =
		rankedResults.length === 0 ? 0 : rankedResults[0].percentage;

	return { error: false, percentage };
}

/**
 * Predict and rank projects for a given material
 * @param materialId The material ID to find projects for
 * @param projectIds Candidate project IDs to rank
 * @returns Ranked list of projects with percentages
 */
type ProjectResult = {
	projectId: string;
	percentage: number;
};
export type ProjectsForMaterialPayload = {
	materialId: string;
	projectIds?: string[];
};
export type ProjectsForMaterialResponse =
	| {
			error: false;
			projects: ProjectResult[];
	  }
	| { error: true; message: string };
export async function predictProjectsForMaterial(
	payload: ProjectsForMaterialPayload,
): Promise<ProjectsForMaterialResponse> {
	const { materialId, projectIds } = payload;

	if (!materialId) {
		return { error: true, message: "materialId is required" };
	}

	if (!projectIds || projectIds.length === 0) {
		//TODO: crawl from db to get all project ids
		return { error: true, message: "projectIds are required" };
	}

	const model = new KAERRInference();
	await model.initialize("kaerr_model.onnx");

	const paths: RankInput[] = projectIds.map((projectId) => ({
		projectId: projectId,
		materialId: materialId,
		pathData: getPathsForPair(materialId, projectId),
	}));

	const rankedResults = await model.rank(paths);
	var projectResults = rankedResults.map((result) => ({
		projectId: result.projectId,
		percentage: result.percentage,
	}));

	return { error: false, projects: projectResults };
}

/**
 * Predict and rank projects for a given material
 * @param projectId The project ID to find materials for
 * @param materialIds Candidate material IDs to rank
 * @returns Ranked list of materials with scores
 */
type MaterialResult = {
	materialId: string;
	percentage: number;
};
export type MaterialsForProjectPayload = {
	projectId: string;
	materialIds?: string[];
};
export type MaterialsForProjectResponse =
	| {
			error: false;
			materials: MaterialResult[];
	  }
	| { error: true; message: string };
export async function predictMaterialsForProject(
	payload: MaterialsForProjectPayload,
): Promise<MaterialsForProjectResponse> {
	const { projectId, materialIds } = payload;

	if (!projectId) {
		return { error: true, message: "projectId is required" };
	}

	if (!materialIds || materialIds.length === 0) {
		return { error: true, message: "materialIds are required" };
	}

	const model = new KAERRInference();
	await model.initialize("kaerr_model.onnx");

	const paths: RankInput[] = materialIds.map((materialId) => ({
		projectId: projectId,
		materialId: materialId,
		pathData: getPathsForPair(materialId, projectId),
	}));

	const rankedResults = await model.rank(paths);
	const materialResults: MaterialResult[] = rankedResults.map((result) => ({
		materialId: result.materialId,
		percentage: result.percentage,
	}));

	return { error: false, materials: materialResults };
}

/**
 * Predict and rank materials for multiple projects
 * @param materialId Array of material IDs
 * @param projectIds Array of project IDs
 * @returns Ranked list of material and project pairs with percentages
 */
type MultiMatchResult = {
	projectId: string;
	materialId: string;
	percentage: number;
};
export type MultiMatchResponse =
	| {
			error: false;
			matches: MultiMatchResult[];
	  }
	| { error: true; message: string };
export type MultiMatchPayload = {
	materialId: string[];
	projectIds: string[];
};
export async function predictMultiMatch(
	payload: MultiMatchPayload,
): Promise<MultiMatchResponse> {
	const { materialId, projectIds } = payload;

	if (!materialId || materialId.length === 0) {
		return { error: true, message: "materialIds are required" };
	}

	if (!projectIds || projectIds.length === 0) {
		return { error: true, message: "projectIds are required" };
	}

	const model = new KAERRInference();
	await model.initialize("kaerr_model.onnx");

	const paths: RankInput[] = [];
	for (const mId of materialId) {
		for (const pId of projectIds) {
			paths.push({
				projectId: pId,
				materialId: mId,
				pathData: getPathsForPair(mId, pId),
			});
		}
	}

	const rankedResults = await model.rank(paths);
	const multiMatchResults: MultiMatchResult[] = rankedResults.map((result) => ({
		projectId: result.projectId,
		materialId: result.materialId,
		percentage: result.percentage,
	}));

	return { error: false, matches: multiMatchResults };
}
