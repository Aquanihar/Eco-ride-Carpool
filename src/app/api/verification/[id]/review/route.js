import { dbUpdateVerificationStatus } from '@/lib/db';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, adminNotes } = body;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return Response.json({
        success: false,
        message: 'Invalid action. Must be APPROVE or REJECT.',
      }, { status: 400 });
    }

    const updated = await dbUpdateVerificationStatus(id, action, adminNotes);

    if (!updated) {
      return Response.json({ success: false, message: 'Verification record not found.' }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: action === 'APPROVE' ? 'Document verified and approved successfully!' : 'Document rejected.',
      verification: updated,
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
