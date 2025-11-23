"use client";

import {
	Box,
	Typography,
	Avatar,
	Paper,
	TextField,
	IconButton,
	InputAdornment,
	Chip,
	Popover,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/utils/orpc";
import { toast } from "sonner";

const ReplyIcon = () => (
	<Box
		component="svg"
		width={18}
		height={18}
		fill="none"
		stroke="currentColor"
		strokeLinecap="round"
		strokeLinejoin="round"
		strokeWidth={1.5}
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		sx={{ display: "block" }}
	>
		<path d="m9 17-5-5 5-5" />
		<path d="M20 18v-2a4 4 0 0 0-4-4H4" />
	</Box>
);

interface CommentMessage {
	id: string;
	content: string;
	createdAt: string | Date;
	user?: {
		id?: string | null;
		name?: string | null;
		role?: string | null;
		email?: string | null;
	} | null;
	mentionedUsers?: Array<{
		id: string;
		name: string;
		email?: string;
		role?: string;
	}>;
	align?: "left" | "right";
}

interface LetterDiscussionProps {
	letterId: string;
	comments: CommentMessage[];
	currentUserId: string;
}

const formatTime = (value: string | Date) =>
	new Date(value).toLocaleTimeString("am-ET", {
		hour: "2-digit",
		minute: "2-digit",
	});

export default function LetterDiscussion({ letterId, comments, currentUserId }: LetterDiscussionProps) {
	const [message, setMessage] = useState("");
	const queryClient = useQueryClient();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	
	// Popover state for mentions
	const [mentionPopover, setMentionPopover] = useState<{
		open: boolean;
		anchorEl: HTMLElement | null;
		users: Array<{ id: string; name: string; email?: string; role?: string }>;
	}>({
		open: false,
		anchorEl: null,
		users: [],
	});

	const messages = comments;

	// Auto-scroll to bottom on mount and when messages change
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	// Scroll to bottom on initial load
	useEffect(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
		}
	}, []);

	const addCommentMutation = useMutation({
		mutationFn: (content: string) =>
			client.letter.addComment({ letterId, content }),
		onSuccess: () => {
			toast.success("መልእክት ተልኳል");
			setMessage("");
			// Invalidate the letter query to refetch with new comments
			queryClient.invalidateQueries({ queryKey: ["letter", "getById", letterId] });
			// Scroll to bottom after new comment is added
			setTimeout(() => {
				if (messagesEndRef.current) {
					messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
				}
			}, 100);
		},
		onError: (error: Error) => {
			toast.error(error.message || "መልእክት ላክ አልተሳካም");
		},
	});

	const handleSend = () => {
		if (!message.trim()) return;
		addCommentMutation.mutate(message.trim());
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", bgcolor: "background.default" }}>
			<Box 
				ref={scrollContainerRef} 
				sx={{ 
					flex: 1, 
					overflow: "auto", 
					px: { xs: 2, md: 3 }, 
					py: 3,
					"&::-webkit-scrollbar": {
						width: "8px",
					},
					"&::-webkit-scrollbar-track": {
						background: "transparent",
					},
					"&::-webkit-scrollbar-thumb": {
						background: "rgba(0,0,0,0.2)",
						borderRadius: "4px",
						"&:hover": {
							background: "rgba(0,0,0,0.3)",
						},
					},
				}}
			>
				<Typography 
					variant="subtitle2" 
					color="text.secondary" 
					sx={{ 
						textAlign: "center", 
						mb: 4,
						fontWeight: 600,
						letterSpacing: 1,
						textTransform: "uppercase",
						fontSize: "0.7rem",
						color: "text.secondary",
					}}
				>
					ዛሬ • የውይይት መዝገብ
				</Typography>

				<Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
					{messages.map((msg) => {
						const align =
							msg.align ??
							(msg.user?.id === currentUserId ? "right" : "left");
						const author = msg.user?.name || "ተጠቃሚ";
						const mentionedUsers = msg.mentionedUsers || [];
						return (
							<Box
								key={msg.id}
								sx={{
									display: "flex",
									flexDirection: align === "right" ? "row-reverse" : "row",
									alignItems: "flex-start",
									gap: 1.5,
								}}
							>
								<Avatar 
									sx={{ 
										width: 36, 
										height: 36,
										bgcolor: align === "right" ? "primary.main" : "grey.300",
										fontSize: "0.8125rem",
										fontWeight: 600,
										flexShrink: 0,
									}}
								>
									{author.charAt(0).toUpperCase()}
								</Avatar>
								<Box sx={{ maxWidth: { xs: "80%", md: "70%" }, flex: 1, minWidth: 0 }}>
									{/* Mentions list - Google-like styling - filter out current user */}
									{mentionedUsers.filter((u) => u.id !== currentUserId).length > 0 && (
										<Box sx={{ display: "flex", gap: 0.75, mb: 1, flexWrap: "wrap", alignItems: "center" }}>
											{mentionedUsers
												.filter((u) => u.id !== currentUserId)
												.slice(0, 2)
												.map((user) => (
													<Chip
														key={user.id}
														label={`@${user.name}`}
														size="small"
														variant="outlined"
														sx={{
															fontSize: "0.6875rem",
															height: "24px",
															borderColor: "rgba(0, 0, 0, 0.12)",
															color: "text.primary",
															bgcolor: "rgba(0, 0, 0, 0.04)",
															fontWeight: 500,
															"& .MuiChip-label": {
																px: 1.25,
															},
															"&:hover": {
																bgcolor: "rgba(0, 0, 0, 0.08)",
																borderColor: "rgba(0, 0, 0, 0.2)",
															},
														}}
													/>
												))}
											{mentionedUsers.filter((u) => u.id !== currentUserId).length > 2 && (
												<Typography
													component="span"
													onClick={(e) => {
														setMentionPopover({
															open: true,
															anchorEl: e.currentTarget,
															users: mentionedUsers.filter((u) => u.id !== currentUserId),
														});
													}}
													sx={{
														fontSize: "0.6875rem",
														color: "primary.main",
														cursor: "pointer",
														fontWeight: 500,
														px: 0.75,
														py: 0.25,
														borderRadius: "4px",
														"&:hover": {
															color: "primary.dark",
															bgcolor: "rgba(25, 118, 210, 0.08)",
														},
													}}
												>
													እና {mentionedUsers.filter((u) => u.id !== currentUserId).length - 2} {mentionedUsers.filter((u) => u.id !== currentUserId).length - 2 === 1 ? "ሌላ" : "ሌሎች"}
												</Typography>
											)}
										</Box>
									)}
									
									<Box
										sx={{
											px: 2,
											py: 1.5,
											borderRadius: 1.5,
											bgcolor: align === "right" ? "primary.main" : "grey.50",
											color: align === "right" ? "primary.contrastText" : "text.primary",
											boxShadow: "none",
											border: align === "right" ? "none" : "1px solid",
											borderColor: align === "right" ? "transparent" : "grey.200",
										}}
									>
										<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
											<Typography 
												variant="subtitle2" 
												sx={{ 
													fontWeight: 600,
													fontSize: "0.8125rem",
													color: align === "right" ? "inherit" : "text.primary",
												}}
											>
												{author}
											</Typography>
											<Typography 
												variant="caption" 
												sx={{ 
													color: align === "right" ? "rgba(255,255,255,0.7)" : "text.secondary",
													fontSize: "0.6875rem",
												}}
											>
												{formatTime(msg.createdAt)}
											</Typography>
										</Box>
										<Typography 
											variant="body2" 
											sx={{ 
												whiteSpace: "pre-line",
												lineHeight: 1.6,
												fontSize: "0.875rem",
												color: align === "right" ? "inherit" : "text.primary",
											}}
										>
											{msg.content}
										</Typography>
									</Box>
								</Box>
							</Box>
						);
					})}
					<div ref={messagesEndRef} />
				</Box>
			</Box>

			{/* Mentions Popover - Google-like styling */}
			<Popover
				open={mentionPopover.open}
				anchorEl={mentionPopover.anchorEl}
				onClose={() => setMentionPopover({ open: false, anchorEl: null, users: [] })}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "left",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "left",
				}}
				PaperProps={{
					sx: {
						maxWidth: 320,
						maxHeight: 400,
						mt: 0.5,
						boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
						borderRadius: "8px",
						overflow: "hidden",
					},
				}}
			>
				<Box>
					<Typography 
						variant="subtitle2" 
						sx={{ 
							px: 2, 
							py: 1.5, 
							fontWeight: 600,
							fontSize: "0.875rem",
							borderBottom: 1,
							borderColor: "divider",
							bgcolor: "background.paper",
						}}
					>
						የተጠቀሱ ተጠቃሚዎች ({mentionPopover.users.filter((u) => u.id !== currentUserId).length})
					</Typography>
					<List
						sx={{
							maxHeight: 300,
							overflowY: "auto",
							py: 0.5,
							"&::-webkit-scrollbar": {
								width: "8px",
							},
							"&::-webkit-scrollbar-track": {
								background: "transparent",
							},
							"&::-webkit-scrollbar-thumb": {
								background: "rgba(0,0,0,0.2)",
								borderRadius: "4px",
								"&:hover": {
									background: "rgba(0,0,0,0.3)",
								},
							},
						}}
					>
						{mentionPopover.users.filter((u) => u.id !== currentUserId).map((user) => (
							<ListItem 
								key={user.id} 
								sx={{ 
									px: 2, 
									py: 1,
									"&:hover": {
										bgcolor: "action.hover",
									},
								}}
							>
								<ListItemAvatar>
									<Avatar
										sx={{
											width: 36,
											height: 36,
											bgcolor: "primary.main",
											fontSize: "0.875rem",
											fontWeight: 500,
										}}
									>
										{user.name.charAt(0).toUpperCase()}
									</Avatar>
								</ListItemAvatar>
								<ListItemText
									primary={
										<Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.875rem" }}>
											{user.name}
										</Typography>
									}
									secondary={
										<Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, mt: 0.25 }}>
											{user.email && (
												<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
													{user.email}
												</Typography>
											)}
											{user.role && (
												<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
													{user.role}
												</Typography>
											)}
										</Box>
									}
								/>
							</ListItem>
						))}
					</List>
				</Box>
			</Popover>

			{/* Message Input */}
			<Box
				sx={{
					borderTop: 1,
					borderColor: "divider",
					p: 2,
					bgcolor: "background.paper",
				}}
			>
				<TextField
					fullWidth
					multiline
					maxRows={4}
					placeholder="መልእክት ይጻፉ..."
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyPress={handleKeyPress}
					disabled={addCommentMutation.isPending}
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								<IconButton
									onClick={handleSend}
									disabled={!message.trim() || addCommentMutation.isPending}
									color="primary"
									sx={{ 
										mr: -1,
										"&:hover": {
											bgcolor: "primary.light",
											color: "primary.contrastText",
										},
									}}
								>
									<SendIcon />
								</IconButton>
							</InputAdornment>
						),
					}}
					sx={{
						"& .MuiOutlinedInput-root": {
							borderRadius: 2,
							bgcolor: "background.default",
							"&:hover": {
								bgcolor: "background.paper",
							},
							"&.Mui-focused": {
								bgcolor: "background.paper",
							},
						},
					}}
				/>
			</Box>
		</Box>
	);
}

