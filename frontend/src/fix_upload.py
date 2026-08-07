with open('App.jsx', 'r') as f:
    content = f.read()

# Fix 1: Remove "Select a deal first" blocker
content = content.replace(
    "if (!selectedDeal) return showToast('Select a deal first', '⚠️')",
    "/* Upload without deal selection allowed */"
)

# Fix 2: Make dealId optional (send only if deal selected)
content = content.replace(
    "form.append('dealId', selectedDeal.id)",
    "if (selectedDeal) form.append('dealId', selectedDeal.id)"
)

with open('App.jsx', 'w') as f:
    f.write(content)

print('Done!')
