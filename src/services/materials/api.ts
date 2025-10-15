const MATERIAL_KV_PREFIX = "MATERIALS";

type MATERIAL_KV = {
	id: string;
	name?: string;
	description?: string;
};

export type MaterialResponse = {
	id: string;
	name?: string;
	description?: string;
};

export type MaterialListResponse =
	| { error: false; materials: MaterialResponse[] }
	| { error: true; message: string };

export async function listMaterials(env: Env): Promise<MaterialListResponse> {
	try {
		const materialIds = await env.DATA.list({
			prefix: `${MATERIAL_KV_PREFIX}/`,
		});

		const materialsKV = await Promise.all(
			materialIds.keys.map(
				(key) => env.DATA.get(key.name, "json") as Promise<MATERIAL_KV>,
			),
		);

		const materials: MaterialResponse[] = materialsKV.map((material) => ({
			id: material.id,
			name: material.name ?? "",
			description: material.description ?? "",
		}));

		return { error: false, materials };
	} catch (_error) {
		return { error: true, message: "Error retrieving materials" };
	}
}

export type MaterialGetResponse =
	| { error: false; material: MaterialResponse }
	| { error: true; message: string };

export async function getMaterialById(
	id: string,
	env: Env,
): Promise<MaterialGetResponse> {
	try {
		const material: MATERIAL_KV | null = await env.DATA.get(
			`${MATERIAL_KV_PREFIX}/${id}`,
			"json",
		);

		if (!material) {
			return { error: true, message: "Material not found" };
		}

		return { error: false, material };
	} catch (_error) {
		return { error: true, message: "Error retrieving material" };
	}
}

export type MaterialCreatePayload = {
	name?: string;
	description?: string;
};
export type MaterialCreateResponse =
	| { error: false; material: MaterialResponse }
	| { error: true; message: string };
export async function createMaterial(
	payload: MaterialCreatePayload,
	env: Env,
): Promise<MaterialCreateResponse> {
	const { name, description } = payload;

	const id = crypto.randomUUID();
	const encodedId = encodeURIComponent(id);

	const material: MATERIAL_KV = { id, name, description };

	try {
		await env.DATA.put(
			`${MATERIAL_KV_PREFIX}/${encodedId}`,
			JSON.stringify(material),
		);

		const createdMaterial: MaterialResponse = {
			id: material.id,
			name: material.name,
			description: material.description,
		};

		return { error: false, material: createdMaterial };
	} catch (_error) {
		return { error: true, message: "Failed to create material" };
	}
}

export type MaterialUpdatePayload = {
	id: string;
	name?: string;
	description?: string;
};
export type MaterialUpdateResponse =
	| { error: false; material: MaterialResponse }
	| { error: true; message: string };

export async function updateMaterial(
	payload: MaterialUpdatePayload,
	env: Env,
): Promise<MaterialUpdateResponse> {
	const { id, name, description } = payload;
	const encodedId = encodeURIComponent(id);

	try {
		const existingMaterial: MATERIAL_KV | null = await env.DATA.get(
			`${MATERIAL_KV_PREFIX}/${encodedId}`,
			"json",
		);

		if (!existingMaterial) {
			return { error: true, message: "Material not found" };
		}

		const updatedMaterial: MATERIAL_KV = {
			...existingMaterial,
			name: name ?? existingMaterial.name,
			description: description ?? existingMaterial.description,
		};

		await env.DATA.put(
			`${MATERIAL_KV_PREFIX}/${encodedId}`,
			JSON.stringify(updatedMaterial),
		);

		const responseMaterial: MaterialResponse = {
			id: updatedMaterial.id,
			name: updatedMaterial.name,
			description: updatedMaterial.description,
		};

		return { error: false, material: responseMaterial };
	} catch (_error) {
		return { error: true, message: "Failed to update material" };
	}
}

export type MaterialDeletePayload = { id: string };
export type MaterialDeleteResponse =
	| { error: false }
	| { error: true; message: string };

export async function deleteMaterial(
	payload: MaterialDeletePayload,
	env: Env,
): Promise<MaterialDeleteResponse> {
	const { id } = payload;
	const encodedId = encodeURIComponent(id);

	try {
		await env.DATA.delete(`${MATERIAL_KV_PREFIX}/${encodedId}`);
		return { error: false };
	} catch (_error) {
		return { error: true, message: "Failed to delete material" };
	}
}
