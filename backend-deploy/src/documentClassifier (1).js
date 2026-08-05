const DOC_CLASSIFIERS = [
  { category: 'financials', folderLabel: '01 Financials', classification: 'Financial Statement',
    keywords: ['ebitda','balance sheet','cash flow','income statement','p&l','profit','loss','financial','audit','ledger','forecast','budget','valuation','revenue','accounts','annual report','10-k','qoe','working capital'] },
  { category: 'tax', folderLabel: '04 Tax', classification: 'Tax Document',
    keywords: ['tax','gst','vat','itr','withholding','transfer pricing','1040','1120','1099','excise','assessment'] },
  { category: 'legal', folderLabel: '02 Legal', classification: 'Legal Contract',
    keywords: ['contract','agreement','msa','nda','spa','mou','loi','litigation','lawsuit','legal','license','compliance','shareholder','bylaws','incorporation','indemnity','arbitration'] },
  { category: 'hr', folderLabel: '03 HR', classification: 'HR Document',
    keywords: ['employee','employment','payroll','salary','hr','offer letter','org chart','benefits','esop','hiring','headcount','onboarding','leave'] },
  { category: 'commercial', folderLabel: '05 Commercial', classification: 'Commercial Document',
    keywords: ['customer','sales','pipeline','marketing','churn','pricing','arr','mrr','crm','market','competitor'] },
  { category: 'operations', folderLabel: '06 Operations', classification: 'Operations Document',
    keywords: ['operations','supply','inventory','vendor','logistics','manufacturing','procurement','warehouse','production'] }
]

export function classifyDocument(fileName) {
  const name = (fileName || '').toLowerCase()
  for (const c of DOC_CLASSIFIERS) {
    let matches = 0
    for (const kw of c.keywords) { if (name.includes(kw)) matches++ }
    if (matches > 0) {
      const confidence = Math.min(99, 91 + matches * 3 + (fileName.length % 4))
      return { category: c.category, classification: c.classification, confidence }
    }
  }
  return { category: 'other', classification: 'General Document', confidence: 62 + (fileName.length % 9) }
}

export function getFolderLabel(category) {
  const c = DOC_CLASSIFIERS.find(x => x.category === category)
  return c ? c.folderLabel : '07 Other'
}
