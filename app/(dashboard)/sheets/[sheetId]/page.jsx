'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSheet, updateSheetTitle } from '@/lib/supabase/client';
import { updatePresence } from '@/lib/supabase/collaboration';
import Spreadsheet from '@/components/spreadsheet/Spreadsheet';
import ShareModal from '@/components/collaboration/ShareModal';
import ChatPanel from '@/components/collaboration/ChatPanel';
import OnlineUsers from '@/components/collaboration/OnlineUsers';
import { FileSpreadsheet, ArrowLeft, Share2, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function SheetPage({ params }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    checkUserAndLoadSheet();
  }, []);

  useEffect(() => {
    // Mark user as online when component mounts
    if (params.sheetId && user) {
      updatePresence(params.sheetId, true);

      // Mark offline on unmount
      return () => {
        updatePresence(params.sheetId, false);
      };
    }
  }, [params.sheetId, user]);

  // Update presence periodically
  useEffect(() => {
    if (params.sheetId && user) {
      const interval = setInterval(() => {
        updatePresence(params.sheetId, true);
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [params.sheetId, user]);

  const checkUserAndLoadSheet = async () => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    
    // Load sheet data
    const { data, error } = await getSheet(params.sheetId);
    
    if (error || !data) {
      router.push('/dashboard');
      return;
    }

    setSheet(data);
    setTitle(data.title);
    setLoading(false);
  };

  const handleTitleUpdate = async () => {
    if (title.trim() === '') {
      setTitle(sheet.title);
      setEditingTitle(false);
      return;
    }

    const { data, error } = await updateSheetTitle(params.sheetId, title);
    
    if (!error && data) {
      setSheet(data);
    }
    
    setEditingTitle(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              
              {editingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleUpdate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleUpdate();
                    if (e.key === 'Escape') {
                      setTitle(sheet.title);
                      setEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="text-xl font-semibold px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <h1
                  onClick={() => setEditingTitle(true)}
                  className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-50"
                >
                  {sheet?.title}
                </h1>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <OnlineUsers sheetId={params.sheetId} />
            
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle Chat"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Chat</span>
            </button>
            
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            
            <span className="text-sm text-gray-600">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-hidden">
        <Spreadsheet sheetId={params.sheetId} />
      </div>

      {/* Collaboration Features */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        sheetId={params.sheetId}
        sheetTitle={sheet?.title || 'Untitled Sheet'}
      />
      
      <ChatPanel
        sheetId={params.sheetId}
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
      />
    </div>
  );
}
