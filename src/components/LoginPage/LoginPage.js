'use client';

import { useState, useRef, useCallback } from 'react';
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
  const [verificationRecord, setVerificationRecord] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

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

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({
        ...prev,
        [field]: file,
        [previewField]: e.target.result,
        [nameField]: file.name,
      }));
    };
    reader.readAsDataURL(file);

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
    if (!formData.idProof) {
      newErrors.idProof = 'ID proof is required for verification';
    }
    if (!formData.drivingLicense) {
      newErrors.drivingLicense = 'Driving license is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* Send real OTP email to the recipient's mail ID */
  const requestOtpDispatch = async () => {
    setOtpSending(true);
    setErrors((prev) => ({ ...prev, otp: null }));
    setOtpSuccessMsg('');
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
      if (data.success) {
        setOtpSuccessMsg(`OTP sent to ${formData.email.trim()}! Please check your inbox.`);
      }
    } catch (err) {
      console.error('OTP Dispatch Error:', err);
    } finally {
      setOtpSending(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
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
          // Allowed from backend! Proceed to OTP step
          await requestOtpDispatch();
          setStep(3);
        }
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleProceedToOtp = async () => {
    if (!validateStep2()) return;

    setDocVerifying(true);
    setErrors((prev) => ({ ...prev, verification: null }));

    try {
      // Send document scans (Aadhaar & Driving License) to backend database
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          idProofBase64: formData.idProofPreview,
          idProofName: formData.idProofName,
          drivingLicenseBase64: formData.drivingLicensePreview,
          drivingLicenseName: formData.drivingLicenseName,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrors((prev) => ({ ...prev, verification: data.message || 'Failed to submit documents.' }));
        setDocVerifying(false);
        return;
      }

      setVerificationRecord(data.verification);

      if (data.verification.status === 'APPROVED') {
        // Already approved earlier
        await requestOtpDispatch();
        setStep(3);
      }
      // If status is PENDING, we do not directly proceed; user sees pending status and can check status
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
              <div className={styles.imagePreviewWrapper}>
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
                      An administrator will verify if they are legitimate documents. Once allowed from the backend, verification will complete.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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

                {/* If backend approved */}
                {verificationRecord && verificationRecord.status === 'APPROVED' && (
                  <div className={styles.verifSuccessBox}>
                    <div className={styles.verifSuccessHeader}>
                      <div className={styles.verifSuccessIcon}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <div>
                        <div className={styles.verifSuccessTitle}>Documents Allowed & Verified!</div>
                        <div style={{ fontSize: '0.78rem', color: '#047857' }}>Backend approved successfully</div>
                      </div>
                    </div>
                    <p className={styles.verifSuccessDesc}>
                      Your Aadhaar card and driving license have been reviewed and verified by backend. You can now proceed to email OTP verification.
                    </p>
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

                  {(!verificationRecord || verificationRecord.status === 'REJECTED') ? (
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
                      onClick={() => {
                        requestOtpDispatch();
                        setStep(3);
                      }}
                    >
                      Proceed to Email OTP
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
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
                    An OTP email has been sent to <strong>{formData.email}</strong>. Check your inbox!
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
                    onClick={requestOtpDispatch}
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
    </div>
  );
}
