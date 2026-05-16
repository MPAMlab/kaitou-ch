export async function onRequestGet(context) {
    const db = context.env.DB;
    if (!db) {
        return new Response('D1 database binding "DB" not found', { status: 500 });
    }

    try {
        // We'll use a table named 'kaitou_ch_vote' with 'option_name' and 'count' columns
        const results = await db.prepare("SELECT option_name, count FROM kaitou_ch_vote").all();
        
        // Transform array results into the expected object format: { Yes: X, No: Y }
        const data = { Yes: 0, No: 0 };
        results.results.forEach(row => {
            if (row.option_name === 'Yes' || row.option_name === 'No') {
                data[row.option_name] = row.count;
            }
        });

        return new Response(JSON.stringify(data), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (e) {
        // If the table doesn't exist yet, we'll return initialized zeros
        if (e.message.includes('no such table')) {
            return new Response(JSON.stringify({ Yes: 0, No: 0 }), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        return new Response(`Error fetching data: ${e.message}`, { status: 500 });
    }
}

export async function onRequestPost(context) {
    const db = context.env.DB;
    if (!db) {
        return new Response('D1 database binding "DB" not found', { status: 500 });
    }

    try {
        const body = await context.request.json();
        const option = body.option;
        if (!option || !['Yes', 'No'].includes(option)) {
            return new Response('Bad Request: Invalid option', { status: 400 });
        }

        // Use UPSERT logic (atomic increment)
        // This query increments the count if the option exists, or inserts it with count 1 if it doesn't.
        await db.prepare(`
            INSERT INTO kaitou_ch_vote (option_name, count) 
            VALUES (?, 1) 
            ON CONFLICT(option_name) DO UPDATE SET count = count + 1
        `).bind(option).run();

        return new Response('Vote Count Updated', { 
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (e) {
        return new Response(`Error updating vote: ${e.message}`, { status: 500 });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
