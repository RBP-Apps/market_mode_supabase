process.env.NODE_ENV = 'development'; // Ensure it bypasses the 1st of month check during testing

import handler from './api/sync-monthly-report.js';

const req = {
    headers: {}
};

const res = {
    status: (code) => ({
        json: (data) => console.log(`Status: ${code}`, JSON.stringify(data, null, 2))
    })
};

async function test() {
    try {
        console.log("Starting test for sync-monthly-report...");
        await handler(req, res);
    } catch (e) {
        console.error("Test failed with error:", e);
    }
}

test();
