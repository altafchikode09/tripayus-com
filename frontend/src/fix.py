content = open('App.jsx').read()
content = content.replace("name: 'New Deal', companyName: ''", "name: '', companyName: ''")
old = '<option value="">-- Create or Select --</option>'
new = '<option value="">-- Create or Select --</option>\n                  <option value="pe">PRIVATE EQUITY</option>\n                  <option value="realestate">REAL ESTATE</option>\n                  <option value="ma">M&A</option>\n                  <option value="legal">LEGAL</option>\n                  <option value="healthcare">HEALTHCARE</option>\n                  <option value="supplychain">SUPPLY CHAIN</option>\n                  <option value="insurance">INSURANCE</option>\n                  <option value="vc">VC / STARTUPS</option>'
content = content.replace(old, new)
content = content.replace('>New Deal</button>', '>Create New Deal</button>')
open('App.jsx', 'w').write(content)
print('Done!')
