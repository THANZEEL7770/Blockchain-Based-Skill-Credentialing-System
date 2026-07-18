/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Database, Link2, Clock, CheckCircle, Cpu, Shield, Search, Terminal } from 'lucide-react';
import { Transaction } from '../types';

interface ExplorerViewProps {
  darkMode: boolean;
}

export default function ExplorerView({ darkMode }: ExplorerViewProps) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/blockchain/blocks');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load blocks telemetry', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const filteredTxs = data?.transactions.filter((tx: Transaction) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      tx.txHash.toLowerCase().includes(term) ||
      tx.from.toLowerCase().includes(term) ||
      tx.method.toLowerCase().includes(term) ||
      (tx.certificateId && tx.certificateId.toLowerCase().includes(term))
    );
  }) || [];

  return (
    <div className="space-y-8 py-6 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            CertiChain Ledger Explorer
          </h1>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Live transactions, block heights, and smart contract audits on the decentralized network.
          </p>
        </div>
        <button
          onClick={fetchBlocks}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5"
        >
          <Cpu className="w-4 h-4" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Database className="w-10 h-10 text-indigo-500 animate-bounce" />
          <p className="text-sm font-mono text-slate-500">Querying simulated Ethereum blocks...</p>
        </div>
      ) : (
        <>
          {/* Blockchain Smart Contract Config Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'}`}>
              <div className="text-xs text-slate-400 font-mono mb-1">Contract Address (Solidity)</div>
              <div className="text-sm font-semibold font-mono tracking-wider truncate text-indigo-400">{data?.contractAddress}</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-1.5 flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Deployed successfully (ERC-721 modified)</span>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'}`}>
              <div className="text-xs text-slate-400 font-mono mb-1">Current Block Height</div>
              <div className="text-sm font-semibold font-mono tracking-wider text-indigo-400">#{data?.blockNumber}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1.5">Network Difficulty: 4.82T</div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'}`}>
              <div className="text-xs text-slate-400 font-mono mb-1">Network Host Authority</div>
              <div className="text-sm font-semibold font-mono tracking-wider text-indigo-400 truncate">{data?.ownerAddress}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1.5">Consensus: Proof of Authority</div>
            </div>
          </div>

          {/* Search Tx Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Transaction Hash, Wallet Address, or Certificate ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-3.5 pl-11 rounded-xl text-xs font-mono border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                darkMode ? 'glass border-slate-800/50 text-white' : 'glass-light border-slate-200/50 text-slate-950'
              }`}
            />
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          </div>

          {/* Transaction Grid */}
          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'glass border-slate-800/35' : 'glass-light border-slate-200/35'}`}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${darkMode ? 'border-slate-800/40 bg-slate-900/10' : 'border-slate-200/30 bg-slate-50/10'}`}>
              <span className="font-semibold text-sm">Transactions Log Ledger</span>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded">
                {filteredTxs.length} TXs found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-slate-400 text-[10px] font-mono border-b ${darkMode ? 'border-slate-800 bg-slate-900/10' : 'border-slate-200 bg-slate-50'}`}>
                    <th className="p-4">Tx Hash</th>
                    <th className="p-4">Block</th>
                    <th className="p-4">Age</th>
                    <th className="p-4">From Address</th>
                    <th className="p-4">Smart Contract Method</th>
                    <th className="p-4">Gas Status</th>
                    <th className="p-4 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono divide-y divide-slate-800/20">
                  {filteredTxs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTxs.map((tx: Transaction) => (
                      <tr key={tx.txHash} className={`hover:bg-slate-500/5 transition-all`}>
                        <td className="p-4 text-indigo-400 truncate max-w-[120px]" title={tx.txHash}>
                          {tx.txHash}
                        </td>
                        <td className="p-4">#{tx.blockNumber}</td>
                        <td className="p-4 flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                        </td>
                        <td className="p-4 text-slate-400 truncate max-w-[120px]" title={tx.from}>
                          {tx.from}
                        </td>
                        <td className="p-4">
                          <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px]">
                            {tx.method}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {tx.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded text-[10px]"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* INSPECT MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 space-y-4 shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-950'
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm">Forensic Block JSON Details</span>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800/50">
              {JSON.stringify({
                _metadata: "Ethereum Simulated Gas Transaction Frame",
                hash: selectedTx.txHash,
                contract: "0x99655B7C16f243A23e685a49A3f03b223CDAfeA7",
                block: selectedTx.blockNumber,
                gasUsed: "48201 Wei",
                timestamp: selectedTx.timestamp,
                from: selectedTx.from,
                method: selectedTx.method,
                payload: selectedTx.certificateId ? {
                  certificateId: selectedTx.certificateId,
                  ipfsGateway: `https://ipfs.io/ipfs/QmSignatureGatewayHash`
                } : "Internal state setup"
              }, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
