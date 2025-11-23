"use client";
import { authClient } from "@/lib/auth-client";
import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient, useQueries } from "@tanstack/react-query";
import { orpc, client } from "@/utils/orpc";
import LetterDisplay from "@/components/letter-display";
import LetterDiscussion from "@/components/letter-discussion";
import LetterTaskThread from "@/components/letter-task-thread";
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
	useMediaQuery,
	useTheme,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Collapse,
} from "@mui/material";
import {
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
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
	ChevronLeft as ChevronLeftIcon,
	ChevronRight as ChevronRightIcon,
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
	AlternateEmail as MentionIcon,
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
	letterType?: string;
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
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const currentUserId = session.user.id;
	const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
	const [activeNav, setActiveNav] = useState("inbox");
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [detailTab, setDetailTab] = useState(0); // 0: detail, 1: discussion, 2: audit
	const [messagesDrawerOpen, setMessagesDrawerOpen] = useState(false);

	const userRole = (session?.user as any)?.role || "";
	const isAdmin = userRole === "admin" || userRole === "መሪ ስራ አስፈፃሚ" || userRole === "lead_executive";
	const isRecordsSection = userRole === "መዝገብ ክፍል" || userRole === "records_section";
	const isDraftView = isAdmin && activeNav === "drafts";
	const [directionFilter, setDirectionFilter] = useState<string | null>(null); // null = all, "incoming", "outgoing", "draft", "stamped"
	const [statusFilter, setStatusFilter] = useState<string | null>(null); // null = all, "new", "approved", "archived", "rejected"
	const [incomingStatusFilter, setIncomingStatusFilter] = useState<string | null>(null); // For incoming letter status filters
	const [taskStatusFilter, setTaskStatusFilter] = useState<string | null>(null); // For task status filters
	const [filterScrollLeft, setFilterScrollLeft] = useState(0);
	const [incomingExpanded, setIncomingExpanded] = useState(false); // For expanding incoming status submenu
	const [showMentions, setShowMentions] = useState(false); // For showing letters where user is mentioned

	// Fetch letters from backend
	const lettersQueryOptions = useMemo(
		() =>
			isDraftView
				? orpc.letter.getByStatus.queryOptions({ input: { status: "draft" } })
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

	// Fetch tasks for selected letter to determine if task_assigned status should be shown
	const selectedLetterTasksQuery = orpc.letterTask.getByLetterId.queryOptions({ input: { letterId } });
	const { data: selectedLetterTasks = [] } = useQuery({
		...selectedLetterTasksQuery,
		enabled: !!letterId && selectedLetterData?.direction === "incoming",
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
				letterType: (letter as any).letterType || "text",
			};
		});
	}, [letters]);

	// Filter emails based on search query, direction filter, status filter, and incoming filters
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
		
		// Apply status filter (for all letters)
		if (statusFilter) {
			if (statusFilter === "new") {
				filtered = filtered.filter((email) => email.status === "draft" || email.status === "pending_approval");
			} else {
				filtered = filtered.filter((email) => email.status === statusFilter);
			}
		}
		
		// Apply incoming letter status filter (only for incoming letters)
		if (directionFilter === "incoming" && incomingStatusFilter) {
			if (incomingStatusFilter === "new") {
				filtered = filtered.filter((email) => 
					email.direction === "incoming" && (email.status === "draft" || email.status === "pending_approval" || !email.status)
				);
			} else if (incomingStatusFilter === "completed") {
				filtered = filtered.filter((email) => 
					email.direction === "incoming" && email.status === "archived"
				);
			} else if (incomingStatusFilter === "in_progress") {
				filtered = filtered.filter((email) => 
					email.direction === "incoming" && email.status === "approved"
				);
			} else if (incomingStatusFilter === "in_review") {
				filtered = filtered.filter((email) => 
					email.direction === "incoming" && email.status === "pending_approval"
				);
			} else if (incomingStatusFilter === "task_assigned") {
				// This will be handled by EmailListWithTaskFilter component
				filtered = filtered.filter((email) => 
					email.direction === "incoming" && email.status === "approved"
				);
			} else {
				filtered = filtered.filter((email) => 
					email.direction === "incoming" && email.status === incomingStatusFilter
				);
			}
		}
		
		// Note: Task status filtering is handled separately in EmailListWithTaskFilter component
		// to avoid expensive queries for all letters
		
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
	}, [emails, searchQuery, directionFilter, statusFilter, incomingStatusFilter, taskStatusFilter]);

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
				queryKey: orpc.letter.getByStatus.queryOptions({ input: { status: "draft" } }).queryKey,
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

	// Update incoming letter status mutation (for executives)
	const updateIncomingStatusMutation = useMutation({
		mutationFn: (payload: { id: string; status: string }) =>
			client.letter.update({ id: payload.id, status: payload.status as any }),
		onSuccess: () => {
			toast.success("ሁኔታ ተዘምኗል");
			queryClient.invalidateQueries({ queryKey: orpc.letter.getAll.queryOptions().queryKey });
			if (selectedEmail?.id) {
				queryClient.invalidateQueries({ queryKey: ["letter", "getById", selectedEmail.id] });
			}
			if (selectedEmail) {
				setSelectedEmail((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						status: selectedLetterData?.status || "new",
					};
				});
			}
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const handleIncomingStatusChange = (status: string) => {
		if (!selectedLetterData) return;
		updateIncomingStatusMutation.mutate({ id: selectedLetterData.id, status });
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
			<Box sx={{ px: sidebarOpen ? 2 : 1, mb: 2, display: "flex", flexDirection: "column", gap: 1 }}>
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
				<Button
					fullWidth={sidebarOpen}
					variant="outlined"
					startIcon={<ScanIcon />}
					onClick={() => router.push("/scan-letter")}
					sx={{
						textTransform: "none",
						borderRadius: 2,
						py: 1.5,
						minWidth: sidebarOpen ? "auto" : 48,
						px: sidebarOpen ? 2 : 1,
					}}
					title={sidebarOpen ? undefined : "ደብዳቤ ቃኝ"}
				>
					{sidebarOpen && "ደብዳቤ ቃኝ"}
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
										onClick={() => {
											setDirectionFilter("incoming");
											setIncomingExpanded(!incomingExpanded);
										}}
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
										{incomingExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
									</ListItemButton>
								</ListItem>
								{/* Nested status filters for incoming letters */}
								<Collapse in={incomingExpanded} timeout="auto" unmountOnExit>
									<List component="div" disablePadding>
								<ListItem disablePadding>
									<ListItemButton
												onClick={() => {
													setDirectionFilter("incoming");
													setIncomingStatusFilter(null);
												}}
										sx={{
													pl: 4,
											borderRadius: 2,
											mb: 0.5,
													bgcolor: directionFilter === "incoming" && incomingStatusFilter === null ? "action.selected" : "transparent",
													"&:hover": {
														bgcolor: "action.hover",
													},
												}}
											>
												<ListItemText primary="ሁሉም" />
											</ListItemButton>
										</ListItem>
										<ListItem disablePadding>
											<ListItemButton
												onClick={() => {
													setShowMentions(false);
													setDirectionFilter("incoming");
													setIncomingStatusFilter("new");
												}}
												sx={{
													pl: 4,
													borderRadius: 2,
													mb: 0.5,
													bgcolor: directionFilter === "incoming" && incomingStatusFilter === "new" ? "action.selected" : "transparent",
													"&:hover": {
														bgcolor: "action.hover",
													},
												}}
											>
												<ListItemText primary="አዲስ" />
											</ListItemButton>
										</ListItem>
										<ListItem disablePadding>
											<ListItemButton
												onClick={() => {
													setShowMentions(false);
													setDirectionFilter("incoming");
													setIncomingStatusFilter("in_review");
												}}
												sx={{
													pl: 4,
													borderRadius: 2,
													mb: 0.5,
													bgcolor: directionFilter === "incoming" && incomingStatusFilter === "in_review" ? "action.selected" : "transparent",
													"&:hover": {
														bgcolor: "action.hover",
													},
												}}
											>
												<ListItemText primary="በግምገማ ላይ" />
											</ListItemButton>
										</ListItem>
										<ListItem disablePadding>
											<ListItemButton
												onClick={() => {
													setShowMentions(false);
													setDirectionFilter("incoming");
													setIncomingStatusFilter("in_progress");
												}}
												sx={{
													pl: 4,
													borderRadius: 2,
													mb: 0.5,
													bgcolor: directionFilter === "incoming" && incomingStatusFilter === "in_progress" ? "action.selected" : "transparent",
													"&:hover": {
														bgcolor: "action.hover",
													},
												}}
											>
												<ListItemText primary="በመስራት ላይ" />
											</ListItemButton>
										</ListItem>
										<ListItem disablePadding>
											<ListItemButton
												onClick={() => {
													setShowMentions(false);
													setDirectionFilter("incoming");
													setIncomingStatusFilter("task_assigned");
												}}
												sx={{
													pl: 4,
													borderRadius: 2,
													mb: 0.5,
													bgcolor: directionFilter === "incoming" && incomingStatusFilter === "task_assigned" ? "action.selected" : "transparent",
													"&:hover": {
														bgcolor: "action.hover",
													},
												}}
											>
												<ListItemText primary="ተግባር ተመድቧል" />
											</ListItemButton>
										</ListItem>
										<ListItem disablePadding>
											<ListItemButton
												onClick={() => {
													setShowMentions(false);
													setDirectionFilter("incoming");
													setIncomingStatusFilter("completed");
												}}
												sx={{
													pl: 4,
													borderRadius: 2,
													mb: 0.5,
													bgcolor: directionFilter === "incoming" && incomingStatusFilter === "completed" ? "action.selected" : "transparent",
													"&:hover": {
														bgcolor: "action.hover",
													},
												}}
											>
												<ListItemText primary="ተጠናቋል" />
											</ListItemButton>
										</ListItem>
									</List>
								</Collapse>
								<ListItem disablePadding>
									<ListItemButton
										onClick={() => {
											setShowMentions(true);
											setDirectionFilter(null);
											setIncomingStatusFilter(null);
										}}
										sx={{
											borderRadius: 2,
											mb: 0.5,
											bgcolor: showMentions ? "primary.main" : "transparent",
											color: showMentions ? "primary.contrastText" : "text.primary",
											justifyContent: "flex-start",
											px: 2,
											"&:hover": {
												bgcolor: showMentions
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
											<MentionIcon />
										</ListItemIcon>
										<ListItemText primary="የተጠቀሱ መልእክቶች" />
									</ListItemButton>
								</ListItem>
								<ListItem disablePadding>
									<ListItemButton
										onClick={() => {
											setShowMentions(false);
											setDirectionFilter("outgoing");
										}}
										sx={{
											borderRadius: 2,
											mb: 0.5,
											bgcolor: directionFilter === "outgoing" && !showMentions ? "primary.main" : "transparent",
											color: directionFilter === "outgoing" && !showMentions ? "primary.contrastText" : "text.primary",
											justifyContent: "flex-start",
											px: 2,
											"&:hover": {
												bgcolor: directionFilter === "outgoing" && !showMentions
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
					{/* Email List - Drawer on Mobile, Sidebar on Desktop */}
					<Drawer
						variant={isMobile ? "temporary" : "permanent"}
						open={isMobile ? messagesDrawerOpen : true}
						onClose={() => setMessagesDrawerOpen(false)}
						ModalProps={{
							keepMounted: true, // Better open performance on mobile
						}}
						sx={{
							width: isMobile ? "85%" : 400,
							flexShrink: 0,
							"& .MuiDrawer-paper": {
								width: isMobile ? "85%" : 400,
								boxSizing: "border-box",
								position: isMobile ? "fixed" : "relative",
								height: isMobile ? "100%" : "100%",
								display: "flex",
								flexDirection: "column",
							},
						}}
					>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							bgcolor: "background.paper",
							height: "100%",
							overflow: "hidden",
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
										{isMobile && (
											<IconButton 
												size="small"
												onClick={() => setMessagesDrawerOpen(false)}
												sx={{
													"&:hover": {
														bgcolor: "action.hover",
													},
												}}
											>
												<ArrowBackIcon />
											</IconButton>
										)}
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
									stamped: 5,
									pending_approval: 6,
								};
								return filterMap[statusFilter || "null"] ?? 0;
							})()}
							onChange={(_, newValue) => {
								const filters: (string | null)[] = [null, "new", "approved", "archived", "rejected", "stamped", "pending_approval"];
								setStatusFilter(filters[newValue] || null);
							}}
							variant="scrollable"
							scrollButtons="auto"
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
							<Tab label="ተማህቷል" />
							<Tab label="በመጠባበቅ ላይ" />
						</Tabs>

						{/* Email List */}
						<Box 
							sx={{ 
								flex: 1,
								minHeight: 0, // Important for flex children to allow scrolling
								overflowY: "auto",
								overflowX: "hidden",
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
								<EmailListWithTaskFilter
									emails={filteredEmails}
									selectedEmail={selectedEmail}
									setSelectedEmail={setSelectedEmail}
									isMobile={isMobile}
									setMessagesDrawerOpen={setMessagesDrawerOpen}
									taskStatusFilter={taskStatusFilter}
									directionFilter={directionFilter}
								/>
							)}
						</Box>
						
						{/* Status Filter Dropdown for Incoming Letters */}
						{directionFilter === "incoming" && (
											<Box
												sx={{
									borderTop: 1,
									borderColor: "divider",
									p: 1.5,
									bgcolor: "background.paper",
													display: "flex",
													alignItems: "center",
									gap: 2,
								}}
							>
								<FormControl size="small" sx={{ minWidth: 180 }}>
									<InputLabel>ሁኔታ ማጣሪያ</InputLabel>
									<Select
										value={incomingStatusFilter || "all"}
										label="ሁኔታ ማጣሪያ"
										onChange={(e) => {
											const value = e.target.value;
											setIncomingStatusFilter(value === "all" ? null : value);
										}}
									>
										<MenuItem value="all">ሁሉም</MenuItem>
										<MenuItem value="new">አዲስ</MenuItem>
										<MenuItem value="in_review">በግምገማ ላይ</MenuItem>
										<MenuItem value="in_progress">በመስራት ላይ</MenuItem>
										<MenuItem value="task_assigned">ተግባር ተመድቧል</MenuItem>
										<MenuItem value="completed">ተጠናቋል</MenuItem>
									</Select>
								</FormControl>
								
								{/* Task Status Filter */}
								<FormControl size="small" sx={{ minWidth: 150 }}>
									<InputLabel>ተግባር ሁኔታ</InputLabel>
									<Select
										value={taskStatusFilter || "all"}
										label="ተግባር ሁኔታ"
										onChange={(e) => {
											const value = e.target.value;
											setTaskStatusFilter(value === "all" ? null : value);
										}}
									>
										<MenuItem value="all">ሁሉም</MenuItem>
										<MenuItem value="open">ክፍት</MenuItem>
										<MenuItem value="in_progress">በ ተግባር ላይ</MenuItem>
										<MenuItem value="done">ተጠናቋል</MenuItem>
										<MenuItem value="closed">ዝግብ</MenuItem>
									</Select>
								</FormControl>
										</Box>
							)}
						</Box>
					</Drawer>

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
									{isMobile && (
										<IconButton 
											size="small"
											onClick={() => setMessagesDrawerOpen(true)}
											sx={{
												"&:hover": {
													bgcolor: "action.hover",
												},
											}}
										>
											<MailIcon />
										</IconButton>
									)}
									{!isMobile && (
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
									)}
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
									{/* Status dropdown for incoming letters (executives only) */}
									{isAdmin && 
										selectedLetterData?.direction === "incoming" && (
										<Box sx={{ display: "flex", gap: 1, mr: 2 }}>
											<FormControl size="small" sx={{ minWidth: 180 }}>
												<InputLabel>ሁኔታ</InputLabel>
												<Select
													value={
														selectedLetterData?.status === "archived" 
															? "done" 
															: selectedLetterData?.status === "approved"
																? (selectedLetterTasks.length > 0 ? "task_assigned" : "in_progress")
																: selectedLetterData?.status === "pending_approval"
																	? "in_review"
																	: (selectedLetterData?.status === "draft" || !selectedLetterData?.status)
																		? "new"
																		: selectedLetterData?.status
													}
													label="ሁኔታ"
													onChange={(e) => {
														let newStatus: string;
														switch (e.target.value) {
															case "done":
																newStatus = "archived";
																break;
															case "new":
																newStatus = "draft";
																break;
															case "in_progress":
																newStatus = "approved";
																break;
															case "task_assigned":
																newStatus = "approved";
																break;
															case "in_review":
																newStatus = "pending_approval";
																break;
															default:
																newStatus = e.target.value;
														}
														handleIncomingStatusChange(newStatus);
													}}
													disabled={updateIncomingStatusMutation.isPending}
												>
													<MenuItem value="new">አዲስ</MenuItem>
													<MenuItem value="in_review">በግምገማ ላይ</MenuItem>
													<MenuItem value="in_progress">በመስራት ላይ</MenuItem>
													<MenuItem value="task_assigned">ተግባር ተመድቧል</MenuItem>
													<MenuItem value="done">ተጠናቋል</MenuItem>
												</Select>
											</FormControl>
										</Box>
									)}
									{/* Approve/Reject buttons for outgoing letters */}
									{isAdmin && 
										selectedLetterData?.direction !== "incoming" &&
										(selectedLetterData?.status === "draft" || selectedLetterData?.status === "pending_approval") && (
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
										{selectedLetterData?.direction === "incoming" ? (
											<Tab label="መምሪያ" />
										) : (
										<Tab label="ውይይት" />
										)}
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
											<Box sx={{ flex: 1, overflow: "auto", display: detailTab === 0 ? "block" : "none" }}>
												<LetterDisplay 
													letter={{
														id: selectedLetterData.id,
														type: selectedLetterData.type as "internal" | "external",
														referenceNumber: selectedLetterData.referenceNumber,
														date: selectedLetterData.date,
														to: selectedLetterData.to,
														from: selectedLetterData.from,
														subject: selectedLetterData.subject,
														content: selectedLetterData.content as any,
														attachments: selectedLetterData.attachments,
														status: selectedLetterData.status,
														stampedBy: selectedLetterData.stampedBy,
														stampedAt: selectedLetterData.stampedAt,
														letterType: (selectedLetterData as any).letterType,
														scannedImageUrl: (selectedLetterData as any).scannedImageUrl,
													}} 
												/>
											</Box>
											{detailTab === 1 && (
												selectedLetterData?.direction === "incoming" ? (
													<Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
														<LetterTaskThread
															letterId={selectedLetterData.id}
															currentUserId={currentUserId}
															letterDirection={selectedLetterData.direction as "incoming" | "outgoing"}
															letterType={(selectedLetterData as any).letterType || "text"}
														/>
													</Box>
												) : (
												<LetterDiscussion
													letterId={selectedLetterData.id}
													comments={(selectedLetterData.comments || []) as any}
													currentUserId={currentUserId}
												/>
												)
											)}
											{detailTab === 2 && (
												<Box sx={{ flex: 1, overflow: "auto" }}>
													<LetterAuditTimeline logs={(selectedLetterData.auditLogs || []) as any} />
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
									{isMobile ? "መልእክት ለመመልከት ይክፈቱ" : "መልእክት ለመመልከት ይምረጡ"}
								</Typography>
								{isMobile && (
									<Button
										variant="contained"
										startIcon={<MailIcon />}
										onClick={() => setMessagesDrawerOpen(true)}
									>
										መልእክት ክፈት
									</Button>
								)}
							</Box>
						)}
					</Box>
				</Box>
			</Box>
		</Box>
	);
}

// Component to show task badges for incoming letters
function IncomingLetterTaskBadge({ letterId, letterStatus }: { letterId: string; letterStatus?: string }) {
	const { data: tasks = [] } = useQuery(
		orpc.letterTask.getByLetterId.queryOptions({ input: { letterId } })
	);

	const openTasks = tasks.filter((task: any) => task.status !== "closed" && task.status !== "done");
	const openTasksCount = openTasks.length;

	if (openTasksCount > 0) {
		return (
			<Chip
				icon={<TaskIcon sx={{ fontSize: "0.875rem !important" }} />}
				label={`(${openTasksCount}) ተግባር`}
				size="small"
				sx={{
					bgcolor: "warning.main",
					color: "warning.contrastText",
					fontSize: "0.75rem",
					height: 20,
					fontWeight: 500,
				}}
			/>
		);
	}

	return null;
}

// Component to filter and display email list with task status filtering
function EmailListWithTaskFilter({
	emails,
	selectedEmail,
	setSelectedEmail,
	isMobile,
	setMessagesDrawerOpen,
	taskStatusFilter,
	directionFilter,
}: {
	emails: Email[];
	selectedEmail: Email | null;
	setSelectedEmail: (email: Email | null) => void;
	isMobile: boolean;
	setMessagesDrawerOpen: (open: boolean) => void;
	taskStatusFilter: string | null;
	directionFilter: string | null;
}) {
	// Fetch tasks for all incoming letters if task filter is active
	const incomingEmailIds = useMemo(() => {
		if (directionFilter === "incoming" && taskStatusFilter) {
			return emails.filter((e) => e.direction === "incoming").map((e) => e.id);
		}
		return [];
	}, [emails, directionFilter, taskStatusFilter]);

	// Batch fetch tasks for all incoming letters
	const tasksQueries = useQueries({
		queries: incomingEmailIds.map((letterId) =>
			orpc.letterTask.getByLetterId.queryOptions({ input: { letterId } })
		),
	});

	// Create a map of letterId -> tasks
	const tasksMap = useMemo(() => {
		const map: Record<string, any[]> = {};
		incomingEmailIds.forEach((letterId, index) => {
			map[letterId] = tasksQueries[index]?.data || [];
		});
		return map;
	}, [incomingEmailIds, tasksQueries]);

	// Filter emails by task status if filter is active
	const finalEmails = useMemo(() => {
		if (directionFilter === "incoming" && taskStatusFilter) {
			return emails.filter((email) => {
				if (email.direction !== "incoming") return true;
				const tasks = tasksMap[email.id] || [];
				
				if (taskStatusFilter === "in_progress") {
					return tasks.some((task: any) => 
						task.status !== "closed" && task.status !== "done"
					);
				} else if (taskStatusFilter === "closed") {
					return tasks.length > 0 && tasks.every((task: any) => task.status === "closed");
				} else if (taskStatusFilter === "open") {
					return tasks.some((task: any) => task.status === "open");
				} else if (taskStatusFilter === "done") {
					return tasks.some((task: any) => task.status === "done");
				}
				return true;
			});
		}
		return emails;
	}, [emails, taskStatusFilter, directionFilter, tasksMap]);

	return (
		<Box
			sx={{
				"@keyframes slideInUp": {
					"0%": {
						opacity: 0,
						transform: "translateY(20px)",
					},
					"100%": {
						opacity: 1,
						transform: "translateY(0)",
					},
				},
			}}
		>
			{finalEmails.map((email, index) => {
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
							// Staggered animation
							animation: "slideInUp 0.3s ease-out forwards",
							opacity: 0,
							transform: "translateY(20px)",
							animationDelay: `${index * 0.03}s`,
						}}
						onClick={() => {
							setSelectedEmail(email);
							if (isMobile) {
								setMessagesDrawerOpen(false);
							}
						}}
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
										{email.letterType === "scanned" && (
											<Chip
												icon={<ScanIcon sx={{ fontSize: "0.875rem !important" }} />}
												label="ስካን"
												size="small"
												sx={{
													bgcolor: "info.main",
													color: "info.contrastText",
													fontSize: "0.75rem",
													height: 20,
													fontWeight: 500,
												}}
											/>
										)}
										{/* Status badge for incoming letters */}
										{email.direction === "incoming" && (
											<>
												{email.status === "draft" || email.status === "pending_approval" || !email.status ? (
													<Chip
														label="አዲስ"
														size="small"
														sx={{
															bgcolor: "primary.main",
															color: "primary.contrastText",
															fontSize: "0.75rem",
															height: 20,
															fontWeight: 500,
														}}
													/>
												) : email.status === "approved" ? (
													<Chip
														label="በመስራት ላይ"
														size="small"
														sx={{
															bgcolor: "info.main",
															color: "info.contrastText",
															fontSize: "0.75rem",
															height: 20,
															fontWeight: 500,
														}}
													/>
												) : email.status === "pending_approval" ? (
													<Chip
														label="በግምገማ ላይ"
														size="small"
														sx={{
															bgcolor: "warning.main",
															color: "warning.contrastText",
															fontSize: "0.75rem",
															height: 20,
															fontWeight: 500,
														}}
													/>
												) : email.status === "archived" ? (
													<Chip
														label="ተጠናቋል"
														size="small"
														sx={{
															bgcolor: "grey.600",
															color: "grey.contrastText",
															fontSize: "0.75rem",
															height: 20,
															fontWeight: 500,
														}}
													/>
												) : null}
												<IncomingLetterTaskBadge letterId={email.id} letterStatus={email.status} />
											</>
										)}
										{email.status === "approved" && email.direction !== "incoming" && (
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
										{email.isNew && email.direction !== "incoming" && (
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
			})}
		</Box>
	);
}
