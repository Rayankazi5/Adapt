import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import Database from "better-sqlite3"
import { trackingApiPlugin } from "./server/apiPlugin"

function sqliteApiPlugin(): Plugin {
    return {
        name: 'sqlite-api',
        configureServer(server) {
            let db: Database.Database | null = null;
            try {
                // Load the DB we just created
                db = new Database(path.resolve(__dirname, 'public/food_facts.sqlite'), { readonly: true });
                console.log("✅ Custom Barcode API loaded SQLite DB successfully.");
            } catch (err) {
                console.error("Failed to load SQLite DB. Assuming it's not created yet.", err);
            }

            // Mount custom middleware
            server.middlewares.use('/api/barcode', (req, res, next) => {
                const url = req.url || '/';
                const match = url.match(/^\/([^/?]+)/);
                if (match) {
                    const barcode = match[1];
                    if (db) {
                        try {
                            const stmt = db.prepare('SELECT name, brands, calories, protein, fat, carbs, vitamin_a, vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b6, vitamin_b9, vitamin_b12, vitamin_c, vitamin_d, vitamin_e, vitamin_k FROM food_products WHERE barcode = ?');
                            const row = stmt.get(barcode);
                            if (row) {
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ success: true, data: row }));
                                return;
                            } else {
                                res.setHeader('Content-Type', 'application/json');
                                res.statusCode = 404;
                                res.end(JSON.stringify({ success: false, error: 'Barcode not found' }));
                                return;
                            }
                        } catch (err) {
                            console.error(err);
                            res.setHeader('Content-Type', 'application/json');
                            res.statusCode = 500;
                            res.end(JSON.stringify({ success: false, error: 'Database error' }));
                            return;
                        }
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.statusCode = 503;
                        res.end(JSON.stringify({ success: false, error: 'Database not initialized' }));
                        return;
                    }
                }
                next();
            });
        }
    }
}

export default defineConfig({
    plugins: [react(), sqliteApiPlugin(), trackingApiPlugin()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
})
