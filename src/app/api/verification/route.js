import { dbCreateDocumentVerification, dbGetVerificationByEmail, dbGetAllVerifications, dbUpdateVerificationStatus } from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, fullName, phone, idProofBase64, idProofName, drivingLicenseBase64, drivingLicenseName } = body;

    if (!email || !fullName) {
      return Response.json({ success: false, message: 'Email and Full Name are required.' }, { status: 400 });
    }

    if (!idProofBase64 || !drivingLicenseBase64) {
      return Response.json({
        success: false,
        message: 'Both Aadhaar/ID proof and Driving License documents must be uploaded.'
      }, { status: 400 });
    }

    const verificationRecord = await dbCreateDocumentVerification({
      email,
      fullName,
      phone,
      idProofBase64,
      idProofName,
      drivingLicenseBase64,
      drivingLicenseName,
    });

    return Response.json({
      success: true,
      message: 'Documents submitted successfully. Verification status is pending backend review.',
      verification: verificationRecord,
    });
  } catch (error) {
    console.error('Error submitting documents:', error);
    return Response.json({ success: false, message: error.message || 'Failed to submit documents.' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (email) {
      const record = await dbGetVerificationByEmail(email);
      return Response.json({
        success: true,
        verification: record || { status: 'NOT_SUBMITTED' },
      });
    }

    const allRecords = await dbGetAllVerifications();
    return Response.json({
      success: true,
      verifications: allRecords,
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
