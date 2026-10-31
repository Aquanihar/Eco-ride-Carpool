import { dbGetVerificationById } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return Response.json(
        { success: false, message: 'Verification ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const decodedId = decodeURIComponent(id);
    const record = await dbGetVerificationById(decodedId);

    if (!record) {
      return Response.json(
        { success: false, message: 'Verification record not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return Response.json(
      {
        success: true,
        verification: record,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error fetching verification on demand:', error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
