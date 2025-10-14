import * as ort from "onnxruntime-web";

export type KGPath = number[];

export type PathData = {
	paths: KGPath[]; // Up to 16 paths, each up to 7 elements (auto-calculates validPathNum)
};

export type RankedResult = {
	projectId: string;
	materialId: string;
	score: number;
	percentage: number;
};

export type RankInput = {
	projectId: string;
	materialId: string;
	pathData: PathData;
};

export class KAERRInference {
	private session: ort.InferenceSession | null = null;
	private readonly MAX_PATH_NUM = 16;
	private readonly MAX_PATH_LEN = 7;

	async initialize(modelPath = "kaerr_model.onnx") {
		console.log("Loading KAERR model...");
		this.session = await ort.InferenceSession.create(modelPath);
		console.log("✓ Model loaded successfully");
	}

	/**
	 * Score multiple material-project pairs in a batch
	 *
	 * @param pathDataList Array of path data for each pair
	 * @returns Array of scores
	 */
	private async scoreBatch(pathDataList: PathData[]): Promise<number[]> {
		if (!this.session) {
			throw new Error("Model not initialized. Call initialize() first.");
		}

		const batchSize = pathDataList.length;

		const pathArray = new BigInt64Array(
			batchSize * this.MAX_PATH_NUM * this.MAX_PATH_LEN,
		);

		const validPathNumArray = new BigInt64Array(batchSize);

		for (let b = 0; b < batchSize; b++) {
			const pathData = pathDataList[b];
			// Auto-calculate validPathNum from paths.length
			validPathNumArray[b] = BigInt(
				Math.min(pathData.paths.length, this.MAX_PATH_NUM),
			);

			const baseIdx = b * this.MAX_PATH_NUM * this.MAX_PATH_LEN;
			for (
				let i = 0;
				i < Math.min(pathData.paths.length, this.MAX_PATH_NUM);
				i++
			) {
				const path = pathData.paths[i];
				for (let j = 0; j < Math.min(path.length, this.MAX_PATH_LEN); j++) {
					pathArray[baseIdx + i * this.MAX_PATH_LEN + j] = BigInt(path[j]);
				}
			}
		}

		const feeds = {
			path: new ort.Tensor("int64", pathArray, [
				batchSize,
				this.MAX_PATH_NUM,
				this.MAX_PATH_LEN,
			]),
			valid_path_num: new ort.Tensor("int64", validPathNumArray, [batchSize]),
		};

		const results = await this.session.run(feeds);
		const scores = Array.from(results.score.data as Float32Array);

		return scores;
	}

	/**
	 * Rank candidates based on their knowledge graph paths
	 *
	 * This generic function works for any 1-to-many scenario:
	 * - Rank projects for a material
	 * - Rank materials for a project
	 * - Or any other entity-to-entity ranking
	 *
	 * @param candidates Array of {id, pathData} objects where pathData contains the KG paths,
	 * @param ids are just forwareded to return type
	 * @returns Ranked list with scores and percentages
	 */
	public async rank(candidates: RankInput[]): Promise<RankedResult[]> {
		const pathDataList = candidates.map((c) => c.pathData);

		const scores = await this.scoreBatch(pathDataList);

		const ranked = candidates.map((c, idx) => ({
			projectId: c.projectId,
			materialId: c.materialId,
			score: scores[idx],
			percentage: 0,
		}));

		ranked.sort((a, b) => b.score - a.score);

		const maxScore = ranked[0]?.score ?? 1;
		const minScore = ranked[ranked.length - 1]?.score ?? 0;
		const range = maxScore - minScore;

		return ranked.map((r) => ({
			...r,
			percentage: range === 0 ? 50 : ((r.score - minScore) / range) * 100,
		}));
	}
}
