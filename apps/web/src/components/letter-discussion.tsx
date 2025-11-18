"use client";

import {
	Box,
	Typography,
	Avatar,
	Paper,
	TextField,
	IconButton,
	InputAdornment,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/utils/orpc";
import { toast } from "sonner";

interface CommentMessage {
	id: string;
	content: string;
	createdAt: string | Date;
	user?: {
		id?: string | null;
		name?: string | null;
		role?: string | null;
	} | null;
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

	const messages = comments;

	const addCommentMutation = useMutation({
		mutationFn: (content: string) =>
			client.letter.addComment({ letterId, content }),
		onSuccess: () => {
			toast.success("መልእክት ተልኳል");
			setMessage("");
			// Invalidate the letter query to refetch with new comments
			queryClient.invalidateQueries({ queryKey: ["letter", "getById", letterId] });
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
		<Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
			<Box sx={{ flex: 1, overflow: "auto", px: 3, py: 2 }}>
				<Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: "center", mb: 2 }}>
					ዛሬ • የውይይት መዝገብ
				</Typography>

				<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
					{messages.map((msg) => {
						const align =
							msg.align ??
							(msg.user?.id === currentUserId ? "right" : "left");
						const author = msg.user?.name || "ተጠቃሚ";
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
								<Avatar sx={{ width: 34, height: 34 }}>
									{author.charAt(0).toUpperCase()}
								</Avatar>
								<Box sx={{ maxWidth: { xs: "80%", md: "70%" } }}>
									<Paper
										sx={{
											px: 2,
											py: 1.25,
											mb: 0.5,
											borderRadius: 3,
											bgcolor: align === "right" ? "primary.light" : "grey.100",
											color: align === "right" ? "primary.contrastText" : "text.primary",
										}}
									>
										<Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
											<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
												{author}
											</Typography>
											<Typography variant="caption" color="inherit">
												{formatTime(msg.createdAt)}
											</Typography>
										</Box>
										<Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
											{msg.content}
										</Typography>
									</Paper>
								</Box>
							</Box>
						);
					})}
				</Box>
			</Box>

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
									sx={{ mr: -1 }}
								>
									<SendIcon />
								</IconButton>
							</InputAdornment>
						),
					}}
					sx={{
						"& .MuiOutlinedInput-root": {
							borderRadius: 3,
						},
					}}
				/>
			</Box>
		</Box>
	);
}

