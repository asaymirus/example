/**
 * Brand management API.
 *
 * GET  /api/brands       - List all brands for the authenticated user
 * POST /api/brands       - Create a new brand
 */

export async function onRequestGet(context) {
  const { env } = context;

  // TODO: Authenticate user and fetch their brands from Google Sheets.
  return new Response(
    JSON.stringify({ brands: [], message: 'Google Sheets integration not yet configured.' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { brandName, ownerEmail } = body;

    if (!brandName || !ownerEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: brandName, ownerEmail' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const slug = brandName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const brandId = `brand_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    // TODO: Save to Google Sheets via sheets-client.
    const brand = {
      brandId,
      brandName,
      slug,
      ownerEmail,
      createdAt: new Date().toISOString(),
      status: 'draft',
      phaseCompleted: 0,
    };

    return new Response(JSON.stringify({ brand }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create brand' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
