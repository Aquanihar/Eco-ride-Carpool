'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  RefreshCw,
  ExternalLink,
  Mail,
  Phone,
  User,
  Calendar,
} from 'lucide-react';
import { AppProvider } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import styles from './admin.module.css';

function AdminContent() {
  const [verifications, setVerifications] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState({});
  const [adminNotes, setAdminNotes] = useState({});

  const getRowTimestamp = (r) => {
    if (!r) return 0;
    const tRev = r.driver?.reviewedAt ? new Date(r.driver.reviewedAt).getTime() : 0;
    const tSub = r.driver?.submittedAt ? new Date(r.driver.submittedAt).getTime() : 0;
    const idMatch = (r.id || '').match(/_(\d{13})$/);
    const tId = idMatch ? parseInt(idMatch[1], 10) : 0;
    const tCreated = r.created_at ? new Date(r.created_at).getTime() : 0;
    const tUpdated = r.updated_at ? new Date(r.updated_at).getTime() : 0;
    return Math.max(tRev, tSub, tId, tCreated, tUpdated);
  };

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const emailMap = new Map();

      // 1. Direct fetch from Supabase rides cloud table
      try {
        const { data: rideRows } = await supabase
          .from('rides')
          .select('*')
          .ilike('status', 'VERIFICATION_%');

        if (rideRows && rideRows.length > 0) {
          const groups = new Map();
          rideRows.forEach((r) => {
            if (r.driver && (r.driver.type === 'DOC_VERIFICATION' || r.driver.email)) {
              const userEmail = (r.driver.email || '').toLowerCase().trim();
              if (userEmail) {
                if (!groups.has(userEmail)) groups.set(userEmail, []);
                groups.get(userEmail).push(r);
              }
            }
          });

          groups.forEach((userRows, userEmail) => {
            userRows.sort((a, b) => getRowTimestamp(b) - getRowTimestamp(a));
            const latest = userRows[0];
            const photoRow = userRows.find(
              (r) => r.driver?.idProofBase64 || r.driver?.drivingLicenseBase64
            ) || latest;

            const status = latest.status === 'VERIFICATION_APPROVED' ? 'APPROVED'
              : latest.status === 'VERIFICATION_REJECTED' ? 'REJECTED'
              : (latest.driver?.status || 'PENDING');

            emailMap.set(userEmail, {
              ...photoRow.driver,
              ...latest.driver,
              id: latest.driver?.id || latest.id,
              status,
              rowId: latest.id,
              idProofBase64: photoRow.driver?.idProofBase64 || latest.driver?.idProofBase64 || '',
              idProofName: photoRow.driver?.idProofName || latest.driver?.idProofName || 'Identity Document',
              drivingLicenseBase64: photoRow.driver?.drivingLicenseBase64 || latest.driver?.drivingLicenseBase64 || '',
              drivingLicenseName: photoRow.driver?.drivingLicenseName || latest.driver?.drivingLicenseName || 'Driving License',
              submittedAt: photoRow.driver?.submittedAt || latest.driver?.submittedAt || new Date(getRowTimestamp(photoRow)).toISOString(),
              reviewedAt: latest.driver?.reviewedAt || (status !== 'PENDING' ? new Date(getRowTimestamp(latest)).toISOString() : null),
              adminNotes: latest.driver?.adminNotes || '',
            });
          });
        }
      } catch (err) {
        console.error('Supabase admin fetch error:', err);
      }

      // 2. Also merge from API route
      try {
        const res = await fetch('/api/verification');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.verifications && Array.isArray(data.verifications)) {
            data.verifications.forEach((v) => {
              if (v && v.email) {
                const normEmail = v.email.toLowerCase().trim();
                const existing = emailMap.get(normEmail);
                if (!existing) {
                  emailMap.set(normEmail, v);
                } else {
                  const vTime = new Date(v.reviewedAt || v.submittedAt || 0).getTime();
                  const eTime = new Date(existing.reviewedAt || existing.submittedAt || 0).getTime();
                  if (vTime > eTime) {
                    emailMap.set(normEmail, {
                      ...existing,
                      ...v,
                      idProofBase64: existing.idProofBase64 || v.idProofBase64 || '',
                      drivingLicenseBase64: existing.drivingLicenseBase64 || v.drivingLicenseBase64 || '',
                    });
                  }
                }
              }
            });
          }
        }
      } catch (e) {}

      const list = Array.from(emailMap.values());
      setVerifications(
        list.sort(
          (a, b) =>
            new Date(b.reviewedAt || b.submittedAt || 0) -
            new Date(a.reviewedAt || a.submittedAt || 0)
        )
      );
    } catch (err) {
      console.error('Failed to fetch verifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
    const interval = setInterval(fetchVerifications, 5000);
    return () => clearInterval(interval);
  }, [fetchVerifications]);

  const handleReview = async (id, action) => {
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const note = adminNotes[id] || (action === 'REJECT' ? 'Invalid documents. Try with original documents.' : 'Approved by admin review.');
    const now = new Date();
    const reviewedAt = now.toISOString();
    setActionInProgress((prev) => ({ ...prev, [id]: true }));

    const item = verifications.find((v) => v.id === id || v.email === id);
    const normEmail = (item?.email || id).toLowerCase().trim();
    const updateId = `doc_${normEmail.replace(/[^a-z0-9]/g, '_')}_${now.getTime()}`;

    // Optimistically update UI
    setVerifications((prev) =>
      prev.map((v) =>
        v.id === id || v.email?.toLowerCase().trim() === normEmail
          ? { ...v, status, adminNotes: note, reviewedAt }
          : v
      )
    );

    try {
      const updatedDriver = {
        ...(item || {}),
        id: updateId,
        status,
        adminNotes: note,
        reviewedAt,
        idProofBase64: item?.idProofBase64 || '',
        idProofName: item?.idProofName || '',
        drivingLicenseBase64: item?.drivingLicenseBase64 || '',
        drivingLicenseName: item?.drivingLicenseName || '',
      };

      // 1. Direct write to Supabase
      try {
        await supabase.from('rides').insert([
          {
            id: updateId,
            driver: {
              type: 'DOC_VERIFICATION',
              ...updatedDriver,
            },
            status: action === 'APPROVE' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
          },
        ]);
      } catch (sbErr) {
        console.error('Supabase admin review insert error:', sbErr);
      }

      // 2. Also call API route
      try {
        await fetch(`/api/verification/${encodeURIComponent(id)}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, adminNotes: note }),
        });
      } catch (e) {}

      // Refresh to confirm live state from database
      await fetchVerifications();
    } catch (err) {
      console.error('Error updating review:', err);
      alert('Error updating review status.');
    } finally {
      setActionInProgress((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filteredVerifications = verifications.filter((v) => {
    if (filter === 'ALL') return true;
    return v.status === filter;
  });

  const pendingCount = verifications.filter((v) => v.status === 'PENDING').length;
  const approvedCount = verifications.filter((v) => v.status === 'APPROVED').length;
  const rejectedCount = verifications.filter((v) => v.status === 'REJECTED').length;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1>
              <ShieldCheck size={28} color="#10b981" /> Document Verification Portal
            </h1>
            <p className={styles.subtitle}>
              Review official Aadhaar Cards & Driving Licenses submitted by users. Approve or reject with original document validation.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.refreshBtn} onClick={fetchVerifications} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Submitted</span>
            <span className={styles.statNumber}>{verifications.length}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Awaiting Verification</span>
            <span className={`${styles.statNumber} ${styles.pendingStat}`}>{pendingCount}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Approved Documents</span>
            <span className={`${styles.statNumber} ${styles.approvedStat}`}>{approvedCount}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Rejected Documents</span>
            <span className={`${styles.statNumber} ${styles.rejectedStat}`}>{rejectedCount}</span>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${filter === 'ALL' ? styles.activeTab : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All Submissions ({verifications.length})
          </button>
          <button
            className={`${styles.tabBtn} ${filter === 'PENDING' ? styles.activeTab : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            className={`${styles.tabBtn} ${filter === 'APPROVED' ? styles.activeTab : ''}`}
            onClick={() => setFilter('APPROVED')}
          >
            Approved ({approvedCount})
          </button>
          <button
            className={`${styles.tabBtn} ${filter === 'REJECTED' ? styles.activeTab : ''}`}
            onClick={() => setFilter('REJECTED')}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Records */}
        {filteredVerifications.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No document submissions found</h3>
            <p>
              {filter === 'ALL'
                ? 'No users have uploaded Aadhaar or Driving License documents yet.'
                : `No submissions with status ${filter}.`}
            </p>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {filteredVerifications.map((item) => {
              const isWorking = actionInProgress[item.id];
              return (
                <div key={item.id} className={styles.verifCard}>
                  <div className={styles.cardTop}>
                    <div className={styles.userMeta}>
                      <h2>{item.fullName}</h2>
                      <div className={styles.metaRow}>
                        <span>
                          <Mail size={15} /> {item.email}
                        </span>
                        {item.phone && (
                          <span>
                            <Phone size={15} /> {item.phone}
                          </span>
                        )}
                        <span>
                          <Calendar size={15} />{' '}
                          {new Date(item.submittedAt).toLocaleDateString()} {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className={styles.statusBadgeArea}>
                      {item.status === 'PENDING' && (
                        <span className={`${styles.badge} ${styles.badgePending}`}>
                          <Clock size={14} /> Pending Review
                        </span>
                      )}
                      {item.status === 'APPROVED' && (
                        <span className={`${styles.badge} ${styles.badgeApproved}`}>
                          <CheckCircle size={14} /> Verified & Allowed
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className={`${styles.badge} ${styles.badgeRejected}`}>
                          <XCircle size={14} /> Invalid / Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className={styles.docsSection}>
                    {/* Aadhar Proof */}
                    <div className={styles.docColumn}>
                      <div className={styles.docHeader}>
                        <FileText size={18} color="#0284c7" />
                        <span>Aadhaar / Identity Proof Document</span>
                      </div>
                      <div className={styles.previewBox}>
                        {item.idProofBase64 && (item.idProofBase64.startsWith('data:image/') || item.idProofBase64.startsWith('http') || /\.(png|jpe?g|webp|gif)$/i.test(item.idProofName)) ? (
                          <img
                            src={item.idProofBase64.startsWith('data:') || item.idProofBase64.startsWith('http') ? item.idProofBase64 : `data:image/jpeg;base64,${item.idProofBase64}`}
                            alt="Aadhaar ID Proof"
                            className={styles.docImage}
                            onClick={() => {
                              const src = item.idProofBase64.startsWith('data:') || item.idProofBase64.startsWith('http') ? item.idProofBase64 : `data:image/jpeg;base64,${item.idProofBase64}`;
                              window.open(src, '_blank');
                            }}
                            title="Click to view full size"
                          />
                        ) : item.idProofBase64 ? (
                          <div className={styles.pdfFallback}>
                            <FileText size={42} color="#0284c7" />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>PDF Document</span>
                            <a
                              href={item.idProofBase64}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.viewBtn}
                            >
                              <ExternalLink size={14} /> Open & View Document
                            </a>
                          </div>
                        ) : (
                          <div className={styles.pdfFallback}>
                            <FileText size={36} color="#94a3b8" />
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No document uploaded</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.docFooterRow}>
                        <span className={styles.docFooter}>{item.idProofName}</span>
                        {item.idProofBase64 && (
                          <a
                            href={item.idProofBase64.startsWith('data:') || item.idProofBase64.startsWith('http') ? item.idProofBase64 : `data:image/jpeg;base64,${item.idProofBase64}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.smallOpenLink}
                          >
                            <ExternalLink size={12} /> View Full
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Driving License */}
                    <div className={styles.docColumn}>
                      <div className={styles.docHeader}>
                        <FileText size={18} color="#10b981" />
                        <span>Driving License Document</span>
                      </div>
                      <div className={styles.previewBox}>
                        {item.drivingLicenseBase64 && (item.drivingLicenseBase64.startsWith('data:image/') || item.drivingLicenseBase64.startsWith('http') || /\.(png|jpe?g|webp|gif)$/i.test(item.drivingLicenseName)) ? (
                          <img
                            src={item.drivingLicenseBase64.startsWith('data:') || item.drivingLicenseBase64.startsWith('http') ? item.drivingLicenseBase64 : `data:image/jpeg;base64,${item.drivingLicenseBase64}`}
                            alt="Driving License"
                            className={styles.docImage}
                            onClick={() => {
                              const src = item.drivingLicenseBase64.startsWith('data:') || item.drivingLicenseBase64.startsWith('http') ? item.drivingLicenseBase64 : `data:image/jpeg;base64,${item.drivingLicenseBase64}`;
                              window.open(src, '_blank');
                            }}
                            title="Click to view full size"
                          />
                        ) : item.drivingLicenseBase64 ? (
                          <div className={styles.pdfFallback}>
                            <FileText size={42} color="#10b981" />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>PDF Document</span>
                            <a
                              href={item.drivingLicenseBase64}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.viewBtn}
                            >
                              <ExternalLink size={14} /> Open & View Document
                            </a>
                          </div>
                        ) : (
                          <div className={styles.pdfFallback}>
                            <FileText size={36} color="#94a3b8" />
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No document uploaded</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.docFooterRow}>
                        <span className={styles.docFooter}>{item.drivingLicenseName}</span>
                        {item.drivingLicenseBase64 && (
                          <a
                            href={item.drivingLicenseBase64.startsWith('data:') || item.drivingLicenseBase64.startsWith('http') ? item.drivingLicenseBase64 : `data:image/jpeg;base64,${item.drivingLicenseBase64}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.smallOpenLink}
                          >
                            <ExternalLink size={12} /> View Full
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Feedback / Admin Notes display if reviewed */}
                  {item.adminNotes && (
                    <div className={styles.reviewFeedback}>
                      <div className={styles.feedbackTitle}>Backend Verification Remarks:</div>
                      <div>{item.adminNotes}</div>
                    </div>
                  )}

                  {/* Action Area */}
                  <div className={styles.actionArea}>
                    <input
                      type="text"
                      placeholder="Notes (e.g. 'Invalid documents try with Original documents' or 'Clear DL verified')"
                      className={styles.notesInput}
                      value={adminNotes[item.id] !== undefined ? adminNotes[item.id] : ''}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      disabled={isWorking}
                    />

                    <button
                      type="button"
                      className={`${styles.rejectBtn} ${isWorking ? styles.btnDisabled : ''}`}
                      onClick={() => handleReview(item.id, 'REJECT')}
                      disabled={isWorking}
                    >
                      <XCircle size={16} /> Reject (Invalid Document)
                    </button>

                    <button
                      type="button"
                      className={`${styles.approveBtn} ${isWorking ? styles.btnDisabled : ''}`}
                      onClick={() => handleReview(item.id, 'APPROVE')}
                      disabled={isWorking}
                    >
                      <CheckCircle size={16} /> Allow & Verify Document
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default function AdminVerificationsPage() {
  return (
    <AppProvider>
      <AdminContent />
    </AppProvider>
  );
}
