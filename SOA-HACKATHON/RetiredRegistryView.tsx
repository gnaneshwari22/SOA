import React, { useState } from 'react';
import { 
  Archive, 
  Search, 
  ShieldCheck, 
  FileText, 
  X, 
  Printer, 
  CheckCircle, 
  Hash, 
  Calendar, 
  Building,
  Download,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { RetirementRecord } from '../types';

interface RetiredRegistryViewProps {
  retirements: RetirementRecord[];
}

export const RetiredRegistryView: React.FC<RetiredRegistryViewProps> = ({ retirements }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRetirement, setSelectedRetirement] = useState<RetirementRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [printNotice, setPrintNotice] = useState<string | null>(null);

  const filteredRetirements = retirements.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.serialNumber.toLowerCase().includes(q) ||
      r.claimReference.toLowerCase().includes(q) ||
      r.claimantOrganization.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q)
    );
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const generateCertificateHtml = (record: RetirementRecord) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Retirement Certificate - ${record.serialNumber}</title>
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    body {
      font-family: 'Georgia', serif;
      background-color: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 90vh;
    }
    .cert-container {
      width: 100%;
      max-width: 900px;
      border: 8px double #059669;
      padding: 40px;
      position: relative;
      background: #fafaf9;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .cert-header {
      text-align: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .registry-title {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #059669;
      font-weight: 700;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 26px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #1e293b;
      margin: 10px 0;
    }
    .cert-subtitle {
      font-size: 12px;
      color: #64748b;
      font-style: italic;
    }
    .cert-body {
      font-size: 15px;
      line-height: 1.8;
      text-align: center;
      margin-bottom: 30px;
      color: #334155;
    }
    .cert-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 20px;
      margin-bottom: 25px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      text-align: left;
    }
    .grid-label {
      color: #64748b;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      display: block;
    }
    .grid-value {
      color: #0f172a;
      font-weight: bold;
      font-size: 14px;
      margin-top: 2px;
    }
    .highlight-green {
      color: #059669;
    }
    .seal-box {
      border-top: 1px dashed #cbd5e1;
      padding-top: 15px;
      margin-top: 15px;
      grid-column: span 2;
    }
    .hash-text {
      font-size: 10px;
      color: #475569;
      word-break: break-all;
    }
    .footer-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 40px;
      padding-top: 20px;
    }
    .signature-block {
      text-align: center;
      width: 220px;
    }
    .sig-line {
      border-bottom: 1px solid #475569;
      margin-bottom: 6px;
      height: 30px;
    }
    .sig-name {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      font-weight: bold;
      color: #1e293b;
    }
    .sig-sub {
      font-size: 10px;
      color: #64748b;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 72px;
      font-weight: bold;
      color: rgba(5, 150, 105, 0.05);
      letter-spacing: 12px;
      text-transform: uppercase;
      pointer-events: none;
      z-index: 0;
    }
    .print-actions {
      text-align: center;
      margin-bottom: 25px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .print-btn {
      background: #059669;
      color: white;
      border: none;
      padding: 10px 22px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .print-btn:hover {
      background: #047857;
    }
    @media print {
      .print-actions { display: none !important; }
      body { padding: 0 !important; background: #ffffff !important; }
      .cert-container { box-shadow: none !important; max-width: 100% !important; border: 6px double #059669 !important; }
    }
  </style>
</head>
<body>
  <div>
    <div class="print-actions">
      <button class="print-btn" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
    </div>
    <div class="cert-container">
      <div class="watermark">PERMANENTLY RETIRED</div>
      
      <div class="cert-header">
        <div class="registry-title">Global Clean Energy Registry · Team 17 Microservices</div>
        <h1>Certificate of Renewable Energy Retirement</h1>
        <div class="cert-subtitle">Official Non-Transferable Tamper-Evident Proof of Generation Claim</div>
      </div>

      <div class="cert-body">
        This document certifies that the following Renewable Energy Certificate (REC) has been permanently retired and surrendered from commercial circulation in the Registry. It represents verified, exclusive renewable energy generation that can never be traded, transferred, or claimed again.
      </div>

      <div class="cert-grid">
        <div>
          <span class="grid-label">Certificate Serial Number:</span>
          <div class="grid-value highlight-green">${record.serialNumber}</div>
        </div>
        <div>
          <span class="grid-label">Claim Reference Number:</span>
          <div class="grid-value">${record.claimReference}</div>
        </div>
        <div>
          <span class="grid-label">Beneficiary Claimant:</span>
          <div class="grid-value">${record.claimantOrganization}</div>
        </div>
        <div>
          <span class="grid-label">Certified Clean Energy Quantity:</span>
          <div class="grid-value highlight-green">${record.energyQuantityMWh} MWh (${record.energySource})</div>
        </div>
        <div>
          <span class="grid-label">Authorizing Agent:</span>
          <div class="grid-value">${record.retiredBy}</div>
        </div>
        <div>
          <span class="grid-label">Retirement Timestamp (UTC):</span>
          <div class="grid-value">${new Date(record.retirementTimestamp).toUTCString()}</div>
        </div>
        <div style="grid-column: span 2;">
          <span class="grid-label">Stated Claim Purpose:</span>
          <div class="grid-value" style="font-family: Georgia, serif; font-style: italic; font-size: 13px;">${record.purpose}</div>
        </div>
        <div class="seal-box">
          <span class="grid-label">Cryptographic Proof Seal (SHA-256 Digest):</span>
          <div class="hash-text">${record.verificationHash}</div>
        </div>
      </div>

      <div class="footer-signatures">
        <div class="signature-block">
          <div class="sig-line"></div>
          <div class="sig-name">Registry Registrar</div>
          <div class="sig-sub">Global Clean Energy Registry</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 24px; color: #059669;">★</div>
          <div style="font-size: 10px; font-weight: bold; color: #059669; letter-spacing: 1px;">OFFICIAL SEAL</div>
        </div>
        <div class="signature-block">
          <div class="sig-line"></div>
          <div class="sig-name">SOA Gateway Controller</div>
          <div class="sig-sub">Kafka Topic: soa.s10.t17.events</div>
        </div>
      </div>
    </div>
  </div>
  <script>
    // Automatically trigger print on load if requested
    window.onload = function() {
      setTimeout(function() {
        try { window.print(); } catch(e) {}
      }, 500);
    };
  </script>
</body>
</html>`;
  };

  const handleDownloadProof = (record: RetirementRecord) => {
    const htmlContent = generateCertificateHtml(record);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RETIREMENT-PROOF-${record.serialNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setPrintNotice('Official Printable Certificate downloaded! Open it in any browser to print or export as PDF.');
    setTimeout(() => setPrintNotice(null), 6000);
  };

  const handlePrintProof = (record: RetirementRecord) => {
    setPrintNotice('Triggering print dialog... If your browser blocks iframe printing, use "Download HTML Proof" below.');
    setTimeout(() => setPrintNotice(null), 6000);

    try {
      window.print();
    } catch (err) {
      console.warn('Direct print call prevented by iframe sandbox:', err);
      handleDownloadProof(record);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Immutable Retired Certificates Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Permanent, tamper-evident registry of all retired certificates with cryptographic verification proofs.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Retired: <span className="text-emerald-400 font-bold tabular-nums">{retirements.length}</span>
        </div>
      </div>

      {/* Print / Download notification toast */}
      {printNotice && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 px-4 py-3 rounded text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{printNotice}</span>
          </div>
          <button
            onClick={() => setPrintNotice(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by serial number, claim reference, claimant organization, or purpose..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Table of Retired Certificates */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Certificate Serial</th>
                <th className="py-3 px-4">Claim Reference</th>
                <th className="py-3 px-4">Claimant Organization</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Energy Source</th>
                <th className="py-3 px-4">Retirement Date</th>
                <th className="py-3 px-4 text-right">Certificate Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRetirements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No retired certificates found.
                  </td>
                </tr>
              ) : (
                filteredRetirements.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedRetirement(record)}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      {record.serialNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">
                      {record.claimReference}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {record.claimantOrganization}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-white tabular-nums">
                      {record.energyQuantityMWh} MWh
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {record.energySource}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono tabular-nums">
                      {new Date(record.retirementTimestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedRetirement(record)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded transition-colors inline-flex items-center gap-1.5"
                          title="View Official Certificate"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          View Proof
                        </button>
                        <button
                          onClick={() => handleDownloadProof(record)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] rounded transition-colors"
                          title="Download Printable Certificate (.html)"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Retirement Certificate Modal */}
      {selectedRetirement && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div 
            id="printable-certificate"
            className="bg-slate-900 border border-slate-800 rounded max-w-2xl w-full p-8 space-y-6 relative text-slate-100 my-8 shadow-2xl"
          >
            <button
              onClick={() => setSelectedRetirement(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors no-print"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Certificate Header Banner */}
            <div className="text-center space-y-2 border-b border-slate-800 pb-6">
              <div className="inline-flex p-2 bg-emerald-950 border border-emerald-800/80 rounded-full text-emerald-400 mb-2">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white font-serif uppercase">
                Official Certificate of Renewable Energy Retirement
              </h2>
              <p className="text-xs text-slate-400">
                Issued by Global Clean Energy Registry · Verified by SOA Microservices Gateway
              </p>
            </div>

            {/* Certificate Body */}
            <div className="space-y-4 text-xs leading-relaxed">
              <p className="text-slate-300 text-center">
                This document certifies that the following renewable energy certificate has been
                permanently retired from circulation and cannot be claimed, traded, or retired by any other party:
              </p>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-3 font-mono">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">SERIAL NUMBER:</span>
                    <div className="text-emerald-400 font-bold">{selectedRetirement.serialNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">CLAIM REFERENCE:</span>
                    <div className="text-white font-bold">{selectedRetirement.claimReference}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">BENEFICIARY CLAIMANT:</span>
                    <div className="text-white">{selectedRetirement.claimantOrganization}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">ENERGY QUANTITY:</span>
                    <div className="text-white tabular-nums font-bold">
                      {selectedRetirement.energyQuantityMWh} MWh ({selectedRetirement.energySource})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">RETIRED BY:</span>
                    <div className="text-slate-300">{selectedRetirement.retiredBy}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">RETIREMENT TIMESTAMP:</span>
                    <div className="text-slate-300 tabular-nums">
                      {new Date(selectedRetirement.retirementTimestamp).toUTCString()}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-500 block text-[11px]">PURPOSE:</span>
                  <div className="text-slate-300 italic font-sans text-xs">
                    {selectedRetirement.purpose}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500 text-[10px]">
                      SHA-256 CRYPTOGRAPHIC VERIFICATION SEAL:
                    </span>
                    <button
                      onClick={() => handleCopyHash(selectedRetirement.verificationHash)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 no-print"
                    >
                      {copiedHash ? (
                        <>
                          <Check className="w-3 h-3" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Seal
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 break-all select-all font-mono bg-slate-900 p-2 rounded border border-slate-800">
                    {selectedRetirement.verificationHash}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-800 no-print">
              <span className="text-[11px] text-slate-500">
                Status: PERMANENTLY RETIRED & LOCKED
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handlePrintProof(selectedRetirement)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                  title="Print official document"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  Print Proof
                </button>
                <button
                  onClick={() => handleDownloadProof(selectedRetirement)}
                  className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                  title="Download standalone certificate file"
                >
                  <Download className="w-4 h-4" />
                  Download HTML Proof
                </button>
                <button
                  onClick={() => setSelectedRetirement(null)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
