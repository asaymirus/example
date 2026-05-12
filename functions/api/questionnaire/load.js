/**
 * Load questionnaire progress from Google Sheets.
 *
 * GET /api/questionnaire/load?brandId=xxx
 */
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const brandId = url.searchParams.get('brandId');

    if (!brandId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: brandId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // In production, this would read from Google Sheets via the sheets client.
    // TODO: Integrate with sheets-client.ts when Google Sheets is configured.

    return new Response(
      JSON.stringify({
        brandId,
        responses: {},
        message: 'Google Sheets integration not yet configured. Using localStorage.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to load questionnaire responses' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
