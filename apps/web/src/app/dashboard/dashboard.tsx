"use client";
import { authClient } from "@/lib/auth-client";
import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "@/utils/orpc";
import LetterDisplay from "@/components/letter-display";
import LetterDiscussion from "@/components/letter-discussion";
import LetterAuditTimeline from "@/components/letter-audit-timeline";
import { toast } from "sonner";
import {
	Box,
	Drawer,
	AppBar,
	Toolbar,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	TextField,
	InputAdornment,
	Typography,
	Avatar,
	Badge,
	Chip,
	IconButton,
	Divider,
	Paper,
	Tabs,
	Tab,
	Button,
	ButtonGroup,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from "@mui/material";
import {
	Home as HomeIcon,
	LocalShipping as ShippingIcon,
	TrackChanges as TrackingIcon,
	Mail as MailIcon,
	Contacts as ContactIcon,
	Receipt as InvoiceIcon,
	Analytics as AnalyticIcon,
	Search as SearchIcon,
	Menu as MenuIcon,
	ArrowBack as ArrowBackIcon,
	Edit as EditIcon,
	Flag as FlagIcon,
	Delete as DeleteIcon,
	Reply as ReplyIcon,
	Forward as ForwardIcon,
	Archive as ArchiveIcon,
	Logout as LogoutIcon,
	AccountCircle as AccountCircleIcon,
	Add as AddIcon,
	Close as CloseIcon,
	Inbox as InboxIcon,
	Outbox as OutboxIcon,
	Assignment as TaskIcon,
	Comment as CommentIcon,
	CameraAlt as ScanIcon,
	Verified as VerifiedIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface Email {
	id: string;
	sender: string;
	avatar: string;
	subject: string;
	preview: string;
	date: string;
	isNew?: boolean;
	status?: string;
	direction?: string;
}

type LetterDetail = Awaited<ReturnType<typeof client.letter.getById>>;

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 80;

export default function Dashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const currentUserId = session.user.id;
	const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
	const [activeNav, setActiveNav] = useState("inbox");
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [detailTab, setDetailTab] = useState(0); // 0: detail, 1: discussion, 2: audit

	const userRole = (session?.user as any)?.role || "";
	const isAdmin = userRole === "admin" || userRole === "መሪ ስራ አስፈፃሚ" || userRole === "lead_executive";
	const isRecordsSection = userRole === "መዝገብ ክፍል" || userRole === "records_section";
	const isDraftView = isAdmin && activeNav === "drafts";
	const [directionFilter, setDirectionFilter] = useState<string | null>(null); // null = all, "incoming", "outgoing", "draft", "stamped"
	const [statusFilter, setStatusFilter] = useState<string | null>(null); // null = all, "new", "approved", "archived", "rejected"

	// Fetch letters from backend
	const lettersQueryOptions = useMemo(
		() =>
			isDraftView
				? orpc.letter.getByStatus.queryOptions({ status: "draft" })
				: orpc.letter.getAll.queryOptions(),
		[isDraftView],
	);
	const { data: letters = [], isLoading } = useQuery(lettersQueryOptions);

	// Fetch selected letter details
	const letterId = selectedEmail?.id || "";
	const { data: selectedLetterData, isLoading: isLoadingLetter, error: letterError } = useQuery<LetterDetail | null>({
		queryKey: ["letter", "getById", letterId],
		queryFn: async () => {
			if (!letterId) return null;
			return await client.letter.getById({ id: letterId });
		},
		enabled: !!letterId && letterId.length > 0,
	});

	// Transform letters to Email format
	const emails: Email[] = useMemo(() => {
		return letters.map((letter) => {
			const senderName = letter.from || "Unknown";
			const initials = senderName
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2);
			
			const date = letter.createdAt 
				? new Date(letter.createdAt).toLocaleDateString("am-ET", {
						day: "numeric",
						month: "short",
					})
				: "";

			// Extract preview from content if available
			let preview = "";
			if (letter.content && Array.isArray(letter.content)) {
				const firstParagraph = letter.content.find(
					(node: any) => node.type === "p" && node.children?.[0]?.text
				);
				preview = firstParagraph?.children?.[0]?.text?.slice(0, 50) || "";
			}

			return {
				id: letter.id,
				sender: senderName,
				avatar: initials,
				subject: letter.subject || "No Subject",
				preview: preview || "",
				date: date,
				isNew: letter.status === "draft" || letter.status === "pending_approval",
				status: letter.status,
				direction: letter.direction,
			};
		});
	}, [letters]);

	// Filter emails based on search query, direction filter, and status filter
	const filteredEmails = useMemo(() => {
		let filtered = emails;
		
		// Apply direction filter
		if (directionFilter) {
			if (directionFilter === "draft") {
				filtered = filtered.filter((email) => email.status === "draft");
			} else if (directionFilter === "stamped") {
				filtered = filtered.filter((email) => email.status === "stamped");
			} else {
				filtered = filtered.filter((email) => email.direction === directionFilter);
			}
		}
		
		// Apply status filter
		if (statusFilter) {
			if (statusFilter === "new") {
				filtered = filtered.filter((email) => email.status === "draft" || email.status === "pending_approval");
			} else {
				filtered = filtered.filter((email) => email.status === statusFilter);
			}
		}
		
		// Apply search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(email) =>
					email.sender.toLowerCase().includes(query) ||
					email.subject.toLowerCase().includes(query) ||
					email.preview.toLowerCase().includes(query)
			);
		}
		
		return filtered;
	}, [emails, searchQuery, directionFilter, statusFilter]);

	useEffect(() => {
		if (!selectedEmail) return;
		const exists = emails.some((email) => email.id === selectedEmail.id);
		if (!exists) {
			setSelectedEmail(null);
		}
	}, [emails, selectedEmail]);

	const handleLogoutClick = () => {
		setLogoutDialogOpen(true);
	};

	const handleLogoutClose = () => {
		setLogoutDialogOpen(false);
	};

	const handleLogout = async () => {
		handleLogoutClose();
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push("/login");
				},
			},
		});
	};

	const reviewMutation = useMutation({
		mutationFn: (payload: { id: string; action: "approve" | "reject"; note?: string }) =>
			client.letter.review(payload),
		onSuccess: (data, variables) => {
			const actionText = variables.action === "approve" ? "ተጸድቋል" : "ተቀድቷል";
			toast.success(`ደብዳቤ ${actionText}`);
			
			// Invalidate all letter queries to refetch
			queryClient.invalidateQueries({ queryKey: orpc.letter.getAll.queryOptions().queryKey });
			queryClient.invalidateQueries({
				queryKey: orpc.letter.getByStatus.queryOptions({ status: "draft" }).queryKey,
			});
			if (selectedEmail?.id) {
				queryClient.invalidateQueries({ queryKey: ["letter", "getById", selectedEmail.id] });
			}
			
			// Update selected email status if it's the one being reviewed
			if (selectedEmail?.id === variables.id) {
				setSelectedEmail((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						status: variables.action === "approve" ? "approved" : "rejected",
						isNew: false,
					};
				});
			}
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const handleReview = (action: "approve" | "reject") => {
		if (!selectedLetterData) return;
		reviewMutation.mutate({ id: selectedLetterData.id, action });
	};

	const stampMutation = useMutation({
		mutationFn: (id: string) => client.letter.stamp({ id }),
		onSuccess: () => {
			toast.success("ደብዳቤ ተማህቷል");
			
			// Invalidate all letter queries to refetch
			queryClient.invalidateQueries({ queryKey: orpc.letter.getAll.queryOptions().queryKey });
			if (selectedEmail?.id) {
				queryClient.invalidateQueries({ queryKey: ["letter", "getById", selectedEmail.id] });
			}
			
			// Update selected email status
			if (selectedEmail) {
				setSelectedEmail((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						status: "stamped",
					};
				});
			}
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const handleStamp = () => {
		if (!selectedLetterData) return;
		stampMutation.mutate(selectedLetterData.id);
	};

	// Define all possible navigation items
	const allNavItems = [
		{ id: "inbox", label: "ገቢ ደብዳቤዎች", icon: InboxIcon, roles: ["መሪ ስራ አስፈፃሚ", "lead_executive"] },
		{ id: "outbox", label: "ውጪ ደብዳቤዎች", icon: OutboxIcon, roles: ["መሪ ስራ አስፈፃሚ", "ፀሐፊ", "lead_executive"] },
		{ id: "tasks", label: "ተግባራት", icon: TaskIcon, roles: ["መሪ ስራ አስፈፃሚ", "ዴስክ ሃላፊ", "ኤክስፐርት", "ፀሐፊ", "መዝገብ ክፍል", "lead_executive"] },
		{ id: "comments", label: "ቃኝ", icon: CommentIcon, roles: ["መሪ ስራ አስፈፃሚ", "ዴስክ ሃላፊ", "ኤክስፐርት", "ፀሐፊ", "መዝገብ ክፍል", "lead_executive"] },
		{ id: "scan-incoming", label: "ገቢ ደብዳቤ ይቃኙ", icon: ScanIcon, roles: ["ፀሐፊ", "መዝገብ ክፍል"] },
		{ id: "drafts", label: "የድራፍት መልእክቶች", icon: MailIcon, roles: ["መሪ ስራ አስፈፃሚ", "admin", "lead_executive"] },
	];

	// Filter navigation items based on user role
	const navItems = allNavItems.filter((item) => 
		item.roles.includes(userRole)
	);


	return (
		<Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
			{/* Sidebar */}
			<Drawer
				variant="permanent"
				sx={{
					width: sidebarOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
					flexShrink: 0,
					transition: "width 0.3s ease",
					"& .MuiDrawer-paper": {
						width: sidebarOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
						boxSizing: "border-box",
						bgcolor: "background.paper",
						borderRight: 1,
						borderColor: "divider",
						transition: "width 0.3s ease",
						overflowX: "hidden",
					},
				}}
			>
				{/* Logo and Brand */}
				<Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: sidebarOpen ? 2 : 0 }}>
						<Box
							component="img"
							src="/MOH BLUE Transparent.png"
							alt="MOH Logo"
							sx={{
								width: sidebarOpen ? 28 : 24,
								height: sidebarOpen ? 28 : 24,
								objectFit: "contain",
							}}
						/>
						{sidebarOpen && (
							<Typography variant="body1" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
							ጤና ሚኒስቴር
						</Typography>
						)}
					</Box>
					{sidebarOpen && (
					<TextField
						fullWidth
						placeholder="ማንኛውንም ይፈልጉ"
						size="small"
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ color: "text.secondary" }} />
								</InputAdornment>
							),
						}}
						sx={{
							bgcolor: "action.hover",
							"& .MuiOutlinedInput-root": {
								"& fieldset": {
									border: "none",
								},
							},
						}}
					/>
					)}
				</Box>

				{/* Navigation */}
				<Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
					{/* Create Letter Button */}
					<Box sx={{ px: sidebarOpen ? 2 : 1, mb: 2 }}>
						<Button
							fullWidth={sidebarOpen}
							variant="contained"
							startIcon={<AddIcon />}
							onClick={() => router.push("/create-letter")}
							sx={{
								textTransform: "none",
								borderRadius: 2,
								py: 1.5,
								minWidth: sidebarOpen ? "auto" : 48,
								px: sidebarOpen ? 2 : 1,
							}}
							title={sidebarOpen ? undefined : "ደብዳቤ ፍጠር"}
						>
							{sidebarOpen && "ደብዳቤ ፍጠር"}
						</Button>
					</Box>

					{/* Direction Filters */}
					{sidebarOpen && (
						<>
					<Typography
						variant="caption"
						sx={{
							px: 2,
							py: 1,
							display: "block",
							fontWeight: 600,
							color: "text.secondary",
							textTransform: "uppercase",
						}}
					>
								የደብዳቤ አይነት
					</Typography>
					<List>
								<ListItem disablePadding>
									<ListItemButton
										onClick={() => setDirectionFilter("incoming")}
										sx={{
											borderRadius: 2,
											mb: 0.5,
											bgcolor: directionFilter === "incoming" ? "primary.main" : "transparent",
											color: directionFilter === "incoming" ? "primary.contrastText" : "text.primary",
											justifyContent: "flex-start",
											px: 2,
											"&:hover": {
												bgcolor: directionFilter === "incoming"
													? "primary.dark"
													: "action.hover",
											},
										}}
									>
										<ListItemIcon
											sx={{
												color: "inherit",
												minWidth: 40,
												justifyContent: "center",
											}}
										>
											<InboxIcon />
										</ListItemIcon>
										<ListItemText primary="ገቢ" />
									</ListItemButton>
								</ListItem>
								<ListItem disablePadding>
									<ListItemButton
										onClick={() => setDirectionFilter("outgoing")}
										sx={{
											borderRadius: 2,
											mb: 0.5,
											bgcolor: directionFilter === "outgoing" ? "primary.main" : "transparent",
											color: directionFilter === "outgoing" ? "primary.contrastText" : "text.primary",
											justifyContent: "flex-start",
											px: 2,
											"&:hover": {
												bgcolor: directionFilter === "outgoing"
													? "primary.dark"
													: "action.hover",
											},
										}}
									>
										<ListItemIcon
											sx={{
												color: "inherit",
												minWidth: 40,
												justifyContent: "center",
											}}
										>
											<OutboxIcon />
										</ListItemIcon>
										<ListItemText primary="ውጪ" />
									</ListItemButton>
								</ListItem>
								<ListItem disablePadding>
									<ListItemButton
										onClick={() => setDirectionFilter("draft")}
										sx={{
											borderRadius: 2,
											mb: 0.5,
											bgcolor: directionFilter === "draft" ? "primary.main" : "transparent",
											color: directionFilter === "draft" ? "primary.contrastText" : "text.primary",
											justifyContent: "flex-start",
											px: 2,
											"&:hover": {
												bgcolor: directionFilter === "draft"
													? "primary.dark"
													: "action.hover",
											},
										}}
									>
										<ListItemIcon
											sx={{
												color: "inherit",
												minWidth: 40,
												justifyContent: "center",
											}}
										>
											<MailIcon />
										</ListItemIcon>
										<ListItemText primary="ድራፍት" />
									</ListItemButton>
								</ListItem>
								{/* Stamped Letters - Only visible to records section */}
								{(isRecordsSection || isAdmin) && (
									<ListItem disablePadding>
										<ListItemButton
											onClick={() => setDirectionFilter("stamped")}
											sx={{
												borderRadius: 2,
												mb: 0.5,
												bgcolor: directionFilter === "stamped" ? "primary.main" : "transparent",
												color: directionFilter === "stamped" ? "primary.contrastText" : "text.primary",
												justifyContent: "flex-start",
												px: 2,
												"&:hover": {
													bgcolor: directionFilter === "stamped"
														? "primary.dark"
														: "action.hover",
												},
											}}
										>
											<ListItemIcon
												sx={{
													color: "inherit",
													minWidth: 40,
													justifyContent: "center",
												}}
											>
												<VerifiedIcon />
											</ListItemIcon>
											<ListItemText primary="ተማህተው ደብዳቤዎች" />
										</ListItemButton>
									</ListItem>
								)}
					</List>
						</>
					)}
				</Box>

				{/* User Menu / Logout */}
				<Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
					<Button
						fullWidth={sidebarOpen}
						variant="outlined"
						startIcon={<AccountCircleIcon />}
						onClick={handleLogoutClick}
						sx={{
							justifyContent: sidebarOpen ? "flex-start" : "center",
							textTransform: "none",
							color: "text.primary",
							borderColor: "divider",
							minWidth: sidebarOpen ? "auto" : 48,
							px: sidebarOpen ? 2 : 1,
							"&:hover": {
								borderColor: "primary.main",
								bgcolor: "action.hover",
							},
						}}
						title={sidebarOpen ? undefined : session?.user?.name || "User"}
					>
						{sidebarOpen && (session?.user?.name || "User")}
					</Button>
					<Dialog
						open={logoutDialogOpen}
						onClose={handleLogoutClose}
						PaperProps={{
							sx: {
								borderRadius: 2,
								border: "1px solid",
								borderColor: "divider",
								minWidth: 400,
								maxWidth: 500,
							},
						}}
					>
						<DialogTitle
							sx={{
								pb: 2,
								borderBottom: 1,
								borderColor: "divider",
							}}
						>
							<Typography variant="h6" sx={{ fontWeight: 600 }}>
								የተጠቃሚ መረጃ
							</Typography>
						</DialogTitle>
						<DialogContent sx={{ pt: 3, pb: 2 }}>
							{/* User Profile Section */}
							<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
								<Avatar
									sx={{
										width: 64,
										height: 64,
										bgcolor: "primary.main",
										fontSize: "1.75rem",
										fontWeight: 600,
									}}
									src={session?.user?.image || undefined}
								>
									{(session?.user?.name || "U").charAt(0).toUpperCase()}
								</Avatar>
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Typography 
										variant="h6" 
										sx={{ 
											fontWeight: 600,
											mb: 0.5,
											overflow: "hidden",
											textOverflow: "ellipsis",
										}}
									>
								{session?.user?.name || "User"}
							</Typography>
									<Typography 
										variant="body2" 
										color="text.secondary"
										sx={{ 
											mb: 1,
											overflow: "hidden",
											textOverflow: "ellipsis",
										}}
									>
								{session?.user?.email || ""}
							</Typography>
									{userRole && (
										<Chip
											label={userRole}
											size="small"
											sx={{
												height: 24,
												fontSize: "0.75rem",
												bgcolor: "primary.light",
												color: "primary.contrastText",
												fontWeight: 600,
											}}
										/>
									)}
								</Box>
							</Box>
						</DialogContent>
						<DialogActions sx={{ p: 2, pt: 1, flexDirection: "column", gap: 1.5 }}>
							<Button
								fullWidth
								variant="outlined"
								onClick={handleLogoutClose}
								sx={{
									textTransform: "none",
									fontWeight: 600,
									py: 1.25,
									fontSize: "1rem",
								}}
							>
								ዝጋ
							</Button>
							<Button
								fullWidth
								variant="contained"
								startIcon={<LogoutIcon />}
								onClick={handleLogout}
								sx={{
									textTransform: "none",
									borderRadius: 1.5,
									py: 1.25,
									fontSize: "1rem",
									fontWeight: 600,
									boxShadow: "none",
									"&:hover": {
										boxShadow: "none",
									},
								}}
							>
								ውጣ
							</Button>
						</DialogActions>
					</Dialog>
				</Box>
			</Drawer>

			{/* Main Content */}
			<Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
				{/* Email List and Content */}
				<Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
					{/* Email List */}
					<Box
						sx={{
							width: 400,
							display: "flex",
							flexDirection: "column",
							bgcolor: "background.paper",
							borderRight: 1,
							borderColor: "divider",
						}}
					>
						{/* Header */}
						<Box
							sx={{
								p: 2,
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								borderBottom: 1,
								borderColor: "divider",
								position: "relative",
								minHeight: 64, // Maintain consistent height
							}}
						>
							{/* Search Input (absolute positioned on top) */}
							{searchOpen && (
								<Box
									sx={{
										position: "absolute",
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										p: 2,
										display: "flex",
										alignItems: "center",
										bgcolor: "background.paper",
										zIndex: 1,
									}}
								>
									<TextField
										fullWidth
										placeholder="መልእክት ይፈልጉ..."
										size="small"
										autoFocus
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<Box
														component="svg"
														width={20}
														height={20}
														fill="none"
														stroke="currentColor"
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={1.5}
														viewBox="0 0 24 24"
														xmlns="http://www.w3.org/2000/svg"
														sx={{ color: "text.secondary" }}
													>
														<path d="M10.5 19a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z" />
														<path d="M13.328 7.172A3.988 3.988 0 0 0 10.5 6a3.988 3.988 0 0 0-2.828 1.172" />
														<path d="m16.61 16.611 4.244 4.243" />
													</Box>
												</InputAdornment>
											),
											endAdornment: searchQuery && (
												<InputAdornment position="end">
													<IconButton
														size="small"
														onClick={() => setSearchQuery("")}
														sx={{ p: 0.5 }}
													>
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
															sx={{ color: "text.secondary" }}
														>
															<path d="m7 7 10 10" />
															<path d="M7 17 17 7" />
														</Box>
													</IconButton>
												</InputAdornment>
											),
										}}
										sx={{
											"& .MuiOutlinedInput-root": {
												bgcolor: "action.hover",
												"& fieldset": {
													border: "none",
													outline: "none",
												},
												"&:hover fieldset": {
													border: "none",
													outline: "none",
												},
												"&.Mui-focused fieldset": {
													border: "none",
													outline: "none",
												},
											},
											"& .MuiOutlinedInput-root:focus": {
												outline: "none",
											},
										}}
									/>
								</Box>
							)}

							{/* Header Content (hidden when search is open) */}
							{!searchOpen && (
								<>
							<Typography variant="h6" sx={{ fontWeight: 600 }}>
								መልእክት
							</Typography>
									<Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
										<IconButton 
											size="small"
											onClick={() => {
												setSearchOpen(true);
											}}
											sx={{
												"&:hover": {
													bgcolor: "action.hover",
												},
											}}
										>
											<Box
												component="svg"
												width={20}
												height={20}
												fill="none"
												stroke="currentColor"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path d="M10.5 19a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z" />
												<path d="M13.328 7.172A3.988 3.988 0 0 0 10.5 6a3.988 3.988 0 0 0-2.828 1.172" />
												<path d="m16.61 16.611 4.244 4.243" />
											</Box>
										</IconButton>
										<IconButton 
											size="small"
											onClick={() => setSidebarOpen(!sidebarOpen)}
											sx={{
												"&:hover": {
													bgcolor: "action.hover",
												},
											}}
										>
								<MenuIcon />
							</IconButton>
						</Box>
								</>
							)}

							{/* Close button when search is open */}
							{searchOpen && (
								<IconButton 
									size="small"
									onClick={() => {
										setSearchOpen(false);
										setSearchQuery("");
									}}
									sx={{
										position: "absolute",
										right: 8,
										zIndex: 2,
										"&:hover": {
											bgcolor: "action.hover",
										},
									}}
								>
									<Box
										component="svg"
										width={20}
										height={20}
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={1.5}
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path d="m7 7 10 10" />
										<path d="M7 17 17 7" />
									</Box>
								</IconButton>
							)}
						</Box>

						{/* Status Filter Tabs */}
						<Tabs
							value={(() => {
								const filterMap: Record<string, number> = {
									null: 0,
									new: 1,
									approved: 2,
									archived: 3,
									rejected: 4,
								};
								return filterMap[statusFilter || "null"] ?? 0;
							})()}
							onChange={(_, newValue) => {
								const filters: (string | null)[] = [null, "new", "approved", "archived", "rejected"];
								setStatusFilter(filters[newValue] || null);
							}}
							sx={{
								borderBottom: 1,
								borderColor: "divider",
								"& .MuiTab-root": {
									textTransform: "none",
									fontWeight: 500,
									minHeight: 48,
								},
							}}
						>
							<Tab label="ሁሉም" />
							<Tab label="አዲስ" />
							<Tab label="ተጸድቋል" />
							<Tab label="ተጠቅሷል" />
							<Tab label="ተቀድቷል" />
						</Tabs>

						{/* Email List */}
						<Box sx={{ flex: 1, overflow: "auto" }}>
							{isLoading ? (
								<Box sx={{ p: 3, textAlign: "center" }}>
									<Typography color="text.secondary">በመጫን ላይ...</Typography>
								</Box>
							) : filteredEmails.length === 0 ? (
								<Box sx={{ p: 3, textAlign: "center" }}>
									<Typography color="text.secondary">
										{searchQuery ? "ምንም ውጤት አልተገኘም" : "ምንም መልእክት የለም"}
									</Typography>
								</Box>
							) : (
								filteredEmails.map((email) => {
								const isSelected = selectedEmail?.id === email.id;
								return (
								<Paper
									key={email.id}
									elevation={0}
									sx={{
										p: 2,
										borderBottom: 1,
										borderColor: "divider",
										cursor: "pointer",
										bgcolor: isSelected
											? "rgba(0, 0, 0, 0.08)"
												: "transparent",
										"&:hover": {
											bgcolor: isSelected
												? "rgba(0, 0, 0, 0.12)"
												: "action.hover",
										},
									}}
									onClick={() => setSelectedEmail(email)}
								>
									<Box sx={{ display: "flex", gap: 2 }}>
										<Avatar
											sx={{
												width: 40,
												height: 40,
												bgcolor: "primary.main",
												fontSize: "0.875rem",
											}}
										>
											{email.avatar}
										</Avatar>
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													mb: 0.5,
													gap: 1,
												}}
											>
												<Typography
													variant="body2"
													sx={{ fontWeight: 500 }}
													noWrap
												>
													{email.sender}
												</Typography>
												<Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
													{email.status === "approved" && (
														<Chip
															label="ተጸድቋል"
															size="small"
															sx={{
																bgcolor: "success.main",
																color: "success.contrastText",
																fontSize: "0.75rem",
																height: 20,
																fontWeight: 500,
															}}
														/>
													)}
													{email.status === "rejected" && (
														<Chip
															label="ተቀድቷል"
															size="small"
															sx={{
																bgcolor: "error.main",
																color: "error.contrastText",
																fontSize: "0.75rem",
																height: 20,
																fontWeight: 500,
															}}
														/>
													)}
													{email.status === "stamped" && (
														<Chip
															label="ተማህቷል"
															size="small"
															sx={{
																bgcolor: "warning.main",
																color: "warning.contrastText",
																fontSize: "0.75rem",
																height: 20,
																fontWeight: 500,
															}}
														/>
													)}
												{email.isNew && (
													<Chip
														label="አዲስ"
														size="small"
														sx={{
															bgcolor: "primary.main",
															color: "primary.contrastText",
															fontSize: "0.75rem",
															height: 20,
														}}
													/>
												)}
												</Box>
											</Box>
											<Typography
												variant="body2"
												sx={{ fontWeight: 500, mb: 0.5 }}
												noWrap
											>
												{email.subject}
											</Typography>
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ mb: 0.5 }}
												noWrap
											>
												{email.preview}
											</Typography>
											<Typography
												variant="caption"
												color="text.secondary"
											>
												{email.date}
											</Typography>
										</Box>
									</Box>
								</Paper>
								);
							})
							)}
						</Box>
					</Box>

					{/* Email Content */}
					<Box
						sx={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							bgcolor: "background.paper",
							overflow: "hidden",
						}}
					>
						{selectedEmail ? (
							<>
								{/* Action Bar */}
								<Box
									sx={{
										p: 2,
										display: "flex",
										alignItems: "center",
										gap: 1,
										borderBottom: 1,
										borderColor: "divider",
									}}
								>
									<IconButton 
										size="small"
										onClick={() => setSelectedEmail(null)}
										sx={{
											"&:hover": {
												bgcolor: "action.hover",
											},
										}}
									>
										<ArrowBackIcon />
									</IconButton>
									{selectedLetterData?.status === "approved" && (
										<Chip
											label="ተጸድቋል"
											size="small"
											sx={{
												bgcolor: "success.main",
												color: "success.contrastText",
												fontSize: "0.75rem",
												height: 24,
												fontWeight: 600,
											}}
										/>
									)}
									{selectedLetterData?.status === "rejected" && (
										<Chip
											label="ተቀድቷል"
											size="small"
											sx={{
												bgcolor: "error.main",
												color: "error.contrastText",
												fontSize: "0.75rem",
												height: 24,
												fontWeight: 600,
											}}
										/>
									)}
									{selectedLetterData?.status === "stamped" && (
										<Chip
											label="ተማህቷል"
											size="small"
											sx={{
												bgcolor: "warning.main",
												color: "warning.contrastText",
												fontSize: "0.75rem",
												height: 24,
												fontWeight: 600,
											}}
										/>
									)}
									{(selectedLetterData?.status === "draft" || selectedLetterData?.status === "pending_approval") && (
										<Chip
											label="አዲስ"
											size="small"
											sx={{
												bgcolor: "primary.main",
												color: "primary.contrastText",
												fontSize: "0.75rem",
												height: 24,
												fontWeight: 600,
											}}
										/>
									)}
									{isAdmin && (selectedLetterData?.status === "draft" || selectedLetterData?.status === "pending_approval") && (
										<Box sx={{ display: "flex", gap: 1, mr: 2 }}>
											<Button
												variant="outlined"
												size="small"
												onClick={() => handleReview("approve")}
												disabled={reviewMutation.isPending}
												sx={{ minWidth: 100 }}
											>
												አጽድቅ
											</Button>
											<Button
												variant="outlined"
												color="error"
												size="small"
												onClick={() => handleReview("reject")}
												disabled={reviewMutation.isPending}
												sx={{ minWidth: 100 }}
											>
												አትጽድቅ
											</Button>
										</Box>
									)}
									{isRecordsSection && selectedLetterData?.status === "approved" && (
										<Box sx={{ display: "flex", gap: 1, mr: 2 }}>
											<Button
												variant="outlined"
												size="small"
												onClick={handleStamp}
												disabled={stampMutation.isPending}
												sx={{ minWidth: 120 }}
											>
												{stampMutation.isPending ? "በመማህት ላይ..." : "ደብዳቤ ማህተም"}
											</Button>
										</Box>
									)}
									<Box sx={{ flex: 1 }} />
									<IconButton size="small">
										<EditIcon />
									</IconButton>
									<IconButton size="small">
										<FlagIcon />
									</IconButton>
									<IconButton size="small">
										<DeleteIcon />
									</IconButton>
									<IconButton size="small">
										<ReplyIcon />
									</IconButton>
									<IconButton size="small">
										<ForwardIcon />
									</IconButton>
									<IconButton size="small">
										<ArchiveIcon />
									</IconButton>
								</Box>

								{/* Sticky Tabs Header */}
								<Box
											sx={{
										position: "sticky",
										top: 0,
										zIndex: 10,
										bgcolor: "background.paper",
										borderBottom: 1,
										borderColor: "divider",
									}}
								>
									<Tabs
										value={detailTab}
										onChange={(_, newValue) => setDetailTab(newValue)}
									sx={{
											borderBottom: 1,
											borderColor: "divider",
											pl: "20px",
											"& .MuiTab-root": {
												textTransform: "none",
												fontWeight: 500,
												minHeight: 48,
											},
										}}
									>
										<Tab label="ዝርዝር ያሳዩ" />
										<Tab label="ውይይት" />
										<Tab label="ኦዲት" />
									</Tabs>
								</Box>

								{/* Tab Content */}
								<Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
									{isLoadingLetter ? (
										<Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
											<Typography color="text.secondary">በመጫን ላይ...</Typography>
										</Box>
									) : letterError ? (
										<Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
											<Typography color="error">
												{letterError instanceof Error ? letterError.message : "ስህተት ተፈጥሯል"}
									</Typography>
										</Box>
									) : selectedLetterData ? (
										<>
											{detailTab === 0 && (
												<Box sx={{ flex: 1, overflow: "auto" }}>
													<LetterDisplay letter={selectedLetterData} />
												</Box>
											)}
											{detailTab === 1 && (
												<LetterDiscussion
													letterId={selectedLetterData.id}
													comments={selectedLetterData.comments || []}
													currentUserId={currentUserId}
												/>
											)}
											{detailTab === 2 && (
												<Box sx={{ flex: 1, overflow: "auto" }}>
													<LetterAuditTimeline logs={selectedLetterData.auditLogs || []} />
												</Box>
											)}
										</>
									) : (
										<Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
											<Typography color="text.secondary">ደብዳቤ አልተገኘም</Typography>
										</Box>
									)}
								</Box>
							</>
						) : (
							<Box
								sx={{
									flex: 1,
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									gap: 2,
								}}
							>
								<Box
									component="svg"
									width={46}
									height={46}
									fill="none"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={0.5}
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
									sx={{
										color: "text.secondary",
										opacity: 0.5,
									}}
								>
									<path d="M2 15 4.5 3h15L22 15" />
									<path d="M2 15h5.455l.909 3h7.272l.91-3H22v6.5H2V15Z" />
									<path d="M9.5 7h5" />
									<path d="M8 11h8" />
								</Box>
								<Typography color="text.secondary">
									መልእክት ለመመልከት ይምረጡ
								</Typography>
							</Box>
						)}
					</Box>
				</Box>
			</Box>
		</Box>
	);
}
