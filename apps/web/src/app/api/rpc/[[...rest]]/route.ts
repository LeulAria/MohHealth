import { createContext } from "@my-better-t-app/api/context";
import { appRouter } from "@my-better-t-app/api/routers/index";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { NextRequest } from "next/server";

const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});
const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

async function handleRequest(
	req: NextRequest,
	context: { params: Promise<Record<string, string | string[]>> }
) {
	// Type cast to work around Next.js version mismatch
	const request = req as any;
	const rpcResult = await rpcHandler.handle(request, {
		prefix: "/api/rpc",
		context: await createContext(request),
	});
	if (rpcResult.response) return rpcResult.response;

	const apiResult = await apiHandler.handle(request, {
		prefix: "/api/rpc/api-reference",
		context: await createContext(request),
	});
	if (apiResult.response) return apiResult.response;

	return new Response("Not found", { status: 404 });
}

export async function GET(
	req: NextRequest,
	context: { params: Promise<Record<string, string | string[]>> }
) {
	return handleRequest(req, context);
}

export async function POST(
	req: NextRequest,
	context: { params: Promise<Record<string, string | string[]>> }
) {
	return handleRequest(req, context);
}

export async function PUT(
	req: NextRequest,
	context: { params: Promise<Record<string, string | string[]>> }
) {
	return handleRequest(req, context);
}

export async function PATCH(
	req: NextRequest,
	context: { params: Promise<Record<string, string | string[]>> }
) {
	return handleRequest(req, context);
}

export async function DELETE(
	req: NextRequest,
	context: { params: Promise<Record<string, string | string[]>> }
) {
	return handleRequest(req, context);
}
