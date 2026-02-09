import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL;

if (!url) {
    console.error("❌ DATABASE_URL is not set in .env");
    process.exit(1);
}

// Mask password for safety in logs
const safeUrl = url.replace(/:([^:@]+)@/, ':****@');
console.log(`Testing connection to: ${safeUrl}`);

const sql = postgres(url, { max: 1, connect_timeout: 5 });

async function test() {
    try {
        console.log("Attempting to select 1 from database...");
        const result = await sql`SELECT 1 as result`;
        console.log("✅ Connection successful!");
        console.log("Result:", result);

        // Check for tasks table and image_url column
        try {
            console.log("Checking for 'image_url' column in 'tasks' table...");
            const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'image_url';
        `;
            if (columns.length > 0) {
                console.log("✅ 'image_url' column exists.");
            } else {
                console.error("❌ 'image_url' column is MISSING.");
            }
        } catch (err) {
            console.error("Failed to check schema:", err.message);
        }

    } catch (error) {
        console.error("❌ Connection failed:");
        console.error(error.message);
        if (error.code) console.error(`Error code: ${error.code}`);
        if (error.address) console.error(`Address: ${error.address}:${error.port}`);
    } finally {
        await sql.end();
    }
}

test();
