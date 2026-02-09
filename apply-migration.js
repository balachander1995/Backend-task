import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL;

if (!url) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function migrate() {
    try {
        console.log("Applying migration: Add image_url column to tasks table...");

        // Check if column already exists to avoid error
        const columns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'image_url';
    `;

        if (columns.length > 0) {
            console.log("⚠️ Column 'image_url' already exists. Skipping.");
        } else {
            await sql`ALTER TABLE "tasks" ADD COLUMN "image_url" varchar(2048);`;
            console.log("✅ Successfully added 'image_url' column.");
        }

    } catch (error) {
        const err = /** @type {any} */ (error);
        console.error("❌ Migration failed:", err.message);
    } finally {
        await sql.end();
    }
}

migrate();
