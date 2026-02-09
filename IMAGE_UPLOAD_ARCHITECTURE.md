# Image Upload Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Tasks Page (src/app/tasks/page.tsx)       │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │       Create Task Section                       │ │   │
│  │  │  ┌──────────────────────────────────────────┐  │ │   │
│  │  │  │ ImageUpload Component (image-upload.tsx)│  │ │   │
│  │  │  │  - File input (JPEG/PNG/WebP)           │  │ │   │
│  │  │  │  - Client-side validation                │  │ │   │
│  │  │  │  - Preview thumbnail                     │  │ │   │
│  │  │  │  - Upload status                         │  │ │   │
│  │  │  └──────────────────────────────────────────┘  │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │       Tasks Table                              │ │   │
│  │  │  ┌──────────────────────────────────────────┐  │ │   │
│  │  │  │ Image Column                            │  │ │   │
│  │  │  │ - Thumbnail display (64px)              │  │ │   │
│  │  │  │ - Click to full size                    │  │ │   │
│  │  │  │ - Edit: Add/Change Image button         │  │ │   │
│  │  │  └──────────────────────────────────────────┘  │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │
         │ FormData
         │ { file, taskId }
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│               API LAYER (Next.js Route Handlers)             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /api/tasks/upload-image                        │   │
│  │  (src/app/api/tasks/upload-image/route.ts)          │   │
│  │                                                       │   │
│  │  1. Authenticate user (validateRequest)             │   │
│  │  2. Extract file & taskId from FormData             │   │
│  │  3. Call uploadImageToStorage()                     │   │
│  │  4. Return { success, url, error }                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Storage Helper (src/lib/storage.ts)                │   │
│  │                                                       │   │
│  │  • validateImageFile()                              │   │
│  │    - Check MIME type (JPEG/PNG/WebP)               │   │
│  │    - Check file size (≤ 5MB)                       │   │
│  │                                                       │   │
│  │  • uploadImageToStorage()                           │   │
│  │    - Generate unique filename                       │   │
│  │    - Upload to Supabase Storage                    │   │
│  │    - Get public URL                                │   │
│  │                                                       │   │
│  │  • deleteImageFromStorage()                         │   │
│  │    - Remove from Supabase Storage                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │
         │ Supabase JS SDK
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│           CLOUD STORAGE (Supabase Storage)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Bucket: "task-images"                                      │
│  ├── task-images/                                           │
│  │   ├── {taskId}-{timestamp}.jpg                          │
│  │   ├── {taskId}-{timestamp}.png                          │
│  │   └── {taskId}-{timestamp}.webp                         │
│  │                                                           │
│  Public URL: https://{project}.supabase.co/storage/...     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │
         │ Image URL
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│               DATABASE (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Table: tasks                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │ id (UUID)         │ Primary Key                │         │
│  │ title (VARCHAR)   │ Task title                 │         │
│  │ description       │ Task details               │         │
│  │ status (ENUM)     │ pending/in-progress/done   │         │
│  │ priority (ENUM)   │ low/medium/high            │         │
│  │ imageUrl (VARCHAR)│ ← NEW: Supabase URL        │         │
│  │ userId (UUID)     │ Foreign Key -> users       │         │
│  │ createdAt         │ Timestamp                  │         │
│  └────────────────────────────────────────────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Upload Flow
```
User selects image
        ↓
[ImageUpload Component]
        ↓
Client validates file
├─ Check MIME type (JPEG/PNG/WebP) ✓
├─ Check file size (≤ 5MB) ✓
└─ Show preview
        ↓
Submit to /api/tasks/upload-image
        ↓
[Upload API Endpoint]
        ↓
Authenticate (Lucia session) ✓
        ↓
[Storage Helper - uploadImageToStorage()]
        ↓
Call Supabase Storage SDK
        ↓
Generate unique filename
└─ {taskId}-{Date.now()}.{ext}
        ↓
Upload file to bucket
└─ task-images/{filename}
        ↓
Get public URL
        ↓
Return { success: true, url: "https://..." }
        ↓
[Frontend]
├─ Store URL in state
├─ Send with task creation/update
└─ Display thumbnail
```

### Create Task Flow
```
User fills form + uploads image
        ↓
[Create Task Section]
├─ title
├─ description
├─ status
├─ priority
└─ imageUrl (from upload)
        ↓
Submit POST /api/tasks/create
        ↓
[Task Router - createTask()]
        ↓
Validate input (Zod schema)
        ↓
Insert into database
├─ id (generated UUID)
├─ title, description
├─ status, priority
├─ imageUrl ← Stored
├─ userId (from context)
└─ createdAt (current time)
        ↓
Return created task
        ↓
[Frontend]
├─ Clear form
├─ Show success message
└─ Fetch updated task list
```

### Display Flow
```
Task loaded from database
        ↓
Task has imageUrl? 
├─ YES → Show thumbnail
│         ├─ Source: imageUrl
│         ├─ Size: max-width: 64px
│         └─ Click: Open full image
│
└─ NO → Show "No image" placeholder
```

## Component Hierarchy

```
TasksPage
├── Header
├── MessageDisplay
├── CreateTaskSection
│   ├── TaskForm
│   │   ├── TitleInput
│   │   ├── DescriptionInput
│   │   ├── StatusSelect
│   │   └── PrioritySelect
│   ├── ImageUploadSection ← NEW
│   │   └── ImageUpload (Component)
│   │       ├── FileInput
│   │       ├── PreviewImage
│   │       └── ValidationErrors
│   └── CreateButton
├── FilterSection
│   ├── SearchInputs
│   └── FilterSelects
└── TasksTableSection
    └── TasksTable
        └── TaskRow (multiple)
            ├── ImageColumn ← NEW
            │   ├── ThumbnailDisplay
            │   └── ImageActions
            ├── TitleColumn
            ├── DescriptionColumn
            ├── StatusColumn
            ├── PriorityColumn
            ├── CreatedColumn
            └── ActionsColumn
                ├── EditButton
                └── DeleteButton
```

## API Endpoints

```
┌──────────────────────────────────────────────┐
│ Endpoint: POST /api/tasks/upload-image       │
├──────────────────────────────────────────────┤
│ Auth: Required (Lucia session)               │
│ Content-Type: multipart/form-data            │
│                                               │
│ Request:                                     │
│ ├─ file: File (binary)                       │
│ └─ taskId: string (UUID)                     │
│                                               │
│ Response (200 OK):                           │
│ {                                            │
│   "success": true,                           │
│   "url": "https://...publicUrl"              │
│ }                                            │
│                                               │
│ Response (400 Bad Request):                  │
│ {                                            │
│   "error": "File size exceeds 5MB limit"     │
│ }                                            │
│                                               │
│ Response (401 Unauthorized):                 │
│ {                                            │
│   "error": "Unauthorized"                    │
│ }                                            │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Endpoint: POST /api/tasks/create             │
│ (Updated to support imageUrl)                │
├──────────────────────────────────────────────┤
│ Auth: Required (Lucia session)               │
│ Content-Type: application/json               │
│                                               │
│ Request:                                     │
│ {                                            │
│   "title": "Task title",                     │
│   "description": "...",                      │
│   "status": "pending",                       │
│   "priority": "medium",                      │
│   "imageUrl": "https://..." (optional)       │
│ }                                            │
│                                               │
│ Response (200 OK):                           │
│ {                                            │
│   "id": "uuid",                              │
│   "title": "...",                            │
│   "imageUrl": "https://...",                 │
│   ...                                        │
│ }                                            │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Endpoint: PUT /api/tasks/{id}                │
│ (Updated to support imageUrl)                │
├──────────────────────────────────────────────┤
│ Auth: Required (Lucia session)               │
│ Content-Type: application/json               │
│                                               │
│ Request:                                     │
│ {                                            │
│   "title": "...",          (optional)        │
│   "description": "...",    (optional)        │
│   "status": "...",         (optional)        │
│   "priority": "...",       (optional)        │
│   "imageUrl": "https://..." (optional)       │
│ }                                            │
│                                               │
│ Response (200 OK): Updated task              │
│ Response (401 Unauthorized): Not auth        │
│ Response (403 Forbidden): Not owner          │
│ Response (404 Not Found): Task not found     │
└──────────────────────────────────────────────┘
```

## State Management Flow

```
TasksPage (Parent Component)
│
├─ user: User | null
│  └─ Loaded from localStorage
│
├─ tasks: Task[]
│  ├─ Fetched from /api/tasks/list
│  └─ Refetched after mutations
│
├─ taskImageUrl: string | null ← NEW
│  ├─ Set by ImageUpload.onUploadSuccess
│  └─ Sent with createTask
│
├─ editingId: string | null
│  └─ Shows which task is in edit mode
│
├─ showImageUpload: string | null ← NEW
│  ├─ Shows ImageUpload for task edit
│  └─ taskId value when active
│
└─ message: string
   └─ Status messages (success/error)
```

## Database Schema Modifications

```sql
-- Before
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- After
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  image_url VARCHAR(2048),  -- ← ADDED
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Error Handling Flow

```
Upload Attempt
│
├─ File Validation
│  ├─ MIME Type Check
│  │  └─ Invalid? → "Only JPEG, PNG, WebP allowed"
│  │
│  └─ Size Check
│     └─ >5MB? → "File size exceeds 5MB limit"
│
├─ API Request
│  ├─ No Auth? → 401 "Unauthorized"
│  ├─ No File? → 400 "No file provided"
│  ├─ Upload Fails? → 400 "Upload failed: {reason}"
│  └─ Server Error? → 500 "Failed to upload image"
│
└─ Success
   └─ Return URL & show image
```

## Performance Considerations

```
File Upload Performance:
├─ Client-side validation: <1ms
├─ Network transfer: Depends on file size
│  └─ 5MB at 10Mbps ≈ 4 seconds
├─ Supabase processing: <1 second
└─ Total: ~5 seconds for 5MB file

Database:
├─ imageUrl field: VARCHAR(2048)
├─ Index: Not indexed (accessed via task ID)
├─ Storage: ~2KB per URL
└─ No performance impact

Rendering:
├─ Thumbnail display: <16ms (native img)
├─ Click to expand: Instant (new tab)
└─ Table reflow: Minimal (column sized)
```

---

**Architecture Version**: 1.0  
**Last Updated**: 2026-02-07  
**Compliance**: Production Ready ✅
