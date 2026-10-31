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
  Eye,
  Download,
  X,
  Maximize2,
} from 'lucide-react';
import { AppProvider } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import styles from './admin.module.css';

// Safely format document string into a valid displayable Data URL or Web URL
function formatDocSrc(raw, fallbackType = 'image/jpeg') {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.length < 50) return '';
  if (trimmed.startsWith('JVBERi')) return `data:application/pdf;base64,${trimmed}`;
  if (trimmed.startsWith('iVBORw')) return `data:image/png;base64,${trimmed}`;
  if (trimmed.startsWith('/9j/')) return `data:image/jpeg;base64,${trimmed}`;
  if (trimmed.startsWith('UklGR')) return `data:image/webp;base64,${trimmed}`;
  return `data:${fallbackType};base64,${trimmed}`;
}

// Check whether the document is an image or PDF
function isImageDoc(src, fileName = '') {
  if (!src) return false;
  if (src.startsWith('data:image/')) return true;
  if (src.startsWith('data:application/pdf')) return false;
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return !/\.pdf$/i.test(src);
  }
  if (/\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(fileName)) return true;
  if (/\.pdf$/i.test(fileName) && (src.startsWith('data:application/pdf') || src.includes('JVBERi'))) {
    return false;
  }
  // Default to true for base64 images that may lack explicit mime-type
  return true;
}

// Download document safely without hitting browser top-level data URL security blocks
function downloadDocument(src, fileName) {
  if (!src) return;
  try {
    if (src.startsWith('data:')) {
      const parts = src.split(';base64,');
      if (parts.length === 2) {
        const contentType = parts[0].split(':')[1] || 'application/octet-stream';
        const raw = window.atob(parts[1]);
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName || (contentType.includes('pdf') ? 'document.pdf' : 'document.jpg');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        return;
      }
    }
    const a = document.createElement('a');
    a.href = src;
    a.download = fileName || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Download error:', err);
  }
}

// Safely open in new window avoiding Chrome top-level data: navigation block
function openInNewTab(src, title = 'Document Preview') {
  if (!src) return;
  if (src.startsWith('http')) {
    window.open(src, '_blank');
    return;
  }
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
            img { max-width: 95vw; max-height: 95vh; object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 8px; }
            iframe { width: 100vw; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          ${src.startsWith('data:application/pdf') 
            ? `<iframe src="${src}"></iframe>` 
            : `<img src="${src}" alt="${title}" />`}
        </body>
      </html>
    `);
    win.document.close();
  }
}

function AdminContent() {
  const [verifications, setVerifications] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState({});
  const [adminNotes, setAdminNotes] = useState({});
  const [previewModal, setPreviewModal] = useState(null); // { src, title, fileName, isImage, user }

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPreviewModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getRowTimestamp = (r) => {
    if (!r) return 0;
    const tRev = (r.reviewedAt || r.driver?.reviewedAt) ? new Date(r.reviewedAt || r.driver?.reviewedAt).getTime() : 0;
    const tSub = (r.submittedAt || r.driver?.submittedAt) ? new Date(r.submittedAt || r.driver?.submittedAt).getTime() : 0;
    const idMatch = (r.id || '').match(/_(\d{13})$/);
    const tId = idMatch ? parseInt(idMatch[1], 10) : 0;
    const tCreated = r.created_at ? new Date(r.created_at).getTime() : 0;
    const tUpdated = r.updated_at ? new Date(r.updated_at).getTime() : 0;
    return Math.max(tRev, tSub, tId, tCreated, tUpdated);
  };

  const cleanUserEmail = (rawEmail, rawId) => {
    if (rawEmail && rawEmail.includes('@') && !rawEmail.startsWith('doc_')) {
      return rawEmail.toLowerCase().trim();
    }
    const str = rawEmail || rawId || '';
    const m = str.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+)/i);
    return m ? m[1].toLowerCase().trim() : null;
  };

  const fetchVerifications = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const userMap = new Map();

      // 1. Fetch from authoritative API route first (has local persistence + photos)
      try {
        const res = await fetch('/api/verification');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.verifications && Array.isArray(data.verifications)) {
            data.verifications.forEach((v) => {
              if (v) {
                const normEmail = cleanUserEmail(v.email, v.id);
                if (normEmail) {
                  userMap.set(normEmail, { ...v, email: normEmail, id: v.id || ('doc_' + normEmail.replace(/[^a-z0-9]/g, '_')) });
                }
              }
            });
          }
        }
      } catch (apiErr) {
        console.error('API verification fetch error:', apiErr);
      }

      // 2. Also merge Supabase entries with fast selective query (avoids statement timeout)
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase request timeout')), 8000)
        );
        const queryPromise = supabase
          .from('rides')
          .select('id, driver_id, status, created_at, updated_at, driver')
          .ilike('status', 'VERIFICATION_%')
          .order('created_at', { ascending: false })
          .limit(60);

        const { data: rideRows } = await Promise.race([queryPromise, timeoutPromise]);

        if (rideRows && rideRows.length > 0) {
          rideRows.forEach((r) => {
            if (r.driver) {
              const userEmail = cleanUserEmail(r.driver.email, r.id);
              if (userEmail) {
                const existing = userMap.get(userEmail);
                const status = r.status === 'VERIFICATION_APPROVED' ? 'APPROVED'
                  : r.status === 'VERIFICATION_REJECTED' ? 'REJECTED'
                  : (r.driver?.status || existing?.status || 'PENDING');

                const rSubTime = new Date(r.driver?.submittedAt || r.created_at || 0).getTime();
                const existingSubTime = new Date(existing?.submittedAt || 0).getTime();

                // Select the NEWEST document photos: if Supabase row is newer and has photos, prefer Supabase photos!
                const rHasPhotos = (r.driver?.idProofBase64 && r.driver.idProofBase64.length > 50) ||
                                   (r.driver?.drivingLicenseBase64 && r.driver.drivingLicenseBase64.length > 50);
                const existingHasPhotos = (existing?.idProofBase64 && existing.idProofBase64.length > 50) ||
                                          (existing?.drivingLicenseBase64 && existing.drivingLicenseBase64.length > 50);

                let resolvedIdProof = '';
                let resolvedIdProofName = 'Identity Document';
                let resolvedDl = '';
                let resolvedDlName = 'Driving License';

                if (rHasPhotos && (!existingHasPhotos || rSubTime >= existingSubTime)) {
                  resolvedIdProof = r.driver?.idProofBase64 || existing?.idProofBase64 || '';
                  resolvedIdProofName = r.driver?.idProofName || existing?.idProofName || 'Identity Document';
                  resolvedDl = r.driver?.drivingLicenseBase64 || existing?.drivingLicenseBase64 || '';
                  resolvedDlName = r.driver?.drivingLicenseName || existing?.drivingLicenseName || 'Driving License';
                } else {
                  resolvedIdProof = existing?.idProofBase64 || r.driver?.idProofBase64 || '';
                  resolvedIdProofName = existing?.idProofName || r.driver?.idProofName || 'Identity Document';
                  resolvedDl = existing?.drivingLicenseBase64 || r.driver?.drivingLicenseBase64 || '';
                  resolvedDlName = existing?.drivingLicenseName || r.driver?.drivingLicenseName || 'Driving License';
                }

                const latestSubmittedAt = existingSubTime >= rSubTime
                  ? (existing?.submittedAt || r.created_at)
                  : (r.driver?.submittedAt || r.created_at);

                // If user uploaded new documents after review, status is PENDING
                const finalStatus = (existingSubTime > rSubTime && existing?.status) ? existing.status : status;

                userMap.set(userEmail, {
                  ...(existing || {}),
                  ...r.driver,
                  id: (rSubTime >= existingSubTime ? r.id : existing?.id) || r.driver.id || r.id,
                  email: userEmail,
                  status: finalStatus,
                  rowId: r.id,
                  idProofBase64: resolvedIdProof,
                  idProofName: resolvedIdProofName,
                  drivingLicenseBase64: resolvedDl,
                  drivingLicenseName: resolvedDlName,
                  submittedAt: latestSubmittedAt,
                  reviewedAt: r.driver?.reviewedAt || existing?.reviewedAt || (finalStatus !== 'PENDING' ? r.updated_at : null),
                  adminNotes: r.driver?.adminNotes || existing?.adminNotes || '',
                });
              }
            }
          });
        }
      } catch (sbErr) {
        // Supabase error or timeout; backend API data in userMap is retained
      }

      const list = Array.from(userMap.values());
      const sorted = list.sort((a, b) => getRowTimestamp(b) - getRowTimestamp(a));
      setVerifications(sorted);
    } catch (err) {
      console.error('Failed to fetch verifications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
    const interval = setInterval(() => fetchVerifications(true), 8000);

    const channel = supabase
      .channel('realtime_admin_verifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides' },
        () => {
          fetchVerifications(true);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchVerifications]);

  const handleReview = async (id, action) => {
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const note = adminNotes[id] || (action === 'REJECT' ? 'Invalid documents. Try with original documents.' : 'Approved by admin review.');
    const now = new Date();
    const reviewedAt = now.toISOString();
    setActionInProgress((prev) => ({ ...prev, [id]: true }));

    const item = verifications.find((v) => v.id === id || v.email === id);
    const normEmail = cleanUserEmail(item?.email, id) || (item?.email || id).toLowerCase().trim();
    const updateId = 'doc_' + normEmail.replace(/[^a-z0-9]/g, '_');

    // Optimistically update UI
    setVerifications((prev) =>
      prev.map((v) =>
        v.id === id || cleanUserEmail(v.email, v.id) === normEmail
          ? { ...v, status, adminNotes: note, reviewedAt }
          : v
      )
    );

    try {
      const updatedDriver = {
        ...(item || {}),
        id: updateId,
        email: normEmail,
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
        const payload = {
          id: updateId,
          driver_id: updateId,
          origin: 'Verification Portal',
          destination: 'Document Verification',
          origin_latitude: 0,
          origin_longitude: 0,
          destination_latitude: 0,
          destination_longitude: 0,
          departure_date: now.toISOString().split('T')[0],
          departure_time: '00:00',
          total_seats: 1,
          available_seats: 1,
          price_per_seat: 0,
          status: action === 'APPROVE' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
          driver: {
            type: 'DOC_VERIFICATION',
            ...updatedDriver,
          },
          created_at: item?.submittedAt || now.toISOString(),
          updated_at: reviewedAt,
        };
        await supabase.from('rides').upsert([payload], { onConflict: 'id' });
      } catch (sbErr) {
        console.error('Supabase admin review insert error:', sbErr);
      }

      // 2. Also call API route
      try {
        await fetch('/api/verification/' + encodeURIComponent(item?.id || normEmail) + '/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, adminNotes: note }),
        });
      } catch (e) {}

      // Refresh to confirm live state from database silently without loading spinner jump
      await fetchVerifications(true);
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
            <button className={styles.refreshBtn} onClick={() => fetchVerifications(false)} disabled={loading}>
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
              const aadharSrc = formatDocSrc(item.idProofBase64);
              const aadharIsImg = isImageDoc(aadharSrc, item.idProofName);
              const dlSrc = formatDocSrc(item.drivingLicenseBase64);
              const dlIsImg = isImageDoc(dlSrc, item.drivingLicenseName);

              return (
                <div key={item.id} className={styles.verifCard}>
                  <div className={styles.cardTop}>
                    <div className={styles.userMeta}>
                      <h2>{item.fullName || 'User Document Verification'}</h2>
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
                          {new Date(item.submittedAt || Date.now()).toLocaleDateString()} {new Date(item.submittedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    {/* Aadhaar Proof */}
                    <div className={styles.docColumn}>
                      <div className={styles.docHeader}>
                        <FileText size={18} color="#0284c7" />
                        <span>Aadhaar / Identity Proof Document</span>
                      </div>

                      <div
                        className={styles.previewBox}
                        onClick={() => {
                          if (aadharSrc) {
                            setPreviewModal({
                              src: aadharSrc,
                              title: `Aadhaar / ID Document - ${item.fullName || item.email}`,
                              fileName: item.idProofName || 'aadhaar_card.jpg',
                              isImage: aadharIsImg,
                              user: item.fullName,
                            });
                          }
                        }}
                      >
                        {aadharSrc && aadharIsImg ? (
                          <>
                            <img
                              src={aadharSrc}
                              alt="Aadhaar ID Proof"
                              className={styles.docImage}
                            />
                            <div className={styles.previewOverlay}>
                              <Eye size={18} /> Click to Inspect Photo
                            </div>
                          </>
                        ) : aadharSrc ? (
                          <div className={styles.pdfFallback}>
                            <FileText size={42} color="#0284c7" />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>PDF Document</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary-500)' }}>
                              Click to view PDF
                            </span>
                          </div>
                        ) : (
                          <div className={styles.pdfFallback}>
                            <FileText size={36} color="#94a3b8" />
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No document uploaded</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.docFooterRow}>
                        <span className={styles.docFooter}>{item.idProofName || 'Identity Document'}</span>
                        {aadharSrc && (
                          <div className={styles.docActions}>
                            <button
                              type="button"
                              className={styles.inspectBtn}
                              onClick={() =>
                                setPreviewModal({
                                  src: aadharSrc,
                                  title: `Aadhaar / ID Document - ${item.fullName || item.email}`,
                                  fileName: item.idProofName || 'aadhaar_card.jpg',
                                  isImage: aadharIsImg,
                                  user: item.fullName,
                                })
                              }
                            >
                              <Maximize2 size={13} /> Inspect
                            </button>
                            <button
                              type="button"
                              className={styles.downloadBtn}
                              onClick={() => downloadDocument(aadharSrc, item.idProofName || 'aadhaar_card.jpg')}
                              title="Download original file"
                            >
                              <Download size={13} /> Download
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Driving License */}
                    <div className={styles.docColumn}>
                      <div className={styles.docHeader}>
                        <FileText size={18} color="#10b981" />
                        <span>Driving License Document</span>
                      </div>

                      <div
                        className={styles.previewBox}
                        onClick={() => {
                          if (dlSrc) {
                            setPreviewModal({
                              src: dlSrc,
                              title: `Driving License - ${item.fullName || item.email}`,
                              fileName: item.drivingLicenseName || 'driving_license.jpg',
                              isImage: dlIsImg,
                              user: item.fullName,
                            });
                          }
                        }}
                      >
                        {dlSrc && dlIsImg ? (
                          <>
                            <img
                              src={dlSrc}
                              alt="Driving License"
                              className={styles.docImage}
                            />
                            <div className={styles.previewOverlay}>
                              <Eye size={18} /> Click to Inspect Photo
                            </div>
                          </>
                        ) : dlSrc ? (
                          <div className={styles.pdfFallback}>
                            <FileText size={42} color="#10b981" />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>PDF Document</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary-500)' }}>
                              Click to view PDF
                            </span>
                          </div>
                        ) : (
                          <div className={styles.pdfFallback}>
                            <FileText size={36} color="#94a3b8" />
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No document uploaded</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.docFooterRow}>
                        <span className={styles.docFooter}>{item.drivingLicenseName || 'Driving License'}</span>
                        {dlSrc && (
                          <div className={styles.docActions}>
                            <button
                              type="button"
                              className={styles.inspectBtn}
                              onClick={() =>
                                setPreviewModal({
                                  src: dlSrc,
                                  title: `Driving License - ${item.fullName || item.email}`,
                                  fileName: item.drivingLicenseName || 'driving_license.jpg',
                                  isImage: dlIsImg,
                                  user: item.fullName,
                                })
                              }
                            >
                              <Maximize2 size={13} /> Inspect
                            </button>
                            <button
                              type="button"
                              className={styles.downloadBtn}
                              onClick={() => downloadDocument(dlSrc, item.drivingLicenseName || 'driving_license.jpg')}
                              title="Download original file"
                            >
                              <Download size={13} /> Download
                            </button>
                          </div>
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
                      placeholder="Remarks (e.g. 'Invalid documents try with Original documents' or 'Verified & approved')"
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

      {/* Document Lightbox / Fullscreen Modal */}
      {previewModal && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewModal(null)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderInfo}>
                <h3>
                  <FileText size={20} color="#10b981" /> {previewModal.title}
                </h3>
                <p>Original filename: {previewModal.fileName}</p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setPreviewModal(null)}
                aria-label="Close Preview"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {previewModal.isImage ? (
                <img
                  src={previewModal.src}
                  alt={previewModal.title}
                  className={styles.modalImage}
                />
              ) : (
                <iframe
                  src={previewModal.src}
                  title={previewModal.title}
                  className={styles.modalIframe}
                />
              )}
            </div>

            <div className={styles.modalFooter}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Press <kbd style={{ background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>Esc</kbd> or click background to exit
              </div>
              <div className={styles.modalFooterActions}>
                <button
                  type="button"
                  className={styles.inspectBtn}
                  onClick={() => openInNewTab(previewModal.src, previewModal.title)}
                >
                  <ExternalLink size={14} /> Open in New Tab
                </button>
                <button
                  type="button"
                  className={styles.approveBtn}
                  onClick={() => downloadDocument(previewModal.src, previewModal.fileName)}
                >
                  <Download size={15} /> Download Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
