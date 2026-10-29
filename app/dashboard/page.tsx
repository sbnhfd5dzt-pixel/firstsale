'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface SavedPlan {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  completed_steps?: number[];
  created_at?: string;
}

export default function Dashboard() {
  const [plan, setPlan] = useState<SavedPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'Welcome to your FirstSale Dashboard! What step are you working on right now?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function fetchLatestPlan() {
      const { data } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setPlan({
          ...data,
          completed_steps: data.completed_steps || []
        });
      }
      setLoading(false);
    }

    fetchLatestPlan();
  }, []);

  // Handle checking/unchecking checklist steps
  const toggleStep = async (index: number) => {
    if (!plan) return;

    const currentCompleted = plan.completed_steps || [];
    let updatedCompleted: number[];

    if (currentCompleted.includes(index)) {
      updatedCompleted = currentCompleted.filter((i) => i !== index);
    } else {
      updatedCompleted = [...currentCompleted, index];
    }

    // Update state immediately for snappy UI
    setPlan({ ...plan, completed_steps: updatedCompleted });

    // Save progress to Supabase
    await supabase
      .from('plans')
      .update({ completed_steps: updatedCompleted })
      .eq('id', plan.id);
  };

  // Handle AI Launch Coach Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    // Build the planContext string expected by app/api/coach/route.ts
    const planContextStr = plan
      ? `Title: ${plan.title}. Summary: ${plan.summary}. Action Steps: ${plan.steps ? plan.steps.join('; ') : ''}`
      : 'General micro-SaaS / digital business';

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          planContext: planContextStr
        })
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setChatHistory((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'Sorry, I ran into an issue. Please try again!' }
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble connecting to your AI Coach.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
        Loading your dashboard...
      </div>
    );
  }

  const totalSteps = plan?.steps?.length || 5;
  const completedCount = plan?.completed_steps?.length || 0;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left 2 Columns: Roadmap & Checklist */}
      <div className="lg:col-span-2 space-y-8">
        <h1 className="text-3xl font-bold">Your Business Dashboard</h1>

        {!plan ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No active business plan saved yet!</h2>
            <p className="text-slate-400 mb-6">
              Go to the Generator homepage to create your custom AI business roadmap.
            </p>
            <Link
              href="/"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium"
            >
              Create Business Plan 🚀
            </Link>
          </div>
        ) : (
          <>
            {/* Active Roadmap Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <span className="text-xs uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full font-semibold">
                Active Roadmap
              </span>
              <h2 className="text-2xl font-bold text-white mt-3 mb-2">{plan.title}</h2>
              <p className="text-slate-300">{plan.summary}</p>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Launch Roadmap Progress</h3>
                <span className="text-indigo-400 font-bold text-lg">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Launch Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="font-semibold text-lg mb-4">
                Launch Checklist ({completedCount}/{totalSteps})
              </h3>
              <div className="space-y-3">
                {plan.steps?.map((step: string, index: number) => {
                  const isChecked = plan.completed_steps?.includes(index);
                  return (
                    <div
                      key={index}
                      onClick={() => toggleStep(index)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-indigo-950/30 border-indigo-500/40 opacity-75 line-through text-slate-400'
                          : 'bg-slate-800/60 border-slate-700 hover:border-slate-600 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked || false}
                          onChange={() => {}} // Handled by outer div click
                          className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                        />
                        <span className="font-medium">{step}</span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded bg-slate-700 text-slate-300">
                        Step {index + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Column: AI Launch Coach Sidebar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[750px] sticky top-8 shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h3 className="font-semibold text-lg">AI Launch Coach</h3>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white ml-6'
                  : 'bg-slate-800 text-slate-200 mr-6'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {chatLoading && (
            <div className="bg-slate-800 text-slate-400 p-3 rounded-lg text-sm italic">
              Coach is thinking...
            </div>
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-slate-800">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Ask for advice..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={chatLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}