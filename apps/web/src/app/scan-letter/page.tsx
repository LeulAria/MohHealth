"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Box,
	Container,
	Button,
	Typography,
	TextField,
	Card,
	CardContent,
	CircularProgress,
	Paper,
	Divider,
	Chip,
} from "@mui/material";
import {
	CloudUpload as CloudUploadIcon,
	Check as CheckIcon,
	ArrowBack as ArrowBackIcon,
	Image as ImageIcon,
	Description as DescriptionIcon,
} from "@mui/icons-material";
import { toast } from "sonner";
import { orpc, client } from "@/utils/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Step {
	label: string;
	description?: string;
	icon: React.ReactNode;
}

const steps: Step[] = [
	{ 
		label: "ምስል ይጫኑ", 
		description: "ፋይል ይምረጡ",
		icon: <CloudUploadIcon />,
	},
	{ 
		label: "ይመልከቱ", 
		description: "ይመልከቱ",
		icon: <ImageIcon />,
	},
	{ 
		label: "ፍጠር", 
		description: "ደብዳቤ ይፍጠሩ",
		icon: <CheckIcon />,
	},
];

function VerticalStepper({
	steps,
	activeStep,
}: {
	steps: Step[];
	activeStep: number;
}) {
	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
			{steps.map((step, index) => {
				const isCompleted = index < activeStep;
				const isActive = index === activeStep;
				const isPending = index > activeStep;

				return (
					<Box key={index} sx={{ display: "flex", position: "relative" }}>
						{/* Step Circle and Connector */}
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								mr: 2,
							}}
						>
							{/* Step Circle */}
							<Box
								sx={{
									width: 40,
									height: 40,
									borderRadius: "50%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									...(isCompleted && {
										bgcolor: "#e8f5e9",
										color: "#4caf50",
									}),
									...(isActive && {
										bgcolor: "#005EB8",
										color: "#ffffff",
									}),
									...(isPending && {
										bgcolor: "#ffffff",
										border: "2px solid #000000",
										color: "#000000",
									}),
									fontWeight: 600,
									fontSize: "16px",
									zIndex: 1,
								}}
							>
								{isCompleted ? (
									<CheckIcon sx={{ fontSize: 24 }} />
								) : (
									index + 1
								)}
							</Box>
							{/* Connector Line */}
							{index < steps.length - 1 && (
								<Box
									sx={{
										width: 2,
										height: 60,
										bgcolor: "#e0e0e0",
										mt: 1,
										mb: 1,
									}}
								/>
							)}
						</Box>

						{/* Step Content */}
						<Box sx={{ flex: 1, pt: 0.5 }}>
							<Typography
								variant="body1"
								sx={{
									fontWeight: isActive ? 600 : 400,
									color: isActive ? "#005EB8" : "rgba(0, 0, 0, 0.87)",
									mb: step.description ? 0.5 : 0,
								}}
							>
								{step.label}
							</Typography>
							{step.description && (
								<Typography
									variant="body2"
									sx={{
										color: "rgba(0, 0, 0, 0.6)",
										mb: 1,
									}}
								>
									{step.description}
								</Typography>
							)}
							{isCompleted && (
								<Typography
									variant="body2"
									sx={{
										color: "#4caf50",
										fontWeight: 500,
									}}
								>
									Complete
								</Typography>
							)}
						</Box>
					</Box>
				);
			})}
		</Box>
	);
}

export default function ScanLetterPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [activeStep, setActiveStep] = useState(0);
	const [uploading, setUploading] = useState(false);
	
	// Form data
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [filePreview, setFilePreview] = useState<string>("");
	const [label, setLabel] = useState("");
	const [uploadedFileUrl, setUploadedFileUrl] = useState("");

	// Generate signed URL mutation
	const generateSignedUrlMutation = useMutation({
		mutationFn: (input: { fileName: string; fileType: string; fileSize: number }) =>
			client.upload.generateSignedUrl(input),
		onError: (error: any) => {
			toast.error(error?.message || "Failed to get upload URL");
		},
	});

	// Create letter mutation
	const createLetterMutation = useMutation(
		orpc.letter.create.mutationOptions({
			onSuccess: () => {
				toast.success("ደብዳቤ ተቀምጧል");
				queryClient.invalidateQueries({ queryKey: orpc.letter.getAll.queryKey() });
				router.push("/dashboard");
			},
			onError: (error: any) => {
				toast.error(error?.message || "ደብዳቤ ለመቀመጥ ስህተት ተፈጥሯል");
			},
		})
	);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/tiff", "application/pdf"];
		if (!allowedTypes.includes(file.type)) {
			toast.error("የተሳሳተ ፋይል አይነት። ፈቅደዋል: JPG, PNG, TIFF, PDF");
			return;
		}

		// Validate file size (50MB)
		const maxSize = 50 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error("የፋይል መጠን ከፍተኛውን ፈቃድ 50MB ያልፋል");
			return;
		}

		setSelectedFile(file);

		// Create preview for images
		if (file.type.startsWith("image/")) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setFilePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		} else {
			setFilePreview(""); // PDF preview not supported
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("እባክዎ ፋይል ይምረጡ");
			return;
		}

		if (!label.trim()) {
			toast.error("እባክዎ መለያ ያስገቡ");
			return;
		}

		setUploading(true);

		try {
			// Step 1: Get signed URL from backend using orpc
			const result = await generateSignedUrlMutation.mutateAsync({
				fileName: selectedFile.name,
				fileType: selectedFile.type,
				fileSize: selectedFile.size,
			});

			const { uploadUrl, fileUrl } = result;

			// Step 2: Upload file directly to S3
			const uploadResponse = await fetch(uploadUrl, {
				method: "PUT",
				body: selectedFile,
				headers: {
					"Content-Type": selectedFile.type,
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("Failed to upload file to S3");
			}

			setUploadedFileUrl(fileUrl);
			toast.success("ፋይል በተሳካ ሁኔታ ተጭኗል");
			setActiveStep(1); // Move to review step
		} catch (error: any) {
			console.error("Upload error:", error);
			toast.error(error.message || "ፋይል ለመጫን ስህተት ተፈጥሯል");
		} finally {
			setUploading(false);
		}
	};

	const handleCreateLetter = async () => {
		if (!uploadedFileUrl) {
			toast.error("እባክዎ መጀመሪያ ፋይል ይጫኑ");
			return;
		}

		const letterId = `letter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		const letterData = {
			id: letterId,
			type: "external" as const,
			direction: "incoming" as const,
			to: "ጤና ኢኖቬሽንና ጥራት መሪ ስራ አስፈፃሚ",
			from: label,
			subject: `ስካን የተደረገ ደብዳቤ - ${label}`,
			content: undefined, // No content for scanned letters, just the image
			letterType: "scanned" as const,
			scannedImageUrl: uploadedFileUrl,
		};

		createLetterMutation.mutate(letterData);
	};

	const handleNext = () => {
		if (activeStep === 0) {
			handleUpload();
		} else if (activeStep === 1) {
			setActiveStep(2);
		} else if (activeStep === 2) {
			handleCreateLetter();
		}
	};

	const handleBack = () => {
		if (activeStep === 0) {
			router.back();
		} else {
			setActiveStep((prev) => prev - 1);
		}
	};

	return (
		<Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex" }}>
			{/* Sidebar with Stepper */}
			<Box
				sx={{
					width: { xs: "100%", md: 300 },
					borderRight: { xs: "none", md: "1px solid #DDD" },
					bgcolor: "background.paper",
					p: 4,
					position: { xs: "relative", md: "sticky" },
					top: 0,
					height: { xs: "auto", md: "100vh" },
					overflowY: "auto",
				}}
			>
				<Box sx={{ mt: { xs: 0, md: 5 } }}>
					<VerticalStepper steps={steps} activeStep={activeStep} />
				</Box>
			</Box>

			{/* Main Content Area */}
			<Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
				<Container maxWidth="md" sx={{ py: 4, flex: 1, display: "flex", flexDirection: "column" }}>
					{/* Step 0: Upload */}
					{activeStep === 0 && (
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 700, mx: "auto", width: "100%" }}>
							<Box sx={{ mb: 4 }}>
								<Typography 
									variant="h5" 
									sx={{ 
										mb: 1, 
										fontWeight: 700,
										color: "text.primary",
									}}
								>
									ፋይል ይጫኑ
								</Typography>
								<Typography 
									variant="body2" 
									sx={{ 
										color: "text.secondary",
									}}
								>
									ምስል ይጫኑ እና መለያ ያክሉ
								</Typography>
							</Box>

							<Card 
								variant="outlined"
								sx={{ 
									mb: 3,
									borderRadius: 2,
									overflow: "hidden",
								}}
							>
								<CardContent sx={{ p: 3 }}>
									<TextField
										fullWidth
										label="መለያ / ከ"
										value={label}
										onChange={(e) => setLabel(e.target.value)}
										placeholder="ለምሳሌ: የአዲስ አበባ ጤና ቢሮ"
										sx={{ mb: 3 }}
									/>

									{/* File Upload Area */}
									<input
										accept="image/jpeg,image/jpg,image/png,image/tiff,application/pdf"
										style={{ display: "none" }}
										id="file-upload"
										type="file"
										onChange={handleFileSelect}
									/>
									<label htmlFor="file-upload">
										<Paper
											elevation={0}
											sx={{
												border: "2px dashed",
												borderColor: selectedFile ? "success.main" : "divider",
												borderRadius: 2,
												p: 4,
												textAlign: "center",
												cursor: "pointer",
												transition: "all 0.2s ease",
												bgcolor: "transparent",
												"&:hover": {
													borderColor: "primary.main",
													bgcolor: "action.hover",
												},
											}}
										>
											{selectedFile ? (
												<>
													<CheckIcon sx={{ fontSize: 48, color: "success.main", mb: 2 }} />
													<Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
														{selectedFile.name}
													</Typography>
													<Typography variant="caption" color="text.secondary">
														{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
													</Typography>
													<Button
														variant="outlined"
														size="small"
														sx={{ mt: 2 }}
														onClick={(e) => {
															e.stopPropagation();
															setSelectedFile(null);
															setFilePreview("");
														}}
													>
														ይቀይሩ
													</Button>
												</>
											) : (
												<>
													<CloudUploadIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
													<Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
														ፋይል ለመጫን ይጫኑ
													</Typography>
													<Typography variant="caption" color="text.secondary">
														JPG, PNG, TIFF, PDF (ከፍተኛ 50MB)
													</Typography>
												</>
											)}
										</Paper>
									</label>

									{/* File Preview */}
									{filePreview && (
										<Box sx={{ mt: 3 }}>
											<Paper
												elevation={0}
												sx={{
													borderRadius: 2,
													overflow: "hidden",
													border: "1px solid",
													borderColor: "divider",
												}}
											>
												<img
													src={filePreview}
													alt="Preview"
													style={{ 
														width: "100%", 
														maxHeight: 400, 
														objectFit: "contain",
														display: "block",
													}}
												/>
											</Paper>
										</Box>
									)}
								</CardContent>
							</Card>

							<Box 
								sx={{ 
									display: "flex", 
									justifyContent: "flex-end", 
									gap: 2,
									mt: "auto",
									pt: 3,
								}}
							>
								<Button 
									onClick={handleBack}
									variant="outlined"
									size="large"
									sx={{ minWidth: 160, minHeight: 48, fontSize: "1rem", fontWeight: 600, px: 3 }}
								>
									ተመለስ
								</Button>
								<Button
									variant="contained"
									onClick={handleNext}
									disabled={!selectedFile || !label.trim() || uploading || generateSignedUrlMutation.isPending}
									size="large"
									sx={{ minWidth: 160, minHeight: 48, fontSize: "1rem", fontWeight: 600, px: 3 }}
								>
									{uploading || generateSignedUrlMutation.isPending ? (
										<>
											<CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
											በመጫን ላይ...
										</>
									) : (
										"ቀጣይ"
									)}
								</Button>
							</Box>
						</Box>
					)}

					{/* Step 1: Review */}
					{activeStep === 1 && (
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 800, mx: "auto", width: "100%" }}>
							<Box sx={{ mb: 4 }}>
								<Typography 
									variant="h5" 
									sx={{ 
										mb: 1, 
										fontWeight: 700,
										color: "text.primary",
									}}
								>
									ይመልከቱ
								</Typography>
								<Typography 
									variant="body2" 
									sx={{ 
										color: "text.secondary",
									}}
								>
									ፋይሉ በተሳካ ሁኔታ ተጭኗል
								</Typography>
							</Box>

							<Card 
								variant="outlined"
								sx={{ 
									mb: 3,
									borderRadius: 2,
									overflow: "hidden",
								}}
							>
								<CardContent sx={{ p: 3 }}>
									<Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
										<Chip 
											label={`መለያ: ${label}`}
											variant="outlined"
											sx={{ fontWeight: 500 }}
										/>
										<Chip 
											label={`ፋይል: ${selectedFile?.name}`}
											variant="outlined"
											sx={{ fontWeight: 500 }}
										/>
									</Box>

									<Divider sx={{ mb: 3 }} />

									{filePreview && (
										<Paper
											elevation={0}
											sx={{
												borderRadius: 2,
												overflow: "hidden",
												border: "1px solid",
												borderColor: "divider",
												textAlign: "center",
											}}
										>
											<img
												src={filePreview}
												alt="Letter preview"
												style={{ 
													width: "100%", 
													maxHeight: 500, 
													objectFit: "contain",
													display: "block",
												}}
											/>
										</Paper>
									)}
								</CardContent>
							</Card>

							<Box 
								sx={{ 
									display: "flex", 
									justifyContent: "space-between", 
									gap: 2,
									mt: "auto",
									pt: 3,
								}}
							>
								<Button 
									onClick={handleBack}
									variant="outlined"
									size="large"
									sx={{ minWidth: 160, minHeight: 48, fontSize: "1rem", fontWeight: 600, px: 3 }}
								>
									ወደ ኋላ
								</Button>
								<Button
									variant="contained"
									onClick={handleNext}
									size="large"
									sx={{ minWidth: 160, minHeight: 48, fontSize: "1rem", fontWeight: 600, px: 3 }}
								>
									ቀጣይ
								</Button>
							</Box>
						</Box>
					)}

					{/* Step 2: Create */}
					{activeStep === 2 && (
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 600, mx: "auto", width: "100%" }}>
							<Box sx={{ mb: 4, textAlign: "center" }}>
								<Box
									sx={{
										width: 80,
										height: 80,
										borderRadius: "50%",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										mx: "auto",
										mb: 3,
										border: "4px solid",
										borderColor: "success.main",
									}}
								>
									<CheckIcon sx={{ fontSize: 48, color: "success.main" }} />
								</Box>
								<Typography 
									variant="h5" 
									sx={{ 
										mb: 1, 
										fontWeight: 700,
										color: "text.primary",
									}}
								>
									ዝግጁ ነው!
								</Typography>
								<Typography 
									variant="body2" 
									sx={{ 
										color: "text.secondary",
									}}
								>
									ስካን የተደረገውን ደብዳቤ ለመፍጠር ፍጠር ይጫኑ።
								</Typography>
							</Box>

							<Card 
								variant="outlined"
								sx={{ 
									mb: 3,
									borderRadius: 2,
								}}
							>
								<CardContent sx={{ p: 3 }}>
									<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
										<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
											<Typography variant="body2" color="text.secondary">
												አይነት
											</Typography>
											<Typography variant="body2" sx={{ fontWeight: 600 }}>
												ውጪ ደብዳቤ (ገቢ)
											</Typography>
										</Box>
										<Divider />
										<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
											<Typography variant="body2" color="text.secondary">
												ከ
											</Typography>
											<Typography variant="body2" sx={{ fontWeight: 600 }}>
												{label}
											</Typography>
										</Box>
										<Divider />
										<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
											<Typography variant="body2" color="text.secondary">
												ሁኔታ
											</Typography>
											<Chip 
												label="ተቀብሏል" 
												color="success" 
												size="small"
											/>
										</Box>
									</Box>
								</CardContent>
							</Card>

							<Box 
								sx={{ 
									display: "flex", 
									justifyContent: "space-between", 
									gap: 2,
									mt: "auto",
									pt: 3,
								}}
							>
								<Button 
									onClick={handleBack}
									variant="outlined"
									disabled={createLetterMutation.isPending}
									size="large"
									sx={{ minWidth: 160, minHeight: 48, fontSize: "1rem", fontWeight: 600, px: 3 }}
								>
									ወደ ኋላ
								</Button>
								<Button
									variant="contained"
									onClick={handleNext}
									disabled={createLetterMutation.isPending}
									size="large"
									sx={{ minWidth: 160, minHeight: 48, fontSize: "1rem", fontWeight: 600, px: 3 }}
								>
									{createLetterMutation.isPending ? (
										<>
											<CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
											በመፍጠር ላይ...
										</>
									) : (
										"ፍጠር"
									)}
								</Button>
							</Box>
						</Box>
					)}
				</Container>
			</Box>
		</Box>
	);
}
