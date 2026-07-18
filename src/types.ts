/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'institution' | 'student' | 'verifier';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  institutionName?: string;
  walletAddress?: string;
  isVerified: boolean;
  twoFactorEnabled?: boolean;
}

export interface Certificate {
  id: string;
  studentName: string;
  studentEmail: string;
  institution: string;
  course: string;
  issueDate: string;
  grade: string;
  certificateHash: string;
  ipfsHash: string;
  txHash: string;
  status: 'active' | 'revoked';
  signature: string;
  qrCode: string;
  fraudScore?: number; // AI assessment 0-100
  fraudAnalysis?: string; // AI text explanation
  fileUrl?: string; // Data URI or mock IPFS gateway URL
  isFake?: boolean;
}

export interface Transaction {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  method: string;
  certificateId?: string;
  status: 'success' | 'failed';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  timestamp: string;
  details: string;
}

export interface DashboardStats {
  totalCertificates: number;
  activeInstitutions: number;
  totalStudents: number;
  verifiedCount: number;
  blockchainBlocks: number;
  fraudAlerts: number;
}
