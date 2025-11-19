import { protectedProcedure } from "../index";
import { z } from "zod";
import { generateUploadUrl, generateViewUrl } from "../lib/s3";

export const uploadRouter = {
	generateSignedUrl: protectedProcedure
		.input(
			z.object({
				fileName: z.string(),
				fileType: z.string(),
				fileSize: z.number(),
			})
		)
		.handler(async ({ input }) => {
			try {
				const result = await generateUploadUrl({
					fileName: input.fileName,
					fileType: input.fileType,
					fileSize: input.fileSize,
				});

				return result;
			} catch (error: any) {
				console.error("Error generating upload URL:", error);
				throw new Error(
					error.message || "Failed to generate upload URL. Please check AWS credentials and configuration."
				);
			}
		}),
	generateViewUrl: protectedProcedure
		.input(
			z.object({
				s3Url: z.string(),
			})
		)
		.handler(async ({ input }) => {
			try {
				const viewUrl = await generateViewUrl(input.s3Url);
				return { viewUrl };
			} catch (error: any) {
				console.error("Error generating view URL:", error);
				throw new Error(
					error.message || "Failed to generate view URL. Please check AWS credentials and configuration."
				);
			}
		}),
};
