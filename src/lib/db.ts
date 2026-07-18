/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { User, Certificate, AuditLog, DashboardStats } from '../types';

const DB_FILE = path.join(process.cwd(), 'db.json');

interface DatabaseSchema {
  users: User[];
  certificates: Certificate[];
  auditLogs: AuditLog[];
  approvedInstitutions: { name: string; approvedBy: string; approvedAt: string; walletAddress: string }[];
}

const initialDb: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin',
      email: 'admin@credential.gov',
      name: 'System Admin',
      role: 'admin',
      isVerified: true,
      twoFactorEnabled: true
    },
    {
      id: 'usr_inst1',
      email: 'dean@stanford.edu',
      name: 'Dean of Stanford',
      role: 'institution',
      institutionName: 'Stanford University',
      walletAddress: '0x321658Fdf9D479B3e9086f6d50ffDe4B31479169',
      isVerified: true,
      twoFactorEnabled: true
    },
    {
      id: 'usr_stud1',
      email: 'alex@student.com',
      name: 'Alex Johnson',
      role: 'student',
      walletAddress: '0x8b3df98A3Ccf2C086fB1fe386D5A2bcFDeE89d7F',
      isVerified: true,
      twoFactorEnabled: false
    },
    {
      id: 'usr_stud2',
      email: 'thanzeel2006@gmail.com',
      name: 'Thanzeel',
      role: 'student',
      walletAddress: '0x9E99fBDeEF7B76f790c0F7fA3e89dA2BCFDeE2B3',
      isVerified: true,
      twoFactorEnabled: false
    }
  ],
  certificates: [
    {
      id: 'cert_001',
      studentName: 'Alex Johnson',
      studentEmail: 'alex@student.com',
      institution: 'Stanford University',
      course: 'Advanced Blockchain Engineering',
      issueDate: '2026-05-10',
      grade: 'A+',
      certificateHash: '0x8a92440cfbfd8e5e89d1b6cf84931a72ae4549b934ca495991b7852b855bc8d4',
      ipfsHash: 'QmYwAPz8r7v9H9oF76Ff8d5SgL6X37s8b7C45XgP8L63gD',
      txHash: '0x4ea2778da128be2bc8d4d549E086f6d50ffDe4B31479169a53fe2d321658Fdf9',
      status: 'active',
      signature: 'sig_a831f24d868eb92d19b4cf84931a72',
      qrCode: '',
      fraudScore: 3,
      fraudAnalysis: 'Digital signature verified. Metadata matches public blockchain records. Fonts and layouts show high consistency with Stanford templates.'
    }
  ],
  auditLogs: [
    {
      id: 'log_001',
      userId: 'usr_admin',
      userName: 'System Admin',
      role: 'admin',
      action: 'CONTRACT_DEPLOY',
      timestamp: '2026-07-18T01:10:00.000Z',
      details: 'Smart Contract deployed at address 0x99655B7C16f243A23e685a49A3f03b223CDAfeA7'
    },
    {
      id: 'log_002',
      userId: 'usr_admin',
      userName: 'System Admin',
      role: 'admin',
      action: 'APPROVE_INSTITUTION',
      timestamp: '2026-07-18T01:15:00.000Z',
      details: 'Approved Stanford University as a legitimate certificate issuer'
    }
  ],
  approvedInstitutions: [
    {
      name: 'Stanford University',
      approvedBy: 'System Admin',
      approvedAt: '2026-07-18T01:15:00.000Z',
      walletAddress: '0x321658Fdf9D479B3e9086f6d50ffDe4B31479169'
    },
    {
      name: 'Massachusetts Institute of Technology',
      approvedBy: 'System Admin',
      approvedAt: '2026-07-18T01:16:00.000Z',
      walletAddress: '0x771658Fdf9D479B3e9086f6d50ffDe4B31479169'
    }
  ]
};

class FileDb {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.read();
  }

  private read(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to read db file, creating new db', e);
    }
    this.write(initialDb);
    return initialDb;
  }

  private write(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write db file', e);
    }
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public saveUser(user: User) {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.write(this.data);
  }

  public getCertificates(): Certificate[] {
    return this.data.certificates;
  }

  public getCertificateById(id: string): Certificate | undefined {
    return this.data.certificates.find(c => c.id === id);
  }

  public getCertificateByHash(hash: string): Certificate | undefined {
    return this.data.certificates.find(c => c.certificateHash === hash);
  }

  public saveCertificate(cert: Certificate) {
    const idx = this.data.certificates.findIndex(c => c.id === cert.id);
    if (idx >= 0) {
      this.data.certificates[idx] = cert;
    } else {
      this.data.certificates.push(cert);
    }
    this.write(this.data);
  }

  public deleteCertificate(id: string) {
    this.data.certificates = this.data.certificates.filter(c => c.id !== id);
    this.write(this.data);
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public saveAuditLog(log: AuditLog) {
    this.data.auditLogs.unshift(log);
    this.write(this.data);
  }

  public getApprovedInstitutions() {
    return this.data.approvedInstitutions;
  }

  public saveApprovedInstitution(inst: { name: string; approvedBy: string; approvedAt: string; walletAddress: string }) {
    if (!this.data.approvedInstitutions.some(i => i.name === inst.name)) {
      this.data.approvedInstitutions.push(inst);
      this.write(this.data);
    }
  }

  public getStats(): DashboardStats {
    const certs = this.data.certificates;
    const insts = this.data.approvedInstitutions.length;
    const students = new Set(certs.map(c => c.studentEmail)).size;
    const verified = certs.filter(c => c.status === 'active').length;
    const fraudAlerts = certs.filter(c => (c.fraudScore && c.fraudScore > 50) || c.isFake).length;
    
    return {
      totalCertificates: certs.length,
      activeInstitutions: insts,
      totalStudents: students || 2,
      verifiedCount: verified,
      blockchainBlocks: 4829104 + certs.length * 3 + insts * 2,
      fraudAlerts
    };
  }
}

export const db = new FileDb();
export { DB_FILE };
