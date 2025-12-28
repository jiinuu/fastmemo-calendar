/**
 * This script tests the /api/tags endpoint.
 * Run this while the Next.js server is running (e.g., npm run dev).
 */

async function testTagging() {
    const url = "http://localhost:3000/api/tags";

    const testCases = [
        {
            name: "Text only (YouTube link)",
            body: {
                text: "How to build a SaaS with Next.js in 2024",
                url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                title: "Building SaaS with Next.js",
            }
        },
        {
            name: "Text + Image (Coupang Product)",
            body: {
                text: "이거 살까 말까 고민중",
                url: "https://www.coupang.com/vp/products/12345",
                title: "Logitech MX Master 3S Wireless Mouse",
                image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" // 1x1 alpha pixel
            }
        }
    ];

    for (const tc of testCases) {
        console.log(`\n--- Testing: ${tc.name} ---`);
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tc.body)
            });
            const data = await res.json();
            console.log("Response Status:", res.status);
            console.log("Tags Received:", JSON.stringify(data.tags));
        } catch (err) {
            console.error("Error:", err.message);
        }
    }
}

testTagging();
