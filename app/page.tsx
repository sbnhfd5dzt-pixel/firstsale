'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [skills, setSkills] = useState('');
  const [budget, setBudget] = useState('0-50');
  const [hours, setHours] = useState('10');
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState<null | { title: string; summary: string; steps: string[] }>(null);
  const [savedStatus, setSavedStatus] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIdea(null);
    setSavedStatus('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, budget, hours }),
      });

      const data = await response.json();
      if (response.ok) {
        setIdea(data);

        // Check if user is logged in to save plan
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from('plans').insert({
            user_id: user.id,
            title: data.title,
            summary: data.summary,
            steps: data.steps,
          });

          if (!error) {
            setSavedStatus('Saved to your dashboard!');
          }
        }
      } else {
        alert(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      alert('Error contacting AI server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xl">
            F
          </div>
          <span className="font-bold text-xl tracking-wide text-white">FirstSale</span>
        </div>
        <nav className="space-x-6 text-sm text-slate-400">
          <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
          <Link href="/login" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition">Login</Link>
        </nav>
      </header>

      {/* Main Form */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center">
        <span className="bg-indigo-950 text-indigo-400 border border-indigo-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          AI Business Generator
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-4 text-white">
          Generate your next business idea & get your <span className="text-indigo-500">First Sale</span>
        </h1>
        <p className="mt-3 text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Fill in your skills and resources below, and our AI will build a step-by-step launch roadmap for you.
        </p>

        <div id="generator" className="mt-8 p-6 sm:p-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl text-left max-w-2xl mx-auto">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                1. What are your main skills or interests?
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Graphic design, coding, fitness coaching..."
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  2. Starting Budget
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="0-50">$0 - $50 (Bootstrapped)</option>
                  <option value="50-200">$50 - $200</option>
                  <option value="200-500">$200 - $500</option>
                  <option value="500+">$500+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  3. Hours available per week
                </label>
                <select
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="5">5 hours/week</option>
                  <option value="10">10 hours/week</option>
                  <option value="20">20 hours/week</option>
                  <option value="40">Full time (40+ hrs)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-lg shadow-lg transition duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'AI is generating your plan...' : 'Generate Business Idea 🚀'}
            </button>
          </form>

          {/* AI Result */}
          {idea && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-green-950 text-green-400 border border-green-800 rounded">
                  Live AI Recommendation
                </span>
                {savedStatus && (
                  <span className="text-xs text-indigo-400 font-medium">
                    ✓ {savedStatus}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{idea.title}</h3>
              <p className="text-sm text-slate-300 mb-4">{idea.summary}</p>
              
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                Action Plan:
              </h4>
              <ul className="space-y-2">
                {idea.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start text-sm text-slate-300">
                    <span className="h-5 w-5 rounded-full bg-indigo-900 text-indigo-300 text-xs flex items-center justify-center font-bold mr-2 mt-0.5 shrink-0">
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-900 text-center py-6 text-xs text-slate-500">
        © 2026 FirstSale Inc. All rights reserved.
      </footer>
    </div>
  );
}