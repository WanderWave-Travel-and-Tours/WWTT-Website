import * as XLSX from 'xlsx';

// ============================================
// FLEXIBLE EXCEL PARSER FOR SELLER RATES
// FIXED VERSION - Handles multiple column naming conventions
// ============================================

/**
 * Flexible column mapping - handles various column name formats
 */
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

/**
 * Find matching column name from row data
 */
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
 * Parse value and handle different formats
 */
const parseValue = (value, fieldType) => {
  if (value === null || value === undefined || value === '') return null;
  
  let stringValue = String(value).trim();
  
  if (fieldType === 'number') {
    // Remove currency symbols, commas, and spaces
    stringValue = stringValue.replace(/[₱$,\s]/g, '');
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return stringValue;
};

/**
 * Detect markup type from the data
 */
const detectMarkupType = (markupValue, supplierRate, sellingPrice) => {
  if (!markupValue) return 'percentage';
  
  const markup = parseFloat(String(markupValue).replace(/[%₱$,\s]/g, ''));
  
  if (String(markupValue).includes('%')) return 'percentage';
  
  if (markup < 100 && supplierRate && sellingPrice) {
    const calculatedWithPercent = supplierRate + (supplierRate * markup / 100);
    const calculatedWithFixed = supplierRate + markup;
    const actualDiff = sellingPrice - supplierRate;
    
    if (Math.abs(calculatedWithPercent - sellingPrice) < Math.abs(calculatedWithFixed - sellingPrice)) {
      return 'percentage';
    }
  }
  
  if (markup > 100) return 'fixed';
  
  return 'percentage';
};

/**
 * Calculate missing values
 */
const calculateMissingValues = (data) => {
  const { supplierRate, markup, markupType, sellingPrice } = data;
  
  if (supplierRate && markup && !sellingPrice) {
    if (markupType === 'percentage') {
      return supplierRate + (supplierRate * markup / 100);
    } else {
      return supplierRate + markup;
    }
  }
  
  if (supplierRate && sellingPrice && !markup) {
    const difference = sellingPrice - supplierRate;
    if (markupType === 'percentage') {
      return (difference / supplierRate) * 100;
    } else {
      return difference;
    }
  }
  
  return sellingPrice || 0;
};

/**
 * Main parser function - handles flexible Excel formats
 */
export const parseFlexibleExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          reject({ message: 'Excel file is empty' });
          return;
        }

        console.log('📊 Detected columns:', Object.keys(jsonData[0]));

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
            const markupValue = markupCol ? parseValue(row[markupCol], 'number') : null;
            const sellingPriceValue = sellingPriceCol ? parseValue(row[sellingPriceCol], 'number') : null;
            const pax = paxCol ? parseValue(row[paxCol], 'string') : '';
            const inclusions = inclusionsCol ? parseValue(row[inclusionsCol], 'string') : '';
            const notes = notesCol ? parseValue(row[notesCol], 'string') : '';

            if (!destination && !activity && !supplierRate) {
              return null;
            }

            const markupType = detectMarkupType(markupValue, supplierRate, sellingPriceValue);
            
            let markup = markupValue || 0;
            let sellingPrice = sellingPriceValue;
            
            if (!sellingPrice) {
              sellingPrice = calculateMissingValues({
                supplierRate,
                markup,
                markupType,
                sellingPrice: sellingPriceValue
              });
            }

            return {
              destination: destination || 'Unspecified',
              activity: activity || 'Unspecified',
              supplierName: supplierName || 'Unspecified',
              supplierRate: supplierRate,
              markup: markup,
              markupType: markupType,
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
          reject({ message: 'No valid data found in Excel file' });
          return;
        }

        const report = {
          totalRows: jsonData.length,
          parsedRows: parsedRates.length,
          skippedRows: jsonData.length - parsedRates.length,
          detectedColumns: {
            destination: findMatchingColumn(jsonData[0], FLEXIBLE_COLUMN_MAPPING.destination),
            activity: findMatchingColumn(jsonData[0], FLEXIBLE_COLUMN_MAPPING.activity),
            supplier: findMatchingColumn(jsonData[0], FLEXIBLE_COLUMN_MAPPING.supplierName),
            supplierRate: findMatchingColumn(jsonData[0], FLEXIBLE_COLUMN_MAPPING.supplierRate),
            markup: findMatchingColumn(jsonData[0], FLEXIBLE_COLUMN_MAPPING.markup),
          }
        };

        console.log('✅ Parsing Report:', report);

        resolve({
          rates: parsedRates,
          report: report
        });

      } catch (error) {
        console.error('Error parsing Excel:', error);
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

/**
 * Preview Excel columns before import - FIXED VERSION
 */
export const previewExcelColumns = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = jsonData[0] || [];
        const firstDataRow = jsonData[1] || [];

        const preview = {
          sheetName: sheetName,
          totalSheets: workbook.SheetNames.length,
          headers: headers,
          sampleData: firstDataRow,
          totalRows: jsonData.length - 1,
          detectedMapping: {}
        };

        // Create sample object from headers and first data row
        const sampleObject = {};
        headers.forEach((header, idx) => {
          if (header) {
            sampleObject[header] = firstDataRow[idx] || '';
          }
        });

        // Try to detect what each column might be
        Object.keys(FLEXIBLE_COLUMN_MAPPING).forEach(field => {
          const matched = findMatchingColumn(sampleObject, FLEXIBLE_COLUMN_MAPPING[field]);
          if (matched) {
            preview.detectedMapping[field] = matched;
          }
        });

        resolve(preview);
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