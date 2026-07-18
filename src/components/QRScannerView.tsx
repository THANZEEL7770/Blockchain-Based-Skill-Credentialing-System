/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, CheckCircle, ShieldAlert, Key, Clipboard, Scan } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerViewProps {
  darkMode: boolean;
}

export default function QRScannerView({ darkMode }: QRScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualId, setManualId] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);

  // Stop camera feed
  const stopCamera = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Start camera and setup scanning loop
  const startCamera = async () => {
    setError(null);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        videoRef.current.play();
        setScanning(true);
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setError('Could not access camera. Please make sure camera permissions are enabled, or try the manual verification below.');
      setCameraActive(false);
    }
  };

  // Processing loops with Canvas + jsQR
  useEffect(() => {
    let animationFrameId: number;

    const scanFrame = () => {
      if (!scanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_CURRENT_DATA) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code) {
            // QR Code scanned successfully!
            console.log('QR Code payload parsed:', code.data);
            try {
              const qrPayload = JSON.parse(code.data);
              if (qrPayload.id || qrPayload.hash) {
                verifyCertificate(qrPayload.id, qrPayload.hash);
                stopCamera();
                return;
              }
            } catch (e) {
              // Fallback if the scanned QR is just raw text/id instead of JSON
              verifyCertificate(code.data.trim(), undefined);
              stopCamera();
              return;
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    if (scanning) {
      animationFrameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [scanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Server verification function
  const verifyCertificate = async (id: string, hash?: string) => {
    setLoadingVerify(true);
    setError(null);
    try {
      const res = await fetch('/api/certificates/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, hash }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setScanResult({
          isFake: false,
          studentName: data.certificate.studentName,
          institution: data.certificate.institution,
          course: data.certificate.course,
          issueDate: data.certificate.issueDate,
          txHash: data.certificate.txHash,
          ipfsHash: data.certificate.ipfsHash,
          blockNumber: data.blockchain.blockNumber || '4829107',
          timestamp: data.blockchain.timestamp || new Date().toISOString()
        });
      } else if (data.certificate) {
        setScanResult({
          isFake: true,
          status: data.certificate.status,
          studentName: data.certificate.studentName,
          course: data.certificate.course
        });
      } else {
        // Not registered on blockchain (FAKE!)
        setScanResult({
          isFake: true,
          status: 'NOT_FOUND',
          studentName: 'Unknown / Cryptographically Corrupted',
          course: 'Forged Academic Claim'
        });
      }
    } catch (err: any) {
      setError('Blockchain network query timed out.');
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) {
      verifyCertificate(manualId.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Real-Time QR & Blockchain Validator
        </h1>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Extract security signatures directly from the user camera to query the block hashes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Camera view */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-4">
          <div className={`relative w-full aspect-video rounded-3xl overflow-hidden border flex flex-col items-center justify-center ${
            darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
          }`}>
            {/* Video Feed */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
            
            {/* Canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />

            {!cameraActive && !scanResult && (
              <div className="text-center p-6 space-y-4">
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Scan className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">Awaiting Camera Hook</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Permissions must be allowed inside your browser. Handled securely through WebRTC.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {scanning && (
              <div className="absolute inset-0 border-2 border-indigo-500 pointer-events-none animate-pulse">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1] animate-bounce" />
                <div className="absolute top-4 left-4 bg-slate-950/80 px-2.5 py-1 rounded text-[10px] text-white font-mono flex items-center space-x-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                  <span>DECRYPTING LENSES ACTIVE</span>
                </div>
              </div>
            )}
          </div>

          {cameraActive && (
            <button
              onClick={stopCamera}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
            >
              Stop Camera Feed
            </button>
          )}
        </div>

        {/* Right Side: Verification Output */}
        <div className="lg:col-span-5 space-y-6">
          {/* Scanning / Loading state */}
          {loadingVerify && (
            <div className={`p-6 rounded-3xl border text-center space-y-3 animate-pulse ${
              darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
            }`}>
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <div className="text-xs font-mono text-slate-400">Verifying signature on smart contract...</div>
            </div>
          )}

          {/* Verification Results Panel */}
          {scanResult && !loadingVerify && (
            <div className={`p-6 rounded-3xl border shadow-xl text-left space-y-5 animate-fadeIn ${
              scanResult.isFake
                ? (darkMode ? 'glass border-red-500/30' : 'glass-light border-red-200 text-slate-900')
                : (darkMode ? 'glass border-emerald-500/30' : 'glass-light border-emerald-200 text-slate-900')
            }`}>
              {/* Header Status */}
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-700/20">
                {scanResult.isFake ? (
                  <>
                    <div className="p-2 bg-red-500/20 rounded-xl text-red-500">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-base text-red-500">FAKE / TAMPERED CERTIFICATE</div>
                      <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider">
                        Fraud Status: Block Rejected
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-500">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-base text-emerald-500">CERTIFICATE VERIFIED</div>
                      <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                        Status: Secure Cryptographic Match
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Data body */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="text-slate-400 font-mono text-[10px] uppercase">Student Identity</div>
                  <div className="font-semibold text-sm">{scanResult.studentName}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-mono text-[10px] uppercase">Awarded Course</div>
                  <div className="font-semibold text-sm">{scanResult.course}</div>
                </div>

                {!scanResult.isFake && (
                  <>
                    <div>
                      <div className="text-slate-400 font-mono text-[10px] uppercase">Authority Issuer</div>
                      <div className="font-semibold text-sm">{scanResult.institution}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-mono text-[10px] uppercase">Solidity Block Height</div>
                      <div className="font-mono text-sm">#{scanResult.blockNumber}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-mono text-[10px] uppercase">IPFS Gateway Hash</div>
                      <div className="font-mono text-[11px] text-cyan-400 truncate select-all">{scanResult.ipfsHash}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-mono text-[10px] uppercase">Ledger Tx Hash</div>
                      <div className="font-mono text-[11px] text-slate-500 truncate select-all">{scanResult.txHash}</div>
                    </div>
                  </>
                )}

                {scanResult.isFake && (
                  <div className={`p-3 rounded-xl text-xs font-medium leading-relaxed ${
                    darkMode ? 'bg-red-950/40 text-red-400' : 'bg-red-100 text-red-700'
                  }`}>
                    <strong>Security Warning:</strong> This certificate does not correspond to any active blockchain transaction. This may signify an edited document, unauthorized issuer, or backdated claims.
                  </div>
                )}
              </div>

              {/* Reset button */}
              <button
                onClick={() => {
                  setScanResult(null);
                  startCamera();
                }}
                className="w-full flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Re-Initialize Scanner</span>
              </button>
            </div>
          )}

          {/* Fallback Form: Manual Input */}
          {!scanResult && (
            <div className={`p-6 rounded-3xl border space-y-4 ${
              darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
            }`}>
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">Manual Ledger Verification</h3>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                If camera access is blocked inside your sandbox, paste the Certificate ID directly.
              </p>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter Certificate ID (e.g. cert_001)"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${
                    darkMode ? 'bg-slate-950/40 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!manualId.trim() || loadingVerify}
                  className="w-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white text-white font-semibold text-xs py-2.5 rounded-xl transition-colors"
                >
                  Verify Cryptographic ID
                </button>
              </form>
            </div>
          )}

          {error && (
            <div className={`p-4 rounded-2xl border flex items-start space-x-2 text-red-400 text-xs bg-red-950/10 border-red-500/20`}>
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
