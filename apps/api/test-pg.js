const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://auditor:auditor123@postgres:5432/auditor_trade?schema=public'
});
async function main() {
    await client.connect();
    const res = await client.query('SELECT "tradeDate", symbol, quantity, pnl, "importId" FROM "Trade" ORDER BY "tradeDate" DESC LIMIT 5');
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}
main().catch(console.error);
