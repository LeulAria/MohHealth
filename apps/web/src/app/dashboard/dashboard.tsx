"use client";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
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
	Popover,
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
}

const mockEmails: Email[] = [
	{
		id: "1",
		sender: "ሮናልድ ሪቻርድስ",
		avatar: "RR",
		subject: "ዕቃ ማድረስ ማጠያ",
		preview: "ውድ ጆን ዶይ፣ ይህ መልእክት በደህና ይደርስልዎት...",
		date: "23 ኦክቶ",
	},
	{
		id: "2",
		sender: "ሳቫና ንጉየን",
		avatar: "SN",
		subject: "የማድረስ ሁኔታ ጠይቅ",
		preview: "ለቻት ይገኛሉ?",
		date: "18 ኦክቶ",
		isNew: true,
	},
	{
		id: "3",
		sender: "ጀሮም ቤል",
		avatar: "JB",
		subject: "ዕቃ ማድረስ ማጠያ",
		preview: "ጥሩ። አሁን ላኩአቸው፣ ሰላምታ",
		date: "10 ኦክቶ",
		isNew: true,
	},
	{
		id: "4",
		sender: "ማርቪን ማክኪንኒ",
		avatar: "MM",
		subject: "ዕቃ ማድረስ ማጠያ",
		preview: "ጥሩ። አሁን ላኩአቸው፣ ሰላምታ",
		date: "8 ኦክቶ",
		isNew: true,
	},
	{
		id: "5",
		sender: "ቴሬሳ ዌብ",
		avatar: "TW",
		subject: "ለአዲስ ትዕዛዝ ማድረስ ምርጫ ያስፈልጋል",
		preview: "ሰላም አለቃ፣ እዚህ ምርጫዎ ያስፈልጋል፣ እላክልዎታለሁ...",
		date: "9/9/23",
	},
	{
		id: "6",
		sender: "ኮዲ ፊሸር",
		avatar: "CF",
		subject: "ዕቃ ማድረስ ማጠያ",
		preview: "",
		date: "2/9/23",
	},
];

const mockEmailContent = {
	sender: "ሮናልድ ሪቻርድስ",
	email: "ronaldrichards@gmail.com",
	to: "አስተዳዳሪ",
	subject: "ዕቃ ማድረስ ማጠያ",
	body: `ውድ ጆን ዶይ፣

ይህ መልእክት በደህና ይደርስልዎት ብዬ ተስፋ አደርጋለሁ።

ለቀርቦ የሚመጣው ማድረስ የሚከተሉትን ዕቃዎች እንፈልጋለን። እባክዎ የሚከተሉትን ንጥሎች ለማድረስ ያዘጋጁ።

1. የጭነት መኪና ማድረስ
   - ብዛት: 1
   - 5 ቶን ሊጭን ይችላል

2. ፎርክሊፍት
   - ብዛት: 2
   - ከአሽከርካሪው ጋር ከሆነ

እባክዎ ዕቃዎቹ በደህንነት የተሸፈኑ መሆናቸውን እና የተላኩት ንጥሎች ዝርዝር ያለው ስሊፕ መሆኑን ያረጋግጡ።

በአክብሮት፣
ሮናልድ ሪቻርድስ`,
};

const DRAWER_WIDTH = 280;

export default function Dashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const router = useRouter();
	const [selectedEmail, setSelectedEmail] = useState<Email | null>(mockEmails[0]);
	const [activeTab, setActiveTab] = useState(0);
	const [activeNav, setActiveNav] = useState("mail");
	const [logoutAnchorEl, setLogoutAnchorEl] = useState<HTMLButtonElement | null>(
		null,
	);

	const handleLogoutClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setLogoutAnchorEl(event.currentTarget);
	};

	const handleLogoutClose = () => {
		setLogoutAnchorEl(null);
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

	const logoutOpen = Boolean(logoutAnchorEl);
	const logoutId = logoutOpen ? "logout-popover" : undefined;

	const navItems = [
		{ id: "overview", label: "አጠቃላይ እይታ", icon: HomeIcon },
		{ id: "shipping", label: "ማጓጓዣ", icon: ShippingIcon },
		{ id: "tracking", label: "የትዕዛዝ ስልክ", icon: TrackingIcon },
		{ id: "mail", label: "መልእክት", icon: MailIcon },
		{ id: "contact", label: "ዕውቂያ", icon: ContactIcon },
		{ id: "invoice", label: "ደረሰኝ", icon: InvoiceIcon },
		{ id: "analytic", label: "ትንተና", icon: AnalyticIcon },
	];

	const tabs = ["ዋና", "መልእክተኞች", "ደንበኞች"];

	return (
		<Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
			{/* Sidebar */}
			<Drawer
				variant="permanent"
				sx={{
					width: DRAWER_WIDTH,
					flexShrink: 0,
					"& .MuiDrawer-paper": {
						width: DRAWER_WIDTH,
						boxSizing: "border-box",
						bgcolor: "background.paper",
						borderRight: 1,
						borderColor: "divider",
					},
				}}
			>
				{/* Logo and Brand */}
				<Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
						<Avatar
							sx={{
								width: 32,
								height: 32,
								bgcolor: "primary.main",
								fontWeight: "bold",
							}}
						>
							M
						</Avatar>
						<Typography variant="h6" sx={{ fontWeight: 600 }}>
							ጤና ሚኒስቴር
						</Typography>
					</Box>
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
				</Box>

				{/* Navigation */}
				<Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
					{/* Create Letter Button */}
					<Box sx={{ px: 2, mb: 2 }}>
						<Button
							fullWidth
							variant="contained"
							startIcon={<AddIcon />}
							onClick={() => router.push("/create-letter")}
							sx={{
								textTransform: "none",
								borderRadius: 2,
								py: 1.5,
							}}
						>
							ደብዳቤ ፍጠር
						</Button>
					</Box>

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
						ዋና መሳሪያዎች
					</Typography>
					<List>
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = activeNav === item.id;
							return (
								<ListItem key={item.id} disablePadding>
									<ListItemButton
										onClick={() => setActiveNav(item.id)}
										sx={{
											borderRadius: 2,
											mb: 0.5,
											bgcolor: isActive ? "primary.main" : "transparent",
											color: isActive ? "primary.contrastText" : "text.primary",
											"&:hover": {
												bgcolor: isActive
													? "primary.dark"
													: "action.hover",
											},
										}}
									>
										<ListItemIcon
											sx={{
												color: "inherit",
												minWidth: 40,
											}}
										>
											<Icon />
										</ListItemIcon>
										<ListItemText primary={item.label} />
									</ListItemButton>
								</ListItem>
							);
						})}
					</List>
				</Box>

				{/* User Menu / Logout */}
				<Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
					<Button
						fullWidth
						variant="outlined"
						startIcon={<AccountCircleIcon />}
						onClick={handleLogoutClick}
						sx={{
							justifyContent: "flex-start",
							textTransform: "none",
							color: "text.primary",
							borderColor: "divider",
							"&:hover": {
								borderColor: "primary.main",
								bgcolor: "action.hover",
							},
						}}
					>
						{session?.user?.name || "User"}
					</Button>
					<Popover
						id={logoutId}
						open={logoutOpen}
						anchorEl={logoutAnchorEl}
						onClose={handleLogoutClose}
						anchorOrigin={{
							vertical: "top",
							horizontal: "center",
						}}
						transformOrigin={{
							vertical: "bottom",
							horizontal: "center",
						}}
					>
						<Box sx={{ p: 2, minWidth: 200 }}>
							<Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
								{session?.user?.name || "User"}
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
								{session?.user?.email || ""}
							</Typography>
							<Divider sx={{ my: 1 }} />
							<Button
								fullWidth
								variant="contained"
								color="error"
								startIcon={<LogoutIcon />}
								onClick={handleLogout}
								sx={{
									textTransform: "none",
								}}
							>
								ውጣ
							</Button>
						</Box>
					</Popover>
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
							}}
						>
							<Typography variant="h6" sx={{ fontWeight: 600 }}>
								መልእክት
							</Typography>
							<IconButton size="small">
								<MenuIcon />
							</IconButton>
						</Box>

						{/* Tabs */}
						<Tabs
							value={activeTab}
							onChange={(_, newValue) => setActiveTab(newValue)}
							sx={{ borderBottom: 1, borderColor: "divider" }}
						>
							{tabs.map((tab, index) => (
								<Tab key={index} label={tab} sx={{ textTransform: "none" }} />
							))}
						</Tabs>

						{/* Email List */}
						<Box sx={{ flex: 1, overflow: "auto" }}>
							{mockEmails.map((email) => (
								<Paper
									key={email.id}
									elevation={0}
									sx={{
										p: 2,
										borderBottom: 1,
										borderColor: "divider",
										cursor: "pointer",
										bgcolor:
											selectedEmail?.id === email.id
												? "action.selected"
												: "transparent",
										"&:hover": {
											bgcolor: "action.hover",
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
												}}
											>
												<Typography
													variant="body2"
													sx={{ fontWeight: 500 }}
													noWrap
												>
													{email.sender}
												</Typography>
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
							))}
						</Box>
					</Box>

					{/* Email Content */}
					<Box
						sx={{
							flex: 1,
							display: "flex",
							flexDirection: "column",
							bgcolor: "background.paper",
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
									<IconButton size="small">
										<ArrowBackIcon />
									</IconButton>
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

								{/* Email Header */}
								<Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
									<Box sx={{ display: "flex", gap: 2, mb: 2 }}>
										<Avatar
											sx={{
												width: 48,
												height: 48,
												bgcolor: "primary.main",
												fontSize: "1rem",
											}}
										>
											{selectedEmail.avatar}
										</Avatar>
										<Box sx={{ flex: 1 }}>
											<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
												{mockEmailContent.sender}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												{mockEmailContent.email}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												ወደ {mockEmailContent.to}
											</Typography>
										</Box>
									</Box>
									<Typography variant="h6" sx={{ fontWeight: 600 }}>
										{mockEmailContent.subject}
									</Typography>
								</Box>

								{/* Email Body */}
								<Box
									sx={{
										flex: 1,
										overflow: "auto",
										p: 3,
									}}
								>
									<Typography
										variant="body1"
										sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}
									>
										{mockEmailContent.body}
									</Typography>
								</Box>
							</>
						) : (
							<Box
								sx={{
									flex: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
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
