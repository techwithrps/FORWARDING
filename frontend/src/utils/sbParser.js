/**
 * ICEGATE Shipping Bill (.sb / RES) Flat File Parser
 * Indian Customs ICES 1.5 Flat File Parser
 * 
 * Delimiter: ASCII Group Separator (\x1d / 0x1D) or Tab / Whitespace
 * Tables:
 * - HREC (Header Record)
 * - <TABLE>SB (Shipping Bill Header & Exporter/Consignee Info)
 * - <TABLE>INVOICE (Commercial Invoice Details)
 * - <TABLE>ITEM (Cargo / HS Code / Duty Items)
 * - <TABLE>CONTAINER (Container & Seal Info)
 */

export function parseIcegateSbFile(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Invalid file content: Expected text content');
  }

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const parsed = {
    header: {},
    sb: {},
    invoices: [],
    items: [],
    containers: [],
    rawText: rawText,
    summary: {
      sbNo: '',
      sbDate: '',
      exporterName: '',
      exporterAddress: '',
      consigneeName: '',
      consigneeAddress: '',
      gstin: '',
      iec: '',
      pol: '',
      pod: '',
      country: '',
      grossWeight: '',
      netWeight: '',
      weightUnit: 'KGS',
      totalPackages: '',
      invoiceNo: '',
      invoiceDate: '',
      invoiceAmount: '',
      currency: 'USD',
      itemDescription: '',
      hsCode: '',
      containersCount: 0
    }
  };

  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('HREC')) {
      const parts = line.includes('\x1d') ? line.split('\x1d') : line.split(/\s+/);
      parsed.header = {
        sender: parts[2] || '',
        customsStation: parts[4] || '',
        icesVersion: parts[5] || '',
        jobNo: parts[9] || parts[8] || '',
        date: formatDate(parts[10] || parts[9] || ''),
        time: parts[11] || parts[10] || ''
      };
      continue;
    }

    if (line.startsWith('<TABLE>')) {
      currentSection = line.replace('<TABLE>', '').trim().toUpperCase();
      continue;
    }

    if (line.startsWith('<END-') || line.startsWith('TREC')) {
      currentSection = '';
      continue;
    }

    // Process table sections
    if (currentSection === 'SB') {
      const parts = line.includes('\x1d') ? line.split('\x1d') : line.split(/\s{2,}|\t/);
      
      const sbPort = parts[1] || '';
      const sbJob = parts[2] || '';
      const sbDate = formatDate(parts[3] || '');
      const chaPan = parts[6] || '';
      const iec = parts[7] || '';
      const exporter = parts[9] || '';
      const exporterAddr = [parts[10], parts[11], parts[12], parts[13], parts[14]].filter(Boolean).join(', ');
      const consignee = parts[20] || '';
      const consigneeAddr = [parts[21], parts[22]].filter(Boolean).join(', ');
      const country = parts[25] || '';
      const pol = parts[29] || sbPort || '';
      const pod = parts[30] || '';
      const grossWeight = parts[36] || '';
      const netWeight = parts[37] || '';
      const weightUnit = parts[38] || 'KGS';
      const packages = parts[39] || '';
      const marksDesc = parts[40] || '';
      const gstin = parts[49] || (line.match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/)?.[0] || '');

      parsed.sb = {
        port: sbPort,
        jobNo: sbJob,
        sbNo: sbJob ? `SB-${sbJob}` : '',
        date: sbDate,
        chaPan,
        iec,
        exporterName: exporter,
        exporterAddress: exporterAddr,
        consigneeName: consignee,
        consigneeAddress: consigneeAddr,
        country,
        pol,
        pod,
        grossWeight,
        netWeight,
        weightUnit,
        packages,
        marksDesc,
        gstin
      };

      parsed.summary.sbNo = parsed.sb.sbNo || `SB-${sbJob}`;
      parsed.summary.sbDate = sbDate;
      parsed.summary.exporterName = exporter;
      parsed.summary.exporterAddress = exporterAddr;
      parsed.summary.consigneeName = consignee;
      parsed.summary.consigneeAddress = consigneeAddr;
      parsed.summary.country = country;
      parsed.summary.gstin = gstin;
      parsed.summary.iec = iec;
      parsed.summary.pol = pol;
      parsed.summary.pod = pod;
      parsed.summary.grossWeight = grossWeight;
      parsed.summary.netWeight = netWeight;
      parsed.summary.weightUnit = weightUnit;
      parsed.summary.totalPackages = packages;
      if (!parsed.summary.itemDescription && marksDesc) {
        parsed.summary.itemDescription = marksDesc;
      }
    } else if (currentSection === 'INVOICE') {
      const parts = line.includes('\x1d') ? line.split('\x1d') : line.split(/\s{2,}|\t/);
      const invNo = parts[7] || parts[4] || '';
      const invDate = formatDate(parts[8] || parts[5] || '');
      const currency = parts[9] || parts[6] || 'USD';
      const terms = parts[10] || parts[7] || 'CIF';
      const buyer = parts[11] || '';
      const amount = parts[17] || parts[10] || '';

      const invObj = {
        invoiceNo: invNo,
        invoiceDate: invDate,
        currency,
        terms,
        buyer,
        amount
      };
      parsed.invoices.push(invObj);

      if (!parsed.summary.invoiceNo && invNo) {
        parsed.summary.invoiceNo = invNo;
        parsed.summary.invoiceDate = invDate;
        parsed.summary.currency = currency;
        parsed.summary.invoiceAmount = amount;
      }
    } else if (currentSection === 'ITEM') {
      const parts = line.includes('\x1d') ? line.split('\x1d') : line.split(/\s{2,}|\t/);
      const itemNo = parts[7] || parts[6] || '1';
      const hsCode = parts[9] || parts[7] || '';
      const desc = parts[10] || parts[8] || '';
      const unit = parts[13] || parts[9] || '';
      const qty = parts[14] || parts[10] || '';
      const unitPrice = parts[15] || '';
      const value = parts[18] || parts[11] || '';

      const itemObj = {
        itemNo,
        hsCode,
        description: desc,
        quantity: qty,
        unit,
        unitPrice,
        value
      };
      parsed.items.push(itemObj);

      if (hsCode) {
        parsed.summary.hsCode = hsCode;
      }
      if (desc) {
        parsed.summary.itemDescription = desc;
      }
    } else if (currentSection === 'CONTAINER') {
      const parts = line.includes('\x1d') ? line.split('\x1d') : line.split(/\s{2,}|\t/);
      const contNo = parts[6] || parts[4] || '';
      const sealNo = parts[7] || parts[5] || '';
      const sizeType = parts[8] || parts[6] || '40HC';
      const grossWt = parts[9] || parts[7] || '';

      if (contNo) {
        parsed.containers.push({
          containerNo: contNo,
          sealNo,
          sizeType,
          grossWeight: grossWt
        });
      }
    }
  }

  parsed.summary.containersCount = parsed.containers.length;
  return parsed;
}

function formatDate(raw) {
  if (!raw) return '';
  const cleaned = String(raw).trim().replace(/\D/g, '');
  if (cleaned.length === 8) {
    // YYYYMMDD -> YYYY-MM-DD
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}-${cleaned.substring(6, 8)}`;
  }
  return raw;
}
