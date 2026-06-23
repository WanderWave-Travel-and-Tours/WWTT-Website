/**
 * Feedback spam / rate-limit test.
 *
 * Fires N feedback submissions at the API and tallies the responses so you can
 * confirm the feedbackLimiter (5 req / 10 min per IP) actually kicks in.
 *
 * Expected result with the limiter in place:
 *   - first 5 requests  -> 201 Created
 *   - the rest          -> 429 Too Many Requests
 *
 * Usage (from backend/):
 *   node scripts/spam-feedback-test.js                 # 20 reqs at http://localhost:5000
 *   node scripts/spam-feedback-test.js 50              # 50 reqs
 *   node scripts/spam-feedback-test.js 50 http://localhost:5000
 *
 * Requires Node 18+ (uses the built-in global fetch).
 */

const COUNT = Number(process.argv[2]) || 20;
const BASE_URL = (process.argv[3] || process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
const ENDPOINT = `${BASE_URL}/api/feedback`;

function makePayload(i) {
  return {
    category: 'bug',
    message: `Spam test message #${i} sent at ${new Date().toISOString()}`,
    name: `SpamBot-${i}`,
    rating: (i % 5) + 1,
    screenshot: null,
    technicalData: {
      url: 'http://localhost/test',
      browser: 'spam-feedback-test-script',
      screenSize: '0x0',
      timestamp: new Date().toISOString(),
      language: 'en',
      platform: 'node',
    },
  };
}

async function sendOne(i) {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makePayload(i)),
    });
    return { i, status: res.status };
  } catch (err) {
    return { i, status: 'ERR', error: err.message };
  }
}

(async () => {
  console.log(`\n🎯 Target : ${ENDPOINT}`);
  console.log(`📨 Sending: ${COUNT} feedback requests...\n`);

  // Fire sequentially so the order of 201 -> 429 is easy to read.
  const tally = {};
  for (let i = 1; i <= COUNT; i++) {
    const { status, error } = await sendOne(i);
    tally[status] = (tally[status] || 0) + 1;
    const label = status === 201 ? '✅' : status === 429 ? '⛔' : status === 400 ? '⚠️' : '❓';
    console.log(`  ${label} #${String(i).padStart(2, '0')} -> ${status}${error ? ' (' + error + ')' : ''}`);
  }

  console.log('\n── Summary ─────────────────────────');
  for (const [status, n] of Object.entries(tally)) {
    console.log(`  ${status}: ${n}`);
  }
  console.log('────────────────────────────────────');
  if (tally['429']) {
    console.log('✅ Rate limiter is WORKING — excess requests were blocked with 429.');
  } else {
    console.log('⚠️  No 429 responses seen. Either the limiter is off, the window/cap');
    console.log('    is higher than the request count, or you hit it from a fresh IP.');
  }
})();
