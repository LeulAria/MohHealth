"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Box,
	Container,
	Stepper,
	Step,
	StepLabel,
	Button,
	Typography,
	Card,
	CardContent,
	CardActionArea,
	Grid,
} from "@mui/material";
import {
	Description as InternalIcon,
	Mail as ExternalIcon,
} from "@mui/icons-material";
import LetterForm from "@/components/letter-form";

const steps = ["ዓይነት ይምረጡ", "ደብዳቤ ይሙሉ"];

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
		<Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
			<Container maxWidth="lg">
				<Stepper activeStep={activeStep} sx={{ mb: 4 }}>
					{steps.map((label) => (
						<Step key={label}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>

				{activeStep === 0 && (
					<Box>
						<Typography variant="h4" sx={{ mb: 4, textAlign: "center" }}>
							ደብዳቤ ዓይነት ይምረጡ
						</Typography>
						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<Card
									sx={{
										height: "100%",
										border: letterType === "internal" ? 2 : 1,
										borderColor:
											letterType === "internal"
												? "primary.main"
												: "divider",
									}}
								>
									<CardActionArea
										onClick={() => setLetterType("internal")}
										sx={{ p: 3, height: "100%" }}
									>
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												gap: 2,
											}}
										>
											<InternalIcon sx={{ fontSize: 64, color: "primary.main" }} />
											<Typography variant="h5" sx={{ fontWeight: 600 }}>
												ውስጣዊ ደብዳቤ
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Internal Letter
											</Typography>
										</Box>
									</CardActionArea>
								</Card>
							</Grid>
							<Grid item xs={12} md={6}>
								<Card
									sx={{
										height: "100%",
										border: letterType === "external" ? 2 : 1,
										borderColor:
											letterType === "external"
												? "primary.main"
												: "divider",
									}}
								>
									<CardActionArea
										onClick={() => setLetterType("external")}
										sx={{ p: 3, height: "100%" }}
									>
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												gap: 2,
											}}
										>
											<ExternalIcon sx={{ fontSize: 64, color: "primary.main" }} />
											<Typography variant="h5" sx={{ fontWeight: 600 }}>
												ውጫዊ ደብዳቤ
											</Typography>
											<Typography variant="body2" color="text.secondary">
												External Letter
											</Typography>
										</Box>
									</CardActionArea>
								</Card>
							</Grid>
						</Grid>
						<Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
							<Button onClick={handleBack}>ተመለስ</Button>
							<Button
								variant="contained"
								onClick={handleNext}
								disabled={!letterType}
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
	);
}

