"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
	Box,
	Paper,
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Typography,
	Button,
	Divider,
	InputAdornment,
} from "@mui/material";
import { toast } from "sonner";
import { Plate, PlateContent } from "platejs/react";
import { createPlateEditor } from "platejs/react";
import { EditorKit } from "@/components/editor/editor-kit";
import { type Value } from "platejs";

interface LetterFormProps {
	letterType: "internal" | "external";
	onBack: () => void;
}

export default function LetterForm({ letterType, onBack }: LetterFormProps) {
	const router = useRouter();
	const editor = useMemo(
		() => createPlateEditor({ plugins: EditorKit }),
		[],
	);
	const [editorValue, setEditorValue] = useState<Value>([
		{
			type: "p",
			children: [{ text: "" }],
		},
	]);
	const [formData, setFormData] = useState({
		referenceNumber: "",
		date: "",
		to: "",
		from: "ጤና ኢኖቬሽንና ጥራት መሪ ስራ አስፈፃሚ",
		subject: "",
		relevantBody: "",
		attachments: "",
	});

	const handleSubmit = async () => {
		// TODO: Save letter to database
		toast.success("ደብዳቤ ተቀምጧል");
		router.push("/dashboard");
	};

	const isInternal = letterType === "internal";

	return (
		<Paper
			sx={{
				p: 4,
				border: "2px solid",
				borderColor: "text.primary",
				maxWidth: 900,
				mx: "auto",
				bgcolor: "background.paper",
			}}
		>
			{/* Header */}
			<Box sx={{ mb: 3 }}>
				<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
					<Box>
						<Typography variant="h6" sx={{ mb: 0.5 }}>
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
							<TextField
								size="small"
								value={formData.referenceNumber}
								onChange={(e) =>
									setFormData({ ...formData, referenceNumber: e.target.value })
								}
								sx={{ width: 120 }}
								placeholder="ጠ/ሥ/ሥ/ጥ/መ/ስ/አ/"
								variant="standard"
								InputProps={{ disableUnderline: true }}
							/>
							<Typography variant="body2">/2018</Typography>
						</Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<Typography variant="body2">ቀን:-</Typography>
							<TextField
								size="small"
								type="date"
								value={formData.date}
								onChange={(e) => setFormData({ ...formData, date: e.target.value })}
								sx={{ width: 120 }}
								InputLabelProps={{ shrink: true }}
								variant="standard"
								InputProps={{ disableUnderline: true }}
							/>
							<Typography variant="body2">/2018 ዓ.ም.</Typography>
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
					<FormControl fullWidth>
						<Select
							value={formData.to}
							onChange={(e) => setFormData({ ...formData, to: e.target.value })}
							displayEmpty
							sx={{
								bgcolor: "background.paper",
								"& .MuiOutlinedInput-notchedOutline": {
									borderWidth: 1,
								},
							}}
						>
							<MenuItem value="" disabled>
								(Drop Down)
							</MenuItem>
							<MenuItem value="desk_head">ዴስክ ሃላፊ</MenuItem>
							<MenuItem value="expert">ኤክስፐርት</MenuItem>
							<MenuItem value="record_room">መዝገብ ክፍል</MenuItem>
						</Select>
					</FormControl>
				</Box>

				{/* From Field */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Typography variant="body1" sx={{ minWidth: 50, fontWeight: 500 }}>
						ከ:
					</Typography>
					<TextField
						fullWidth
						value={formData.from}
						onChange={(e) => setFormData({ ...formData, from: e.target.value })}
						sx={{
							bgcolor: "background.paper",
							"& .MuiOutlinedInput-root": {
								"& fieldset": {
									borderWidth: 1,
								},
							},
						}}
					/>
				</Box>

				{/* Subject Field */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
					<Typography variant="body1" sx={{ minWidth: 50, fontWeight: 500 }}>
						ጉዳዩ:
					</Typography>
					<TextField
						fullWidth
						value={formData.subject}
						onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
						sx={{
							bgcolor: "background.paper",
							"& .MuiOutlinedInput-root": {
								"& fieldset": {
									borderWidth: 1,
								},
							},
						}}
					/>
				</Box>

				{/* Relevant Body - Only for external */}
				{!isInternal && (
					<Box>
						<Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
							የሚመለከተው አካል
						</Typography>
						<TextField
							fullWidth
							multiline
							rows={3}
							value={formData.relevantBody}
							onChange={(e) =>
								setFormData({ ...formData, relevantBody: e.target.value })
							}
							sx={{
								bgcolor: "background.paper",
								"& .MuiOutlinedInput-root": {
									"& fieldset": {
										borderWidth: 1,
									},
								},
							}}
						/>
					</Box>
				)}

				{/* Content Label */}
				<Typography variant="body1" sx={{ fontWeight: 600 }}>
					የደብዳቤው ይዘት
				</Typography>

				{/* WYSIWYG Editor */}
				<Box
					sx={{
						border: "1px solid",
						borderColor: "divider",
						borderRadius: 1,
						minHeight: 400,
						p: 2,
						bgcolor: "background.paper",
					}}
				>
					<Plate editor={editor} value={editorValue} onChange={setEditorValue}>
						<PlateContent
							placeholder="የደብዳቤውን ይዘት ይጻፉ..."
							style={{
								minHeight: 400,
								outline: "none",
							}}
						/>
					</Plate>
				</Box>

				{/* Attachments - Only for external */}
				{!isInternal && (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
						<Typography variant="body2">አባሪዎች</Typography>
						<TextField
							size="small"
							type="number"
							value={formData.attachments}
							onChange={(e) =>
								setFormData({ ...formData, attachments: e.target.value })
							}
							sx={{ width: 60 }}
							inputProps={{ min: 0 }}
						/>
					</Box>
				)}

				{/* Closing */}
				<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
					<Typography variant="body2">ከሰላምታ ጋር</Typography>
				</Box>
			</Box>

			{/* Action Buttons */}
			<Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
				<Button onClick={onBack}>ተመለስ</Button>
				<Button variant="contained" onClick={handleSubmit}>
					አስቀምጥ
				</Button>
			</Box>
		</Paper>
	);
}

