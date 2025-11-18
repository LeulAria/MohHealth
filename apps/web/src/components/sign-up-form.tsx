import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { useRouter } from "next/navigation";
import {
	Box,
	Button,
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	CircularProgress,
	Container,
	Typography,
	Avatar,
	Card,
	CardContent,
} from "@mui/material";

const USER_ROLES = [
	{ value: "lead_executive", label: "መሪ ስራ አስፈፃሚ" },
	{ value: "desk_head", label: "ዴስክ ሃላፊ" },
	{ value: "expert", label: "ኤክስፐርት" },
	{ value: "secretary", label: "ጰሃፊ" },
	{ value: "records_section", label: "መዝገብ ክፍል" },
] as const;

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const router = useRouter();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
			role: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: async () => {
						// Update user with role after signup
						if (value.role) {
							try {
								await authClient.updateUser({
									role: value.role,
								} as any);
							} catch (error) {
								console.error("Failed to update user role:", error);
								// Don't block navigation if role update fails
							}
						}
						router.push("/dashboard");
						toast.success("Sign up successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "Name must be at least 2 characters"),
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
				role: z.string().min(1, "Please select a role"),
			}),
		},
	});

	if (isPending) {
		return (
			<Box
				sx={{
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: "primary.main",
				}}
			>
				<CircularProgress sx={{ color: "white" }} />
			</Box>
		);
	}

	return (
		<Box
			sx={{
				minHeight: "100vh",
				bgcolor: "primary.main",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				p: 4,
			}}
		>
			<Container maxWidth="md">
				{/* Header with Logo and Title */}
				<Box sx={{ display: "flex", gap: 3, mb: 6, alignItems: "flex-start" }}>
					<Avatar
						src="/MOH White Transparent.png"
						alt="MOH Logo"
						sx={{ width: 80, height: 80, bgcolor: "transparent" }}
						variant="square"
					/>
					<Box sx={{ flex: 1, color: "white" }}>
						<Typography variant="body2" sx={{ mb: 0.5 }}>
							ጤና ሚኒስቴር - ኢትዮጵያ
						</Typography>
						<Typography variant="caption" sx={{ mb: 2, display: "block" }}>
							MINISTRY OF HEALTH-ETHIOPIA
						</Typography>
						<Typography variant="h3" sx={{ mb: 1, fontWeight: "bold" }}>
							ዲጂታል ደብዳቤ
						</Typography>
						<Typography variant="h6">Digital Letter Management System</Typography>
					</Box>
				</Box>

				{/* Form Section */}
				<Card
					sx={{
						maxWidth: 600,
						mx: "auto",
						bgcolor: "background.paper",
						elevation: 8,
						borderRadius: "10px",
					}}
				>
					<CardContent sx={{ p: 4 }}>
						<Typography
							variant="h4"
							sx={{ mb: 4, textAlign: "center", fontWeight: "bold" }}
						>
							መለያ ይፍጠሩ
						</Typography>

						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
						>
							<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
								<form.Field name="name">
									{(field) => (
										<TextField
											fullWidth
											label="ሙሉ ስም"
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											error={field.state.meta.errors.length > 0}
											helperText={
												field.state.meta.errors[0]?.message || ""
											}
										/>
									)}
								</form.Field>

								<form.Field name="email">
									{(field) => (
										<TextField
											fullWidth
											type="email"
											label="ኢሜይል አድራሻ"
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											error={field.state.meta.errors.length > 0}
											helperText={
												field.state.meta.errors[0]?.message || ""
											}
										/>
									)}
								</form.Field>

								<form.Field name="role">
									{(field) => (
										<FormControl fullWidth>
											<InputLabel id="role-label">የተጠቃሚ ሚና</InputLabel>
											<Select
												labelId="role-label"
												id="role"
												value={field.state.value}
												label="የተጠቃሚ ሚና"
												onChange={(e) => field.handleChange(e.target.value)}
											>
												{USER_ROLES.map((role) => (
													<MenuItem key={role.value} value={role.value}>
														{role.label}
													</MenuItem>
												))}
											</Select>
											{field.state.meta.errors.length > 0 && (
												<Typography
													variant="caption"
													sx={{ color: "error.main", mt: 0.5, ml: 1.75 }}
												>
													{field.state.meta.errors[0]?.message}
												</Typography>
											)}
										</FormControl>
									)}
								</form.Field>

								<form.Field name="password">
									{(field) => (
										<TextField
											fullWidth
											type="password"
											label="የይለፍ ቃል"
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											error={field.state.meta.errors.length > 0}
											helperText={
												field.state.meta.errors[0]?.message || ""
											}
										/>
									)}
								</form.Field>

								<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
									<form.Subscribe>
										{(state) => (
											<Button
												type="submit"
												variant="contained"
												size="large"
												disabled={!state.canSubmit || state.isSubmitting}
												sx={{
													px: 4,
													py: 1.5,
												}}
											>
												{state.isSubmitting ? "በመመዝገብ ላይ..." : "መለያ ፍጠር"}
											</Button>
										)}
									</form.Subscribe>
								</Box>
							</Box>
						</form>

						<Box sx={{ mt: 3, textAlign: "center" }}>
							<Button
								onClick={onSwitchToSignIn}
								variant="text"
								sx={{ color: "text.secondary" }}
							>
								አስቀድሞ መለያ አለዎት? ይግቡ
							</Button>
						</Box>
					</CardContent>
				</Card>
			</Container>
		</Box>
	);
}
