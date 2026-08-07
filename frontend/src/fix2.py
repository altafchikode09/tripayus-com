import re

with open('App.jsx', 'r') as f:
    content = f.read()

# Fix 1: Filter deals - remove empty/New Deal/Untitled
old_deals = "{deals.map(d => <option key={d.id} value={d.id}>{d.name || d.companyName || d.id.slice(0,8)}</option>)}"
new_deals = "{deals.filter(d => d.name && d.name.trim() !== '' && d.name !== 'New Deal' && !d.name.toLowerCase().includes('untitled')).map(d => <option key={d.id} value={d.id}>{d.name || d.companyName || d.id.slice(0,8)}</option>)}"
content = content.replace(old_deals, new_deals)

# Fix 2: Update select onChange - handle industry vs deal
old_select = '<select className="login-input" style={{ marginBottom: 16 }} value={selectedDeal?.id || \'\'}\' onChange={e => setSelectedDeal(deals.find(d => d.id === e.target.value) || null)}>'
new_select = '''<select className="login-input" style={{ marginBottom: 16 }} value={selectedDeal?.id || industry || \'\'}\' onChange={e => {
                  const val = e.target.value;
                  const inds = ['pe','realestate','ma','legal','healthcare','supplychain','insurance','vc'];
                  if (inds.includes(val)) { setIndustry(val); setSelectedDeal(null); }
                  else { setSelectedDeal(deals.find(d => d.id === val) || null); }
                }}>'''
content = content.replace(old_select, new_select)

# Fix 3: Tab click clears selectedDeal
content = content.replace("onClick={() => setIndustry(ind)}", "onClick={() => { setIndustry(ind); setSelectedDeal(null); }}")

with open('App.jsx', 'w') as f:
    f.write(content)

print('Done!')
