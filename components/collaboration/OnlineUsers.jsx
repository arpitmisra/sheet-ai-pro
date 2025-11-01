'use client';

import { useState, useEffect } from 'react';
import { Users, Circle } from 'lucide-react';
import { getOnlineCollaborators, subscribeToCollaborators } from '@/lib/supabase/collaboration';

export default function OnlineUsers({ sheetId }) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (sheetId) {
      loadOnlineUsers();
      
      const channel = subscribeToCollaborators(sheetId, () => {
        loadOnlineUsers();
      });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [sheetId]);

  const loadOnlineUsers = async () => {
    const { data, error } = await getOnlineCollaborators(sheetId);
    if (!error && data) {
      setOnlineUsers(data);
    }
  };

  const getUserName = (user) => {
    return user?.user_metadata?.full_name || 
           user?.user_metadata?.name || 
           user?.email?.split('@')[0] ||
           'Unknown User';
  };

  const getUserInitials = (user) => {
    const name = getUserName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-red-500',
  ];

  const getColorForUser = (userId) => {
    const index = parseInt(userId.slice(-4), 16) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Users className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {onlineUsers.length} online
        </span>
        
        {/* Avatar Stack (first 3) */}
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className={`w-6 h-6 rounded-full ${getColorForUser(user.user_id)} text-white text-xs flex items-center justify-center border-2 border-white font-semibold`}
              title={getUserName(user.user)}
            >
              {getUserInitials(user.user)}
            </div>
          ))}
          {onlineUsers.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center border-2 border-white font-semibold">
              +{onlineUsers.length - 3}
            </div>
          )}
        </div>
      </button>

      {/* Expanded List */}
      {isExpanded && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsExpanded(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Collaborators
              </h3>
            </div>
            
            <div className="p-2">
              {onlineUsers.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No one else is online</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {onlineUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                    >
                      <div className={`w-10 h-10 rounded-full ${getColorForUser(user.user_id)} text-white flex items-center justify-center font-semibold relative`}>
                        {getUserInitials(user.user)}
                        <Circle className="w-3 h-3 fill-green-500 text-green-500 absolute -bottom-0.5 -right-0.5 bg-white rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getUserName(user.user)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.user?.email}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.role === 'owner' 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : user.role === 'editor'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role}
                          </span>
                          {user.cursor_position && (
                            <span className="text-xs text-gray-400">
                              • {user.cursor_position.cellRef}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
