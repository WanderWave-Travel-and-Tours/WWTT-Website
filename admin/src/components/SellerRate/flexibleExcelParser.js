import * as XLSX from 'xlsx';

// ============================================
// UNIVERSAL EXCEL PARSER FOR SELLER RATES
// AUTO-DETECTS: Standard Table OR WTT Contracted format
// FIXED: Properly handles NaN/null values
// ============================================

const FLEXIBLE_COLUMN_MAPPING = {
  destination: [
    'destination', 'dest', 'location', 'place', 'city', 
    'area', 'island', 'province', 'where'
  ],
  activity: [
    'activity', 'tour', 'tour name', 'package', 'service',
    'tour package', 'activity name', 'description', 'item',
    'product', 'service name', 'package name'
  ],
  supplierName: [
    'supplier', 'supplier name', 'vendor', 'provider',
    'seller', 'company', 'hotel', 'hotel name', 'resort',
    'partner', 'contractor', 'source'
  ],
  supplierRate: [
    'supplier rate', 'supplier price', 'cost', 'base cost',
    'base price', 'net rate', 'net price', 'contracted rate',
    'wholesale price', 'buy rate', 'purchase price', 'cost price',
    'nett', 'nett rate', 'contracted price', 'supplier cost'
  ],
  markup: [
    'markup', 'margin', 'commission', 'profit', 'margin %',
    'markup %', 'profit margin', 'commission %', 'add on',
    'markup amount', 'commission amount'
  ],
  sellingPrice: [
    'selling price', 'sell price', 'retail price', 'srp',
    'published rate', 'rack rate', 'final price', 'total price',
    'public rate', 'customer price', 'quoted price'
  ],
  pax: [
    'pax', 'persons', 'people', 'guests', 'capacity',
    'min pax', 'max pax', 'number of pax', 'no of pax',
    'group size', 'headcount'
  ],
  inclusions: [
    'inclusions', 'includes', 'included', 'what\'s included',
    'features', 'amenities', 'facilities', 'services included',
    'package includes', 'details'
  ],
  notes: [
    'notes', 'remarks', 'comments', 'additional info',
    'note', 'special notes', 'important notes', 'memo',
    'conditions', 'terms'
  ]
};

const findMatchingColumn = (row, possibleNames) => {
  const rowKeys = Object.keys(row).map(k => k.toLowerCase().trim());
  
  for (const possibleName of possibleNames) {
    const normalized = possibleName.toLowerCase().trim();
    const match = rowKeys.find(key => {
      if (key === normalized) return true;
      if (key.includes(normalized) || normalized.includes(key)) return true;
      const cleanKey = key.replace(/[^a-z0-9]/g, '');
      const cleanNormalized = normalized.replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanNormalized) return true;
      return false;
    });
    
    if (match) {
      return Object.keys(row).find(k => k.toLowerCase().trim() === match);
    }
  }
  return null;
};

/**
 * FIXED: Parse value - returns 0 for empty numbers, null for empty strings
 */
const parseValue = (value, fieldType) => {
  if (fieldType === 'number') {
    // CRITICAL: Return 0 for empty values to prevent NaN
    if (value === null || value === undefined || value === '' || value === 'NaN') {
      return 0;
    }
    
    let stringValue = String(value).trim();
    stringValue = stringValue.replace(/[₱$,\s]/g, '');
    stringValue = stringValue.split('/')[0].trim();
    
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
  }
  
  // For strings
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value).trim();
};

const isWTTFormat = (workbook) => {
  const sheets = workbook.SheetNames.filter(s => 
    s.toLowerCase() !== 'sheet10' && 
    s.toLowerCase() !== 'template' &&
    s.trim().length > 2
  );
  
  if (sheets.length >= 3) return true;
  
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  
  if (jsonData.length === 0) return false;
  
  const firstRow = jsonData[0] || [];
  const nonEmptyCells = firstRow.filter(cell => cell && String(cell).trim() !== '');
  
  if (nonEmptyCells.length <= 2) return true;
  
  return false;
};

const isEmptyOrHeaderRow = (row) => {
  if (!row || row.length === 0) return true;
  
  const firstCell = String(row[0] || '').toLowerCase().trim();
  
  if (row.every(cell => !cell || cell === '')) return true;
  
  const headerKeywords = ['contracted rates', 'supplier name', 'contact', 'pax'];
  if (headerKeywords.some(keyword => firstCell.includes(keyword))) return true;
  
  return false;
};

const parseWTTFormat = (workbook) => {
  console.log('📋 Detected: WTT CONTRACTED FORMAT');
  
  const allRates = [];
  const sheetReports = [];
  
  for (const sheetName of workbook.SheetNames) {
    if (sheetName.toLowerCase() === 'sheet10' || 
        sheetName.toLowerCase() === 'template') {
      continue;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false
    });
    
    const destination = sheetName.trim();
    let dataStartRow = 0;
    
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      const hasActivity = row[0] && String(row[0]).length > 2;
      const hasRate = row[1] && parseValue(row[1], 'number') > 0;
      
      if (hasActivity && hasRate && !isEmptyOrHeaderRow(row)) {
        dataStartRow = i;
        break;
      }
    }
    
    const sheetRates = [];
    
    for (let i = dataStartRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      if (isEmptyOrHeaderRow(row)) continue;
      
      const activity = parseValue(row[0], 'string');
      const supplierRate = parseValue(row[1], 'number');
      const paxInfo = parseValue(row[2], 'string');
      const supplierName = parseValue(row[3], 'string');
      
      // STRICT VALIDATION: Must have activity AND rate > 0
      if (!activity || supplierRate === 0) continue;
      
      const activityLower = activity.toLowerCase();
      if (activityLower.includes('contracted') || 
          activityLower.includes('supplier name') ||
          activityLower === 'pax') {
        continue;
      }
      
      sheetRates.push({
        destination: destination,
        activity: activity,
        supplierName: supplierName || 'Unspecified',
        supplierRate: supplierRate,
        markup: 0,
        markupType: 'percentage',
        sellingPrice: supplierRate,
        pax: paxInfo || '',
        inclusions: '',
        notes: '',
        status: 'active',
        dateAdded: new Date()
      });
      
      const tierPax = parseValue(row[6], 'string');
      const tierRate = parseValue(row[7], 'number');
      
      if (tierPax && tierRate > 0 && tierPax.toLowerCase().includes('pax')) {
        sheetRates.push({
          destination: destination,
          activity: `${activity} - ${tierPax}`,
          supplierName: supplierName || 'Unspecified',
          supplierRate: tierRate,
          markup: 0,
          markupType: 'percentage',
          sellingPrice: tierRate,
          pax: tierPax,
          inclusions: '',
          notes: 'Tiered pricing',
          status: 'active',
          dateAdded: new Date()
        });
      }
    }
    
    allRates.push(...sheetRates);
    sheetReports.push({
      sheet: sheetName,
      ratesFound: sheetRates.length
    });
    
    console.log(`   ✅ ${sheetName}: ${sheetRates.length} rates`);
  }
  
  return {
    rates: allRates,
    report: {
      format: 'WTT Contracted',
      totalSheets: sheetReports.length,
      totalRows: allRates.length,
      parsedRows: allRates.length,
      skippedRows: 0,
      sheets: sheetReports
    }
  };
};

const parseStandardFormat = (workbook) => {
  console.log('📊 Detected: STANDARD TABLE FORMAT');
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  if (jsonData.length === 0) {
    throw new Error('Excel file is empty');
  }
  
  const parsedRates = jsonData.map((row, index) => {
    try {
      const destinationCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.destination);
      const activityCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.activity);
      const supplierCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.supplierName);
      const supplierRateCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.supplierRate);
      const markupCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.markup);
      const sellingPriceCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.sellingPrice);
      const paxCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.pax);
      const inclusionsCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.inclusions);
      const notesCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.notes);
      
      const destination = destinationCol ? parseValue(row[destinationCol], 'string') : null;
      const activity = activityCol ? parseValue(row[activityCol], 'string') : null;
      const supplierName = supplierCol ? parseValue(row[supplierCol], 'string') : null;
      const supplierRate = supplierRateCol ? parseValue(row[supplierRateCol], 'number') : 0;
      const markupValue = markupCol ? parseValue(row[markupCol], 'number') : 0;
      const sellingPriceValue = sellingPriceCol ? parseValue(row[sellingPriceCol], 'number') : 0;
      const pax = paxCol ? parseValue(row[paxCol], 'string') : '';
      const inclusions = inclusionsCol ? parseValue(row[inclusionsCol], 'string') : '';
      const notes = notesCol ? parseValue(row[notesCol], 'string') : '';
      
      if (!destination && !activity && !supplierRate) {
        return null;
      }
      
      const sellingPrice = sellingPriceValue || (supplierRate + (supplierRate * markupValue / 100));
      
      return {
        destination: destination || 'Unspecified',
        activity: activity || 'Unspecified',
        supplierName: supplierName || 'Unspecified',
        supplierRate: supplierRate,
        markup: markupValue,
        markupType: 'percentage',
        sellingPrice: sellingPrice,
        pax: pax,
        inclusions: inclusions,
        notes: notes,
        status: 'active',
        dateAdded: new Date(),
        _originalRow: index + 2
      };
    } catch (error) {
      console.error(`Error parsing row ${index + 2}:`, error);
      return null;
    }
  }).filter(rate => rate !== null);
  
  if (parsedRates.length === 0) {
    throw new Error('No valid data found in Excel file');
  }
  
  return {
    rates: parsedRates,
    report: {
      format: 'Standard Table',
      totalRows: jsonData.length,
      parsedRows: parsedRates.length,
      skippedRows: jsonData.length - parsedRates.length
    }
  };
};

export const parseFlexibleExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const isWTT = isWTTFormat(workbook);
        
        const result = isWTT 
          ? parseWTTFormat(workbook)
          : parseStandardFormat(workbook);
        
        console.log('✅ Parsing Complete:', result.report);
        
        resolve(result);
        
      } catch (error) {
        console.error('Error parsing Excel:', error);
        reject({
          message: error.message || 'Error parsing Excel file',
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

export const previewExcelColumns = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const isWTT = isWTTFormat(workbook);
        
        if (isWTT) {
          const sheets = workbook.SheetNames.filter(s => 
            s.toLowerCase() !== 'sheet10' && s.toLowerCase() !== 'template'
          );
          
          let totalEstimate = 0;
          const sampleRows = [];
          
          if (sheets.length > 0) {
            const firstSheet = workbook.Sheets[sheets[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            let dataStart = 0;
            for (let i = 0; i < Math.min(10, jsonData.length); i++) {
              const row = jsonData[i];
              if (!row || !row[0]) continue;
              
              const hasActivity = row[0] && String(row[0]).length > 2;
              const hasRate = row[1] && parseValue(row[1], 'number') > 0;
              
              if (hasActivity && hasRate && !isEmptyOrHeaderRow(row)) {
                dataStart = i;
                break;
              }
            }
            
            let count = 0;
            for (let i = dataStart; i < jsonData.length && count < 3; i++) {
              const row = jsonData[i];
              if (isEmptyOrHeaderRow(row)) continue;
              
              const activity = parseValue(row[0], 'string');
              const rate = parseValue(row[1], 'number');
              const pax = parseValue(row[2], 'string');
              const supplier = parseValue(row[3], 'string');
              
              if (activity && rate > 0) {
                sampleRows.push({
                  destination: sheets[0].trim(),
                  activity: activity,
                  supplier: supplier || 'N/A',
                  supplierRate: rate
                });
                count++;
              }
            }
            
            totalEstimate = sheets.length * 50;
          }
          
          resolve({
            format: 'WTT Contracted',
            sheetName: sheets[0] || 'Unknown',
            totalSheets: sheets.length,
            totalRows: totalEstimate,
            validRows: totalEstimate,
            mapping: {
              destination: 'Sheet Name',
              activity: 'Column A',
              supplierRate: 'Column B',
              pax: 'Column C',
              supplierName: 'Column D'
            },
            sampleRows: sampleRows
          });
          
        } else {
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            reject({ message: 'Excel file is empty' });
            return;
          }
          
          const firstRow = jsonData[0];
          const detectedMapping = {};
          
          Object.keys(FLEXIBLE_COLUMN_MAPPING).forEach(field => {
            const matched = findMatchingColumn(firstRow, FLEXIBLE_COLUMN_MAPPING[field]);
            if (matched) {
              detectedMapping[field] = matched;
            }
          });
          
          const sampleRows = jsonData.slice(0, 3).map((row) => {
            const destinationCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.destination);
            const activityCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.activity);
            const supplierCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.supplierName);
            const supplierRateCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.supplierRate);
            
            return {
              destination: destinationCol ? parseValue(row[destinationCol], 'string') : 'N/A',
              activity: activityCol ? parseValue(row[activityCol], 'string') : 'N/A',
              supplier: supplierCol ? parseValue(row[supplierCol], 'string') : 'N/A',
              supplierRate: supplierRateCol ? parseValue(row[supplierRateCol], 'number') : 0
            };
          });
          
          const validRows = jsonData.filter(row => {
            const destinationCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.destination);
            const activityCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.activity);
            const supplierRateCol = findMatchingColumn(row, FLEXIBLE_COLUMN_MAPPING.supplierRate);
            
            const hasDestOrActivity = (destinationCol && row[destinationCol]) || 
                                      (activityCol && row[activityCol]);
            const hasRate = supplierRateCol && parseValue(row[supplierRateCol], 'number') > 0;
            
            return hasDestOrActivity && hasRate;
          }).length;
          
          resolve({
            format: 'Standard Table',
            sheetName: sheetName,
            totalSheets: workbook.SheetNames.length,
            totalRows: jsonData.length,
            validRows: validRows,
            mapping: detectedMapping,
            sampleRows: sampleRows
          });
        }
        
      } catch (error) {
        console.error('Preview error:', error);
        reject({ message: 'Error previewing file', error: error.message });
      }
    };
    
    reader.onerror = () => {
      reject({ message: 'Error reading file', error: reader.error });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export default { parseFlexibleExcel, previewExcelColumns };