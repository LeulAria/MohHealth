"use client";

import { Box, Typography, Paper, Avatar, Chip } from "@mui/material";
import {
	CheckCircle as CheckIcon,
	Upload as UploadIcon,
	Assignment as TaskIcon,
	Create as CreateIcon,
	Verified as ApprovedIcon,
	Lock as LockIcon,
	Cancel as RejectedIcon,
	Comment as CommentIcon,
	Person as PersonIcon,
	LocationOn as LocationIcon,
} from "@mui/icons-material";

interface AuditLogEntry {
	id: string;
	action: string;
	details?: Record<string, unknown> | null;
	createdAt: string | Date;
	user?: {
		id?: string | null;
		name?: string | null;
		role?: string | null;
		image?: string | null;
	} | null;
}

interface LetterAuditTimelineProps {
	logs: AuditLogEntry[];
}

export default function LetterAuditTimeline({ logs }: LetterAuditTimelineProps) {
	const sortedLogs = [...logs].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);

	const formatDate = (date: Date | string | null | undefined) => {
		if (!date) return "";
		const d = new Date(date);
		const day = d.getDate().toString().padStart(2, "0");
		const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		return `${day} ${monthNames[d.getMonth()]}`;
	};

	const getActionLabel = (action: string) => {
		const labels: Record<string, string> = {
			created: "ደብዳቤ ተፈጥሯል",
			approved: "ደብዳቤ ተጸድቋል",
			rejected: "ደብዳቤ ተቀድቷል",
			stamped: "ዲጂታል ማህተም ተጭኗል",
			updated: "ደብዳቤ ተሻሽሏል",
			assigned: "ደብዳቤ ተመድቧል",
			commented: "አስተያየት ተጨመረ",
			locked: "ደብዳቤ ተቆልሏል",
		};
		return labels[action] || action;
	};

	const getActionConfig = (action: string) => {
		const configs: Record<string, { icon: React.ReactNode; color: string; bgColor: string; chipColor: string }> = {
			created: {
				icon: <CreateIcon sx={{ fontSize: 18 }} />,
				color: "#0891b2",
				bgColor: "#e0f2fe",
				chipColor: "#0891b2",
			},
			approved: {
				icon: <ApprovedIcon sx={{ fontSize: 18 }} />,
				color: "#059669",
				bgColor: "#d1fae5",
				chipColor: "#059669",
			},
			rejected: {
				icon: <RejectedIcon sx={{ fontSize: 18 }} />,
				color: "#dc2626",
				bgColor: "#fee2e2",
				chipColor: "#dc2626",
			},
			stamped: {
				icon: <LockIcon sx={{ fontSize: 18 }} />,
				color: "#ea580c",
				bgColor: "#ffedd5",
				chipColor: "#ea580c",
			},
			updated: {
				icon: <UploadIcon sx={{ fontSize: 18 }} />,
				color: "#9333ea",
				bgColor: "#f3e8ff",
				chipColor: "#9333ea",
			},
			assigned: {
				icon: <TaskIcon sx={{ fontSize: 18 }} />,
				color: "#0891b2",
				bgColor: "#e0f2fe",
				chipColor: "#0891b2",
			},
			commented: {
				icon: <CommentIcon sx={{ fontSize: 18 }} />,
				color: "#7c3aed",
				bgColor: "#ede9fe",
				chipColor: "#7c3aed",
			},
		};
		return (
			configs[action] || {
				icon: <CheckIcon sx={{ fontSize: 18 }} />,
				color: "#6b7280",
				bgColor: "#f3f4f6",
				chipColor: "#6b7280",
			}
		);
	};

	const getInitials = (name: string | null | undefined) => {
		if (!name) return "?";
		const parts = name.trim().split(" ");
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	};

	return (
		<Box
			sx={{
				p: 3,
				maxWidth: 900,
				mx: "auto",
				height: "100%",
				overflow: "auto",
				bgcolor: "#fafafa",
			}}
		>
			<Box sx={{ position: "relative", pl: 7 }}>
				{/* Vertical timeline line */}
				<Box
					sx={{
						position: "absolute",
						left: 28,
						top: 0,
						bottom: 0,
						width: 2,
						bgcolor: "#e5e7eb",
						display: logs.length > 0 ? "block" : "none",
					}}
				/>

				{/* Timeline entries */}
				{sortedLogs.map((entry, index) => {
					const config = getActionConfig(entry.action);
					const location =
						(entry.details as any)?.location ||
						entry.user?.role ||
						(entry.action === "approved"
							? "መሪ ጽ/ቤት"
							: entry.action === "stamped"
								? "ዲጂታል ማህተሚያ"
								: "አዲስ አበባ");

					return (
						<Box
							key={entry.id || index}
							sx={{
								position: "relative",
								mb: 2,
							}}
						>
							{/* Date on the left */}
							<Box
								sx={{
									position: "absolute",
									left: -56,
									top: 8,
									textAlign: "center",
									width: 40,
								}}
							>
								<Typography
									variant="h6"
									sx={{
										fontWeight: 700,
										fontSize: "1.25rem",
										lineHeight: 1,
										color: "text.primary",
									}}
								>
									{new Date(entry.createdAt).getDate()}
								</Typography>
								<Typography
									variant="caption"
									sx={{
										fontSize: "0.75rem",
										color: "text.secondary",
									}}
								>
									{formatDate(entry.createdAt).split(" ")[1]}
								</Typography>
							</Box>

							{/* Icon circle */}
							<Box
								sx={{
									position: "absolute",
									left: -28,
									top: 12,
									width: 16,
									height: 16,
									borderRadius: "50%",
									bgcolor: config.color,
									border: "3px solid white",
									zIndex: 2,
									boxShadow: "0 0 0 2px #e5e7eb",
								}}
							/>

							{/* Content Card */}
							<Paper
								elevation={0}
								sx={{
									p: 2.5,
									borderRadius: 2,
									bgcolor: "white",
									border: "1px solid #e5e7eb",
								}}
							>
								<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
									{/* Status chip and title */}
									<Box>
										<Chip
											label={getActionLabel(entry.action)}
											size="small"
											sx={{
												height: 24,
												fontSize: "0.75rem",
												fontWeight: 600,
												bgcolor: config.chipColor,
												color: "white",
												mb: 1,
											}}
										/>
										<Typography
											variant="h6"
											sx={{
												fontWeight: 700,
												fontSize: "1rem",
												color: "text.primary",
											}}
										>
											{entry.user?.name || "Unknown User"}
										</Typography>
									</Box>

									{/* User info and location */}
									<Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
										{entry.user?.name && (
											<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
												<PersonIcon sx={{ fontSize: 16, color: "text.secondary" }} />
												<Typography
													variant="body2"
													sx={{
														color: "text.secondary",
														fontSize: "0.875rem",
													}}
												>
													{entry.user.name}
												</Typography>
											</Box>
										)}

										{entry.user?.role && (
											<Chip
												label={entry.user.role}
												size="small"
												variant="outlined"
												sx={{
													height: 22,
													fontSize: "0.7rem",
													borderColor: "#e5e7eb",
													color: "text.secondary",
												}}
											/>
										)}
									</Box>
								</Box>
							</Paper>
						</Box>
					);
				})}

				{/* Empty state */}
				{logs.length === 0 && (
					<Paper
						elevation={0}
						sx={{
							p: 6,
							textAlign: "center",
							bgcolor: "white",
							borderRadius: 2,
							border: "2px dashed #e5e7eb",
						}}
					>
						<TaskIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 2 }} />
						<Typography
							variant="h6"
							sx={{
								fontWeight: 600,
								mb: 1,
								color: "text.secondary",
							}}
						>
							አሁን ድረስ ምንም ኦዲት መዝገብ የለም
						</Typography>
						<Typography variant="body2" color="text.disabled">
							ደብዳቤው ሲቀይር ወይም ሲጸድቅ ኦዲት መዝገቦች እዚህ ይታያሉ
						</Typography>
					</Paper>
				)}
			</Box>
		</Box>
	);
}
