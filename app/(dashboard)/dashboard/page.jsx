'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getUserSheets, createSheet, signOut, deleteSheet } from '@/lib/supabase/client';
import { FileSpreadsheet, Plus, LogOut, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    loadSheets(currentUser.id);
  };

  const loadSheets = async (userId) => {
    const { data, error } = await getUserSheets(userId);
    
    if (!error && data) {
      setSheets(data);
    }
    
    setLoading(false);
  };

  const handleCreateSheet = async () => {
    if (!user || creating) return;
    
    setCreating(true);
    const { data, error } = await createSheet(user.id);
    
    if (!error && data) {
      router.push(`/sheets/${data.id}`);
    } else {
      setCreating(false);
    }
  };

  const handleDeleteSheet = async (sheetId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this sheet?')) return;
    
    const { error } = await deleteSheet(sheetId);
    
    if (!error) {
      setSheets(sheets.filter(s => s.id !== sheetId));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">SheetAI Pro</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Sheets</h1>
            <p className="text-gray-600">Create and manage your spreadsheets</p>
          </div>
          
          <button
            onClick={handleCreateSheet}
            disabled={creating}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            {creating ? 'Creating...' : 'New Sheet'}
          </button>
        </div>

        {/* Sheets Grid */}
        {sheets.length === 0 ? (
          <div className="text-center py-16">
            <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No sheets yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first spreadsheet</p>
            <button
              onClick={handleCreateSheet}
              disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Your First Sheet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sheets.map((sheet) => (
              <Link
                key={sheet.id}
                href={`/sheets/${sheet.id}`}
                className="group block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <FileSpreadsheet className="w-10 h-10 text-blue-600" />
                    <button
                      onClick={(e) => handleDeleteSheet(sheet.id, e)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 truncate">
                    {sheet.title}
                  </h3>
                  
                  <p className="text-sm text-gray-500">
                    {sheet.updated_at ? (
                      <>Updated {format(new Date(sheet.updated_at), 'MMM d, yyyy')}</>
                    ) : (
                      <>Created {format(new Date(sheet.created_at), 'MMM d, yyyy')}</>
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
