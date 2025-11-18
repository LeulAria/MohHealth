"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Box,
	Container,
	Button,
	Typography,
	Card,
	CardActionArea,
} from "@mui/material";
import {
	Description as InternalIcon,
	Mail as ExternalIcon,
	Check as CheckIcon,
} from "@mui/icons-material";
import LetterForm from "@/components/letter-form";

interface Step {
	label: string;
	description?: string;
}

const steps: Step[] = [
	{ label: "ዓይነት ይምረጡ", description: "ዓይነት ይምረጡ" },
	{ label: "ደብዳቤ ይሙሉ", description: "ደብዳቤ ይሙሉ" },
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

export default function CreateLetterPage() {
	const router = useRouter();
	const [activeStep, setActiveStep] = useState(0);
	const [letterType, setLetterType] = useState<"internal" | "external" | null>(
		null,
	);

	const handleNext = () => {
		if (activeStep === 0 && letterType) {
			setActiveStep(1);
		}
	};

	const handleBack = () => {
		if (activeStep > 0) {
			setActiveStep(0);
			setLetterType(null);
		} else {
			router.push("/dashboard");
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
				<Container maxWidth="lg" sx={{ py: 4, flex: 1, display: "flex", flexDirection: "column" }}>
					{activeStep === 0 && (
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "60vh" }}>
							<Box sx={{ mb: 6, textAlign: "center", pt: "7vh" }}>
								<Typography 
									variant="h4" 
									sx={{ 
										mb: 1, 
										fontWeight: 700, 
										fontSize: { xs: "1.75rem", md: "2.125rem" },
										color: "text.primary",
									}}
								>
									ደብዳቤ ዓይነት ይምረጡ
								</Typography>
								<Typography 
									variant="body1" 
									sx={{ 
										color: "text.secondary",
										fontSize: { xs: "0.875rem", md: "1rem" },
									}}
								>
									የሚፈልጉትን ደብዳቤ ዓይነት ይምረጡ
								</Typography>
							</Box>
							<Box
								sx={{
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									gap: 4,
									flex: 1,
									flexDirection: { xs: "column", md: "row" },
								}}
							>
								<Card
									sx={{
										width: { xs: "100%", sm: 280, md: 320 },
										height: { xs: 280, md: 320 },
										borderRadius: "20px",
										border: letterType === "internal" ? "3px solid #000000" : "1px solid #999",
										boxShadow: letterType === "internal" 
											? "0 8px 24px rgba(0, 0, 0, 0.12)" 
											: "0 2px 8px rgba(0, 0, 0, 0.08)",
										transition: "all 0.3s ease-in-out",
										"&:hover": {
											boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
											transform: "translateY(-4px)",
										},
										bgcolor: "background.paper",
									}}
								>
									<CardActionArea
										onClick={() => setLetterType("internal")}
										sx={{ 
											p: 4, 
											height: "100%",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												justifyContent: "center",
												gap: 3,
												width: "100%",
											}}
										>
											<Box
												sx={{
													width: 80,
													height: 80,
													borderRadius: "50%",
													bgcolor: letterType === "internal" ? "primary.main" : "rgba(0, 94, 184, 0.1)",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													transition: "all 0.3s ease",
												}}
											>
												<InternalIcon 
													sx={{ 
														fontSize: 48, 
														color: letterType === "internal" ? "#ffffff" : "primary.main",
													}} 
												/>
											</Box>
											<Typography 
												variant="h5" 
												sx={{ 
													fontWeight: 700,
													color: "text.primary",
													fontSize: { xs: "1.25rem", md: "1.5rem" },
												}}
											>
												ውስጣዊ ደብዳቤ
											</Typography>
											<Typography 
												variant="body2" 
												sx={{
													color: "text.secondary",
													fontSize: "0.875rem",
													fontWeight: 500,
												}}
											>
												Internal Letter
											</Typography>
										</Box>
									</CardActionArea>
								</Card>
								<Card
									sx={{
										width: { xs: "100%", sm: 280, md: 320 },
										height: { xs: 280, md: 320 },
										borderRadius: "20px",
										border: letterType === "external" ? "3px solid #000000" : "1px solid #999",
										boxShadow: letterType === "external" 
											? "0 8px 24px rgba(0, 0, 0, 0.12)" 
											: "0 2px 8px rgba(0, 0, 0, 0.08)",
										transition: "all 0.3s ease-in-out",
										"&:hover": {
											boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
											transform: "translateY(-4px)",
										},
										bgcolor: "background.paper",
									}}
								>
									<CardActionArea
										onClick={() => setLetterType("external")}
										sx={{ 
											p: 4, 
											height: "100%",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												justifyContent: "center",
												gap: 3,
												width: "100%",
											}}
										>
											<Box
												sx={{
													width: 80,
													height: 80,
													borderRadius: "50%",
													bgcolor: letterType === "external" ? "primary.main" : "rgba(0, 94, 184, 0.1)",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													transition: "all 0.3s ease",
												}}
											>
												<ExternalIcon 
													sx={{ 
														fontSize: 48, 
														color: letterType === "external" ? "#ffffff" : "primary.main",
													}} 
												/>
											</Box>
											<Typography 
												variant="h5" 
												sx={{ 
													fontWeight: 700,
													color: "text.primary",
													fontSize: { xs: "1.25rem", md: "1.5rem" },
												}}
											>
												ውጫዊ ደብዳቤ
											</Typography>
											<Typography 
												variant="body2" 
												sx={{
													color: "text.secondary",
													fontSize: "0.875rem",
													fontWeight: 500,
												}}
											>
												External Letter
											</Typography>
										</Box>
									</CardActionArea>
								</Card>
							</Box>
							<Box 
								sx={{ 
									display: "flex", 
									justifyContent: "space-between", 
									mt: "auto",
									pt: 6,
									px: { xs: 0, md: 2 },
								}}
							>
								<Button 
									onClick={handleBack}
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
									onClick={handleNext}
									disabled={!letterType}
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
									ቀጣይ
								</Button>
							</Box>
						</Box>
					)}

					{activeStep === 1 && letterType && (
						<LetterForm letterType={letterType} onBack={handleBack} />
					)}
				</Container>
			</Box>
		</Box>
	);
}