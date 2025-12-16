import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { serverUrl } from "@/lib/api";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AIAssistant() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! I am your AI Health Assistant. I can help with symptoms, vitals, and general advice. Try: "What do my BP readings mean?", "Show warning signs", or "How to log today\'s BP".',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [patientId, setPatientId] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [suggestions] = useState<string[]>([
        "How to log today\'s blood pressure",
        "What does high systolic mean?",
        "Show heart failure warning signs",
        "Explain my weekly vitals chart"
    ])

    useEffect(() => {
        async function getUser() {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
                setPatientId(data.session.user.id);
            }
        }
        getUser();
        (async () => {
          try {
            const res = await fetch(`${serverUrl()}/health`)
            if (!res.ok) throw new Error(String(res.status))
            console.log('[AIAssistant] backend health ok')
          } catch (e) {
            console.error('[AIAssistant] backend health failed', e)
            toast.error('Server connectivity issue')
          }
        })()
    }, []);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // TODO: Connect to backend AI endpoint here.
            // For now, we simulate a response to demonstrate the UI.
            // const res = await fetch(`${serverUrl()}/api/ai/chat`, { method: 'POST', body: JSON.stringify({ message: input, patientId }) });

            await new Promise(resolve => setTimeout(resolve, 1200));
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "If you experience chest pain, severe breathlessness, sudden weight gain (>2kg in 2 days), leg swelling, or fainting, seek medical attention. You can log vitals in the Vitals Tracker.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);

        } catch (err: any) {
            toast.error("Failed to get response from AI");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl h-[calc(100vh-theme(spacing.20))]">
            <Card className="h-full flex flex-col border-primary/20 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Vitalink AI Assistant</CardTitle>
                            <CardDescription>Your personal health companion</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <div className="absolute inset-0 overflow-y-auto p-4 space-y-4" ref={scrollAreaRef}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>

                                <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-none'
                                            : 'bg-card border text-card-foreground rounded-bl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1 opacity-70">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="bg-card border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggestions.map((s, i) => (
                            <Button key={i} variant="outline" size="sm" onClick={() => setInput(s)}>
                              {s}
                            </Button>
                          ))}
                        </div>
                        <div className="mt-4 p-3 border rounded-lg bg-accent/10">
                          <div className="text-sm font-semibold">Warning Signs</div>
                          <div className="text-xs text-muted-foreground">
                            Chest pain • Severe breathlessness • Fainting • Sudden weight gain (>2kg/2 days) • Leg swelling • Worsening orthopnea
                          </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-4 border-t bg-background">
                    <form onSubmit={handleSend} className="flex gap-3 w-full">
                        <Input
                            placeholder="Type your health question..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading || !input.trim()} size="icon">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
