export { service as auth } from "./auth";
export { service as kaerr } from "./kg";

export type Service = {
	path: string;
	fetch: (
		request: Request,
		env: Env,
		ctx: ExecutionContext,
		subPath: string,
	) => Promise<Response | undefined>;
};
