# Image Upload & Storage - Deployment Checklist

## Pre-Deployment

- [x] Database schema updated with imageUrl field
- [x] Migration file created (0002_add_image_url.sql)
- [x] Environment variables configured in env.js
- [x] Supabase storage helper created (src/lib/storage.ts)
- [x] Upload API endpoint created
- [x] Image upload component created
- [x] Task router updated for imageUrl
- [x] Tasks page UI updated with image support
- [x] TypeScript compilation passes (no errors)
- [x] Documentation created

## Supabase Setup Required

Before deploying, you must:

### Step 1: Create Storage Bucket
```
1. Go to Supabase Dashboard
2. Navigate to Storage
3. Click "Create Bucket"
4. Name: task-images
5. Set to Public ✓
6. Create
7. Inside bucket, create folder "task-images"
```

### Step 2: Verify Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL = "https://eugjbxizynzocduenaku.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
✅ Both are already in .env file

## Deployment Steps

### Step 1: Run Database Migration
```bash
npm run db:migrate
# or
pnpm db:migrate
```
This adds the imageUrl column to the tasks table.

### Step 2: Restart Development Server
```bash
npm run dev
# or
pnpm dev
```

### Step 3: Verify Installation
- [ ] Navigate to Tasks page
- [ ] Try creating a task with an image
- [ ] Verify image displays as thumbnail
- [ ] Click thumbnail to view full size
- [ ] Edit task and change image
- [ ] Verify image persists after refresh

## Production Deployment

### Environment Setup
1. Set NEXT_PUBLIC_SUPABASE_URL in production environment
2. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in production environment
3. Ensure Supabase bucket "task-images" exists in production
4. Run migrations on production database

### Testing
- [ ] Upload various image formats (JPEG, PNG, WebP)
- [ ] Test file size limit (try 6MB file - should fail)
- [ ] Test invalid formats (try PDF - should fail)
- [ ] Test concurrent uploads
- [ ] Test on different browsers
- [ ] Test mobile file upload
- [ ] Verify images persist in database
- [ ] Verify image URLs are publicly accessible

## Files Modified/Created

### Created Files (8 files)
```
✓ src/lib/storage.ts
✓ src/app/api/tasks/upload-image/route.ts
✓ src/app/_components/image-upload.tsx
✓ drizzle/0002_add_image_url.sql
✓ IMAGE_UPLOAD_IMPLEMENTATION.md
✓ IMAGE_UPLOAD_SUMMARY.md
✓ IMAGE_UPLOAD_QUICK_REFERENCE.md
✓ IMAGE_UPLOAD_DEPLOYMENT.md (this file)
```

### Modified Files (4 files)
```
✓ src/server/db/schema.ts (added imageUrl field)
✓ src/server/api/routers/task.ts (updated createTask & updateTask)
✓ src/env.js (added Supabase variables)
✓ src/app/tasks/page.tsx (added image upload UI)
```

## Configuration Summary

### Supabase Bucket Configuration
```
Bucket Name: task-images
Access Level: Public
Storage Path: task-images/{taskId}-{timestamp}.{ext}
Max File Size: 5MB (enforced in code)
Allowed Types: JPEG, PNG, WebP
```

### Database Schema
```sql
TABLE: tasks
NEW COLUMN: image_url VARCHAR(2048) NULL
TYPE: Optional - backward compatible
```

### Environment Variables
```javascript
NEXT_PUBLIC_SUPABASE_URL: string (URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY: string
```

## Rollback Plan

If issues occur:

### To Disable Image Upload
1. Comment out ImageUpload component in src/app/tasks/page.tsx
2. Remove upload logic from task creation
3. Images won't be uploaded, but existing ones remain accessible

### To Remove From Database
```bash
# Create reverse migration
npm run db:generate

# Or manually:
ALTER TABLE "tasks" DROP COLUMN "image_url";
```

### To Delete Supabase Bucket
1. Delete all contents in bucket
2. Delete bucket "task-images"
3. No data loss to database (URLs just won't work)

## Monitoring & Maintenance

### Regular Checks
- [ ] Monitor Supabase storage usage
- [ ] Check for failed uploads (logs)
- [ ] Verify image URLs remain valid
- [ ] Monitor API endpoint response times

### Maintenance Tasks
- [ ] Clean up orphaned images (when tasks deleted)
- [ ] Archive old images if storage quota approached
- [ ] Monitor Supabase costs

## Known Limitations

1. ⚠️ Images are public (by design)
2. ⚠️ No automatic cleanup when tasks deleted (future enhancement)
3. ⚠️ No image compression (future enhancement)
4. ⚠️ Single image per task (could support multiple)

## Future Enhancements

- [ ] Image compression before upload
- [ ] Automatic image deletion with task
- [ ] Multiple images per task
- [ ] Image gallery/carousel view
- [ ] Image editing/cropping UI
- [ ] Thumbnail generation
- [ ] Private image storage option
- [ ] Image metadata (dimensions, format, size)
- [ ] Image search/tagging
- [ ] Drag-and-drop upload

## Support & Documentation

### Key Resources
- [IMAGE_UPLOAD_IMPLEMENTATION.md](IMAGE_UPLOAD_IMPLEMENTATION.md) - Technical details
- [IMAGE_UPLOAD_SUMMARY.md](IMAGE_UPLOAD_SUMMARY.md) - Overview
- [IMAGE_UPLOAD_QUICK_REFERENCE.md](IMAGE_UPLOAD_QUICK_REFERENCE.md) - Developer reference
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)

### Common Issues

**Q: Images won't upload**
```
A: Check Supabase bucket exists and is public
   Verify NEXT_PUBLIC_SUPABASE_URL in .env
   Check file is JPEG/PNG/WebP under 5MB
```

**Q: Images not displaying**
```
A: Verify imageUrl column exists in database
   Check image URL is publicly accessible
   Clear browser cache
```

**Q: Migration fails**
```
A: Verify PostgreSQL connection
   Run: npm run db:push (force)
   Check Supabase project status
```

## Sign-Off

- [x] Code implementation complete
- [x] TypeScript compilation passes
- [x] Documentation complete
- [x] Ready for testing
- [ ] Ready for production (after manual testing)

## Testing Completed By

**Name**: ___________________  
**Date**: ___________________  
**Sign-off**: ___________________  

## Deployment Log

**Deployment Date**: ___________________  
**Deployed By**: ___________________  
**Environment**: ___________________  
**Notes**: ___________________  

---

**Last Updated**: 2026-02-07  
**Implementation Version**: 1.0  
**Status**: Ready for Deployment ✅
