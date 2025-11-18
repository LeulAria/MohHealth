import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { useRouter } from "next/navigation";
import {
	Box,
	Button,
	TextField,
	CircularProgress,
	Container,
	Typography,
	Avatar,
	Paper,
	Link,
} from "@mui/material";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						router.push("/dashboard");
						toast.success("Sign in successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
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
							ወደ መለያዎ ይግቡ
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
										{state.isSubmitting ? "በመግባት ላይ..." : "ግባ"}
									</Button>
								)}
							</form.Subscribe>
						</Box>
					</form>

					{/* Footer */}
					<Box sx={{ mt: 4, textAlign: "center" }}>
						<Typography variant="body2" color="text.secondary">
							መለያ የለዎትም?{" "}
							<Link
								component="button"
								onClick={onSwitchToSignUp}
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
								መለያ ይፍጠሩ
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
