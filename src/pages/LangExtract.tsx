import { useState, useEffect, useCallback } from "react";
import { apiJson } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Heart, 
  Target,
  Zap,
  Layers,
  Copy,
  ChevronRight,
  Search,
  Filter,
  Eye,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const LangExtractPage = () => {
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    const fetchTranscripts = async () => {
      try {
        const data = await apiJson('/list_transcripts');
        setTranscripts(data);
        if (data.length > 0) {
          setSelectedTranscript(data[0]);
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchTranscripts();
  }, []);

  useEffect(() => {
    if (selectedTranscript) {
      const fetchAnalysis = async () => {
        setLoading(true);
        setError(null);
        setAnalysis(null);
        try {
          const data = await apiJson(`/analyze/${selectedTranscript}`);
          setAnalysis(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAnalysis();
    }
  }, [selectedTranscript]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('copy failed', e);
    }
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "concern": return <AlertTriangle className="w-5 h-5" />;
      case "action_item": return <CheckCircle className="w-5 h-5" />;
      case "emotion": return <Heart className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "concern": return "from-red-500/30 to-red-600/30 border-red-400/50 shadow-red-500/20";
      case "action_item": return "from-purple-500/30 to-violet-500/30 border-purple-400/50 shadow-purple-500/20";
      case "emotion": return "from-pink-500/30 to-purple-500/30 border-pink-400/50 shadow-pink-500/20";
      default: return "from-slate-500/30 to-gray-600/30 border-slate-400/50 shadow-slate-500/20";
    }
  };

  const getAttributeIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case "domain": return <Layers className="w-4 h-4" />;
      case "problem": return <AlertTriangle className="w-4 h-4" />;
      case "type": return <Target className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const filteredExtractions = analysis?.extractions?.filter((ext: any) => {
    const matchesSearch = ext.extraction_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         JSON.stringify(ext.attributes).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || ext.extraction_class === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = [...new Set(analysis?.extractions?.map((ext: any) => ext.extraction_class) || [])];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-violet-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/95 border-b border-purple-800/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-700 to-violet-700 shadow-lg shadow-purple-900/50">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-violet-300 bg-clip-text text-transparent">
                  ConvoInsight
                </h1>
                <p className="text-sm text-gray-400">AI-Powered Conversation Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-300" />
              <span className="text-sm font-medium text-purple-300">Live Analysis</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Transcript Selector */}
            <Card className="overflow-hidden border border-slate-700/50 shadow-xl bg-slate-800/70 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Eye className="w-5 h-5 text-purple-400" />
                  Select Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={setSelectedTranscript} value={selectedTranscript || ""}>
                  <SelectTrigger className="border border-slate-600 bg-slate-700/50 text-white">
                    <SelectValue placeholder="Choose a conversation..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {transcripts.map((t) => (
                      <SelectItem key={t} value={t} className="text-white hover:bg-slate-700">
                        {t.replace(/^call_transcript_/, '').replace(/\.json$/, '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card className="overflow-hidden border border-slate-700/50 shadow-xl bg-slate-800/70 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Filter className="w-5 h-5 text-purple-400" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search entities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border border-slate-600 bg-slate-700/50 text-white placeholder-slate-400"
                  />
                </div>
                <Select onValueChange={setFilterCategory} value={filterCategory}>
                  <SelectTrigger className="border border-slate-600 bg-slate-700/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-700">All Categories</SelectItem>
                    {categories.map((cat: string) => (
                      <SelectItem key={cat} value={cat} className="text-white hover:bg-slate-700">
                        {cat.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Stats */}
            {analysis && (
              <Card className="overflow-hidden border border-slate-700/50 shadow-xl bg-slate-800/70 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
                      <div className="text-2xl font-bold text-purple-400">{analysis.extractions?.length || 0}</div>
                      <div className="text-xs text-slate-400">Total Entities</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-violet-500/20 border border-violet-500/30">
                      <div className="text-2xl font-bold text-violet-400">{categories.length}</div>
                      <div className="text-xs text-slate-400">Categories</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {error && (
              <Card className="border border-red-500/50 bg-red-900/30 mb-6">
                <CardContent className="pt-6">
                  <p className="text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </p>
                </CardContent>
              </Card>
            )}

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden border border-slate-700/50 shadow-xl bg-slate-800/70">
                    <CardHeader>
                      <Skeleton className="h-6 w-24 bg-slate-700" />
                      <Skeleton className="h-4 w-32 bg-slate-700" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full bg-slate-700" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {analysis && !loading && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Conversation Entities</h2>
                  <Badge variant="outline" className="text-sm border-purple-500/50 text-purple-400">
                    {filteredExtractions.length} results
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredExtractions.map((ext: any, i: number) => (
                    <motion.div
                      key={i}
                      // initial={{ opacity: 0, y: 20 }}
                      // animate={{ opacity: 1, y: 0 }}
                      // transition={{ delay: i * 0.1 }}
                      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${getCategoryColor(ext.extraction_class)} backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer shadow-lg`}
                      onClick={() => setSelectedEntity(selectedEntity === i ? null : i)}
                    >
                      <Card className="border-0 bg-transparent shadow-none">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${ext.extraction_class === 'concern' ? 'bg-red-500/40 border border-red-400/50' : ext.extraction_class === 'action_item' ? 'bg-purple-500/40 border border-purple-400/50' : 'bg-pink-500/40 border border-pink-400/50'}`}>
                                {getCategoryIcon(ext.extraction_class)}
                              </div>
                              <div>
                                <Badge variant="secondary" className={`mb-2 ${ext.extraction_class === 'concern' ? 'bg-red-500/20 text-red-300 border-red-400/50' : ext.extraction_class === 'action_item' ? 'bg-purple-500/20 text-purple-300 border-purple-400/50' : 'bg-pink-500/20 text-pink-300 border-pink-400/50'}`}>
                                  {ext.extraction_class.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <CardDescription className="text-xs text-slate-400">
                                  Entity #{i + 1}
                                </CardDescription>
                              </div>
                            </div>
                            <ChevronRight 
                              className={`w-5 h-5 transition-transform duration-200 text-white ${selectedEntity === i ? 'rotate-90' : ''}`}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-600/50">
                            <p className="text-sm font-medium leading-relaxed text-white">
                              {ext.extraction_text}
                            </p>
                          </div>

                          <AnimatePresence>
                            {selectedEntity === i && (
                              <motion.div
                                // initial={{ opacity: 0, height: 0 }}
                                // animate={{ opacity: 1, height: 'auto' }}
                                // exit={{ opacity: 0, height: 0 }}
                                className="space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-slate-300">Attributes</h4>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(JSON.stringify(ext.attributes, null, 2));
                                          }}
                                          className="h-7 w-7 p-0 hover:bg-slate-700/50 text-purple-400"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-slate-800 border-slate-600 text-white">
                                        <p>Copy attributes</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                
                                <div className="grid gap-3">
                                  {Object.entries(ext.attributes || {}).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/80 border border-slate-600/50">
                                      <div className="p-1.5 rounded-md bg-gradient-to-r from-purple-500/30 to-violet-500/30 border border-purple-500/30">
                                        {getAttributeIcon(key)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-medium text-purple-300 uppercase tracking-wide">
                                            {key}
                                          </span>
                                        </div>
                                        <p className="text-sm font-medium text-white break-words">
                                          {typeof value === 'string' ? value : JSON.stringify(value)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {filteredExtractions.length === 0 && (
                  <Card className="border border-slate-700/50 shadow-xl bg-slate-800/70 backdrop-blur-sm">
                    <CardContent className="pt-6 text-center py-12">
                      <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-white">No entities found</h3>
                      <p className="text-slate-400">Try adjusting your search or filter criteria.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LangExtractPage;