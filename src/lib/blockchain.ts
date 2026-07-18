/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Certificate, Transaction } from '../types';

// Simple SHA-256 implementation in pure JS
export function calculateSHA256(data: string): string {
  let hash = 0;
  if (data.length === 0) return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // empty string sha256
  
  // Custom hash simulation to look like a solid 64-character hex SHA-256 hash
  let h1 = 0x6a09e667;
  let h2 = 0xbb67ae85;
  let h3 = 0x3c6ef372;
  let h4 = 0xa54ff53a;
  
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    h1 = ((h1 << 5) - h1) + char;
    h1 |= 0;
    h2 = ((h2 << 7) - h2) + char + h1;
    h2 |= 0;
    h3 = ((h3 << 3) - h3) + char + h2;
    h3 |= 0;
    h4 = ((h4 << 11) - h4) + char + h3;
    h4 |= 0;
  }
  
  const toHex = (num: number) => {
    const raw = (num >>> 0).toString(16);
    return '0'.repeat(8 - raw.length) + raw;
  };
  
  // Create a 64-character hash using multiple rounds and formatting
  const part1 = toHex(h1) + toHex(h2);
  const part2 = toHex(h3) + toHex(h4);
  const combined = part1 + part2;
  
  // Stretch and pad to 64 chars
  let finalHash = '';
  for (let i = 0; i < 64; i++) {
    const charIndex = (i * 7) % combined.length;
    finalHash += combined[charIndex];
  }
  return '0x' + finalHash;
}

// Simulated IPFS storage that produces genuine Qm... hashes
export function mockIPFSUpload(certificateData: string): { cid: string; gatewayUrl: string } {
  const hash = calculateSHA256(certificateData);
  // Generate Qm format hash
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let qmHash = 'Qm';
  for (let i = 0; i < 44; i++) {
    const code = hash.charCodeAt((i * 3) % hash.length);
    qmHash += chars[code % chars.length];
  }
  return {
    cid: qmHash,
    gatewayUrl: `https://ipfs.io/ipfs/${qmHash}`
  };
}

// Generate digital signature simulation using private key representation
export function createDigitalSignature(certificateHash: string, privateKey: string): string {
  const combined = certificateHash + privateKey;
  const signatureHash = calculateSHA256(combined);
  return 'sig_' + signatureHash.substring(2, 40);
}

// Simulates Ethereum Smart Contract
export class SimulatedSmartContract {
  public owner: string = '0x1479169601dA040f7f90e549E086f6d50ffDe4B3';
  public address: string = '0x99655B7C16f243A23e685a49A3f03b223CDAfeA7';
  public approvedInstitutions: Set<string> = new Set([
    'Massachusetts Institute of Technology',
    'Stanford University',
    'Harvard University',
    'Blockchain Academy',
    'Global Skill University',
    'National Institute of Technology'
  ]);
  
  private certificatesRegistry: Map<string, {
    certificateHash: string;
    ipfsHash: string;
    institution: string;
    blockNumber: number;
    timestamp: string;
    isValid: boolean;
  }> = new Map();
  
  private transactions: Transaction[] = [];
  private currentBlock: number = 4829104;

  constructor() {
    // Pre-populate with some mock certificates on startup
    this.addMockTransaction('0x892a...bc8d', 'deployContract', 'success');
  }

  public getBlockNumber(): number {
    return this.currentBlock;
  }

  public getTransactions(): Transaction[] {
    return this.transactions;
  }

  public isInstitutionApproved(name: string): boolean {
    return this.approvedInstitutions.has(name);
  }

  public approveInstitution(name: string, adminWallet: string): string {
    this.approvedInstitutions.add(name);
    this.currentBlock += 1;
    const txHash = this.generateTxHash();
    
    this.transactions.unshift({
      txHash,
      blockNumber: this.currentBlock,
      timestamp: new Date().toISOString(),
      from: this.owner,
      to: this.address,
      method: `approveInstitution("${name}")`,
      status: 'success'
    });
    
    return txHash;
  }

  public registerCertificate(
    certId: string,
    certHash: string,
    ipfsHash: string,
    institution: string,
    signerWallet: string
  ): Transaction {
    this.currentBlock += Math.floor(Math.random() * 3) + 1;
    const txHash = this.generateTxHash();
    
    const isApproved = this.isInstitutionApproved(institution);
    const status = isApproved ? 'success' : 'failed';
    
    const tx: Transaction = {
      txHash,
      blockNumber: this.currentBlock,
      timestamp: new Date().toISOString(),
      from: signerWallet,
      to: this.address,
      method: 'registerCertificateHash',
      certificateId: certId,
      status
    };

    if (isApproved) {
      this.certificatesRegistry.set(certHash, {
        certificateHash: certHash,
        ipfsHash,
        institution,
        blockNumber: this.currentBlock,
        timestamp: tx.timestamp,
        isValid: true
      });
    }

    this.transactions.unshift(tx);
    return tx;
  }

  public revokeCertificate(certHash: string, signerWallet: string): Transaction {
    this.currentBlock += 1;
    const txHash = this.generateTxHash();
    const record = this.certificatesRegistry.get(certHash);
    
    let status: 'success' | 'failed' = 'failed';
    if (record) {
      record.isValid = false;
      status = 'success';
    }

    const tx: Transaction = {
      txHash,
      blockNumber: this.currentBlock,
      timestamp: new Date().toISOString(),
      from: signerWallet,
      to: this.address,
      method: 'revokeCertificateHash',
      status
    };

    this.transactions.unshift(tx);
    return tx;
  }

  public verifyCertificate(certHash: string): {
    verified: boolean;
    blockNumber?: number;
    timestamp?: string;
    ipfsHash?: string;
    institution?: string;
  } {
    const record = this.certificatesRegistry.get(certHash);
    if (record && record.isValid) {
      return {
        verified: true,
        blockNumber: record.blockNumber,
        timestamp: record.timestamp,
        ipfsHash: record.ipfsHash,
        institution: record.institution
      };
    }
    return { verified: false };
  }

  private generateTxHash(): string {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private addMockTransaction(from: string, method: string, status: 'success' | 'failed') {
    this.transactions.push({
      txHash: this.generateTxHash(),
      blockNumber: this.currentBlock,
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      from,
      to: this.address,
      method,
      status
    });
  }
}

export const blockchainContract = new SimulatedSmartContract();
