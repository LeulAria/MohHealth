import { createRouteHandler } from 'uploadthing/next';
import type { NextRequest } from 'next/server';

import { ourFileRouter } from '@/lib/uploadthing';

const { GET: getHandler, POST: postHandler } = createRouteHandler({ router: ourFileRouter });

export async function GET(request: NextRequest, context: { params: Promise<{}> }) {
	// Type cast to work around Next.js version mismatch
	return getHandler(request as any);
}

export async function POST(request: NextRequest, context: { params: Promise<{}> }) {
	// Type cast to work around Next.js version mismatch
	return postHandler(request as any);
}
