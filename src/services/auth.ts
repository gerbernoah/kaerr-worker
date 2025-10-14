import { hash, signJWT, verifyJWT } from "../crypto";
import type { Service } from ".";

const ACCOUNT_KV_PREFIX = "ACCOUNTS";

type AccountKV = {
	username: string;
	password: string;
};

type SignUpPayload = {
	username: string;
	password: string;
};

type SignInPayload = {
	username: string;
	password: string;
};

type AuthTokenResponse = {
	token: string;
};

export type JWTPayload = {
	iat: number;
	jti: string;
	username: string;
};

export const service: Service = {
	path: "/v1/auth/",
	fetch: async (
		request: Request,
		env: Env,
		// biome-ignore lint/correctness/noUnusedFunctionParameters: cloudflare funciton definition
		ctx: ExecutionContext,
		subPath: string,
	): Promise<Response | undefined> => {
		const authContext = await authenticateToken(request.headers, env);

		switch (`${request.method} /${subPath.split("/")[0]}`) {
			case "POST /signup": {
				//return new Response('Signup disabled', { status: 409 });

				const { username, password } = await request.json<SignUpPayload>();
				const encodedUsername = encodeURIComponent(username);

				const oldUser: AccountKV | null = await env.DATA.get(
					`${ACCOUNT_KV_PREFIX}/${encodedUsername}`,
					"json",
				);
				if (oldUser)
					return new Response("User already exists", { status: 400 });

				const user: AccountKV = {
					username,
					password: await hash(password),
				};

				await env.DATA.put(
					`${ACCOUNT_KV_PREFIX}/${encodedUsername}`,
					JSON.stringify(user),
				);
				return new Response("User registered successfully", { status: 201 });
			}
			case "POST /signin": {
				const { username, password } = await request.json<SignInPayload>();
				const encodedUsername = encodeURIComponent(username);

				const user: AccountKV | null = await env.DATA.get(
					`${ACCOUNT_KV_PREFIX}/${encodedUsername}`,
					"json",
				);
				if (!user) return new Response("User not found", { status: 400 });

				if (user.password !== (await hash(password)))
					return new Response("Invalid password", { status: 400 });

				const payload: JWTPayload = {
					iat: Date.now(),
					jti: crypto.randomUUID(),
					username,
				};
				const token = await signJWT(payload, env.JWT_SECRET);

				const response: AuthTokenResponse = { token };
				return new Response(JSON.stringify(response), { status: 200 });
			}
			case "GET /": {
				if (authContext instanceof Response) return authContext;
				return new Response("Authenticated", { status: 200 });
			}
		}
	},
};

export async function authenticateToken(
	headers: Headers,
	env: Env,
): Promise<JWTPayload | Response> {
	const authHeader = headers.get("Authorization");
	if (!authHeader) return new Response("Invalid token", { status: 401 });

	const token = authHeader.split(" ")[1];
	const context = await verifyJWT<JWTPayload>(token, env.JWT_SECRET);

	if (!context) {
		return new Response("Invalid token", { status: 401 });
	}

	return context;
}
