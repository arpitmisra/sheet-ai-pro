'use client';

import { useState, useEffect } from 'react';
import { X, Users, Mail, Crown, Edit, Eye, AlertCircle } from 'lucide-react';
import { addCollaborator, getSheetCollaborators, updateCollaboratorRole, removeCollaborator } from '@/lib/supabase/collaboration';

export default function ShareModal({ isOpen, onClose, sheetId, sheetTitle }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
    }
  }, [isOpen, sheetId]);

  const loadCollaborators = async () => {
    const { data, error } = await getSheetCollaborators(sheetId);
    if (!error && data) {
      setCollaborators(data);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await addCollaborator(sheetId, email, role);

    if (error) {
      setError(error.message || 'Failed to add collaborator');
    } else {
      setEmail('');
      await loadCollaborators();
    }

    setLoading(false);
  };

  const handleRoleChange = async (collaboratorId, newRole) => {
    await updateCollaboratorRole(collaboratorId, newRole);
    await loadCollaborators();
  };

  const handleRemove = async (collaboratorId) => {
    if (confirm('Remove this collaborator?')) {
      await removeCollaborator(collaboratorId);
      await loadCollaborators();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Share "{sheetTitle}"</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Info Banner */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Collaboration feature coming soon!</p>
              <p className="mt-1">
                Adding collaborators by email requires additional setup. 
                For now, you can see who has access to this sheet.
              </p>
            </div>
          </div>

          {/* Add Collaborator Form - Disabled for now */}
          <form onSubmit={handleAddCollaborator} className="mb-6 opacity-50 pointer-events-none">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add people (Coming soon)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Adding...' : 'Invite'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </form>

          {/* Collaborators List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              People with access
            </h3>
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {collab.user?.email?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {collab.user?.user_metadata?.full_name || 
                         collab.user?.user_metadata?.name ||
                         collab.user?.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {collab.user?.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {collab.role === 'owner' ? (
                      <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                        <Crown className="w-3 h-3" />
                        Owner
                      </div>
                    ) : (
                      <>
                        <select
                          value={collab.role}
                          onChange={(e) => handleRoleChange(collab.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button
                          onClick={() => handleRemove(collab.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permission Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Permission levels</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <Edit className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Editor:</span> Can edit cells, formulas, and chat with team
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Viewer:</span> Can view the sheet and chat, but cannot edit
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={() => loadCollaborators()}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
