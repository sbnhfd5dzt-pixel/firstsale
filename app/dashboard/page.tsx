'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Task {
  id: number;
  title: string;
  category: string;
  completed: boolean;
}

interface SavedPlan {
  id: string;
  title: string;
  summary: string;
  steps: string[];
}

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Define core service & offer outline', category: 'Planning', completed: false },
    { id: 2, title: 'Set up 1-page website landing page', category: 'Tech', completed: false },
    { id: 3, title: 'Find 10 potential target clients on LinkedIn/X', category: 'Marketing', completed: false },
    { id: 4, title: 'Send outreach messages to 5 prospects', category: 'Sales', completed: false },
    { id: 5, title: 'Close first pilot client & deliver value', category: 'Revenue', completed: false },
  ]);

  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Welcome to your FirstSale Dashboard! What step are you working on right now?' }
  ]);

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: plans } = await supabase
          .from('plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (plans && plans.length > 0) {
          setSavedPlans(plans);
        }
      }
    }
    loadUserData();
  }, []);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || loadingChat) return;

    const userText = chatMessage;
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setChatMessage('');
    setLoadingChat(true);

    try {
      const activePlan = savedPlans.length > 0 ? `${savedPlans[0].title}: ${savedPlans[0].summary}` : '';
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, planContext: activePlan }),
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        setChatHistory(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setChatHistory(prev => [...prev, { sender: 'ai', text: 'Sorry, I ran into an issue. Please try again!' }]);
      }
    } catch {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Error connecting to AI Coach.' }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header / Nav */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xl">
            F
          </div>
          <span className="font-bold text-xl tracking-wide text-white">FirstSale</span>
        </div>
        <nav className="flex items-center space-x-6 text-sm">
          <Link href="/" className="text-slate-400 hover:text-white transition">Home / Generator</Link>
          <span className="text-indigo-400 font-semibold">Dashboard</span>
          <button 
            onClick={handleLogout}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition text-xs font-medium cursor-pointer"
          >
            Log Out
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Saved Plans, Progress & Checklist */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Saved Business Plans Section */}
          {savedPlans.length > 0 ? (
            <div className="p-6 bg-slate-900 rounded-2xl border border-indigo-800/60 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded">
                  Active Roadmap
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2">{savedPlans[0].title}</h3>
              <p className="text-sm text-slate-300 mb-4">{savedPlans[0].summary}</p>
              
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                Action Steps:
              </h4>
              <ul className="space-y-2">
                {savedPlans[0].steps?.map((step, idx) => (
                  <li key={idx} className="flex items-start text-sm text-slate-300">
                    <span className="h-5 w-5 rounded-full bg-indigo-900 text-indigo-300 text-xs flex items-center justify-center font-bold mr-2 mt-0.5 shrink-0">
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl text-center">
              <h3 className="text-lg font-bold text-white mb-2">No active business plan saved yet!</h3>
              <p className="text-sm text-slate-400 mb-4">Go to the Generator homepage to create your custom AI business roadmap.</p>
              <Link 
                href="/" 
                className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition"
              >
                Create Business Plan 🚀
              </Link>
            </div>
          )}

          {/* Progress Overview Card */}
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Launch Roadmap Progress</h2>
                <p className="text-sm text-slate-400">Complete tasks to reach your First Sale</p>
              </div>
              <span className="text-2xl font-extrabold text-indigo-400">{progressPercent}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Checklist Card */}
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Launch Checklist ({completedCount}/{tasks.length})</h3>
            <div className="space-y-3">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id)}
                  className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                    task.completed 
                      ? 'bg-slate-950/60 border-slate-800 text-slate-500 line-through' 
                      : 'bg-slate-950 border-slate-800 text-white hover:border-indigo-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      checked={task.completed} 
                      onChange={() => {}} 
                      className="h-5 w-5 accent-indigo-600 rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium">{task.title}</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                    {task.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live AI Business Coach Sidebar */}
        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[560px]">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-4 mb-4">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <h3 className="font-bold text-white">AI Launch Coach</h3>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-sm">
            {chatHistory.map((msg, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg max-w-[85%] ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white ml-auto' 
                    : 'bg-slate-950 border border-slate-800 text-slate-300'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loadingChat && (
              <div className="p-3 rounded-lg max-w-[85%] bg-slate-950 border border-slate-800 text-slate-400 italic">
                AI Coach is thinking...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
            <input 
              type="text"
              placeholder="Ask for advice..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button 
              type="submit" 
              disabled={loadingChat}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-lg text-sm disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>

      </main>

      <footer className="border-t border-slate-900 text-center py-6 text-xs text-slate-500">
        © 2026 FirstSale Inc. All rights reserved.
      </footer>
    </div>
  );
}