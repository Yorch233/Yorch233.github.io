import { resultsCsv } from '../../lib/cof-results.js';

export function GET() {
	return new Response(resultsCsv(), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
}
