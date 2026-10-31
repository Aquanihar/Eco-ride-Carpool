'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Calendar,
  Eye,
  Download,
  X,
  Maximize2,
} from 'lucide-react';
import { AppProvider } from '@/context/AppContext';
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

  // Cache loaded documents on demand { [id]: { idProofBase64, drivingLicenseBase64 } }
  const [loadedDocs, setLoadedDocs] = useState({});
  const [loadingDocs, setLoadingDocs] = useState({}); // { [docKey]: boolean }

  // Sequential request ordering ref: prevents out-of-order race conditions
  const requestIdRef = useRef(0);
  const pollTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPreviewModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch list of verifications solely through authoritative server-side API
  const fetchVerifications = useCallback(async (silent = false) => {
    const currentReqId = ++requestIdRef.current;
    if (!silent) setLoading(true);

    try {
      const res = await fetch(`/api/verifications?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();

      // Discard response if a newer request has already fired or component unmounted
      if (currentReqId !== requestIdRef.current || !isMountedRef.current) {
        return;
      }

      if (data.success && Array.isArray(data.verifications)) {
        setVerifications(data.verifications);
      }
    } catch (err) {
      if (currentReqId === requestIdRef.current) {
        console.warn('API verification fetch failed:', err.message);
      }
    } finally {
      if (currentReqId === requestIdRef.current && isMountedRef.current) {
        if (!silent) setLoading(false);
        // Replace setInterval with scheduled timeout after current response finishes
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        pollTimerRef.current = setTimeout(() => {
          fetchVerifications(true);
        }, 5000);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchVerifications(false);

    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [fetchVerifications]);

  // Load document image on demand when inspected or downloaded
  const fetchDocOnDemand = useCallback(async (item, docType) => {
    const field = docType === 'idProof' ? 'idProofBase64' : 'drivingLicenseBase64';
    const cached = loadedDocs[item.id];
    if (cached && cached[field]) {
      return cached[field];
    }

    const loadKey = `${item.id}_${docType}`;
    setLoadingDocs((prev) => ({ ...prev, [loadKey]: true }));

    try {
      const res = await fetch(`/api/verifications/${encodeURIComponent(item.id)}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && data.verification) {
        setLoadedDocs((prev) => ({
          ...prev,
          [item.id]: {
            ...(prev[item.id] || {}),
            idProofBase64: data.verification.idProofBase64 || '',
            drivingLicenseBase64: data.verification.drivingLicenseBase64 || '',
          },
        }));
        return data.verification[field] || '';
      }
    } catch (err) {
      console.error('Error fetching document on demand:', err);
    } finally {
      setLoadingDocs((prev) => ({ ...prev, [loadKey]: false }));
    }
    return '';
  }, [loadedDocs]);

  // Pre-fetch document thumbnails in background for cards so previews display cleanly
  useEffect(() => {
    if (!verifications || verifications.length === 0) return;
    verifications.forEach((item) => {
      if (!loadedDocs[item.id]) {
        fetchDocOnDemand(item, 'idProof');
      }
    });
  }, [verifications, loadedDocs, fetchDocOnDemand]);

  const handleOpenPreview = async (item, docType) => {
    const isIdProof = docType === 'idProof';
    const fileName = isIdProof
      ? (item.idProofName || 'aadhaar_card.jpg')
      : (item.drivingLicenseName || 'driving_license.jpg');
    const title = isIdProof
      ? `Aadhaar / ID Document - ${item.fullName || item.email}`
      : `Driving License - ${item.fullName || item.email}`;

    const rawSrc = await fetchDocOnDemand(item, docType);
    if (!rawSrc) {
      alert('Could not load document preview. Please check your connection.');
      return;
    }

    const formattedSrc = formatDocSrc(rawSrc);
    const isImg = isImageDoc(formattedSrc, fileName);

    setPreviewModal({
      src: formattedSrc,
      title,
      fileName,
      isImage: isImg,
      user: item.fullName,
    });
  };

  const handleDownload = async (item, docType) => {
    const isIdProof = docType === 'idProof';
    const fileName = isIdProof
      ? (item.idProofName || 'aadhaar_card.jpg')
      : (item.drivingLicenseName || 'driving_license.jpg');
    const rawSrc = await fetchDocOnDemand(item, docType);
    if (rawSrc) {
      downloadDocument(formatDocSrc(rawSrc), fileName);
    } else {
      alert('Failed to download document.');
    }
  };

  const handleReview = async (id, action) => {
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const note = adminNotes[id] || (action === 'REJECT' ? 'Invalid documents. Try with original documents.' : 'Approved by admin review.');
    const now = new Date();
    const reviewedAt = now.toISOString();
    setActionInProgress((prev) => ({ ...prev, [id]: true }));

    const item = verifications.find((v) => v.id === id || v.email === id);
    const targetId = item?.id || id;

    // Optimistically update UI
    setVerifications((prev) =>
      prev.map((v) =>
        v.id === id || v.email === item?.email
          ? { ...v, status, adminNotes: note, reviewedAt }
          : v
      )
    );

    try {
      const res = await fetch(`/api/verifications/${encodeURIComponent(targetId)}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNotes: note,
          email: item?.email,
          rowId: item?.rowId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update review status');
      }

      // Refresh to confirm live state from Supabase
      await fetchVerifications(true);
    } catch (err) {
      console.error('Error updating review:', err);
      alert('Error updating review status: ' + err.message);
      await fetchVerifications(true);
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
            <button
              className={styles.refreshBtn}
              onClick={() => {
                if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
                fetchVerifications(false);
              }}
              disabled={loading}
            >
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
              const cachedDocs = loadedDocs[item.id] || {};

              const aadharSrc = cachedDocs.idProofBase64 ? formatDocSrc(cachedDocs.idProofBase64) : '';
              const aadharIsImg = aadharSrc ? isImageDoc(aadharSrc, item.idProofName) : false;
              const dlSrc = cachedDocs.drivingLicenseBase64 ? formatDocSrc(cachedDocs.drivingLicenseBase64) : '';
              const dlIsImg = dlSrc ? isImageDoc(dlSrc, item.drivingLicenseName) : false;

              const isAadharLoading = Boolean(loadingDocs[`${item.id}_idProof`]);
              const isDlLoading = Boolean(loadingDocs[`${item.id}_drivingLicense`]);

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
                          {new Date(item.submittedAt || Date.now()).toLocaleDateString()}{' '}
                          {new Date(item.submittedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          if (item.hasIdProof) {
                            handleOpenPreview(item, 'idProof');
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
                        ) : item.hasIdProof ? (
                          <div className={styles.pdfFallback}>
                            <FileText size={42} color="#0284c7" />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.idProofName || 'Identity Document'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary-500)' }}>
                              {isAadharLoading ? 'Loading document...' : 'Click to inspect / view document'}
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
                        {item.hasIdProof && (
                          <div className={styles.docActions}>
                            <button
                              type="button"
                              className={styles.inspectBtn}
                              onClick={() => handleOpenPreview(item, 'idProof')}
                              disabled={isAadharLoading}
                            >
                              <Maximize2 size={13} /> {isAadharLoading ? 'Loading...' : 'Inspect'}
                            </button>
                            <button
                              type="button"
                              className={styles.downloadBtn}
                              onClick={() => handleDownload(item, 'idProof')}
                              disabled={isAadharLoading}
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
                          if (item.hasDrivingLicense) {
                            handleOpenPreview(item, 'drivingLicense');
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
                        ) : item.hasDrivingLicense ? (
                          <div className={styles.pdfFallback}>
                            <FileText size={42} color="#10b981" />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.drivingLicenseName || 'Driving License'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary-500)' }}>
                              {isDlLoading ? 'Loading document...' : 'Click to inspect / view document'}
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
                        {item.hasDrivingLicense && (
                          <div className={styles.docActions}>
                            <button
                              type="button"
                              className={styles.inspectBtn}
                              onClick={() => handleOpenPreview(item, 'drivingLicense')}
                              disabled={isDlLoading}
                            >
                              <Maximize2 size={13} /> {isDlLoading ? 'Loading...' : 'Inspect'}
                            </button>
                            <button
                              type="button"
                              className={styles.downloadBtn}
                              onClick={() => handleDownload(item, 'drivingLicense')}
                              disabled={isDlLoading}
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
