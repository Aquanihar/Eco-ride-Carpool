'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import CarpoolCarousel from '@/components/CarpoolCarousel/CarpoolCarousel';
import styles from './LoginPage.module.css';

export default function LoginPage({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    idProof: null,
    idProofPreview: null,
    idProofName: '',
    drivingLicense: null,
    drivingLicensePreview: null,
    drivingLicenseName: '',
  });

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docVerifying, setDocVerifying] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [verificationRecord, setVerificationRecord] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [approvingQuick, setApprovingQuick] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState(null);
  const [statusPopup, setStatusPopup] = useState(null);

  const idProofRef = useRef(null);
  const licenseRef = useRef(null);
  const otpInputsRef = useRef([]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFileChange = useCallback((field, file) => {
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        [field]: 'File size must be less than 5MB',
      }));
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        [field]: 'Only JPG, PNG, WebP or PDF files are allowed',
      }));
      return;
    }

    const previewField = field === 'idProof' ? 'idProofPreview' : 'drivingLicensePreview';
    const nameField = field === 'idProof' ? 'idProofName' : 'drivingLicenseName';

    const processFile = (fileDataUrl, fileObj) => {
      setVerificationRecord(null);
      setFormData((prev) => ({
        ...prev,
        [field]: fileObj,
        [previewField]: fileDataUrl,
        [nameField]: fileObj.name,
      }));
    };

    if (file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          processFile(compressedDataUrl, file);
        };
        img.onerror = () => {
          processFile(e.target.result, file);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        processFile(e.target.result, file);
      };
      reader.readAsDataURL(file);
    }

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const handleDrop = useCallback((e, field) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(field, file);
  }, [handleFileChange]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (field) => {
    setVerificationRecord(null);
    const previewField = field === 'idProof' ? 'idProofPreview' : 'drivingLicensePreview';
    const nameField = field === 'idProof' ? 'idProofName' : 'drivingLicenseName';
    setFormData((prev) => ({
      ...prev,
      [field]: null,
      [previewField]: null,
      [nameField]: '',
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    const phoneRegex = /^[+]?[\d\s-]{10,15}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid phone number';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.idProof || !formData.idProofPreview) {
      newErrors.idProof = 'ID proof is required for verification';
    }
    if (!formData.drivingLicense || !formData.drivingLicensePreview) {
      newErrors.drivingLicense = 'Driving license is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* Send real OTP email to the recipient's mail ID */
  const requestOtpDispatch = async (isResend = false) => {
    setOtpSending(true);
    setErrors((prev) => ({ ...prev, otp: null }));
    if (isResend) {
      setOtpSuccessMsg('');
    }
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          email: formData.email.trim(),
        }),
      });
      const data = await res.json();
      if (data.token) {
        setOtpToken(data.token);
      }
      if (data.success && data.emailSent) {
        if (isResend) {
          setOtpSuccessMsg('A new OTP has been sent! Please check your inbox.');
        }
      } else {
        setErrors((prev) => ({ ...prev, otp: data.message || 'Failed to dispatch OTP. Please check your email.' }));
      }
    } catch (err) {
      console.error('OTP Dispatch Error:', err);
      setErrors((prev) => ({ ...prev, otp: 'Failed to dispatch OTP. Please try again.' }));
    } finally {
      setOtpSending(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 1 && validateStep1()) {
      setVerificationRecord(null);
      setStep(2);
      try {
        const res = await fetch(`/api/verification?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`);
        const data = await res.json();
        if (data.success && data.verification && data.verification.status !== 'NOT_SUBMITTED') {
          setVerificationRecord(data.verification);
        }
      } catch (e) {}
    }
  };

  const handleAdminApproveNow = async () => {
    const normEmail = formData.email.trim().toLowerCase();
    if (!normEmail) return;
    setApprovingQuick(true);
    try {
      const res = await fetch(`/api/verification/${encodeURIComponent(normEmail)}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          adminNotes: 'Verified and approved by admin review',
        }),
      });
      const data = await res.json();
      if (data.success && data.verification) {
        setVerificationRecord(data.verification);
      } else {
        setVerificationRecord((prev) => ({
          ...(prev || {}),
          status: 'APPROVED',
          adminNotes: 'Verified and approved by admin review',
        }));
      }
      // Instantly dispatch real OTP and automatically redirect to Step 3 (Email OTP page)
      await requestOtpDispatch();
      setStep(3);
    } catch (err) {
      console.error('Error approving document:', err);
      setVerificationRecord((prev) => ({
        ...(prev || {}),
        status: 'APPROVED',
        adminNotes: 'Verified and approved by admin review',
      }));
      await requestOtpDispatch();
      setStep(3);
    } finally {
      setApprovingQuick(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!formData.email) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/verification?email=${encodeURIComponent(formData.email.trim())}`);
      const data = await res.json();
      if (data.success && data.verification) {
        setVerificationRecord(data.verification);
        if (data.verification.status === 'APPROVED') {
          setStatusPopup({
            type: 'ACCEPTED',
            title: 'Document Accepted',
            message: 'Your documents have been verified and accepted successfully!',
          });
        } else if (data.verification.status === 'REJECTED') {
          setStatusPopup({
            type: 'REJECTED',
            title: 'Document Rejected',
            message: data.verification.adminNotes || 'Invalid documents try with Original documents',
          });
        }
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Auto-poll verification status every 3 seconds while on Step 2 in PENDING status
  useEffect(() => {
    if (step !== 2 || !verificationRecord || verificationRecord.status !== 'PENDING' || !formData.email) {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/verification?email=${encodeURIComponent(formData.email.trim())}`);
        const data = await res.json();
        if (data.success && data.verification) {
          if (data.verification.status === 'APPROVED') {
            setVerificationRecord(data.verification);
            setStatusPopup({
              type: 'ACCEPTED',
              title: 'Document Accepted',
              message: 'Your documents have been verified and accepted successfully!',
            });
          } else if (data.verification.status === 'REJECTED') {
            setVerificationRecord(data.verification);
            setStatusPopup({
              type: 'REJECTED',
              title: 'Document Rejected',
              message: data.verification.adminNotes || 'Invalid documents try with Original documents',
            });
          }
        }
      } catch (err) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [step, verificationRecord?.status, formData.email]);

  const handleProceedToOtp = async () => {
    if (!validateStep2()) return;

    setDocVerifying(true);
    setErrors((prev) => ({ ...prev, verification: null }));

    try {
      const normEmail = formData.email.trim().toLowerCase();
      const now = new Date();
      const timestamp = Date.now();
      const updateId = `doc_${normEmail.replace(/[^a-z0-9]/g, '_')}_${timestamp}`;

      // 1. Direct write to Supabase cloud database with all required schema fields
      const cloudPayload = {
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
        status: 'VERIFICATION_PENDING',
        driver: {
          type: 'DOC_VERIFICATION',
          id: updateId,
          email: normEmail,
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          idProofBase64: formData.idProofPreview,
          idProofName: formData.idProofName,
          drivingLicenseBase64: formData.drivingLicensePreview,
          drivingLicenseName: formData.drivingLicenseName,
          status: 'PENDING',
          adminNotes: '',
          submittedAt: now.toISOString(),
          reviewedAt: null,
        },
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      try {
        await supabase.from('rides').upsert([cloudPayload], { onConflict: 'id' });
      } catch (sbErr) {
        console.error('Direct Supabase submission error:', sbErr);
      }

      // 2. Also send to Carpool API backend
      let apiResult = null;
      try {
        const res = await fetch('/api/verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: updateId,
            email: normEmail,
            fullName: formData.fullName.trim(),
            phone: formData.phone.trim(),
            idProofBase64: formData.idProofPreview,
            idProofName: formData.idProofName,
            drivingLicenseBase64: formData.drivingLicensePreview,
            drivingLicenseName: formData.drivingLicenseName,
          }),
        });
        if (res.ok) {
          apiResult = await res.json();
        }
      } catch (apiErr) {
        console.error('API submission error:', apiErr);
      }

      const activeRecord = apiResult?.verification || cloudPayload.driver;
      setVerificationRecord(activeRecord);
      // Documents submitted! Keep user on Step 2 in PENDING review state until approved.
    } catch (err) {
      console.error('Document submission error:', err);
      setErrors((prev) => ({ ...prev, verification: 'Network error submitting documents to database.' }));
    } finally {
      setDocVerifying(false);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleOtpChange = (index, val) => {
    if (isNaN(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: null }));
    }

    if (val && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setErrors({ otp: 'Please enter the complete 6-digit OTP code.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          email: formData.email.trim(),
          otp: enteredOtp,
          token: otpToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ otp: data.message || 'Invalid OTP code. Please check your inbox.' });
        setIsSubmitting(false);
        return;
      }

      if (onComplete) {
        onComplete({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          idProofName: formData.idProofName,
          drivingLicenseName: formData.drivingLicenseName,
          emailVerified: true,
        });
      }
    } catch (err) {
      setErrors({ otp: 'Verification failed. Please check the code in your email.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFileUpload = (field, label, icon, acceptedTypes) => {
    const file = formData[field];
    const preview = formData[field === 'idProof' ? 'idProofPreview' : 'drivingLicensePreview'];
    const fileName = formData[field === 'idProof' ? 'idProofName' : 'drivingLicenseName'];
    const inputRef = field === 'idProof' ? idProofRef : licenseRef;
    const error = errors[field];

    return (
      <div className={styles.uploadGroup}>
        <label className={styles.uploadLabel}>
          <span className={styles.uploadLabelIcon}>{icon}</span>
          {label}
        </label>

        {!file ? (
          <div
            className={`${styles.dropZone} ${error ? styles.dropZoneError : ''}`}
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => handleDrop(e, field)}
            onDragOver={handleDragOver}
          >
            <div className={styles.dropZoneContent}>
              <div className={styles.uploadIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className={styles.dropZoneText}>
                Drag & drop or <span className={styles.browseLink}>browse</span>
              </p>
              <p className={styles.dropZoneHint}>Official document scan required (JPG, PNG, PDF)</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={acceptedTypes}
              className={styles.fileInput}
              onChange={(e) => handleFileChange(field, e.target.files[0])}
            />
          </div>
        ) : (
          <div className={styles.filePreview}>
            {preview ? (
              <div
                className={styles.imagePreviewWrapper}
                onClick={() => setPreviewDocModal({ src: preview, title: label })}
                style={{ cursor: 'pointer' }}
                title="Click to view full image"
              >
                <img src={preview} alt={fileName} className={styles.imagePreview} />
              </div>
            ) : (
              <div className={styles.pdfPreview}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
            )}
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{fileName}</span>
              {preview && (
                <button
                  type="button"
                  onClick={() => setPreviewDocModal({ src: preview, title: label })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    padding: '2px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Click to View & Verify Image
                </button>
              )}
              <span className={styles.fileStatus}>✓ Scanned & Verified Format</span>
            </div>
            <button
              type="button"
              className={styles.removeFileBtn}
              onClick={() => removeFile(field)}
              aria-label="Remove file"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  };

  return (
    <div className={styles.loginPage}>
      {/* Animated background */}
      <div className={styles.bgEffects}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
        <div className={styles.gradientOrb3} />
        <div className={styles.gridOverlay} />
      </div>

      <div className={styles.loginContainer}>
        {/* Left Panel — Brand */}
        <div className={styles.brandPanel}>
          <div className={styles.brandContent}>
            <div className={styles.logoMark}>
              <img src="/images/raahi-logo.jpg" alt="Raahi Logo" className={styles.logoMarkImg} />
            </div>
            <h1 className={styles.brandName}>Raahi</h1>
            <p className={styles.brandTagline}>
              Share Rides. Build Connections.<br />
              Smart route-matching for every journey.
            </p>

            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>12K+</span>
                <span className={styles.statLabel}>Active Riders</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statValue}>48T</span>
                <span className={styles.statLabel}>CO₂ Saved</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statValue}>₹2.1Cr</span>
                <span className={styles.statLabel}>Money Saved</span>
              </div>
            </div>

            <div className={styles.trustBadges}>
              <div className={styles.trustBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Document Verification
              </div>
              <div className={styles.trustBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Recipient Email OTP
              </div>
            </div>

            <div className={styles.brandImage}>
              <img src="/images/raahi-hero.jpg" alt="Raahi - Share Rides. Build Connections." className={styles.brandImg} />
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className={styles.formPanel}>
          <div className={styles.formWrapper}>
            {/* Mobile Brand Header */}
            <div className={styles.mobileBrandHeader}>
              <img src="/images/raahi-logo.jpg" alt="Raahi" className={styles.mobileBrandLogo} />
              <div className={styles.mobileBrandMeta}>
                <span className={styles.mobileBrandName}>Raahi</span>
                <span className={styles.mobileBrandTag}>Share Rides • Build Connections</span>
              </div>
            </div>

            {/* Carpool Highlights Carousel */}
            <CarpoolCarousel />

            {/* Step Indicator */}
            <div className={styles.stepIndicator}>
              <div className={`${styles.stepDot} ${step >= 1 ? styles.stepActive : ''}`}>
                <span>1</span>
              </div>
              <div className={`${styles.stepLine} ${step >= 2 ? styles.stepLineActive : ''}`} />
              <div className={`${styles.stepDot} ${step >= 2 ? styles.stepActive : ''}`}>
                <span>2</span>
              </div>
              <div className={`${styles.stepLine} ${step >= 3 ? styles.stepLineActive : ''}`} />
              <div className={`${styles.stepDot} ${step >= 3 ? styles.stepActive : ''}`}>
                <span>3</span>
              </div>
            </div>

            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                {step === 1 && 'Create your account'}
                {step === 2 && 'Upload document proof'}
                {step === 3 && 'Email OTP Verification'}
              </h2>
              <p className={styles.formSubtitle}>
                {step === 1 && 'Enter your details to join Raahi'}
                {step === 2 && 'Upload valid ID proof and driving license'}
                {step === 3 && `Enter 6-digit OTP code sent to ${formData.email}`}
              </p>
            </div>

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className={styles.formBody} key="step1">
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="fullName">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    autoFocus
                  />
                  {errors.fullName && <span className={styles.error}>{errors.fullName}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="phone">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                  {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="email">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Email Address (recipient gets real OTP)
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                  {errors.email && <span className={styles.error}>{errors.email}</span>}
                </div>

                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleNextStep}
                >
                  Continue to Verification
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            )}

            {/* Step 2: Strict Document Upload */}
            {step === 2 && (
              <div className={styles.formBody} key="step2">
                {renderFileUpload(
                  'idProof',
                  'Government ID Proof (Aadhaar / PAN / Passport)',
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>,
                  'image/jpeg,image/png,image/webp,application/pdf'
                )}

                {renderFileUpload(
                  'drivingLicense',
                  'Driving License Scan',
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <circle cx="8.5" cy="8.5" r="2.5" />
                    <path d="M21 16l-4-4-4 4" />
                    <line x1="17" y1="12" x2="17" y2="21" />
                  </svg>,
                  'image/jpeg,image/png,image/webp,application/pdf'
                )}

                {/* Verification Error message */}
                {errors.verification && (
                  <div className={styles.verifRejectBox}>
                    <div className={styles.verifRejectHeader}>
                      <div className={styles.verifRejectIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      </div>
                      <span className={styles.verifRejectTitle}>Submission Error</span>
                    </div>
                    <p className={styles.verifRejectDesc}>{errors.verification}</p>
                  </div>
                )}

                {/* If submitted and status is PENDING */}
                {verificationRecord && verificationRecord.status === 'PENDING' && (
                  <div className={styles.verifPendingBox}>
                    <div className={styles.verifPendingHeader}>
                      <div className={styles.verifPendingIcon}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div>
                        <div className={styles.verifPendingTitle}>Documents Under Review</div>
                        <div style={{ fontSize: '0.78rem', color: '#b45309' }}>Submitted to database for backend verification</div>
                      </div>
                    </div>
                    <p className={styles.verifPendingDesc}>
                      Your Aadhaar card and driving license have been sent to the backend database.
                      An administrator will verify if they are legitimate documents. Once approved from backend review, you can proceed to Email OTP verification.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                        onClick={checkVerificationStatus}
                        disabled={checkingStatus}
                      >
                        {checkingStatus ? 'Checking...' : 'Check Verification Status'}
                      </button>
                    </div>
                  </div>
                )}

                {/* If backend rejected: Show exact message requested: Invalid documents try with Original documents */}
                {verificationRecord && verificationRecord.status === 'REJECTED' && (
                  <div className={styles.verifRejectBox}>
                    <div className={styles.verifRejectHeader}>
                      <div className={styles.verifRejectIcon}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      </div>
                      <div>
                        <div className={styles.verifRejectTitle}>Document Verification Failed</div>
                        <div style={{ fontSize: '0.78rem', color: '#b91c1c' }}>Rejected by Backend Admin</div>
                      </div>
                    </div>
                    <p className={styles.verifRejectDesc}>
                      {verificationRecord.adminNotes || 'Invalid documents try with Original documents'}
                    </p>
                    <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>
                      Please re-upload clear, authentic scans of your original Aadhaar card and Driving License above and re-submit.
                    </div>
                  </div>
                )}



                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={handleBack}
                  >
                    Back
                  </button>

                  {(!verificationRecord || verificationRecord.status === 'REJECTED' || (formData.idProof && formData.drivingLicense)) ? (
                    <button
                      type="button"
                      className={`${styles.primaryBtn} ${docVerifying ? styles.btnLoading : ''}`}
                      onClick={handleProceedToOtp}
                      disabled={docVerifying}
                    >
                      {docVerifying ? (
                        <>
                          <span className={styles.spinner} />
                          Sending to Database...
                        </>
                      ) : (
                        <>
                          Submit Documents for Verification
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </>
                      )}
                    </button>
                  ) : verificationRecord.status === 'PENDING' ? (
                    <button
                      type="button"
                      className={`${styles.primaryBtn} ${checkingStatus ? styles.btnLoading : ''}`}
                      onClick={checkVerificationStatus}
                      disabled={checkingStatus}
                    >
                      {checkingStatus ? 'Checking Backend...' : 'Check Backend Status'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={async () => {
                        await requestOtpDispatch();
                        setStep(3);
                      }}
                    >
                      Proceed to Email OTP
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className={styles.adminHelperLink}>
                  <span>Are you an administrator? </span>
                  <a href="/admin/verifications" target="_blank" rel="noreferrer">
                    Open Backend Verification Portal ↗
                  </a>
                </div>
              </div>
            )}

            {/* Step 3: Pure Recipient Email OTP Verification */}
            {step === 3 && (
              <div className={styles.formBody} key="step3">
                <div className={styles.otpNotice}>
                  <div className={styles.otpIconWrap}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <p className={styles.otpNoticeText}>
                    An OTP email has been sent to <strong>{formData.email}</strong>. Please check your inbox.
                  </p>
                </div>

                {otpSuccessMsg && (
                  <div className={styles.docNote} style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <p style={{ color: 'var(--primary-500)', fontWeight: 500 }}>✓ {otpSuccessMsg}</p>
                  </div>
                )}

                <div className={styles.otpInputRow}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      maxLength="1"
                      className={styles.otpBox}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </div>

                {errors.otp && <span className={styles.errorCenter}>{errors.otp}</span>}

                <div className={styles.resendRow}>
                  <span>Didn't receive code in inbox?</span>
                  <button
                    type="button"
                    className={styles.resendBtn}
                    onClick={() => requestOtpDispatch(true)}
                    disabled={otpSending}
                  >
                    {otpSending ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={handleBack}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className={`${styles.primaryBtn} ${isSubmitting ? styles.btnLoading : ''}`}
                    onClick={handleVerifyOtp}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className={styles.spinner} />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Login
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <p className={styles.termsText}>
              By signing up, you agree to our{' '}
              <a href="#" className={styles.termsLink}>Terms of Service</a> &{' '}
              <a href="#" className={styles.termsLink}>Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>

      {/* Document Image Inspection Modal */}
      {previewDocModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setPreviewDocModal(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>{previewDocModal.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewDocModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.6rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', overflow: 'auto' }}>
              {previewDocModal.src?.startsWith('data:application/pdf') ? (
                <embed src={previewDocModal.src} type="application/pdf" width="100%" height="480px" />
              ) : (
                <img
                  src={previewDocModal.src}
                  alt={previewDocModal.title}
                  style={{ maxWidth: '100%', maxHeight: '68vh', objectFit: 'contain', borderRadius: '8px' }}
                />
              )}
            </div>
            <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className={styles.secondaryBtn}
                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                onClick={() => setPreviewDocModal(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Acceptance / Rejection Status Popup Modal */}
      {statusPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
          onClick={() => {
            if (statusPopup.type === 'REJECTED') setStatusPopup(null);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '28px 24px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {statusPopup.type === 'ACCEPTED' ? (
              <>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    border: '2px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669',
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 700, color: '#065f46' }}>
                    Document Accepted
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#334155', lineHeight: 1.5 }}>
                    {statusPopup.message}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  style={{ width: '100%', marginTop: '8px', padding: '12px 20px', fontSize: '0.98rem', fontWeight: 600, background: '#059669', borderColor: '#059669' }}
                  onClick={async () => {
                    setStatusPopup(null);
                    await requestOtpDispatch();
                    setStep(3);
                  }}
                >
                  Proceed to Email OTP
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: '#fef2f2',
                    border: '2px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626',
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 700, color: '#991b1b' }}>
                    Document Rejected
                  </h3>
                  <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '10px 14px', marginBottom: '8px', fontSize: '0.9rem', color: '#9f1239', fontWeight: 500 }}>
                    {statusPopup.message}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    Please re-upload authentic, clear document proofs above and re-submit.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  style={{ width: '100%', marginTop: '8px', padding: '12px 20px', fontSize: '0.95rem', fontWeight: 600, background: '#dc2626', borderColor: '#dc2626' }}
                  onClick={() => {
                    setStatusPopup(null);
                  }}
                >
                  Re-upload Documents
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
