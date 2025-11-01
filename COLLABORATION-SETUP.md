# 🚀 PHASE 2: REAL-TIME COLLABORATION - SETUP GUIDE

## ✅ **FEATURES IMPLEMENTED:**

### 1. **Live Collaboration** 
- Multiple users can work on the same sheet simultaneously
- Real-time cell updates via Supabase Realtime

### 2. **User Presence**
- See who's online with profile pictures/initials
- View their current cursor position
- Automatic online/offline detection

### 3. **Share & Permissions**
- **Share Modal**: Invite collaborators by email
- **Role System**: Owner, Editor, Viewer
  - **Owner**: Full control, can share, delete
  - **Editor**: Can edit cells and chat
  - **Viewer**: Read-only access, can chat

### 4. **Team Chat**
- Real-time text chat
- Minimizable/expandable chat panel
- Message timestamps
- User identification

### 5. **Voice Chat** (Coming Soon - Phase 3)
- WebRTC integration needed
- Mic on/off controls
- Currently showing foundation only

---

## 📋 **SETUP INSTRUCTIONS:**

### **STEP 1: Run Collaboration SQL** (5 minutes)

1. Go to your Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/syubohbjikkajtiysmvw/sql
   ```

2. Click **"New Query"**

3. Copy **ALL** content from `supabase-collaboration.sql`

4. Paste and click **"Run"**

5. Verify success:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('sheet_collaborators', 'chat_messages', 'sheet_settings');
   ```

---

### **STEP 2: Enable Supabase Realtime** (2 minutes)

1. Go to **Database** → **Replication** in Supabase

2. Find these tables and enable replication:
   - `sheet_collaborators`
   - `chat_messages`
   - `cells`

3. Click **"Save"**

---

### **STEP 3: Test Collaboration** (10 minutes)

#### **A. Test Share Feature:**

1. Open a sheet
2. Click **"Share"** button (top right)
3. Enter an email address
4. Select **"Editor"** or **"Viewer"**
5. Click **"Invite"**
6. ✅ Collaborator should appear in list

#### **B. Test User Presence:**

1. Open same sheet in **2 different browsers** (or incognito)
2. Login with different accounts
3. Check **"X online"** indicator
4. ✅ Should show both users online

#### **C. Test Chat:**

1. Click **"Chat"** button (top right)
2. Type a message
3. Press Enter or click Send
4. ✅ Message appears in both browsers instantly

#### **D. Test Live Editing:**

1. User A: Type in cell A1
2. User B: Should see changes in real-time
3. ✅ Cell updates appear for both users

---

## 🎨 **UI COMPONENTS CREATED:**

### 1. **ShareModal.jsx**
- **Location**: `components/collaboration/ShareModal.jsx`
- **Features**:
  - Email invitation form
  - Role selection (Viewer/Editor)
  - Collaborator list with avatars
  - Remove/change role options
  - Permission info panel

### 2. **ChatPanel.jsx**
- **Location**: `components/collaboration/ChatPanel.jsx`
- **Features**:
  - Floating chat window (bottom-right)
  - Minimize/maximize controls
  - Real-time message sync
  - User identification
  - Timestamp display

### 3. **OnlineUsers.jsx**
- **Location**: `components/collaboration/OnlineUsers.jsx`
- **Features**:
  - Avatar stack (first 3 users)
  - Online count badge
  - Expandable user list
  - Role indicators
  - Cursor position tracking

---

## 🔧 **API FUNCTIONS ADDED:**

**File**: `lib/supabase/collaboration.js`

### Collaborator Management:
- `addCollaborator(sheetId, email, role)` - Invite user
- `getSheetCollaborators(sheetId)` - Get all collaborators
- `updateCollaboratorRole(id, role)` - Change permissions
- `removeCollaborator(id)` - Remove access

### Presence Tracking:
- `updatePresence(sheetId, isOnline, cursorPosition)` - Update status
- `getOnlineCollaborators(sheetId)` - Get active users
- `subscribeToCollaborators(sheetId, callback)` - Real-time updates

### Chat Functions:
- `sendChatMessage(sheetId, message)` - Send message
- `getChatMessages(sheetId, limit)` - Load history
- `subscribeToChatMessages(sheetId, callback)` - Real-time sync
- `deleteChatMessage(messageId)` - Delete message

### Permission System:
- `checkUserPermission(sheetId)` - Get user role
- `getSheetSettings(sheetId)` - Get sheet config
- `updateSheetSettings(sheetId, settings)` - Update config

---

## 📊 **DATABASE SCHEMA:**

### **sheet_collaborators** table:
```sql
- id (UUID)
- sheet_id (UUID) → sheets.id
- user_id (UUID) → auth.users.id
- role (TEXT) → 'owner', 'editor', 'viewer'
- invited_by (UUID)
- invited_at (TIMESTAMP)
- last_seen (TIMESTAMP)
- is_online (BOOLEAN)
- cursor_position (JSONB)
```

### **chat_messages** table:
```sql
- id (UUID)
- sheet_id (UUID)
- user_id (UUID)
- message (TEXT)
- created_at (TIMESTAMP)
- is_deleted (BOOLEAN)
```

### **sheet_settings** table:
```sql
- id (UUID)
- sheet_id (UUID)
- is_public (BOOLEAN)
- allow_comments (BOOLEAN)
- allow_chat (BOOLEAN)
- allow_voice (BOOLEAN)
```

---

## 🎯 **HOW TO USE (User Guide):**

### **For Sheet Owners:**

1. **Share Your Sheet:**
   - Click **"Share"** button
   - Enter collaborator's email
   - Choose **"Editor"** (can edit) or **"Viewer"** (read-only)
   - Click **"Invite"**

2. **Manage Collaborators:**
   - View all users with access
   - Change roles via dropdown
   - Remove users with **X** button

3. **Monitor Activity:**
   - See who's online
   - Check their cursor positions
   - View chat messages

### **For Collaborators:**

1. **Join a Sheet:**
   - Receive invite email (future: email notifications)
   - Login to account
   - Sheet appears in dashboard

2. **Work Together:**
   - See other users' cursors
   - Edit cells (if Editor)
   - Chat with team

3. **Use Chat:**
   - Click **"Chat"** or chat icon (bottom-right)
   - Type messages
   - See real-time responses

---

## 🚧 **KNOWN LIMITATIONS (Phase 2):**

❌ **Not Yet Implemented:**
- Email notifications for invites
- Voice chat (needs WebRTC)
- Collaborative cursors (showing other users' selections)
- Cell-level conflict resolution
- Version history
- Comments on cells

✅ **Working:**
- Real-time cell updates
- Text chat
- User presence
- Share/permissions
- Online indicators

---

## 🔮 **PHASE 3 ROADMAP (Voice Chat):**

For voice chat, we'll need:

1. **WebRTC Integration:**
   - Peer-to-peer connections
   - Media stream handling
   - ICE servers (STUN/TURN)

2. **Libraries:**
   - `simple-peer` or `peerjs`
   - `mediasoup` (for group calls)

3. **UI Components:**
   - Mic on/off button
   - Speaker volume controls
   - Active speaker indicator
   - Call controls (mute all, etc.)

4. **Implementation Time:** ~2-3 days

---

## 🧪 **TESTING CHECKLIST:**

- [ ] Step 1: Run collaboration SQL
- [ ] Step 2: Enable Supabase Realtime
- [ ] Test 1: Share sheet with another email
- [ ] Test 2: See online users (2+ browsers)
- [ ] Test 3: Send chat messages
- [ ] Test 4: Edit cells simultaneously
- [ ] Test 5: Change collaborator roles
- [ ] Test 6: Remove collaborator
- [ ] Test 7: Verify viewer can't edit

---

## 📞 **SUPPORT:**

If something doesn't work:

1. **Check Supabase logs**:
   - Go to Database → Logs
   - Look for errors

2. **Check browser console**:
   - F12 → Console tab
   - Look for red errors

3. **Common Issues**:
   - **"User not found"**: They need to sign up first
   - **"Permission denied"**: Check RLS policies
   - **"Realtime not working"**: Enable replication

---

## 🎉 **YOU NOW HAVE:**

✅ Multi-user collaboration  
✅ Real-time sync  
✅ Team chat  
✅ User presence  
✅ Permission system  
✅ Share functionality  

**Ready for your hackathon demo!** 🏆

---

**Next Steps:**
1. Run `supabase-collaboration.sql`
2. Enable Realtime
3. Test with 2+ accounts
4. Show off at hackathon! 🚀
