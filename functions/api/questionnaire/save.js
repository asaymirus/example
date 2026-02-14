/**
 * Save questionnaire progress to Google Sheets.
 *
 * POST /api/questionnaire/save
 * Body: { brandId, phase, questionId, questionText, response }
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { brandId, phase, questionId, questionText, response } = body;

    if (!brandId || !questionId || response === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: brandId, questionId, response' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // In production, this would write to Google Sheets via the sheets client.
    // For now, return success to support the client-side flow.
    // TODO: Integrate with sheets-client.ts when Google Sheets is configured.

    return new Response(
      JSON.stringify({
        success: true,
        saved: { brandId, phase, questionId, updatedAt: new Date().toISOString() },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to save questionnaire response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
