import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Sparkles, Trash2, Bookmark, CheckCircle, Send, ShieldAlert } from 'lucide-react';
import * as dal from '../services/dal';
import { Insight, AIConsent } from '../types';

export const Insights: React.FC = () => {
  const [consent, setConsent] = useState<AIConsent | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState<{ query: string; answer: string; modelUsed: string }[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const fetchConsentAndInsights = async () => {
    try {
      const consentRes = await dal.ai.getConsentStatus();
      if (consentRes.ok && consentRes.data) {
        setConsent(consentRes.data);
        if (consentRes.data.consentGiven) {
          const listRes = await dal.ai.listInsights();
          if (listRes.ok && listRes.data) {
            setInsights(listRes.data);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching insights/consent:', e);
    }
  };

  useEffect(() => {
    fetchConsentAndInsights();
  }, []);

  const handleEnableConsent = async () => {
    const res = await dal.ai.setConsent({ consentGiven: true });
    if (res.ok && res.data) {
      setConsent(res.data);
      fetchConsentAndInsights();
    }
  };

  const handleGenerateInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await dal.ai.generateInsights();
      if (res.ok && res.data) {
        setInsights(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSaveInsight = async (id: string) => {
    const res = await dal.ai.saveInsight(id);
    if (res.ok) {
      fetchConsentAndInsights();
    }
  };

  const handleDismissInsight = async (id: string) => {
    const res = await dal.ai.dismissInsight(id);
    if (res.ok) {
      fetchConsentAndInsights();
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQuestion = question;
    setQuestion('');
    setLoadingChat(true);

    try {
      const res = await dal.ai.ask(currentQuestion);
      if (res.ok && res.data) {
        setChatLog((prev) => [
          ...prev,
          {
            query: currentQuestion,
            answer: res.data.answer,
            modelUsed: res.data.modelUsed,
          },
        ]);
      } else {
        alert(res.error || 'Failed to get an answer.');
      }
    } catch (e: any) {
      alert(e.message || 'An error occurred.');
    } finally {
      setLoadingChat(false);
    }
  };

  const activeInsights = insights.filter((i) => i.status !== 'dismissed');

  return (
    <div className="space-y-6 text-slate-200">
      <div>
        <h1 className="text-3xl font-bold text-white font-display flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-indigo-400" />
          AI Insights & Assistant
        </h1>
        <p className="text-slate-400 text-sm">
          Generate ledger intelligence and query your books using Gemini 3.5 Flash
        </p>
      </div>

      {!consent?.consentGiven ? (
        <Card className="bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl text-indigo-400 shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <h3 className="font-semibold text-white">AI Insights Consent Required</h3>
            <p className="text-sm text-slate-400">
              To scan your ledger transactions and offer smart suggestions or answer financial queries, you must enable Gemini Insights consent.
            </p>
          </div>
          <Button onClick={handleEnableConsent} className="bg-gradient-brand text-white shadow-lg shadow-indigo-600/30">
            Enable Gemini Insights
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Insights List Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Generated Insights</h2>
              <Button
                onClick={handleGenerateInsights}
                disabled={loadingInsights}
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5"
              >
                {loadingInsights ? 'Analyzing...' : 'Re-analyze Ledger'}
              </Button>
            </div>

            {activeInsights.length === 0 ? (
              <Card className="bg-slate-900 border border-slate-850 p-8 text-center space-y-4">
                <p className="text-slate-400 text-sm">No insights available or analyzed yet.</p>
                <Button onClick={handleGenerateInsights} disabled={loadingInsights} className="mx-auto">
                  {loadingInsights ? 'Generating...' : 'Analyze Ledger Now'}
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeInsights.map((insight) => (
                  <Card key={insight.id} className="bg-slate-900 border border-slate-800 p-4 space-y-2 hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-base">{insight.title}</span>
                          <Badge variant={insight.type === 'trend' ? 'primary' : insight.type === 'reminder' ? 'warning' : 'success'}>
                            {insight.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{insight.body}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {insight.status !== 'saved' ? (
                          <button
                            onClick={() => handleSaveInsight(insight.id)}
                            title="Save Insight"
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="p-1.5 text-green-400" title="Saved">
                            <CheckCircle className="w-4 h-4" />
                          </span>
                        )}
                        <button
                          onClick={() => handleDismissInsight(insight.id)}
                          title="Dismiss Insight"
                          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/50">
                      <span>Model: {insight.modelUsed}</span>
                      <span>Range: {insight.dataRangeCovered.start} to {insight.dataRangeCovered.end}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Gemini Chat Console Column */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Ask Gemini Assistant
            </h2>
            <Card className="bg-slate-900 border border-slate-800 flex flex-col h-[480px]">
              {/* Chat messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
                {chatLog.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                    <Sparkles className="w-8 h-8 text-indigo-500/50 animate-pulse" />
                    <p className="text-sm text-slate-400">
                      Ask anything about your income, expense categories, or taxes.
                    </p>
                    <div className="grid grid-cols-1 gap-2 w-full max-w-xs text-xs">
                      {[
                        'What is my current balance?',
                        'Show me my tax liabilities',
                        'Who is my top client?',
                      ].map((promptText) => (
                        <button
                          key={promptText}
                          onClick={() => setQuestion(promptText)}
                          className="p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:bg-slate-800 hover:border-slate-600 text-left text-slate-300 transition-all truncate"
                        >
                          "{promptText}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatLog.map((chat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-2 text-sm max-w-[85%] shadow-md">
                        {chat.query}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-slate-800 text-slate-100 border border-slate-700 rounded-2xl rounded-tl-none px-4 py-2 text-sm max-w-[85%] shadow-md space-y-1">
                        <p>{chat.answer}</p>
                        <div className="text-[10px] text-slate-500 text-right">
                          via {chat.modelUsed}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm max-w-[85%] shadow-sm text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleAskQuestion} className="p-3 border-t border-slate-800 flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a ledger question..."
                  className="flex-1 bg-slate-950 border-slate-805 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500"
                  disabled={loadingChat}
                />
                <Button
                  type="submit"
                  disabled={loadingChat || !question.trim()}
                  className="bg-indigo-600 text-white hover:bg-indigo-500 shadow-md aspect-square p-2.5 shrink-0 flex items-center justify-center rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
