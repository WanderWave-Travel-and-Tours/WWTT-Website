import * as XLSX from 'xlsx';

export const parseUniversalExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log('📊 Total Sheets:', workbook.SheetNames.length);
        
        const allRates = [];
        const sheetReports = [];
        
        for (const sheetName of workbook.SheetNames) {
          if (sheetName.toLowerCase().includes('sheet') && 
              sheetName.length < 10) continue;
          
          console.log(`\n🔍 Processing: ${sheetName}`);
          
          const worksheet = workbook.Sheets[sheetName];
          
          const sheetRates = parseCustomFormat(worksheet, sheetName);
          
          allRates.push(...sheetRates);
          
          sheetReports.push({
            sheet: sheetName,
            ratesFound: sheetRates.length
          });
          
          console.log(`   ✅ Extracted ${sheetRates.length} rates`);
        }
        
        if (allRates.length === 0) {
          reject({ message: 'No valid data found in any sheet' });
          return;
        }
        
        console.log('\n✅ Total Rates Extracted:', allRates.length);
        
        resolve({
          rates: allRates,
          report: {
            totalSheets: sheetReports.length,
            totalRates: allRates.length,
            sheets: sheetReports
          }
        });
        
      } catch (error) {
        console.error('❌ Error parsing Excel:', error);
        reject({
          message: 'Error parsing Excel file',
          error: error.message
        });
      }
    };
    
    reader.onerror = () => {
      reject({
        message: 'Error reading file',
        error: reader.error
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

function parseCustomFormat(worksheet, sheetName) {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, 
    defval: '',
    raw: false 
  });
  const rates = [];
  
  let destination = sheetName.trim();
  
  let defaultSupplier = 'Unspecified';
  for (let i = 0; i < Math.min(3, jsonData.length); i++) {
    const row = jsonData[i];
    if (!row || !row[0]) continue;
    
    const firstCell = String(row[0]).trim();
    
    if (firstCell.toLowerCase().includes('supplier') ||
        firstCell.toLowerCase().includes('travel') ||
        firstCell.toLowerCase().includes('tours') ||
        firstCell.toLowerCase().includes('bakiki') ||
        firstCell.toLowerCase().includes('gerasmia')) {
      defaultSupplier = firstCell.split('(')[0].trim();
      continue;
    }
    
    if (firstCell.length < 30 && firstCell.length > 2 && 
        !row[1] && !firstCell.toLowerCase().includes('tour')) {
      destination = firstCell;
      continue;
    }
    
    if (i === 1 && firstCell.length < 30 && 
        !firstCell.toLowerCase().includes('contracted')) {
      destination = firstCell;
    }
  }
  
  console.log(`   Destination: ${destination}, Supplier: ${defaultSupplier}`);
  
  let dataStartRow = 0;
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    if (!row || !row[0]) continue;
    
    const firstCell = String(row[0]).toLowerCase();
    
    if (firstCell.includes('contracted') ||
        firstCell.includes('supplier name') ||
        firstCell.includes('contact') ||
        firstCell.includes('transfer') && firstCell.length < 15 ||
        firstCell === 'pax' ||
        firstCell === 'tour') {
      continue;
    }
    
    const hasActivity = row[0] && String(row[0]).length > 2;
    let hasRate = false;
    
    for (let col = 1; col <= 4; col++) {
      const price = parsePrice(row[col]);
      if (price > 0 && price < 1000000) {
        hasRate = true;
        break;
      }
    }
    
    if (hasActivity && hasRate) {
      dataStartRow = i;
      break;
    }
  }
  
  console.log(`   Data starts at row: ${dataStartRow + 1}`);
  
  for (let i = dataStartRow; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    if (!row || row.every(cell => !cell || cell === '')) continue;
    
    const activity = cleanText(row[0]);
    if (!activity || activity.length < 2) continue;
    
    const activityLower = activity.toLowerCase();
    if (activityLower.includes('contracted rates') ||
        activityLower.includes('supplier name') ||
        activityLower === 'pax' ||
        activityLower === 'inclusions' ||
        activityLower.includes('private tour') && activity.length < 15) {
      continue;
    }
    
    let supplierRate = 0;
    let rateColumn = -1;
    
    for (let col = 1; col <= 4; col++) {
      const rate = parsePrice(row[col]);
      if (rate > 0 && rate < 1000000) {
        supplierRate = rate;
        rateColumn = col;
        break;
      }
    }
    
    if (supplierRate === 0) continue;
    
    let paxInfo = '';
    for (let col = Math.max(0, rateColumn - 1); col <= rateColumn + 2; col++) {
      if (row[col] && typeof row[col] === 'string') {
        const text = String(row[col]).toLowerCase();
        if (text.includes('pax') || text.includes('solo') || 
            text.includes('join') || text.includes('per way') ||
            text.includes('min of') || text.includes('person')) {
          paxInfo = cleanText(row[col]);
          break;
        }
      }
    }
    
    let inclusions = '';
    for (let col = 2; col < Math.min(row.length, 8); col++) {
      if (col === rateColumn) continue;
      const text = cleanText(row[col]);
      if (text && text.length > 10 && !text.toLowerCase().includes('pax')) {
        inclusions = text;
        break;
      }
    }
    
    rates.push({
      destination: destination,
      activity: activity,
      supplierName: defaultSupplier,
      supplierRate: supplierRate,
      markup: 0,
      markupType: 'percentage',
      sellingPrice: supplierRate,
      pax: paxInfo,
      inclusions: inclusions,
      notes: '',
      status: 'active',
      dateAdded: new Date()
    });
    
    if (row.length > 7) {
      const tierPax = cleanText(row[6]);
      const tierRate = parsePrice(row[7]);
      const tierPublished = parsePrice(row[8]);
      
      if (tierPax && tierPax.includes('pax') && tierRate > 0) {
        const markup = tierPublished > tierRate 
          ? ((tierPublished - tierRate) / tierRate) * 100 
          : 0;
        
        rates.push({
          destination: destination,
          activity: `${activity} - Tiered`,
          supplierName: defaultSupplier,
          supplierRate: tierRate,
          markup: parseFloat(markup.toFixed(2)),
          markupType: 'percentage',
          sellingPrice: tierPublished || tierRate,
          pax: tierPax,
          inclusions: inclusions,
          notes: 'Tiered pricing',
          status: 'active',
          dateAdded: new Date()
        });
      }
    }
  }
  
  return rates;
}

function cleanText(value) {
  if (!value) return '';
  let str = String(value).trim();
  str = str.replace(/\s+/g, ' ');
  return str;
}

function parsePrice(value) {
  if (!value) return 0;
  
  if (typeof value === 'number') return value;
  
  let str = String(value).trim();
  
  str = str.replace(/[₱$,\s]/g, '');
  
  str = str.split('/')[0];
  
  if (str.toLowerCase().includes('min of')) {
    return 0;
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export const previewUniversalExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets = workbook.SheetNames.filter(s => 
          !s.toLowerCase().includes('sheet') || s.length >= 10
        );
        
        let totalEstimate = 0;
        const sheetInfo = [];
        
        for (const sheetName of sheets) {
          const worksheet = workbook.Sheets[sheetName];
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          const rows = range.e.r + 1;
          const estimate = Math.max(0, rows - 5);  
          totalEstimate += estimate;
          
          sheetInfo.push({
            name: sheetName,
            rows: rows,
            estimated: estimate
          });
        }
        
        resolve({
          totalSheets: sheets.length,
          sheets: sheetInfo,
          estimatedTotal: totalEstimate
        });
        
      } catch (error) {
        reject({ message: 'Error previewing file', error: error.message });
      }
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export default { parseUniversalExcel, previewUniversalExcel };