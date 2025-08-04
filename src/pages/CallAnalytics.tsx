import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Filter, Download, Play, Pause, Phone, User, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LatencyGauge } from "@/components/LatencyGauge";
import { CustomCursor } from "@/components/CustomCursor";

const calls = [
	{
		id: "CALL-001",
		user: "Rajesh Kumar",
		startTime: "2025-08-02 14:30:15",
		endTime: "2025-08-02 14:35:42",
		duration: "5m 27s",
		status: "Completed",
		sentiment: "Positive",
		latency: 145,
		agent: "IntelliAgent-v2",
		industry: "Healthcare",
	},
	{
		id: "CALL-002",
		user: "Priya Singh",
		startTime: "2025-08-02 14:25:30",
		endTime: null,
		duration: "9m 12s",
		status: "In Progress",
		sentiment: "Neutral",
		latency: 89,
		agent: "IntelliAgent-v2",
		industry: "Finance",
	},
	{
		id: "CALL-003",
		user: "Anonymous",
		startTime: "2025-08-02 14:20:45",
		endTime: "2025-08-02 14:21:10",
		duration: "25s",
		status: "Missed",
		sentiment: "N/A",
		latency: 0,
		agent: "IntelliAgent-v2",
		industry: "Education",
	},
];

const conversation = [
	{
		timestamp: "14:30:15",
		type: "user",
		text: "Namaste, doctor sahab. Mujhe diabetes ke bare mein puchna tha.",
	},
	{
		timestamp: "14:30:17",
		type: "ai_final",
		text: "Namaste ji! Main aapki madad kar sakta hun. Diabetes ke bare mein kya specific janna chahte hain aap?",
	},
	{
		timestamp: "14:30:25",
		type: "user",
		text: "Mera sugar level 180 aa raha hai. Kya karna chahiye?",
	},
	{
		timestamp: "14:30:28",
		type: "ai_final",
		text: "180 thoda zyada hai normal range se. Aapko doctor se milna chahiye aur diet control karna hoga. Kya aap regular exercise karte hain?",
	},
];

export default function CallAnalytics() {
	const [selectedCall, setSelectedCall] = useState(calls[0]);
	const [isPlaying, setIsPlaying] = useState(false);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Completed":
				return "bg-success/20 text-success border-success/30";
			case "In Progress":
				return "bg-warning/20 text-warning border-warning/30";
			case "Missed":
				return "bg-destructive/20 text-destructive border-destructive/30";
			default:
				return "bg-muted/20 text-muted-foreground border-muted/30";
		}
	};

	const getSentimentColor = (sentiment: string) => {
		switch (sentiment) {
			case "Positive":
				return "bg-success/20 text-success border-success/30";
			case "Neutral":
				return "bg-accent/20 text-accent-foreground border-accent/30";
			case "Negative":
				return "bg-destructive/20 text-destructive border-destructive/30";
			default:
				return "bg-muted/20 text-muted-foreground border-muted/30";
		}
	};

	return (
		<div className="flex min-h-screen bg-background">
        <CustomCursor/>
			<main className="flex-1 p-6 space-y-6 overflow-y-auto">
				{/* Header with Filters */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
				>
					<div>
						<h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
							Call Analytics
						</h1>
						<p className="text-muted-foreground">
							Detailed call metrics and real-time monitoring
						</p>
					</div>

					<div className="flex gap-3">
						<Select defaultValue="today">
							<SelectTrigger className="w-40">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="today">Today</SelectItem>
								<SelectItem value="week">This Week</SelectItem>
								<SelectItem value="month">This Month</SelectItem>
							</SelectContent>
						</Select>

						<Select defaultValue="all-agents">
							<SelectTrigger className="w-40">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all-agents">All Agents</SelectItem>
								<SelectItem value="v2">IntelliAgent-v2</SelectItem>
								<SelectItem value="v1">IntelliAgent-v1</SelectItem>
							</SelectContent>
						</Select>

						<Button variant="outline" size="icon">
							<Filter className="h-4 w-4" />
						</Button>
					</div>
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-200px)]">
					{/* Call List Panel */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="lg:col-span-2"
					>
						<Card className="h-full p-6">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-semibold">Recent Calls</h2>
								<Badge variant="outline">{calls.length} calls</Badge>
							</div>

							<div className="space-y-3 overflow-y-auto max-h-[calc(100%-80px)]">
								{calls.map((call, index) => (
									<motion.div
										key={call.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
										whileHover={{ scale: 1.02 }}
										className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
											selectedCall.id === call.id
												? "border-primary/50 bg-primary/5"
												: "border-border hover:border-primary/30"
										}`}
										onClick={() => setSelectedCall(call)}
									>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
													<User className="h-4 w-4 text-primary-foreground" />
												</div>
												<div>
													<p className="font-medium text-sm">{call.user}</p>
													<p className="text-xs text-muted-foreground">
														{call.id}
													</p>
												</div>
											</div>
											<Badge className={getStatusColor(call.status)}>
												{call.status}
											</Badge>
										</div>

										<div className="flex items-center justify-between text-xs text-muted-foreground">
											<div className="flex items-center gap-1">
												<Clock className="h-3 w-3" />
												{call.duration}
											</div>
											<div className="flex items-center gap-1">
												<BarChart3 className="h-3 w-3" />
												{call.latency}ms
											</div>
										</div>

										{selectedCall.id === call.id && (
											<motion.div
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: "auto" }}
												className="mt-3 pt-3 border-t border-border/50"
											>
												<p className="text-xs text-muted-foreground">
													"Namaste, doctor sahab. Mujhe diabetes ke bare mein..."
												</p>
											</motion.div>
										)}
									</motion.div>
								))}
							</div>
						</Card>
					</motion.div>

					{/* Call Detail Panel */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className="lg:col-span-3"
					>
						<Card className="h-full p-6">
							<div className="flex items-center justify-between mb-6">
								<div>
									<h2 className="text-xl font-semibold">{selectedCall.id}</h2>
									<p className="text-muted-foreground">
										{selectedCall.user}
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="icon"
										onClick={() => setIsPlaying(!isPlaying)}
									>
										{isPlaying ? (
											<Pause className="h-4 w-4" />
										) : (
											<Play className="h-4 w-4" />
										)}
									</Button>
									<Button variant="outline" size="icon">
										<Download className="h-4 w-4" />
									</Button>
								</div>
							</div>

							<Tabs defaultValue="conversation" className="h-[calc(100%-100px)]">
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="conversation">Conversation</TabsTrigger>
									<TabsTrigger value="metrics">Metrics</TabsTrigger>
									<TabsTrigger value="waveform">Audio</TabsTrigger>
								</TabsList>

								<TabsContent
									value="conversation"
									className="mt-4 h-[calc(100%-50px)]"
								>
									<div className="space-y-4 overflow-y-auto h-full">
										{conversation.map((msg, index) => (
											<motion.div
												key={index}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.1 }}
												className={`flex gap-3 ${
													msg.type === "user"
														? "justify-start"
														: "justify-start"
												}`}
											>
												<div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
													{msg.type === "user" ? "🗣️" : "🤖"}
												</div>
												<div
													className={`max-w-[80%] p-3 rounded-lg ${
														msg.type === "user"
															? "bg-muted/50 text-foreground"
															: "bg-primary/10 text-foreground border border-primary/20"
													}`}
												>
													<p className="text-sm mb-1">{msg.text}</p>
													<p className="text-xs text-muted-foreground">
														{msg.timestamp}
													</p>
												</div>
											</motion.div>
										))}
									</div>
								</TabsContent>

								<TabsContent value="metrics" className="mt-4">
									<div className="grid grid-cols-2 gap-6">
										<div className="space-y-4">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Duration:</span>
												<span className="font-medium">
													{selectedCall.duration}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Agent:</span>
												<span className="font-medium">
													{selectedCall.agent}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Industry:</span>
												<span className="font-medium">
													{selectedCall.industry}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Sentiment:</span>
												<Badge
													className={getSentimentColor(selectedCall.sentiment)}
												>
													{selectedCall.sentiment}
												</Badge>
											</div>
										</div>

										<div className="flex flex-col items-center">
											<h3 className="text-sm font-medium mb-4">Latency</h3>
											<LatencyGauge latency={selectedCall.latency} />
										</div>
									</div>
								</TabsContent>

								<TabsContent value="waveform" className="mt-4">
									<div className="flex items-center justify-center h-full">
										<div className="text-center">
											<p className="text-muted-foreground">
												Audio waveform not available
											</p>
										</div>
									</div>
								</TabsContent>
							</Tabs>
						</Card>
					</motion.div>
				</div>
			</main>
		</div>
	);
}