# Image Upload & Storage Implementation

## Overview
Complete implementation of image upload and storage functionality using Supabase Storage for the task management application.

## Features Implemented

### ✅ File Upload to Cloud Storage
- Uses **Supabase Storage** for reliable cloud-based image hosting
- Auto-generated unique filenames with timestamps to prevent conflicts
- Public URL generation for direct access

### ✅ Database Integration
- New `imageUrl` field added to tasks table (varchar 2048)
- Stores image URLs linked to respective tasks
- Optional field - tasks can exist without images

### ✅ Image Display
- Task list shows thumbnail images (max-width: 64px)
- Clickable images open in new tab at full size
- Displays "No image" placeholder for tasks without images

### ✅ Validation & Restrictions
- **Allowed formats**: JPEG, PNG, WebP
- **Max file size**: 5MB
- Client-side validation with helpful error messages
- Server-side validation for security

## Components Created

### 1. **Database Schema** ([src/server/db/schema.ts](src/server/db/schema.ts))
```typescript
imageUrl: varchar("image_url", { length: 2048 })
```
- Added imageUrl column to tasks table
- Nullable field for backward compatibility

### 2. **Database Migration** ([drizzle/0002_add_image_url.sql](drizzle/0002_add_image_url.sql))
```sql
ALTER TABLE "tasks" ADD COLUMN "image_url" varchar(2048);
```

### 3. **Storage Helper** ([src/lib/storage.ts](src/lib/storage.ts))
Key functions:
- `validateImageFile()` - Validates file type and size
- `uploadImageToStorage()` - Uploads file to Supabase bucket
- `deleteImageFromStorage()` - Removes image from storage

**Configuration**:
- Bucket: `task-images`
- Max file size: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp
- Storage path: `task-images/{taskId}-{timestamp}.{ext}`

### 4. **API Endpoint** ([src/app/api/tasks/upload-image/route.ts](src/app/api/tasks/upload-image/route.ts))
- **POST** `/api/tasks/upload-image`
- Requires authentication
- Accepts FormData with file and taskId
- Returns JSON response with image URL on success

### 5. **UI Component** ([src/app/_components/image-upload.tsx](src/app/_components/image-upload.tsx))
Features:
- File input with JPEG/PNG/WebP filter
- Real-time preview of selected image
- Upload status indicator
- Error messages for validation failures
- Disabled state during upload

### 6. **Task Router Updates** ([src/server/api/routers/task.ts](src/server/api/routers/task.ts))
Updated procedures:
- `createTask()` - Accepts optional imageUrl parameter
- `updateTask()` - Supports imageUrl updates

### 7. **Tasks Page** ([src/app/tasks/page.tsx](src/app/tasks/page.tsx))
Enhancements:
- Image upload component in create task form
- Image column in tasks table
- Edit mode: Add/Change image button
- View mode: Thumbnail display with click-to-enlarge
- Full image URL management lifecycle

## Environment Configuration

### Updated env.js
Added Supabase variables:
```javascript
server: {
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
}

client: {
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
}
```

### .env File
Ensure these variables are configured:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Setup Instructions

### 1. Create Supabase Storage Bucket
```bash
# In Supabase dashboard:
# 1. Go to Storage
# 2. Create new bucket named "task-images"
# 3. Set to Public (or configure policies)
# 4. Create folder "task-images" inside bucket
```

### 2. Run Database Migration
```bash
npm run db:migrate
# or
pnpm db:migrate
```

### 3. Restart Development Server
```bash
npm run dev
# or
pnpm dev
```

## Usage

### Creating Task with Image
1. Fill in task title, description, status, priority
2. Click "Upload Image" and select a JPEG/PNG/WebP file
3. Wait for upload confirmation
4. Click "Create Task" to save

### Updating Task Image
1. Click "Edit" on a task
2. Click "Add Image" or "Change Image" button
3. Select new image file
4. Click "Save" to update

### Viewing Images
- Thumbnails appear in task list
- Click image to open full size in new tab
- Supports direct URL access

## Validation Rules

### File Type Validation
```typescript
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
```

### File Size Validation
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

## Error Handling

All upload operations include:
- File validation with descriptive error messages
- HTTP status codes (400 for validation, 401 for auth, 500 for server errors)
- User-friendly error notifications
- Client-side file preview clearing on failure

## API Examples

### Upload Image
```bash
curl -X POST http://localhost:3000/api/tasks/upload-image \
  -H "Cookie: auth_session=..." \
  -F "file=@image.jpg" \
  -F "taskId=uuid-of-task"
```

**Response**:
```json
{
  "success": true,
  "url": "https://project.supabase.co/storage/v1/object/public/task-images/task-images/uuid-1704067200000.jpg"
}
```

### Create Task with Image
```bash
curl -X POST http://localhost:3000/api/tasks/create \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_session=..." \
  -d {
    "title": "My Task",
    "description": "Task description",
    "status": "pending",
    "priority": "medium",
    "imageUrl": "https://..."
  }
```

### Update Task Image
```bash
curl -X PUT http://localhost:3000/api/tasks/{taskId} \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_session=..." \
  -d {
    "imageUrl": "https://..."
  }
```

## Troubleshooting

### Image Upload Fails
- Check Supabase bucket exists and is public
- Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env
- Ensure file is valid JPEG/PNG/WebP under 5MB
- Check browser console for detailed error messages

### Images Not Displaying
- Verify image URL is public in Supabase
- Check CORS settings if needed
- Clear browser cache
- Ensure imageUrl field exists in database

### Database Errors
- Run migration: `npm run db:migrate`
- Verify PostgreSQL connection string
- Check Supabase project is accessible

## Security Considerations

1. **Authentication**: Only logged-in users can upload images
2. **File Type Validation**: Client and server-side checks
3. **File Size Limits**: 5MB max to prevent abuse
4. **Unique Filenames**: Prevents overwriting
5. **Public Storage**: Images are publicly accessible (by design)
6. **RBAC**: Users can only modify their own tasks

## Future Enhancements

- [ ] Image compression before upload
- [ ] Multiple images per task
- [ ] Image cropping/editing UI
- [ ] Thumbnail caching
- [ ] Image deletion when task is deleted
- [ ] Image gallery view
- [ ] Image search/filtering
- [ ] Drag-and-drop upload
