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
	Paper,
	Link,
	FormHelperText,
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
					bgcolor: "#f5f5f5",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box
			sx={{
				minHeight: "100vh",
				bgcolor: "#f5f5f5",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				p: 2,
			}}
		>
			<Container maxWidth="sm">
				<Paper
					elevation={0}
					sx={{
						p: { xs: 4, sm: 6 },
						borderRadius: 3,
						border: "1px solid #e0e0e0",
						bgcolor: "white",
					}}
				>
					{/* Logo and Title */}
					<Box sx={{ textAlign: "center", mb: 4 }}>
						<Avatar
							src="/MOH BLUE Transparent.png"
							alt="MOH Logo"
							sx={{ width: 60, height: 60, mx: "auto", mb: 2, bgcolor: "transparent" }}
							variant="square"
						/>
						<Typography
							variant="h5"
							sx={{
								fontWeight: 500,
								color: "#202124",
								mb: 0.5,
							}}
						>
							ዲጂታል ደብዳቤ
						</Typography>
						<Typography
							variant="body2"
							sx={{
								color: "#5f6368",
								fontSize: "0.875rem",
							}}
						>
							መለያ ይፍጠሩ
						</Typography>
					</Box>

					{/* Form */}
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
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
										sx={{
											"& .MuiOutlinedInput-root": {
												borderRadius: 2,
												bgcolor: "white",
											},
										}}
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
										sx={{
											"& .MuiOutlinedInput-root": {
												borderRadius: 2,
												bgcolor: "white",
											},
										}}
									/>
								)}
							</form.Field>

							<form.Field name="role">
								{(field) => (
									<FormControl 
										fullWidth 
										error={field.state.meta.errors.length > 0}
									>
										<InputLabel id="role-label">የተጠቃሚ ሚና</InputLabel>
										<Select
											labelId="role-label"
											id="role"
											value={field.state.value}
											label="የተጠቃሚ ሚና"
											onChange={(e) => field.handleChange(e.target.value)}
											sx={{
												borderRadius: 2,
												bgcolor: "white",
											}}
										>
											{USER_ROLES.map((role) => (
												<MenuItem key={role.value} value={role.value}>
													{role.label}
												</MenuItem>
											))}
										</Select>
										{field.state.meta.errors.length > 0 && (
											<FormHelperText>
												{field.state.meta.errors[0]?.message}
											</FormHelperText>
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
										sx={{
											"& .MuiOutlinedInput-root": {
												borderRadius: 2,
												bgcolor: "white",
											},
										}}
									/>
								)}
							</form.Field>

							<form.Subscribe>
								{(state) => (
									<Button
										type="submit"
										variant="contained"
										size="large"
										fullWidth
										disabled={!state.canSubmit || state.isSubmitting}
										sx={{
											mt: 1,
											py: 1.5,
											borderRadius: 2,
											textTransform: "none",
											fontSize: "1rem",
											fontWeight: 500,
											boxShadow: "none",
											"&:hover": {
												boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
											},
										}}
									>
										{state.isSubmitting ? "በመመዝገብ ላይ..." : "መለያ ፍጠር"}
									</Button>
								)}
							</form.Subscribe>
						</Box>
					</form>

					{/* Footer */}
					<Box sx={{ mt: 4, textAlign: "center" }}>
						<Typography variant="body2" color="text.secondary">
							አስቀድሞ መለያ አለዎት?{" "}
							<Link
								component="button"
								onClick={onSwitchToSignIn}
								sx={{
									color: "primary.main",
									fontWeight: 500,
									textDecoration: "none",
									cursor: "pointer",
									"&:hover": {
										textDecoration: "underline",
									},
								}}
							>
								ይግቡ
							</Link>
						</Typography>
					</Box>
				</Paper>

				{/* Footer Info */}
				<Box sx={{ mt: 3, textAlign: "center" }}>
					<Typography variant="caption" color="text.secondary">
						ጤና ሚኒስቴር - ኢትዮጵያ
					</Typography>
				</Box>
			</Container>
		</Box>
	);
}
