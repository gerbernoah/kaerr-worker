export { service as auth } from "./auth";


export type Service = {
	path: string;
	fetch: (
		request: Request,
		env: Env,
		ctx: ExecutionContext,
		subPath: string,
	) => Promise<Response | undefined>;
};