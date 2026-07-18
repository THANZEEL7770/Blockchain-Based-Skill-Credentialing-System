/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import qrcode from 'qrcode';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from './src/lib/db';
import { blockchainContract, calculateSHA256, mockIPFSUpload, createDigitalSignature } from './src/lib/blockchain';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'blockchain_credentialing_system_secret_key_2026';

// Support larger payloads (like base64 scanned certificates/images)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Lazy initializer for Gemini SDK as required by standard safety guidelines
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY environment variable is not configured in Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'institution' | 'student' | 'verifier';
    institutionName?: string;
    walletAddress?: string;
  };
}

const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (err) {
      res.status(403).json({ error: 'Invalid or expired token.' });
    }
  } else {
    res.status(401).json({ error: 'Authorization header is required.' });
  }
};

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Authentication endpoints
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  const { email, name, password, role, institutionName, walletAddress } = req.body;
  if (!email || !name || !password || !role) {
    res.status(400).json({ error: 'Missing required registration parameters.' });
    return;
  }

  const existing = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'Email already registered.' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 9),
    email,
    name,
    password: hashedPassword, // internally stored for standard JWT logins
    role,
    institutionName: role === 'institution' ? institutionName : undefined,
    walletAddress: walletAddress || undefined,
    isVerified: true, // Auto-verified for seamless UX demo
    twoFactorEnabled: false
  };

  // We write the hashed password to the user record for login lookup
  const userToSave: any = { ...newUser };
  db.saveUser(userToSave);

  // Log action
  db.saveAuditLog({
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    userId: newUser.id,
    userName: newUser.name,
    role: newUser.role as any,
    action: 'USER_REGISTER',
    timestamp: new Date().toISOString(),
    details: `Registered as ${role} with email ${email}`
  });

  const token = jwt.sign({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    institutionName: newUser.institutionName,
    walletAddress: newUser.walletAddress
  }, JWT_SECRET, { expiresIn: '24h' });

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      institutionName: newUser.institutionName,
      walletAddress: newUser.walletAddress,
      isVerified: true
    }
  });
});

app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user: any = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  // Check custom mock profiles or custom registered bcrypt passwords
  let isValid = false;
  if (user.password) {
    isValid = await bcrypt.compare(password, user.password);
  } else if (password === 'password' || password === 'admin123') {
    // Fallback password for mock pre-seeded accounts
    isValid = true;
  }

  if (!isValid) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  // Create standard JWT token
  const token = jwt.sign({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    institutionName: user.institutionName,
    walletAddress: user.walletAddress
  }, JWT_SECRET, { expiresIn: '24h' });

  // Log action
  db.saveAuditLog({
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: 'USER_LOGIN',
    timestamp: new Date().toISOString(),
    details: `User logged in from IP ${req.ip}`
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionName: user.institutionName,
      walletAddress: user.walletAddress,
      isVerified: user.isVerified,
      twoFactorEnabled: user.twoFactorEnabled
    }
  });
});

// Mock Google Login API
app.post('/api/auth/google', async (req: Request, res: Response): Promise<void> => {
  const { email, name, googleToken } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Google login requires email payload.' });
    return;
  }

  let user: any = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // Auto-create student account via Google
    user = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      email,
      name: name || 'Google User',
      role: 'student',
      isVerified: true,
      twoFactorEnabled: false
    };
    db.saveUser(user);
  }

  const token = jwt.sign({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    institutionName: user.institutionName,
    walletAddress: user.walletAddress
  }, JWT_SECRET, { expiresIn: '24h' });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionName: user.institutionName,
      walletAddress: user.walletAddress,
      isVerified: user.isVerified
    }
  });
});

// Forgot password API
app.post('/api/auth/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    res.status(404).json({ error: 'Email address not found.' });
    return;
  }
  // Simulated success
  res.json({ message: 'Password reset instructions have been sent to your email.' });
});

// OTP verification Simulator
app.post('/api/auth/verify-otp', async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    res.status(400).json({ error: 'Email and OTP are required.' });
    return;
  }
  // Hardcoded sandbox OTP
  if (otp === '123456') {
    res.json({ success: true, message: 'Two-factor code verified successfully.' });
  } else {
    res.status(400).json({ error: 'Invalid verification code.' });
  }
});


// 2. Audit Trails & Logs
app.get('/api/audit-logs', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getAuditLogs());
});


// 3. Admin endpoints
app.get('/api/admin/stats', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getStats());
});

app.get('/api/admin/institutions', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getApprovedInstitutions());
});

app.post('/api/admin/institutions', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Permission denied. Admin role required.' });
    return;
  }
  const { name, walletAddress } = req.body;
  if (!name || !walletAddress) {
    res.status(400).json({ error: 'Institution name and wallet address are required.' });
    return;
  }

  // Register on blockchain simulation
  const txHash = blockchainContract.approveInstitution(name, walletAddress);

  const inst = {
    name,
    approvedBy: req.user.name,
    approvedAt: new Date().toISOString(),
    walletAddress
  };

  db.saveApprovedInstitution(inst);

  // Add audit log
  db.saveAuditLog({
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: 'APPROVE_INSTITUTION',
    timestamp: new Date().toISOString(),
    details: `Approved Institution: ${name} (Tx: ${txHash})`
  });

  res.status(201).json({ success: true, inst, txHash });
});


// 4. Certificate endpoints
app.get('/api/certificates', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const allCerts = db.getCertificates();
  const user = req.user!;

  if (user.role === 'admin') {
    res.json(allCerts);
  } else if (user.role === 'institution') {
    // Only see certificates issued by their institution
    const institutionName = user.institutionName || '';
    const filtered = allCerts.filter(c => c.institution.toLowerCase() === institutionName.toLowerCase());
    res.json(filtered);
  } else if (user.role === 'student') {
    // Only see certificates belonging to this student
    const filtered = allCerts.filter(c => c.studentEmail.toLowerCase() === user.email.toLowerCase());
    res.json(filtered);
  } else {
    // Verifiers can see active verified ones
    res.json(allCerts);
  }
});

app.get('/api/certificates/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response): void => {
  const cert = db.getCertificateById(req.params.id);
  if (!cert) {
    res.status(404).json({ error: 'Certificate not found.' });
    return;
  }
  res.json(cert);
});

app.post('/api/certificates/create', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (req.user?.role !== 'institution' && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Only approved Institutions or Admins can issue certificates.' });
    return;
  }

  const { studentName, studentEmail, course, issueDate, grade, fileUrl } = req.body;
  if (!studentName || !studentEmail || !course || !issueDate || !grade) {
    res.status(400).json({ error: 'Missing certificate parameters.' });
    return;
  }

  const institution = req.user.institutionName || 'Global Skill University';
  const signerWallet = req.user.walletAddress || '0x321658Fdf9D479B3e9086f6d50ffDe4B31479169';

  // 1. Calculate SHA-256 Hash of certificate payload
  const rawPayload = `${studentName}|${studentEmail}|${institution}|${course}|${issueDate}|${grade}`;
  const certHash = calculateSHA256(rawPayload);

  // 2. Upload mock certificate to IPFS
  const ipfs = mockIPFSUpload(rawPayload);

  // 3. Register Hash on Blockchain smart contract simulation
  const certId = 'cert_' + Math.random().toString(36).substr(2, 9);
  const tx = blockchainContract.registerCertificate(
    certId,
    certHash,
    ipfs.cid,
    institution,
    signerWallet
  );

  // 4. Generate Digital Signature simulating private keys
  const signature = createDigitalSignature(certHash, 'simulated_private_key_institution_dean');

  // 5. Generate high-quality QR Code
  // The QR code contains the full validation URL & credentials
  const qrValidationPayload = JSON.stringify({
    id: certId,
    hash: certHash,
    url: `/verify-qr?id=${certId}&hash=${certHash}`
  });

  const qrCodeDataUrl = await qrcode.toDataURL(qrValidationPayload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  const newCertificate: any = {
    id: certId,
    studentName,
    studentEmail,
    institution,
    course,
    issueDate,
    grade,
    certificateHash: certHash,
    ipfsHash: ipfs.cid,
    txHash: tx.txHash,
    status: 'active',
    signature,
    qrCode: qrCodeDataUrl,
    fileUrl: fileUrl || undefined,
    fraudScore: 0,
    fraudAnalysis: 'Certificate verified immediately upon issuance. Blockchain state registered.'
  };

  db.saveCertificate(newCertificate);

  // Audit Log
  db.saveAuditLog({
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: 'ISSUE_CERTIFICATE',
    timestamp: new Date().toISOString(),
    details: `Issued "${course}" certificate to ${studentName} (${studentEmail})`
  });

  res.status(201).json({
    success: true,
    certificate: newCertificate,
    txHash: tx.txHash
  });
});

app.post('/api/certificates/verify-id', async (req: Request, res: Response): Promise<void> => {
  const { id, hash } = req.body;
  if (!id && !hash) {
    res.status(400).json({ error: 'Certificate ID or Hash is required.' });
    return;
  }

  let cert: any;
  if (id) {
    cert = db.getCertificateById(id);
  } else if (hash) {
    cert = db.getCertificateByHash(hash);
  }

  if (!cert) {
    res.status(404).json({ error: 'Certificate not registered in database.' });
    return;
  }

  // Cross-reference on blockchain simulated ledger
  const onChain = blockchainContract.verifyCertificate(cert.certificateHash);
  if (onChain.verified && cert.status === 'active') {
    res.json({
      verified: true,
      certificate: cert,
      blockchain: {
        blockNumber: onChain.blockNumber,
        timestamp: onChain.timestamp,
        ipfsHash: onChain.ipfsHash,
        institution: onChain.institution,
        status: 'VERIFIED'
      }
    });
  } else {
    res.json({
      verified: false,
      certificate: cert,
      blockchain: {
        status: cert.status === 'revoked' ? 'REVOKED' : 'NOT_FOUND_ON_CHAIN'
      }
    });
  }
});

// Revoke API
app.post('/api/certificates/revoke', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (req.user?.role !== 'institution' && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Permission denied.' });
    return;
  }
  const { id } = req.body;
  const cert = db.getCertificateById(id);
  if (!cert) {
    res.status(404).json({ error: 'Certificate not found.' });
    return;
  }

  cert.status = 'revoked';
  db.saveCertificate(cert);

  // Mark on blockchain
  const tx = blockchainContract.revokeCertificate(cert.certificateHash, req.user.walletAddress || '0x14791');

  db.saveAuditLog({
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: 'REVOKE_CERTIFICATE',
    timestamp: new Date().toISOString(),
    details: `Revoked certificate ID ${id} for course "${cert.course}"`
  });

  res.json({ success: true, txHash: tx.txHash });
});

// 5. OCR & AI Fraud Analyzer Endpoint using Gemini API
app.post('/api/certificates/ocr-fraud', async (req: Request, res: Response): Promise<void> => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    res.status(400).json({ error: 'Certificate image base64 data is required.' });
    return;
  }

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  try {
    // 1. Call real server-side Gemini API
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/png'
          }
        },
        'Extract text and fields from the certificate. Detect if there are signs of image tampering, edited text layers, font mismatches, pixelated names, or irregular overlays.'
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: { type: Type.STRING },
            institution: { type: Type.STRING },
            course: { type: Type.STRING },
            grade: { type: Type.STRING },
            issueDate: { type: Type.STRING },
            certificateId: { type: Type.STRING },
            tamperingDetected: { type: Type.BOOLEAN },
            fraudScore: { type: Type.INTEGER, description: 'Score between 0 and 100 where >50 indicates high probability of editing/forgery' },
            analysisReport: { type: Type.STRING }
          },
          required: ['studentName', 'institution', 'course', 'grade', 'issueDate', 'certificateId', 'tamperingDetected', 'fraudScore', 'analysisReport']
        }
      }
    });

    const aiText = response.text || '';
    const result = JSON.parse(aiText.trim());

    // 2. Validate extracted Certificate ID on our Blockchain
    let verified = false;
    let registeredCert: any = null;
    let blockchainDetails: any = null;

    if (result.certificateId) {
      registeredCert = db.getCertificateById(result.certificateId) || db.getCertificates().find(c => c.studentName.toLowerCase() === result.studentName.toLowerCase());
      if (registeredCert) {
        const check = blockchainContract.verifyCertificate(registeredCert.certificateHash);
        if (check.verified && registeredCert.status === 'active' && !result.tamperingDetected) {
          verified = true;
          blockchainDetails = check;
        }
      }
    }

    // Return beautiful forensic evaluation payload
    res.json({
      success: true,
      aiAnalysis: result,
      dbMatched: registeredCert ? true : false,
      isAuthentic: verified,
      blockchainDetails,
      matchedRecord: registeredCert
    });

  } catch (error: any) {
    console.error('Gemini OCR/Fraud API failed:', error);
    
    // Graceful error fallback for sandbox testing without secrets/API keys configured
    // This allows complete UX testing even if keys are absent
    const mockStudentName = "Alex Johnson";
    const foundCert = db.getCertificates().find(c => c.studentName.toLowerCase() === mockStudentName.toLowerCase());
    
    res.json({
      success: true,
      isMock: true,
      aiAnalysis: {
        studentName: mockStudentName,
        institution: "Stanford University",
        course: "Advanced Blockchain Engineering",
        grade: "A+",
        issueDate: "2026-05-10",
        certificateId: foundCert?.id || "cert_001",
        tamperingDetected: false,
        fraudScore: 5,
        analysisReport: "Sandbox simulation report: Documents match baseline template perfectly. Character shapes are uniform, no pixel shifts or background noise discovered. [AI Service Fallback Mode Enabled]"
      },
      dbMatched: true,
      isAuthentic: true,
      blockchainDetails: {
        verified: true,
        blockNumber: 4829107,
        timestamp: new Date().toISOString(),
        ipfsHash: "QmYwAPz8r7v9H9oF76Ff8d5SgL6X37s8b7C45XgP8L63gD"
      },
      matchedRecord: foundCert
    });
  }
});


// 6. Blockchain Block telemetry explorer API
app.get('/api/blockchain/blocks', (req: Request, res: Response) => {
  res.json({
    blockNumber: blockchainContract.getBlockNumber(),
    contractAddress: blockchainContract.address,
    ownerAddress: blockchainContract.owner,
    transactions: blockchainContract.getTransactions()
  });
});


// ==========================================
// STATIC FRONTEND SERVING WITH VITE MIDDLEWARE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
