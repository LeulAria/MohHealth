"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
	Box,
	Paper,
	Typography,
	Chip,
	Avatar,
	Button,
	Divider,
	TextField,
	IconButton,
	Checkbox,
	FormControlLabel,
	LinearProgress,
	Card,
	CardContent,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
} from "@mui/material";
import {
	ArrowBack as ArrowBackIcon,
	CheckCircle as CheckCircleIcon,
	Comment as CommentIcon,
	Send as SendIcon,
	AttachFile as AttachFileIcon,
	PersonAdd as PersonAddIcon,
	Lock as LockIcon,
	Edit as EditIcon,
	Flag as FlagIcon,
	Upload as UploadIcon,
	Task as TaskIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { getLetterPermissions } from "@/lib/letter-permissions";

interface Letter {
	id: string;
	type: "internal" | "external";
	direction: "incoming" | "outgoing";
	status: string;
	referenceNumber: string;
	date: string;
	to: string;
	from: string;
	subject: string;
	content: any;
	assignedTo?: string;
	approvedBy?: string;
	createdBy: string;
	createdAt: string;
}

interface ActivityLog {
	id: string;
	userId: string;
	userName: string;
	userAvatar: string;
	action: string;
	details: string;
	createdAt: string;
}

interface Comment {
	id: string;
	userId: string;
	userName: string;
	userAvatar: string;
	content: string;
	createdAt: string;
}

const mockLetter: Letter = {
	id: "1",
	type: "internal",
	direction: "outgoing",
	status: "pending_approval",
	referenceNumber: "ጠ/ሥ/ሥ/ጥ/መ/ስ/አ/001",
	date: "2024-01-15",
	to: "ዴስክ ሃላፊ",
	from: "ጤና ኢኖቬሽንና ጥራት መሪ ስራ አስፈፃሚ",
	subject: "የጤና አገልግሎት ጥራት ማሻሻያ",
	content: {},
	assignedTo: "user2",
	createdBy: "user1",
	createdAt: "2024-01-15T10:00:00Z",
};

const mockActivities: ActivityLog[] = [
	{
		id: "1",
		userId: "user1",
		userName: "ፀሐፊ",
		userAvatar: "ፀ",
		action: "created",
		details: "ደብዳቤ ፈጠረ",
		createdAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "2",
		userId: "user1",
		userName: "ፀሐፊ",
		userAvatar: "ፀ",
		action: "assigned",
		details: "ወደ መሪ ስራ አስፈፃሚ ላከ",
		createdAt: "2024-01-15T10:05:00Z",
	},
	{
		id: "3",
		userId: "user2",
		userName: "መሪ ስራ አስፈፃሚ",
		userAvatar: "መ",
		action: "commented",
		details: "አስተያየት ሰጠ",
		createdAt: "2024-01-15T11:00:00Z",
	},
	{
		id: "4",
		userId: "user2",
		userName: "መሪ ስራ አስፈፃሚ",
		userAvatar: "መ",
		action: "assigned",
		details: "ወደ ዴስክ ሃላፊ አደረገ",
		createdAt: "2024-01-15T11:30:00Z",
	},
];

const mockComments: Comment[] = [
	{
		id: "1",
		userId: "user2",
		userName: "መሪ ስራ አስፈፃሚ",
		userAvatar: "መ",
		content: "ይህ ደብዳቤ በጥሩ ሁኔታ ተዘጋጅቷል። እባክዎ ትንሽ ማሻሻያ ያድርጉ።",
		createdAt: "2024-01-15T11:00:00Z",
	},
];

const mockSubtasks = [
	{ id: "1", text: "ደብዳቤ ማዘጋጀት", completed: true },
	{ id: "2", text: "መሪ ስራ አስፈፃሚ ምርጫ", completed: true },
	{ id: "3", text: "ዴስክ ሃላፊ አስተያየት", completed: false },
	{ id: "4", text: "ዲጂታል ማህተም", completed: false },
];

export default function LetterDetail({
	letterId,
	session,
}: {
	letterId: string;
	session: typeof authClient.$Infer.Session;
}) {
	const router = useRouter();
	const userRole = (session?.user as any)?.role || "";
	const permissions = getLetterPermissions(userRole);
	const [comment, setComment] = useState("");
	const [assignDialogOpen, setAssignDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState("");

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "draft":
				return "default";
			case "pending_approval":
				return "warning";
			case "approved":
				return "success";
			case "stamped":
				return "info";
			case "locked":
				return "success";
			default:
				return "default";
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "draft":
				return "አስቀድሞ";
			case "pending_approval":
				return "ምርጫ በመጠባበቅ ላይ";
			case "approved":
				return "ተጸድቋል";
			case "stamped":
				return "ተማርክቷል";
			case "locked":
				return "ተቆልጧል";
			default:
				return status;
		}
	};

	const completedSubtasks = mockSubtasks.filter((t) => t.completed).length;
	const totalSubtasks = mockSubtasks.length;

	return (
		<Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
			{/* Main Content */}
			<Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
				{/* Header */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
					<IconButton onClick={() => router.back()}>
						<ArrowBackIcon />
					</IconButton>
					<Box sx={{ flex: 1 }}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
							<Chip
								label="ውስጣዊ ደብዳቤ"
								size="small"
								color="primary"
							/>
							<Chip
								label={getStatusLabel(mockLetter.status)}
								size="small"
								color={getStatusColor(mockLetter.status) as any}
							/>
						</Box>
						<Typography variant="h4" sx={{ fontWeight: 600 }}>
							{mockLetter.subject}
						</Typography>
					</Box>
					{/* Action Buttons */}
					<Box sx={{ display: "flex", gap: 2 }}>
						{permissions.canApprove && mockLetter.status === "pending_approval" && (
							<>
								<Button
									variant="contained"
									color="success"
									startIcon={<CheckCircleIcon />}
								>
									ጸድቅ
								</Button>
								<Button
									variant="outlined"
									color="error"
								>
									አትቀበል
								</Button>
							</>
						)}
						{permissions.canStamp && mockLetter.status === "approved" && (
							<Button
								variant="contained"
								color="primary"
								startIcon={<LockIcon />}
							>
								ዲጂታል ማህተም አክል
							</Button>
						)}
					</Box>
				</Box>

				<Paper sx={{ p: 3, mb: 3 }}>
					<Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
						የጤና አገልግሎት ጥራትን ለማሻሻያ የሚያገለግሉ ደብዳቤዎችን ማዘጋጀት።
					</Typography>

					{/* Created by */}
					<Box sx={{ mb: 3 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							በፈጠረ:
						</Typography>
						<Chip
							avatar={<Avatar>ፀ</Avatar>}
							label="ፀሐፊ"
							variant="outlined"
						/>
					</Box>

					{/* Assigned to */}
					<Box sx={{ mb: 3 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							ወደ ተመድቧል:
						</Typography>
						<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
							<Chip
								avatar={<Avatar>ዴ</Avatar>}
								label="ዴስክ ሃላፊ"
								variant="outlined"
							/>
							{permissions.canAssignTask && (
								<IconButton
									size="small"
									onClick={() => setAssignDialogOpen(true)}
									sx={{ border: "1px dashed", borderColor: "divider" }}
								>
									<PersonAddIcon />
								</IconButton>
							)}
						</Box>
					</Box>

					{/* Subtasks / Workflow Steps */}
					<Box sx={{ mb: 3 }}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
							<TaskIcon sx={{ color: "text.secondary" }} />
							<Typography variant="body2" color="text.secondary">
								የስራ ደረጃዎች
							</Typography>
						</Box>
						<Box sx={{ mb: 2 }}>
							<LinearProgress
								variant="determinate"
								value={(completedSubtasks / totalSubtasks) * 100}
								sx={{ height: 8, borderRadius: 4, mb: 1 }}
							/>
							<Typography variant="caption" color="text.secondary">
								{completedSubtasks}/{totalSubtasks}
							</Typography>
						</Box>
						<List>
							{mockSubtasks.map((subtask) => (
								<ListItem key={subtask.id} disablePadding>
									<FormControlLabel
										control={
											<Checkbox
												checked={subtask.completed}
												disabled={!permissions.canApprove}
											/>
										}
										label={subtask.text}
									/>
								</ListItem>
							))}
						</List>
					</Box>

					{/* Attachments */}
					<Box sx={{ mb: 3 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
							አባሪዎች
						</Typography>
						<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
							<Card variant="outlined" sx={{ minWidth: 200 }}>
								<CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<AttachFileIcon color="error" />
										<Box>
											<Typography variant="body2">document.pdf</Typography>
											<Typography variant="caption" color="text.secondary">
												2.4 MB
											</Typography>
										</Box>
									</Box>
								</CardContent>
							</Card>
							<Card
								variant="outlined"
								sx={{
									minWidth: 200,
									border: "1px dashed",
									borderColor: "divider",
									cursor: "pointer",
								}}
							>
								<CardContent
									sx={{
										p: 2,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexDirection: "column",
										gap: 1,
									}}
								>
									<UploadIcon color="action" />
									<Typography variant="caption" color="text.secondary">
										አባሪ ያክሉ
									</Typography>
								</CardContent>
							</Card>
						</Box>
					</Box>

					{/* Comments Section */}
					<Divider sx={{ my: 3 }} />
					<Typography variant="h6" sx={{ mb: 2 }}>
						አስተያየቶች
					</Typography>
					<List>
						{mockComments.map((comment) => (
							<ListItem key={comment.id} alignItems="flex-start">
								<ListItemAvatar>
									<Avatar>{comment.userAvatar}</Avatar>
								</ListItemAvatar>
								<ListItemText
									primary={comment.userName}
									secondary={
										<>
											<Typography variant="body2" component="span">
												{comment.content}
											</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
												{formatDate(comment.createdAt)} - {formatTime(comment.createdAt)}
											</Typography>
										</>
									}
								/>
							</ListItem>
						))}
					</List>

					{/* Add Comment */}
					{permissions.canComment && (
						<Box sx={{ mt: 2 }}>
							<TextField
								fullWidth
								multiline
								rows={3}
								placeholder="አስተያየት ያክሉ..."
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								InputProps={{
									endAdornment: (
										<IconButton
											color="primary"
											disabled={!comment.trim()}
											sx={{ position: "absolute", right: 8, bottom: 8 }}
										>
											<SendIcon />
										</IconButton>
									),
								}}
							/>
						</Box>
					)}


				</Paper>
			</Box>

			{/* Right Sidebar - Activity Logs */}
			<Box
				sx={{
					width: 350,
					bgcolor: "background.paper",
					borderLeft: 1,
					borderColor: "divider",
					p: 2,
					overflow: "auto",
				}}
			>
				<Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
					የቅርብ ጊዜ እንቅስቃሴ
				</Typography>
				<List>
					{mockActivities.map((activity) => (
						<ListItem key={activity.id} alignItems="flex-start" disablePadding>
							<ListItemAvatar sx={{ minWidth: 40 }}>
								<Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
									{activity.userAvatar}
								</Avatar>
							</ListItemAvatar>
							<ListItemText
								primary={
									<Typography variant="body2">
										<strong>{activity.userName}</strong> {activity.details}
									</Typography>
								}
								secondary={
									<Typography variant="caption" color="text.secondary">
										{formatDate(activity.createdAt)} - {formatTime(activity.createdAt)}
									</Typography>
								}
								sx={{ mb: 2 }}
							/>
						</ListItem>
					))}
				</List>
			</Box>

			{/* Assign Task Dialog */}
			<Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
				<DialogTitle>ደብዳቤ መመድብ</DialogTitle>
				<DialogContent>
					<FormControl fullWidth sx={{ mt: 2 }}>
						<InputLabel>ተጠቃሚ ይምረጡ</InputLabel>
						<Select
							value={selectedUser}
							onChange={(e) => setSelectedUser(e.target.value)}
							label="ተጠቃሚ ይምረጡ"
						>
							<MenuItem value="desk_head">ዴስክ ሃላፊ</MenuItem>
							<MenuItem value="expert">ኤክስፐርት</MenuItem>
							<MenuItem value="record_room">መዝገብ ክፍል</MenuItem>
						</Select>
					</FormControl>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setAssignDialogOpen(false)}>ተወ</Button>
					<Button variant="contained" onClick={() => setAssignDialogOpen(false)}>
						አስቀምጥ
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}

