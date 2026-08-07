with open('App.jsx', 'r') as f:
    lines = f.readlines()

# Line 318 (index 317) - update select onChange
old = "value={selectedDeal?.id || ''} onChange={e => setSelectedDeal(deals.find(d => d.id === e.target.value) || null)}>"
new = """value={selectedDeal?.id || industry || ''} onChange={e => {
                  const val = e.target.value;
                  const inds = ['pe','realestate','ma','legal','healthcare','supplychain','insurance','vc'];
                  if (inds.includes(val)) { setIndustry(val); setSelectedDeal(null); }
                  else { setSelectedDeal(deals.find(d => d.id === val) || null); }
                }}>"""
lines[317] = lines[317].replace(old, new)

with open('App.jsx', 'w') as f:
    f.writelines(lines)

print('Done!')
