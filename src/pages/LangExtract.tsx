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

  // Map extraction category to theme-consistent tones (works in light and dark)
  const getCategoryTone = (category: string) => {
    switch (category) {
      case "concern":
        return {
          container: "bg-destructive/10 border-destructive/40",
          chip: "bg-destructive/20 text-destructive-foreground/90 border-destructive/30",
          icon: "text-destructive",
        };
      case "action_item":
        return {
          container: "bg-primary/10 border-primary/40",
          chip: "bg-primary/15 text-primary border-primary/30",
          icon: "text-primary",
        };
      case "emotion":
        return {
          container: "bg-accent/10 border-accent/40",
          chip: "bg-accent/20 text-accent-foreground/90 border-accent/30",
          icon: "text-accent-foreground",
        };
      default:
        return {
          container: "bg-muted/30 border-border",
          chip: "bg-muted text-muted-foreground border-border/50",
          icon: "text-muted-foreground",
        };
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl glow-primary glass">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  ConvoInsight
                </h1>
                <p className="text-sm text-muted-foreground">AI-Powered Conversation Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Live Analysis</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Transcript Selector */}
            <Card className="overflow-hidden glass shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="w-5 h-5 text-primary" />
                  Select Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={setSelectedTranscript} value={selectedTranscript || ""}>
                  <SelectTrigger className="border border-input bg-background/50 text-foreground backdrop-blur-sm">
                    <SelectValue placeholder="Choose a conversation..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground backdrop-blur-md">
                    {transcripts.map((t) => (
                      <SelectItem key={t} value={t} className="hover:bg-muted">
                        {t.replace(/^call_transcript_/, '').replace(/\.json$/, '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card className="overflow-hidden glass shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="w-5 h-5 text-primary" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border border-input bg-background/50 text-foreground placeholder-muted-foreground backdrop-blur-sm"
                  />
                </div>
                <Select onValueChange={setFilterCategory} value={filterCategory}>
                  <SelectTrigger className="border border-input bg-background/50 text-foreground backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border backdrop-blur-md">
                    <SelectItem value="all" className="hover:bg-muted">All Categories</SelectItem>
                    {categories.map((cat: string) => (
                      <SelectItem key={cat} value={cat} className="hover:bg-muted">
                        {cat.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Stats */}
            {analysis && (
              <Card className="overflow-hidden glass shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/30 backdrop-blur-sm">
                      <div className="text-2xl font-bold text-primary">{analysis.extractions?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Entities</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/30 backdrop-blur-sm">
                      <div className="text-2xl font-bold text-accent-foreground">{categories.length}</div>
                      <div className="text-xs text-muted-foreground">Categories</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {error && (
              <Card className="border border-destructive/40 bg-destructive/10 mb-6 backdrop-blur-md">
                <CardContent className="pt-6">
                  <p className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                  </p>
                </CardContent>
              </Card>
            )}

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden glass shadow-xl">
                    <CardHeader>
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {analysis && !loading && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Conversation Entities</h2>
                  <Badge variant="outline" className="text-sm border-primary/40 text-primary backdrop-blur-sm">
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
                      className={`group relative overflow-hidden rounded-2xl border ${getCategoryTone(ext.extraction_class).container} glass hover:shadow-2xl transition-all duration-300 cursor-pointer shadow-lg`}
                      onClick={() => setSelectedEntity(selectedEntity === i ? null : i)}
                    >
                      <Card className="border-0 bg-transparent shadow-none">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg backdrop-blur-sm border ${getCategoryTone(ext.extraction_class).container}`}>
                                <span className={getCategoryTone(ext.extraction_class).icon}>
                                  {getCategoryIcon(ext.extraction_class)}
                                </span>
                              </div>
                              <div>
                                <Badge variant="secondary" className={`mb-2 backdrop-blur-sm border ${getCategoryTone(ext.extraction_class).chip}`}>
                                  {ext.extraction_class.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <CardDescription className="text-xs text-muted-foreground">
                                  Entity #{i + 1}
                                </CardDescription>
                              </div>
                            </div>
                            <ChevronRight 
                              className={`w-5 h-5 transition-transform duration-200 text-foreground ${selectedEntity === i ? 'rotate-90' : ''}`}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 rounded-xl bg-card/80 border border-border backdrop-blur-sm">
                            <p className="text-sm font-medium leading-relaxed text-foreground">
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
                                  <h4 className="text-sm font-semibold text-foreground">Attributes</h4>
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
                                          className="h-7 w-7 p-0 hover:bg-muted/50 text-primary backdrop-blur-sm"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-popover border-border text-foreground backdrop-blur-md">
                                        <p>Copy attributes</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                
                                <div className="grid gap-3">
                                  {Object.entries(ext.attributes || {}).map(([key, value]: [string, any]) => (
                                    <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-card/90 border border-border backdrop-blur-sm">
                                      <div className="p-1.5 rounded-md bg-primary/10 border border-primary/30 backdrop-blur-sm">
                                        {getAttributeIcon(key)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-medium text-primary uppercase tracking-wide">
                                            {key}
                                          </span>
                                        </div>
                                        <p className="text-sm font-medium text-foreground break-words">
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
                  <Card className="glass shadow-xl">
                    <CardContent className="pt-6 text-center py-12">
                      <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No entities found</h3>
                      <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
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