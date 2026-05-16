export async function onRequestGet(context) {
    const db = context.env.DB;
    if (!db) {
        console.error('D1 database binding "DB" not found. Please check your Cloudflare Pages settings.');
        return new Response('D1 database binding "DB" not found', { status: 500 });
    }

    try {
        const results = await db.prepare("SELECT option_name, count FROM kaitou_ch_vote").all();
        
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
        console.error('Error in GET /api:', e.message);
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
        console.error('D1 database binding "DB" not found. Please check your Cloudflare Pages settings.');
        return new Response('D1 database binding "DB" not found', { status: 500 });
    }

    try {
        const body = await context.request.json();
        const option = body.option;
        if (!option || !['Yes', 'No'].includes(option)) {
            return new Response('Bad Request: Invalid option', { status: 400 });
        }

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
        console.error('Error in POST /api:', e.message);
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
