import { useState, useEffect } from "react";
import { apiJson } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const LangExtractPage = () => {
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(
    null
  );
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const getBadgeVariant = (category) => {
    switch (category) {
      case "concern":
        return "destructive";
      case "action_item":
        return "secondary";
      case "emotion":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <header className="shrink-0 px-4 pb-2 pt-4 md:px-6 lg:px-8 bg-background z-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Conversation Analysis with LangExtract
        </h1>
        <p className="text-muted-foreground">
          Select a call transcript to view its detailed analysis.
        </p>
      </header>
      <div className="flex-1 flex gap-8 px-4 pb-32 md:px-6 lg:px-8 overflow-hidden">
        <div className="md:w-1/3 w-full h-full overflow-auto pr-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                onValueChange={setSelectedTranscript}
                value={selectedTranscript || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a file..." />
                </SelectTrigger>
                <SelectContent>
                  {transcripts.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Metrics intentionally hidden in redesigned UI */}
        </div>

        <div className="md:w-2/3 w-full h-full overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle>Analysis & Visualization</CardTitle>
              <CardDescription>
                Extracted entities and raw transcript visualization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && <p className="text-red-500">{error}</p>}
              {loading && (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              )}

              {analysis && !loading && (
                <div className="grid gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Extracted Entities</h3>
                    <ScrollArea className="h-72 w-full rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Text</TableHead>
                            <TableHead>Attributes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysis.extractions.map((ext, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Badge variant={getBadgeVariant(ext.extraction_class)}>
                                  {ext.extraction_class}
                                </Badge>
                              </TableCell>
                              <TableCell>{ext.extraction_text}</TableCell>
                              <TableCell>
                                <pre className="text-xs bg-muted p-2 rounded-md">
                                  {JSON.stringify(ext.attributes, null, 2)}
                                </pre>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                  {/* <div>
                    <h3 className="font-semibold mb-2">
                      Transcript Visualization
                    </h3>
                    <ScrollArea className="h-96 w-full rounded-md border">
                      {analysis.visualization_html ? (
                        <iframe
                          srcDoc={analysis.visualization_html}
                          className="w-full h-full"
                          style={{ minHeight: "400px" }}
                          title="Transcript Visualization"
                        />
                      ) : (
                        <p>No visualization available.</p>
                      )}
                    </ScrollArea>
                  </div> */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LangExtractPage;