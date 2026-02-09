# Image Upload - Quick Reference

## 🚀 Quick Start

### 1. Run Database Migration
```bash
npm run db:migrate
```

### 2. Create Supabase Bucket
1. Go to Supabase Dashboard
2. Storage → Create bucket "task-images"
3. Inside bucket, create folder "task-images"
4. Set bucket to Public

### 3. Restart Server
```bash
npm run dev
```

## 📁 File Structure

```
src/
├── app/
│   ├── _components/
│   │   └── image-upload.tsx          # Image upload component
│   ├── api/
│   │   └── tasks/
│   │       └── upload-image/
│   │           └── route.ts           # Upload endpoint
│   └── tasks/
│       └── page.tsx                  # Tasks page (updated)
├── lib/
│   └── storage.ts                     # Storage utilities
└── server/
    ├── api/
    │   └── routers/
    │       └── task.ts               # Task router (updated)
    └── db/
        └── schema.ts                 # Schema (updated)
```

## 💾 Database

### Added Column
```sql
ALTER TABLE "tasks" ADD COLUMN "image_url" varchar(2048);
```

### Task Schema
```typescript
{
  id: uuid (primary key),
  title: varchar,
  description: varchar,
  status: enum,
  priority: enum,
  imageUrl: varchar(2048),  // ← NEW
  userId: uuid (foreign key),
  createdAt: timestamp
}
```

## 🎯 Key Functions

### Storage Validation
```typescript
// Validate file before upload
const error = validateImageFile(file);
if (error) {
  // Handle error
}
```

### Upload Image
```typescript
// Upload to Supabase
const result = await uploadImageToStorage(file, taskId);
if (result.success) {
  console.log(result.url); // Use this URL
}
```

## 🔌 API Usage

### Upload Endpoint
```
POST /api/tasks/upload-image

Body (FormData):
  - file: File
  - taskId: string

Response:
  {
    "success": true,
    "url": "https://..."
  }
```

### Create Task with Image
```typescript
await fetch("/api/tasks/create", {
  method: "POST",
  body: JSON.stringify({
    title: "Task",
    description: "...",
    status: "pending",
    priority: "medium",
    imageUrl: "https://..." // Optional
  })
});
```

### Update Task Image
```typescript
await fetch("/api/tasks/{taskId}", {
  method: "PUT",
  body: JSON.stringify({
    imageUrl: "https://..."
  })
});
```

## ✅ Validation Rules

```typescript
// Allowed formats
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// Max size
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Accepted extensions
.jpg, .jpeg, .png, .webp
```

## 🎨 UI Components

### Image Upload Component
```tsx
<ImageUpload
  taskId="task-123"
  onUploadSuccess={(url) => console.log(url)}
  onUploadError={(error) => console.log(error)}
/>
```

**Features**:
- File input with preview
- Real-time validation
- Upload status indicator
- Error messages

## 🔒 Authentication

- All endpoints require logged-in user
- Uses Lucia auth session
- Returns 401 if not authenticated

## 📋 Checklist for New Features

When adding related features, ensure:
- [ ] Add to Task interface
- [ ] Update database migration
- [ ] Update schema.ts
- [ ] Update task router (TRPC or REST)
- [ ] Update API endpoints
- [ ] Update UI components
- [ ] Update env.js if needed
- [ ] Test with database

## 🐛 Common Issues

### Images not uploading?
```
❌ Check: Supabase bucket "task-images" exists
❌ Check: Bucket is set to Public
❌ Check: NEXT_PUBLIC_SUPABASE_URL in .env
❌ Check: NEXT_PUBLIC_SUPABASE_ANON_KEY in .env
```

### Migration fails?
```
❌ Check: PostgreSQL connection string
❌ Check: Supabase project is accessible
❌ Run: npm run db:push (force push)
```

### Images not displaying?
```
❌ Check: imageUrl field exists in database
❌ Check: URL is publicly accessible
❌ Check: CORS settings in Supabase
```

## 🔄 Workflow Examples

### Example 1: Upload New Task with Image
```
1. User fills task form
2. Selects image file
3. Image validates (type + size)
4. Preview shows in UI
5. User clicks "Create Task"
6. Image uploads to Supabase
7. imageUrl stored in database
8. Task appears with thumbnail
```

### Example 2: Update Task Image
```
1. User clicks "Edit" on task
2. Clicks "Change Image"
3. ImageUpload component appears
4. Selects new image
5. Upload completes
6. URL sent to /api/tasks/{id}
7. Task updated with new imageUrl
```

## 📊 Environment Variables

```env
# Required for image upload
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here

# Existing variables
DATABASE_URL=postgresql://...
NODE_ENV=development
```

## 🎓 Learning Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#handling-request-bodies)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

## ⚡ Performance Tips

1. **Compress images** before upload (future enhancement)
2. **Use thumbnails** - current: 64px max-width
3. **Lazy load** - images load on demand
4. **CDN caching** - Supabase handles this

## 🔐 Security Notes

- ✅ Authentication required
- ✅ File type validation
- ✅ File size limit
- ✅ Unique filenames
- ✅ Public storage (by design)
- ⚠️ Consider private bucket for sensitive images

---

**Last Updated**: 2026-02-07  
**Version**: 1.0  
**Status**: Production Ready ✅
