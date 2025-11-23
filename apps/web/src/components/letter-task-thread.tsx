"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client, orpc } from "@/utils/orpc";
import { toast } from "sonner";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  Button,
  Chip,
  Autocomplete,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  CircularProgress,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Slide,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import {
  Send as SendIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Forward as ForwardIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
} from "@mui/icons-material";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

interface LetterTaskThreadProps {
  letterId: string;
  currentUserId: string;
  letterDirection: "incoming" | "outgoing";
  letterType: "text" | "scanned";
}

export default function LetterTaskThread({
  letterId,
  currentUserId,
  letterDirection,
  letterType,
}: LetterTaskThreadProps) {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [comment, setComment] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [statusUpdate, setStatusUpdate] = useState<string>("");
  const [priorityUpdate, setPriorityUpdate] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [deadline, setDeadline] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [commentRows, setCommentRows] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Only show for incoming letters
  const canShowTask = letterDirection === "incoming";

  // Fetch task data
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery(
    orpc.letterTask.getByLetterId.queryOptions({ input: { letterId } })
  );

  // Fetch all users for autocomplete
  const { data: allUsers = [] } = useQuery(orpc.letterTask.getAllUsers.queryOptions());

  // Check if letter has task tag
  const { data: hasTaskData } = useQuery(
    orpc.letterTask.hasTaskTag.queryOptions({ input: { letterId } })
  );

  const hasTask = hasTaskData?.hasTask || tasks.length > 0;
  const selectedTask = selectedTaskId ? tasks.find((t: any) => t.id === selectedTaskId) : null;

  // Forward as task mutation
  const forwardMutation = useMutation({
    mutationFn: (input: {
      letterId: string;
      assignedUserIds: string[];
      priority?: "low" | "medium" | "high" | "urgent";
      deadline?: Date;
      remarks?: string;
    }) => client.letterTask.forwardAsTask(input),
    onSuccess: (data) => {
      toast.success("ደብዳቤ እንደ ተግባር ተመልሷል");
      setForwardDialogOpen(false);
      setAssignedUserIds([]);
      setPriority("medium");
      setDeadline("");
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: orpc.letterTask.getByLetterId.queryOptions({ input: { letterId } }).queryKey });
      queryClient.invalidateQueries({ queryKey: orpc.letterTask.hasTaskTag.queryOptions({ input: { letterId } }).queryKey });
      refetchTasks();
      // Optionally auto-select the newly created task
      // setSelectedTaskId(data.taskId);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (input: {
      taskId: string;
      content: string;
      parentCommentId?: string;
      mentionedUserIds?: string[];
      statusUpdate?: "open" | "acknowledged" | "active" | "progress" | "assigned" | "in_review" | "done" | "closed";
      priorityUpdate?: "low" | "medium" | "high" | "urgent";
    }) => client.letterTask.addComment(input),
    onSuccess: () => {
      toast.success("አስተያየት ተጨመረ");
      setComment("");
      setCommentRows(2);
      setMentionedUserIds([]);
      setStatusUpdate("");
      setPriorityUpdate("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: orpc.letterTask.getByLetterId.queryOptions({ input: { letterId } }).queryKey });
      refetchTasks();
      // Scroll to bottom after new comment is added
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 200);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (input: { taskId: string; status: "open" | "acknowledged" | "active" | "progress" | "assigned" | "in_review" | "done" | "closed" }) =>
      client.letterTask.updateStatus(input),
    onSuccess: () => {
      toast.success("ሁኔታ ተዘምኗል");
      queryClient.invalidateQueries({ queryKey: orpc.letterTask.getByLetterId.queryOptions({ input: { letterId } }).queryKey });
      refetchTasks();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleForwardAsTask = () => {
    if (assignedUserIds.length === 0) {
      toast.error("እባክዎ ቢያንስ አንድ ሰው ይምረጡ");
      return;
    }

    forwardMutation.mutate({
      letterId,
      assignedUserIds,
      priority,
      deadline: deadline ? new Date(deadline) : undefined,
      remarks: remarks || undefined,
    });
  };

  const handleAddComment = () => {
    if (!selectedTask || !comment.trim()) return;

    addCommentMutation.mutate({
      taskId: selectedTask.id,
      content: comment,
      parentCommentId: replyingTo || undefined,
      mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
      statusUpdate: statusUpdate ? (statusUpdate as "open" | "acknowledged" | "active" | "progress" | "assigned" | "in_review" | "done" | "closed") : undefined,
      priorityUpdate: priorityUpdate ? (priorityUpdate as "low" | "medium" | "high" | "urgent") : undefined,
    });
  };

  // Build comment tree for selected task
  const commentTree = useMemo(() => {
    if (!selectedTask?.comments) return [];
    
    const rootComments = selectedTask.comments.filter((c: any) => !c.parentCommentId);
    const buildTree = (parentId: string | null): any[] => {
      return selectedTask.comments
        .filter((c: any) => c.parentCommentId === parentId)
        .map((comment: any) => ({
          ...comment,
          replies: buildTree(comment.id),
        }));
    };
    
    return rootComments.map((comment: any) => ({
      ...comment,
      replies: buildTree(comment.id),
    }));
  }, [selectedTask?.comments]);

  // Auto-scroll to bottom when comments change or task is selected
  useEffect(() => {
    if (messagesEndRef.current && selectedTaskId) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [commentTree, selectedTaskId]);

  // Scroll to bottom on initial load when task detail opens
  useEffect(() => {
    if (scrollContainerRef.current && selectedTaskId) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [selectedTaskId]);

  if (!canShowTask) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">
          ይህ ባህሪ ለገቢ ደብዳቤዎች ብቻ ነው
        </Typography>
      </Box>
    );
  }

  if (tasksLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasTask && tasks.length === 0) {
    return (
      <>
        <Box sx={{ p: 3 }}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              ደብዳቤን እንደ ተግባር ለመመልስ
            </Typography>
            <Button
              variant="contained"
              startIcon={<ForwardIcon />}
            onClick={() => setForwardDialogOpen(true)}
              disabled={forwardMutation.isPending}
            >
              መምሪያ
            </Button>
          </Paper>
        </Box>

        {/* Forward Dialog */}
        <Dialog open={forwardDialogOpen} onClose={() => setForwardDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>ደብዳቤን እንደ ተግባር ለመመልስ</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                multiple
                options={allUsers}
                getOptionLabel={(option) => `${option.name} (${option.role || ""})`}
                value={allUsers.filter((u) => assignedUserIds.includes(u.id))}
                onChange={(_, newValue) => {
                  setAssignedUserIds(newValue.map((u) => u.id));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="ሰዎችን ይምረጡ *" />
                )}
              />

              <FormControl fullWidth>
                <InputLabel>ቅድሚያ</InputLabel>
                <Select
                  value={priority}
                  label="ቅድሚያ"
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <MenuItem value="low">ዝቅተኛ</MenuItem>
                  <MenuItem value="medium">መካከለኛ</MenuItem>
                  <MenuItem value="high">ከፍተኛ</MenuItem>
                  <MenuItem value="urgent">አስቸኳይ</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="date"
                label="የመጨረሻ ቀን"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="ማስታወሻ"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setForwardDialogOpen(false)}>ዝጋ</Button>
            <Button
              variant="contained"
              onClick={handleForwardAsTask}
              disabled={assignedUserIds.length === 0 || forwardMutation.isPending}
            >
              መምሪያ
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
    open: "default",
    acknowledged: "info",
    active: "primary",
    progress: "warning",
    assigned: "secondary",
    in_review: "info",
    done: "success",
    closed: "default",
  };

  const priorityColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
    low: "default",
    medium: "info",
    high: "warning",
    urgent: "error",
  };

  const statusLabels: Record<string, string> = {
    open: "ክፍት",
    acknowledged: "ተቀብሏል",
    active: "ንቁ",
    progress: "በመስራት ላይ",
    assigned: "ተመድቧል",
    in_review: "በግምገማ ላይ",
    done: "ተጠናቋል",
    closed: "ዝግብ",
  };

  const priorityLabels: Record<string, string> = {
    low: "ዝቅተኛ",
    medium: "መካከለኛ",
    high: "ከፍተኛ",
    urgent: "አስቸኳይ",
  };

  // Build comment tree for a specific task
  const buildCommentTreeForTask = (taskComments: any[]) => {
    if (!taskComments || taskComments.length === 0) return [];
    
    const rootComments = taskComments.filter((c: any) => !c.parentCommentId);
    const buildTree = (parentId: string | null): any[] => {
      return taskComments
        .filter((c: any) => c.parentCommentId === parentId)
        .map((comment: any) => ({
          ...comment,
          replies: buildTree(comment.id),
        }));
    };
    
    return rootComments.map((comment: any) => ({
      ...comment,
      replies: buildTree(comment.id),
    }));
  };

  // Task List View
  if (!selectedTaskId && tasks.length > 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <Box 
          sx={{ 
            p: 3,
            pb: 2,
            borderBottom: 1,
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 1,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ተግባሮች ({tasks.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setForwardDialogOpen(true)}
              disabled={forwardMutation.isPending}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 2.5,
                py: 1,
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              አዲስ ተግባር
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: 3,
            pt: 2,
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
          <Stack spacing={2}>
            {tasks.map((task: any) => {
              const taskCommentTree = buildCommentTreeForTask(task.comments || []);
              return (
                <Paper
                  key={task.id}
                  sx={{ p: 2, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        ተግባር #{tasks.indexOf(task) + 1}
                      </Typography>
                      {task.remarks && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {task.remarks.substring(0, 100)}{task.remarks.length > 100 ? "..." : ""}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                      <Chip
                        label={statusLabels[task.status] || task.status}
                        color={statusColors[task.status] || "default"}
                        size="small"
                      />
                      {task.priority && (
                        <Chip
                          label={priorityLabels[task.priority] || task.priority}
                          color={priorityColors[task.priority] || "default"}
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                  
                  {task.assignments && task.assignments.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        የተመደቡ:
                      </Typography>
                      {task.assignments.slice(0, 3).map((assignment: any) => (
                        <Chip
                          key={assignment.id}
                          avatar={<Avatar sx={{ width: 20, height: 20 }}>{assignment.user?.name?.[0] || "U"}</Avatar>}
                          label={assignment.user?.name || "Unknown"}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                      {task.assignments.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{task.assignments.length - 3} ተጨማሪ
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                    {task.deadline && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(task.deadline).toLocaleDateString("am-ET")}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {taskCommentTree.length} አስተያየት{taskCommentTree.length !== 1 ? "ዎች" : ""}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </Box>

        {/* Forward Dialog */}
        <Dialog open={forwardDialogOpen} onClose={() => setForwardDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>ደብዳቤን እንደ ተግባር ለመመልስ</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                multiple
                options={allUsers}
                getOptionLabel={(option) => `${option.name} (${option.role || ""})`}
                value={allUsers.filter((u) => assignedUserIds.includes(u.id))}
                onChange={(_, newValue) => {
                  setAssignedUserIds(newValue.map((u) => u.id));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="ሰዎችን ይምረጡ *" />
                )}
              />

              <FormControl fullWidth>
                <InputLabel>ቅድሚያ</InputLabel>
                <Select
                  value={priority}
                  label="ቅድሚያ"
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <MenuItem value="low">ዝቅተኛ</MenuItem>
                  <MenuItem value="medium">መካከለኛ</MenuItem>
                  <MenuItem value="high">ከፍተኛ</MenuItem>
                  <MenuItem value="urgent">አስቸኳይ</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="date"
                label="የመጨረሻ ቀን"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="ማስታወሻ"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setForwardDialogOpen(false)}>ዝጋ</Button>
            <Button
              variant="contained"
              onClick={handleForwardAsTask}
              disabled={assignedUserIds.length === 0 || forwardMutation.isPending}
            >
              መምሪያ
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Always show task list, task detail opens in modal
  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <Box 
          sx={{ 
            p: 3,
            pb: 2,
            borderBottom: 1,
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 1,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ተግባሮች ({tasks.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setForwardDialogOpen(true)}
              disabled={forwardMutation.isPending}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 2.5,
                py: 1,
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              አዲስ ተግባር
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            p: 3,
            pt: 2,
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
          <Stack spacing={2}>
            {tasks.map((task: any) => {
              const taskCommentTree = buildCommentTreeForTask(task.comments || []);
              return (
                <Paper
                  key={task.id}
                  sx={{ p: 2, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        ተግባር #{tasks.indexOf(task) + 1}
                      </Typography>
                      {task.remarks && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {task.remarks.substring(0, 100)}{task.remarks.length > 100 ? "..." : ""}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                      <Chip
                        label={statusLabels[task.status] || task.status}
                        color={statusColors[task.status] || "default"}
                        size="small"
                      />
                      {task.priority && (
                        <Chip
                          label={priorityLabels[task.priority] || task.priority}
                          color={priorityColors[task.priority] || "default"}
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                  
                  {task.assignments && task.assignments.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        የተመደቡ:
                      </Typography>
                      {task.assignments.slice(0, 3).map((assignment: any) => (
                        <Chip
                          key={assignment.id}
                          avatar={<Avatar sx={{ width: 20, height: 20 }}>{assignment.user?.name?.[0] || "U"}</Avatar>}
                          label={assignment.user?.name || "Unknown"}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                      {task.assignments.length > 3 && (
                        <Typography variant="caption" color="text.secondary">
                          +{task.assignments.length - 3} ተጨማሪ
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                    {task.deadline && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(task.deadline).toLocaleDateString("am-ET")}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {taskCommentTree.length} አስተያየት{taskCommentTree.length !== 1 ? "ዎች" : ""}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </Box>

        {/* Forward Dialog */}
        <Dialog open={forwardDialogOpen} onClose={() => setForwardDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>ደብዳቤን እንደ ተግባር ለመመልስ</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                multiple
                options={allUsers}
                getOptionLabel={(option) => `${option.name} (${option.role || ""})`}
                value={allUsers.filter((u) => assignedUserIds.includes(u.id))}
                onChange={(_, newValue) => {
                  setAssignedUserIds(newValue.map((u) => u.id));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="ሰዎችን ይምረጡ *" />
                )}
              />

              <FormControl fullWidth>
                <InputLabel>ቅድሚያ</InputLabel>
                <Select
                  value={priority}
                  label="ቅድሚያ"
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <MenuItem value="low">ዝቅተኛ</MenuItem>
                  <MenuItem value="medium">መካከለኛ</MenuItem>
                  <MenuItem value="high">ከፍተኛ</MenuItem>
                  <MenuItem value="urgent">አስቸኳይ</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="date"
                label="የመጨረሻ ቀን"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="ማስታወሻ"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setForwardDialogOpen(false)}>ዝጋ</Button>
            <Button
              variant="contained"
              onClick={handleForwardAsTask}
              disabled={assignedUserIds.length === 0 || forwardMutation.isPending}
            >
              መምሪያ
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Task Detail Modal */}
      <Dialog
        open={!!selectedTaskId && !!selectedTask}
        onClose={() => setSelectedTaskId(null)}
        fullScreen
        PaperProps={{
          sx: {
            m: 0,
            borderRadius: 0,
            height: "100vh",
            maxHeight: "100vh",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", flex: 1 }}>
          {/* Compact Header */}
          <Paper 
            sx={{ 
              p: isMobile ? 1.5 : 2,
              mx: 0, 
              mt: 0,
              borderRadius: 0,
              borderBottom: 1,
              borderColor: "divider",
              position: "sticky",
              top: 0,
              zIndex: 2,
              bgcolor: "#DEE",
              minHeight: isMobile ? "auto" : "120px",
              maxHeight: isMobile ? "auto" : "120px",
            }}
            elevation={0}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: isMobile ? 1 : 1.5, flexWrap: "wrap" }}>
              <IconButton 
                onClick={() => setSelectedTaskId(null)} 
                size="small"
                sx={{
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ flex: 1, fontWeight: 600 }}>
                ተግባር ዝርዝር
              </Typography>
              {selectedTask && (
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  <Chip
                    label={statusLabels[selectedTask.status] || selectedTask.status}
                    color={statusColors[selectedTask.status] || "default"}
                    size="small"
                    sx={{ fontWeight: 500, fontSize: isMobile ? "0.7rem" : "0.75rem" }}
                  />
                  {selectedTask.priority && (
                    <Chip
                      label={priorityLabels[selectedTask.priority] || selectedTask.priority}
                      color={priorityColors[selectedTask.priority] || "default"}
                      size="small"
                      sx={{ fontWeight: 500, fontSize: isMobile ? "0.7rem" : "0.75rem" }}
                    />
                  )}
                </Box>
              )}
            </Box>

            {isMobile ? (
              // Mobile: Compact inline layout
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {selectedTask && selectedTask.assignments && selectedTask.assignments.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                      የተመደቡ:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {selectedTask.assignments.map((assignment: any) => (
                        <Chip
                          key={assignment.id}
                          avatar={<Avatar sx={{ width: 20, height: 20, fontSize: "0.7rem" }}>{assignment.user?.name?.[0] || "U"}</Avatar>}
                          label={assignment.user?.name || "Unknown"}
                          size="small"
                          sx={{ fontWeight: 500, fontSize: "0.7rem", height: "24px" }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                {selectedTask && selectedTask.deadline && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    የመጨረሻ ቀን: {new Date(selectedTask.deadline).toLocaleDateString("am-ET")}
                  </Typography>
                )}
                {selectedTask && selectedTask.remarks && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                      ማስታወሻ:
                    </Typography>
                    <Typography variant="caption" sx={{ lineHeight: 1.4 }}>{selectedTask.remarks}</Typography>
                  </Box>
                )}
                {selectedTask && (
                  <FormControl fullWidth size="small">
                    <InputLabel>ሁኔታ ይቀይሩ</InputLabel>
                    <Select
                      value={selectedTask.status}
                      label="ሁኔታ ይቀይሩ"
                      onChange={(e) => {
                        updateStatusMutation.mutate({
                          taskId: selectedTask.id,
                          status: e.target.value as "open" | "acknowledged" | "active" | "progress" | "assigned" | "in_review" | "done" | "closed",
                        });
                      }}
                      disabled={updateStatusMutation.isPending}
                    >
                      <MenuItem value="open">ክፍት</MenuItem>
                      <MenuItem value="acknowledged">ተቀብሏል</MenuItem>
                      <MenuItem value="active">ንቁ</MenuItem>
                      <MenuItem value="progress">በመስራት ላይ</MenuItem>
                      <MenuItem value="assigned">ተመድቧል</MenuItem>
                      <MenuItem value="in_review">በግምገማ ላይ</MenuItem>
                      <MenuItem value="done">ተጠናቋል</MenuItem>
                      <MenuItem value="closed">ዝግብ</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
            ) : (
              // Desktop: Compact flex layout
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                {selectedTask && selectedTask.assignments && selectedTask.assignments.length > 0 && (
                  <Box sx={{ flex: "0 0 auto", minWidth: "200px" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                      የተመደቡ:
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {selectedTask.assignments.map((assignment: any) => (
                        <Typography key={assignment.id} variant="body2" sx={{ fontWeight: 500 }}>
                          {assignment.user?.name || "Unknown"}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
                {selectedTask && selectedTask.deadline && (
                  <Box sx={{ flex: "0 0 auto", minWidth: "180px" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                      የመጨረሻ ቀን:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(selectedTask.deadline).toLocaleDateString("am-ET")}
                    </Typography>
                  </Box>
                )}
                {selectedTask && selectedTask.remarks && (
                  <Box sx={{ flex: "0 0 auto", minWidth: "200px" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: "block", mb: 0.5 }}>
                      ማስታወሻ:
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.4 }}>{selectedTask.remarks}</Typography>
                  </Box>
                )}
                {selectedTask && (
                  <Box sx={{ flex: "0 0 auto", minWidth: "150px" }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>ሁኔታ ይቀይሩ</InputLabel>
                      <Select
                        value={selectedTask.status}
                        label="ሁኔታ ይቀይሩ"
                        onChange={(e) => {
                          updateStatusMutation.mutate({
                            taskId: selectedTask.id,
                            status: e.target.value as "open" | "acknowledged" | "active" | "progress" | "assigned" | "in_review" | "done" | "closed",
                          });
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <MenuItem value="open">ክፍት</MenuItem>
                        <MenuItem value="acknowledged">ተቀብሏል</MenuItem>
                        <MenuItem value="active">ንቁ</MenuItem>
                        <MenuItem value="progress">በመስራት ላይ</MenuItem>
                        <MenuItem value="assigned">ተመድቧል</MenuItem>
                        <MenuItem value="in_review">በግምገማ ላይ</MenuItem>
                        <MenuItem value="done">ተጠናቋል</MenuItem>
                        <MenuItem value="closed">ዝግብ</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </Box>
            )}
          </Paper>

          {/* Main Content Area */}
          <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {!isMobile && selectedTask && (
              // Desktop Sidebar
              <Paper
                sx={{
                  width: "280px",
                  borderRight: 1,
                  borderColor: "divider",
                  p: 2,
                  overflowY: "auto",
                  bgcolor: "background.default",
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "3px",
                  },
                }}
                elevation={0}
              >
                {selectedTask.assignments && selectedTask.assignments.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                      የተመደቡ:
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {selectedTask.assignments.map((assignment: any) => (
                        <Box key={assignment.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: "0.875rem" }}>
                            {assignment.user?.name?.[0] || "U"}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {assignment.user?.name || "Unknown"}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
                {selectedTask.deadline && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                      የመጨረሻ ቀን:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(selectedTask.deadline).toLocaleDateString("am-ET")}
                    </Typography>
                  </Box>
                )}
                {selectedTask.remarks && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                      ማስታወሻ:
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                      {selectedTask.remarks}
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}

            {/* Comments Thread - Main Content */}
            <Box 
              sx={{ 
                flex: 1, 
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Box 
                ref={scrollContainerRef}
                sx={{ 
                  flex: 1, 
                  overflowY: "auto", 
                  overflowX: "hidden",
                  px: isMobile ? 2 : 4,
                  py: 3,
                  bgcolor: "transparent",
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
                    fontWeight: 500,
                    fontSize: "0.8125rem",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  ዛሬ • የውይይት መዝገብ
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pb: 1 }}>
                  {commentTree.length === 0 ? (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        textAlign: "center", 
                        py: 6,
                        fontStyle: "italic",
                      }}
                    >
                      አስተያየት የለም
                    </Typography>
                  ) : (
                    commentTree.map((comment: any) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        allUsers={allUsers}
                        currentUserId={currentUserId}
                        onReply={(id) => setReplyingTo(id)}
                        depth={0}
                        statusLabels={statusLabels}
                        priorityLabels={priorityLabels}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </Box>
              </Box>

              {/* Compact Comment Form */}
              <Box
                sx={{
                  borderTop: 1,
                  borderColor: "divider",
                  p: isMobile ? 1.5 : 2,
                  bgcolor: "background.paper",
                  position: "sticky",
                  bottom: 0,
                  zIndex: 1,
                }}
              >
                {replyingTo && selectedTask && (
                  <Box sx={{ mb: 1, p: 0.75, bgcolor: "action.hover", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">
                      መልስ ለ: {selectedTask.comments.find((c: any) => c.id === replyingTo)?.user?.name || "Comment"}
                    </Typography>
                    <IconButton size="small" onClick={() => setReplyingTo(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}

                  <Stack spacing={isMobile ? 1 : 1.5}>
                    <Autocomplete
                      multiple
                      options={allUsers}
                      getOptionLabel={(option) => `${option.name} (${option.role || ""})`}
                      value={allUsers.filter((u) => mentionedUserIds.includes(u.id))}
                      onChange={(_, newValue) => {
                        setMentionedUserIds(newValue.map((u) => u.id));
                      }}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="ጠቃሚዎችን ይጥቀሱ (@mention)" 
                          size="small"
                          sx={{
                            "& .MuiInputBase-root": {
                              fontSize: isMobile ? "0.75rem" : "0.875rem",
                            },
                            "& .MuiInputLabel-root": {
                              fontSize: isMobile ? "0.75rem" : "0.875rem",
                            },
                          }}
                        />
                      )}
                      size="small"
                      sx={{
                        "& .MuiChip-root": {
                          height: isMobile ? "20px" : "24px",
                          fontSize: isMobile ? "0.7rem" : "0.75rem",
                        },
                      }}
                    />

                    <Box sx={{ display: "flex", gap: isMobile ? 1 : 2, flexDirection: isMobile ? "column" : "row" }}>
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>ሁኔታ ይቀይሩ</InputLabel>
                        <Select
                          value={statusUpdate}
                          label="ሁኔታ ይቀይሩ"
                          onChange={(e) => setStatusUpdate(e.target.value)}
                          sx={{
                            fontSize: isMobile ? "0.75rem" : "0.875rem",
                            "& .MuiSelect-select": {
                              py: isMobile ? 0.75 : 1,
                            },
                          }}
                        >
                          <MenuItem value="" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>አይቀይር</MenuItem>
                          <MenuItem value="active" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>ንቁ</MenuItem>
                          <MenuItem value="progress" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>በመስራት ላይ</MenuItem>
                          <MenuItem value="in_review" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>በግምገማ ላይ</MenuItem>
                          <MenuItem value="done" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>ተጠናቋል</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>ቅድሚያ</InputLabel>
                        <Select
                          value={priorityUpdate}
                          label="ቅድሚያ"
                          onChange={(e) => setPriorityUpdate(e.target.value)}
                          sx={{
                            fontSize: isMobile ? "0.75rem" : "0.875rem",
                            "& .MuiSelect-select": {
                              py: isMobile ? 0.75 : 1,
                            },
                          }}
                        >
                          <MenuItem value="" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>አይቀይር</MenuItem>
                          <MenuItem value="low" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>ዝቅተኛ</MenuItem>
                          <MenuItem value="medium" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>መካከለኛ</MenuItem>
                          <MenuItem value="high" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>ከፍተኛ</MenuItem>
                          <MenuItem value="urgent" sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}>አስቸኳይ</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={commentRows}
                    maxRows={isMobile ? 4 : 3}
                    placeholder="አስተያየትዎን ይጻፉ..."
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      // Auto-expand textarea based on content
                      const lines = e.target.value.split('\n').length;
                      if (lines > commentRows && lines <= (isMobile ? 4 : 8)) {
                        setCommentRows(Math.min(lines, isMobile ? 4 : 8));
                      }
                    }}
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: isMobile ? "0.875rem" : "1rem",
                      },
                    }}
                  />


                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleAddComment}
                      disabled={!comment.trim() || addCommentMutation.isPending}
                      size={isMobile ? "small" : "medium"}
                    >
                      ላክ
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}

function CommentItem({
  comment,
  allUsers,
  currentUserId,
  onReply,
  depth,
  statusLabels,
  priorityLabels,
}: {
  comment: any;
  allUsers: any[];
  currentUserId: string;
  onReply: (id: string) => void;
  depth: number;
  statusLabels: Record<string, string>;
  priorityLabels: Record<string, string>;
}) {
  const user = comment.user;
  const mentionedUsers = comment.mentionedUsers || [];
  const [mentionPopover, setMentionPopover] = useState<{
    open: boolean;
    anchorEl: HTMLElement | null;
    users: Array<{ id: string; name: string; email?: string; role?: string }>;
  }>({
    open: false,
    anchorEl: null,
    users: [],
  });

  return (
    <Box 
      sx={{ 
        width: "100%",
        display: "flex",
        flexDirection: "row",
        position: "relative",
        py: 2,
        pl: depth > 0 ? `${depth * 2}px` : 0,
      }}
    >
      {/* Vertical line for nested replies (Reddit style) */}
      {depth > 0 && (
        <Box
          sx={{
            position: "absolute",
            left: `${(depth - 1) * 2}px`,
            top: 0,
            bottom: 0,
            width: "2px",
            bgcolor: "divider",
            opacity: 0.3,
          }}
        />
      )}
      
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 1.5, width: "100%" }}>
        <Avatar 
          sx={{ 
            width: 40, 
            height: 40,
            bgcolor: "primary.main",
            fontSize: "0.875rem",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {user?.name?.[0] || "U"}
        </Avatar>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Status/Priority chips */}
          {(comment.statusUpdate || comment.priorityUpdate) && (
            <Box sx={{ display: "flex", gap: 0.5, mb: 1, flexWrap: "wrap" }}>
              {comment.statusUpdate && (
                <Chip
                  label={`ሁኔታ: ${statusLabels[comment.statusUpdate] || comment.statusUpdate}`}
                  size="small"
                  color="primary"
                  sx={{
                    fontSize: "0.6875rem",
                    height: "24px",
                    fontWeight: 500,
                  }}
                />
              )}
              {comment.priorityUpdate && (
                <Chip
                  label={`ቅድሚያ: ${priorityLabels[comment.priorityUpdate] || comment.priorityUpdate}`}
                  size="small"
                  color="warning"
                  sx={{
                    fontSize: "0.6875rem",
                    height: "24px",
                    fontWeight: 500,
                  }}
                />
              )}
            </Box>
          )}

          {/* Username and timestamp - Google-like */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 500,
                fontSize: "0.875rem",
                color: "text.primary",
              }}
            >
              {user?.name || "Unknown"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontSize: "0.75rem",
              }}
            >
              {new Date(comment.createdAt).toLocaleTimeString("am-ET", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          </Box>

          {/* Comment content - Google-like styling */}
          <Box
            sx={{
              bgcolor: "transparent",
              color: "text.primary",
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-line",
                lineHeight: 1.6,
                fontSize: "0.875rem",
                color: "text.primary",
                fontWeight: 400,
              }}
            >
              {comment.content}
            </Typography>
          </Box>

          {/* Mentions - Google-like styling - filter out current user */}
          {mentionedUsers.filter((u: any) => u.id !== currentUserId).length > 0 && (
            <Box sx={{ display: "flex", gap: 0.75, mb: 1, flexWrap: "wrap", alignItems: "center" }}>
              {mentionedUsers
                .filter((u: any) => u.id !== currentUserId)
                .slice(0, 2)
                .map((u: any) => (
                  <Chip
                    key={u.id}
                    label={`@${u.name}`}
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
              {mentionedUsers.filter((u: any) => u.id !== currentUserId).length > 2 && (
                <Typography
                  component="span"
                  onClick={(e) => {
                    setMentionPopover({
                      open: true,
                      anchorEl: e.currentTarget,
                      users: mentionedUsers.filter((u: any) => u.id !== currentUserId),
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
                  እና {mentionedUsers.filter((u: any) => u.id !== currentUserId).length - 2} {mentionedUsers.filter((u: any) => u.id !== currentUserId).length - 2 === 1 ? "ሌላ" : "ሌሎች"}
                </Typography>
              )}
            </Box>
          )}

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
                boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
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

          {/* Reply button */}
          <IconButton
            size="small"
            onClick={() => onReply(comment.id)}
            sx={{
              mt: 0.25,
              p: 0.5,
              color: "text.secondary",
              "&:hover": {
                bgcolor: "action.hover",
                color: "primary.main",
              },
            }}
          >
            <Box
              component="svg"
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="m9 17-5-5 5-5" />
              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </Box>
          </IconButton>
        </Box>
      </Box>

      {/* Replies - nested under parent */}
      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ 
          width: "100%", 
          mt: 0,
          pl: `${(depth + 1) * 2}px`,
        }}>
          {comment.replies.map((reply: any) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              allUsers={allUsers}
              currentUserId={currentUserId}
              onReply={onReply}
              depth={depth + 1}
              statusLabels={statusLabels}
              priorityLabels={priorityLabels}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

