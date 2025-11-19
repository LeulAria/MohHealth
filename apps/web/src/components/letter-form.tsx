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
	Autocomplete,
} from "@mui/material";
import { toast } from "sonner";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { EditorKit } from "@/components/editor/editor-kit";
import { type Value } from "platejs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

interface LetterFormProps {
	letterType: "internal" | "external";
	onBack: () => void;
}

export default function LetterForm({ letterType, onBack }: LetterFormProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const editor = usePlateEditor({
		plugins: EditorKit,
		value: [
			{
				type: "p",
				children: [{ text: "" }],
			},
		],
	});
	const [formData, setFormData] = useState({
		referenceNumber: "",
		date: "",
		to: "",
		from: "ጤና ኢኖቬሽንና ጥራት መሪ ስራ አስፈፃሚ",
		subject: "",
		relevantBody: "",
		attachments: "",
	});

	// Create letter mutation
	const createLetterMutation = useMutation(
		orpc.letter.create.mutationOptions({
			onSuccess: () => {
				toast.success("ደብዳቤ ተቀምጧል");
				// Invalidate queries to refresh the dashboard
				queryClient.invalidateQueries({ queryKey: orpc.letter.getAll.queryKey() });
				router.push("/dashboard");
			},
			onError: (error: any) => {
				toast.error(error?.message || "ደብዳቤ ለመቀመጥ ስህተት ተፈጥሯል");
			},
		})
	);

	const handleSubmit = async () => {
		try {
			// Generate unique ID
			const letterId = `letter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			
			// Get editor content
			const editorContent = editor.children;
			
			// Prepare letter data
			const letterData = {
				id: letterId,
				type: letterType,
				direction: "outgoing" as const,
				referenceNumber: formData.referenceNumber || undefined,
				date: formData.date ? new Date(formData.date) : undefined,
				to: formData.to || undefined,
				from: formData.from,
				subject: formData.subject || undefined,
				content: editorContent || undefined,
				attachments: formData.attachments ? { count: parseInt(formData.attachments) } : undefined,
			};

			// Create letter
			createLetterMutation.mutate(letterData);
		} catch (error: any) {
			toast.error(error?.message || "ደብዳቤ ለመቀመጥ ስህተት ተፈጥሯል");
		}
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
		{isInternal && (
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
						<Typography variant="body2">ጤ/ሥ/ኢ/ጥ/መ/ስ/አ.</Typography>
						<TextField
							size="small"
							value={formData.referenceNumber}
							onChange={(e) =>
								setFormData({ ...formData, referenceNumber: e.target.value })
							}
							sx={{ width: 80 }}
							placeholder="001"
							variant="standard"
							InputProps={{ disableUnderline: true }}
						/>
						<Typography variant="body2">2018 ዓ.ም</Typography>
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
						<Typography variant="body2">ቀን:-</Typography>
						<TextField
							size="small"
							value={formData.date}
							onChange={(e) => setFormData({ ...formData, date: e.target.value })}
							sx={{ width: 80 }}
							placeholder="ቀን/ወር"
							variant="standard"
							InputProps={{ disableUnderline: true }}
						/>
						<Typography variant="body2">2018 ዓ.ም</Typography>
					</Box>
				</Box>
				</Box>
				<Divider sx={{ mb: 2 }} />
			<Typography variant="h5" sx={{ textAlign: "center", mb: 3, fontWeight: 600 }}>
				የቢሮ ማስታወሻ
			</Typography>
			</Box>
		)}

			{/* Form Fields */}
			<Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: isInternal ? 0 : "10%" }}>
				{/* To Field */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: isInternal ? 0 : "80px" }}>
					<Typography variant="body1" sx={{ minWidth: 50, fontWeight: 500 }}>
						ለ:
					</Typography>
					{isInternal ? (
						<Autocomplete
							fullWidth
							freeSolo
							options={[
								"ለ፡ ስራ አመራር ዋና ስራ አስፈፃሚ",
								"ለ፡ ማህበረሰብ ተሳትፎና የመጀመሪያ ደረጃ ጤና ክብካቤ መሪ ስራ አስፈፃሚ",
								"ለ፡ ፖሊሲና ስትራቴጂ ጥናትና ምርምር መ/ስ አስፈፃሚ",
								"ለ፡ ተቋማዊ ለዉጥ ስራ አስፈፃሚ",
								"ለ፡ ሜዲካል አገልግሎት መሪ ስራ አስፈፃሚ",
								"ለ፡ መድሃኒት፣ የህክምና መሳሪያዎችና/መ መ/ስ/አ",
								"ለ፡ ዲጂታል ጤና መሪ ስራ አስፈፃሚ",
								"ለ፡ ጤና መሰረተ ልማት መሪ ስራ አስፈፃሚ",
								"ለ፡ ብቃትና ሰዉ ሃብት አስተዳደር ስራ አስፈፃሚ",
								"ለ፡ ጤና ዘርፍ የሰዉ ሃብት ልማትና ማሻሻያ መ/ስ/አ",
								"ለ፡ መሰረታዊ አገልግሎት ስራ አስፈፃሚ",
								"ለ፡ ህዝብ ግንኙነትና ኮሚኒኬሽን ስራ አስፈፃሚ",
								"ለ፡ በሽታ መከላከልና መቆጣጠር መሪ ስራ አስፈፃሚ",
								"ለ፡ እናቶች ፣ህፃናትና አፍላ ወጣቶች ጤና አገልግሎት መሪ ስራ አስፈፃሚ",
								"ለ፡ ፋይናንስ ስራ አስፈፃሚ",
								"ለ፡ ግዥ ስራ አስፈፃሚ",
								"ለ፡ ኤች.አይ.ቪ ኤድስ መ/መ  መሪ ስራ አስፈፃሚ",
								"ለ፡ ህግ ጉዳዮች ስራ አስፈፃሚ",
								"ለ፡ ሥነ - ምግባርና ፀረ ሙስና ስራ አስፈፃሚ",
								"ለ፡ ዉስጥ ኦዲት ስራ አስፈፃሚ",
								"ለ፡ ስትራቴጂክ ጉዳዮች ስራ አስፈፃሚ",
								"ለ፡ ሴቶችና ማህበራዊ ጉዳዮች አካቶ ትግበራ ስ/አ",
								"ለ፡ ኢንፎርሜሽንና ኮሚኒኬሽን ቴክኖሎጅ ስ/አስፈፃሚ",
								"ለ፡ ሥርዓተ ምግብ ማስተባበሪያ መሪ ስራ አስፈፃሚ",
								"ለ፡ ጤናና ጤና ነክ ተ/ባለሙያዎች ቁጥጥር መ/ስ/አ",
							]}
							value={formData.to}
							onChange={(event, newValue) => {
								setFormData({ ...formData, to: newValue || "" });
							}}
							onInputChange={(event, newInputValue) => {
								setFormData({ ...formData, to: newInputValue });
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									placeholder="ይምረጡ ወይም ይጻፉ..."
									sx={{
										bgcolor: "background.paper",
										"& .MuiOutlinedInput-root": {
											"& fieldset": {
												borderWidth: 1,
											},
										},
									}}
								/>
							)}
						/>
					) : (
						<TextField
							fullWidth
							multiline
							rows={3}
							value={formData.to}
							onChange={(e) => setFormData({ ...formData, to: e.target.value })}
							sx={{
								bgcolor: "background.paper",
								"& .MuiOutlinedInput-root": {
									"& fieldset": {
										borderWidth: 1,
									},
								},
							}}
						/>
					)}
				</Box>

				{/* From Field - Only for internal letters */}
				{isInternal && (
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
				)}

				{/* Subject Field */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "20px" }}>
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
								"& input": {
									paddingLeft: "50px",
								},
							},
						}}
					/>
				</Box>





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
					<Plate editor={editor}>
						<PlateContent
							placeholder="የደብዳቤውን ይዘት ይጻፉ..."
							style={{
								minHeight: 400,
								outline: "none",
							}}
						/>
					</Plate>
				</Box>




			</Box>

			{/* Action Buttons */}
			<Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
				<Button 
					onClick={onBack}
					size="large"
					sx={{ 
						minWidth: 160,
						minHeight: 56,
						fontSize: "1.125rem",
						fontWeight: 600,
						px: 4,
						py: 1.5,
					}}
				>
					ተመለስ
				</Button>
				<Button 
					variant="contained" 
					onClick={handleSubmit}
					disabled={createLetterMutation.isPending}
					size="large"
					sx={{ 
						minWidth: 160,
						minHeight: 56,
						fontSize: "1.125rem",
						fontWeight: 600,
						px: 4,
						py: 1.5,
					}}
				>
					{createLetterMutation.isPending ? "በመቀመጥ ላይ..." : "አስቀምጥ"}
				</Button>
			</Box>
		</Paper>
	);
}

