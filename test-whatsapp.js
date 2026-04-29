// Using --env-file=.env

// Hardcoding the exact function URL based on your Supabase Project ID
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://tvmmtwnjewwuymtowzpv.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/monthly-whatsapp-sync`;

async function testEdgeFunction() {
    console.log("Testing Live Edge Function:", EDGE_FUNCTION_URL);
    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Test Error:", error);
    }
}

testEdgeFunction();
