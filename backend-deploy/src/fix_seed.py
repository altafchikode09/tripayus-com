with open('seed.js', 'r') as f:
    content = f.read()

content = content.replace(
    "    { email: 'admin@tripay.ai', password: 'admin123', name: 'Admin User', role: 'admin' },",
    ""
)

with open('seed.js', 'w') as f:
    f.write(content)

print('Seed Done!')
