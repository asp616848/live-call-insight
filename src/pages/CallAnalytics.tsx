import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Filter, Download, Play, Pause, Phone, User, Clock, BarChart3, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LatencyGauge } from "@/components/LatencyGauge";
import { CustomCursor } from "@/components/CustomCursor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Types based on the API response
interface Summary {
  filename: string;
  stream_sid: string;
  call_started: string;
  call_ended: string;
  duration_seconds: number;
  average_ai_response_latency: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  concerns: string[];
  overview: string;
  user_tone: string;
}

interface ConversationMessage {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface Call {
  summary: Summary;
  conversation: ConversationMessage[];
}

const formatDuration = (seconds: number) => {
    if (seconds === null || seconds === undefined) return "N/A";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
};

export default function CallAnalytics() {
	const [calls, setCalls] = useState<Call[]>([]);
	const [selectedCall, setSelectedCall] = useState<Call | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	useEffect(() => {
		async function fetchCalls() {
			try {
				const response = await fetch('https://live-call-insight.onrender.com/logs');
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const data: Call[] = await response.json();
				setCalls(data);
				if (data.length > 0) {
					setSelectedCall(data[0]);
				}
			} catch (e) {
				setError('Failed to fetch call data. Is the backend running?');
			} finally {
				setLoading(false);
			}
		}
		fetchCalls();
	}, []);

	const getSentimentBadgeClass = (sentiment: string) => {
		switch (sentiment) {
			case "positive":
				return "bg-success/20 text-success border-success/30";
			case "neutral":
				return "bg-accent/20 text-accent-foreground border-accent/30";
			case "negative":
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
								{ !loading && <Badge variant="outline">{calls.length} calls</Badge> }
							</div>

							<div className="space-y-3 overflow-y-auto max-h-[calc(100%-80px)]">
								{loading ? (
									<div className="space-y-4">
										{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
									</div>
								) : error ? (
									<Alert variant="destructive">
										<Terminal className="h-4 w-4" />
										<AlertTitle>Error</AlertTitle>
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								) : (
									calls.map((call, index) => (
										<motion.div
											key={call.summary.stream_sid}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
											whileHover={{ scale: 1.02 }}
											className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
												selectedCall?.summary.stream_sid === call.summary.stream_sid
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
														<p className="font-medium text-sm truncate">{call.summary.overview}</p>
														<p className="text-xs text-muted-foreground">
															{call.summary.stream_sid}
														</p>
													</div>
												</div>
												<Badge className={getSentimentBadgeClass(call.summary.sentiment)}>
													{call.summary.sentiment}
												</Badge>
											</div>

											<div className="flex items-center justify-between text-xs text-muted-foreground">
												<div className="flex items-center gap-1">
													<Clock className="h-3 w-3" />
													{formatDuration(call.summary.duration_seconds)}
												</div>
												<div className="flex items-center gap-1">
													<BarChart3 className="h-3 w-3" />
													{Math.round(call.summary.average_ai_response_latency * 1000)}ms
												</div>
											</div>
										</motion.div>
									))
								)}
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
							{selectedCall ? (
								<>
									<div className="flex items-center justify-between mb-6">
										<div>
											<h2 className="text-xl font-semibold">{selectedCall.summary.stream_sid}</h2>
											<p className="text-muted-foreground">
												{new Date(selectedCall.summary.call_started).toLocaleString()}
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
												{selectedCall.conversation.map((msg, index) => (
													<motion.div
														key={index}
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														transition={{ delay: index * 0.1 }}
														className={`flex gap-3 ${
															msg.speaker === "user"
																? "justify-start"
																: "justify-start"
														}`}
													>
														<div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
															{msg.speaker === "user" ? "🗣️" : "🤖"}
														</div>
														<div
															className={`max-w-[80%] p-3 rounded-lg ${
																msg.speaker === "user"
																	? "bg-muted/50 text-foreground"
																	: "bg-primary/10 text-foreground border border-primary/20"
															}`}
														>
															<p className="text-sm mb-1">{msg.text}</p>
															<p className="text-xs text-muted-foreground">
																{new Date(msg.timestamp).toLocaleTimeString()}
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
															{formatDuration(selectedCall.summary.duration_seconds)}
														</span>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">User Tone:</span>
														<span className="font-medium capitalize">
															{selectedCall.summary.user_tone}
														</span>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">Concerns:</span>
														<span className="font-medium capitalize">
															{selectedCall.summary.concerns.join(', ')}
														</span>
													</div>
													<div className="flex justify-between">
														<span className="text-muted-foreground">Sentiment:</span>
														<Badge
															className={getSentimentBadgeClass(selectedCall.summary.sentiment)}
														>
															{selectedCall.summary.sentiment}
														</Badge>
													</div>
												</div>

												<div className="flex flex-col items-center">
													<h3 className="text-sm font-medium mb-4">Avg. Latency</h3>
													<LatencyGauge latency={Math.round(selectedCall.summary.average_ai_response_latency * 1000)} />
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
								</>
							) : (
								<div className="flex items-center justify-center h-full">
									<div className="text-center">
										<p className="text-muted-foreground">Select a call to see details</p>
									</div>
								</div>
							)}
						</Card>
					</motion.div>
				</div>
			</main>
		</div>
	);
}