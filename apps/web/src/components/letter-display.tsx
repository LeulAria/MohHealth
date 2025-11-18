"use client";

import {
	Box,
	Paper,
	TextField,
	Typography,
	Divider,
} from "@mui/material";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { ReadOnlyEditorKit } from "@/components/editor/readonly-editor-kit";
import type { Value } from "platejs";

interface LetterDisplayProps {
	letter: {
		id: string;
		type: "internal" | "external";
		referenceNumber?: string | null;
		date?: Date | string | null;
		to?: string | null;
		from: string;
		subject?: string | null;
		content?: Value | null;
		attachments?: any;
		status?: string | null;
		stampedBy?: string | null;
		stampedAt?: Date | string | null;
	};
}

export default function LetterDisplay({ letter }: LetterDisplayProps) {
	const isInternal = letter.type === "internal";

	// Initialize editor with letter content
	const editorContent = letter.content && Array.isArray(letter.content) && letter.content.length > 0
		? (letter.content as Value)
		: [
			{
				type: "p",
				children: [{ text: "" }],
			},
		];

	const editor = usePlateEditor({
		plugins: ReadOnlyEditorKit,
		value: editorContent,
		readOnly: true,
	});

	// Format date
	const formattedDate = letter.date
		? new Date(letter.date).toLocaleDateString("am-ET", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			})
		: "";

	const year = letter.date ? new Date(letter.date).getFullYear() : 2018;

	const isStamped = letter.status === "stamped" && letter.stampedAt;

	return (
		<Box sx={{ p: 3, position: "relative" }}>
			<Paper
				sx={{
					p: 4,
					border: "2px solid",
					borderColor: "text.primary",
					maxWidth: 900,
					mx: "auto",
					bgcolor: "background.paper",
					position: "relative",
				}}
			>
				{/* Header */}
				<Box sx={{ mb: 3 }}>
					<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
						<Box>
							<Typography 
								variant="h6" 
								sx={{ 
									mb: 0.5,
									fontFamily: '"Roboto", "Arial", "Helvetica", sans-serif',
								}}
							>
								Health System Innovation and Quality LEO
							</Typography>
							<Typography variant="body2">
								የጤና ኢኖቬሽንና ጥራት መሪ ስራ አስፈፃሚ
							</Typography>
						</Box>
						{/* Reference Number and Date - Top Right */}
						<Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-end" }}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Typography variant="body2">ቁጥር:-</Typography>
								<Typography variant="body2" sx={{ minWidth: 120, textAlign: "right" }}>
									{letter.referenceNumber || "ጠ/ሥ/ሥ/ጥ/መ/ስ/አ/"}
								</Typography>
								<Typography variant="body2">/{year}</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Typography variant="body2">ቀን:-</Typography>
								<Typography variant="body2" sx={{ minWidth: 120, textAlign: "right" }}>
									{formattedDate || ""}
								</Typography>
								<Typography variant="body2">/{year} ዓ.ም.</Typography>
							</Box>
						</Box>
					</Box>
					<Divider sx={{ mb: 2 }} />
					{isInternal && (
						<Typography variant="h5" sx={{ textAlign: "center", mb: 3, fontWeight: 600 }}>
							የቢሮ ማስታወሻ
						</Typography>
					)}
				</Box>

				{/* Form Fields */}
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
					{/* To Field */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
						<Typography variant="body1" sx={{ minWidth: 50, fontWeight: 500 }}>
							ለ:
						</Typography>
						<Typography variant="body1" sx={{ flex: 1 }}>
							{letter.to || "-"}
						</Typography>
					</Box>

					{/* From Field */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
						<Typography variant="body1" sx={{ minWidth: 50, fontWeight: 500 }}>
							ከ:
						</Typography>
						<Typography variant="body1" sx={{ flex: 1 }}>
							{letter.from}
						</Typography>
					</Box>

					{/* Subject Field */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
						<Typography variant="body1" sx={{ minWidth: 50, fontWeight: 500 }}>
							ጉዳዩ:
						</Typography>
						<Typography variant="body1" sx={{ flex: 1 }}>
							{letter.subject || "-"}
						</Typography>
					</Box>

					{/* Attachments - Only for external */}
					{!isInternal && letter.attachments && (
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography variant="body2">አባሪዎች:</Typography>
							<Typography variant="body2">
								{typeof letter.attachments === "object" && letter.attachments.count
									? letter.attachments.count
									: "-"}
							</Typography>
						</Box>
					)}

					{/* Content Label */}
					<Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
						የደብዳቤው ይዘት
					</Typography>

					{/* WYSIWYG Editor - Read Only */}
					<Box
						sx={{
							minHeight: 400,
							p: 0,
							bgcolor: "transparent",
						}}
					>
						<Plate editor={editor}>
							<PlateContent
								readOnly
								style={{
									minHeight: 400,
									outline: "none",
								}}
							/>
						</Plate>
					</Box>

					{/* Closing */}
					<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
						<Typography variant="body2">ከሰላምታ ጋር</Typography>
					</Box>
				</Box>

				{/* Stamp Image - Absolutely Positioned */}
				{isStamped && (
					<Box
						sx={{
							position: "absolute",
							bottom: 80,
							right: 60,
							width: 120,
							height: 120,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 10,
						}}
					>
						<Box
							sx={{
								width: "100%",
								height: "100%",
								borderRadius: "50%",
								border: "3px solid #005EB8",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: "rgba(255, 255, 255, 0.95)",
								boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
								position: "relative",
							}}
						>
							<Box
								sx={{
									width: "90%",
									height: "90%",
									borderRadius: "50%",
									border: "2px solid #005EB8",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									p: 1,
								}}
							>
								<Typography
									variant="caption"
									sx={{
										fontSize: "0.7rem",
										fontWeight: 700,
										color: "#005EB8",
										textAlign: "center",
										lineHeight: 1.2,
									}}
								>
									ጤና ሚኒስቴር
								</Typography>
								<Typography
									variant="caption"
									sx={{
										fontSize: "0.6rem",
										fontWeight: 600,
										color: "#005EB8",
										textAlign: "center",
										mt: 0.5,
										lineHeight: 1.2,
									}}
								>
									ተማህቷል
								</Typography>
								{letter.stampedAt && (
									<Typography
										variant="caption"
										sx={{
											fontSize: "0.5rem",
											fontWeight: 500,
											color: "#005EB8",
											textAlign: "center",
											mt: 0.3,
											lineHeight: 1.2,
										}}
									>
										{new Date(letter.stampedAt).toLocaleDateString("am-ET", {
											year: "numeric",
											month: "2-digit",
											day: "2-digit",
										})}
									</Typography>
								)}
							</Box>
						</Box>
					</Box>
				)}
			</Paper>
		</Box>
	);
}

