with open('App.jsx', 'r') as f:
    content = f.read()

# Fix 1: Empty email default
content = content.replace(
    "const [email, setEmail] = useState('admin@tripay.ai')",
    "const [email, setEmail] = useState('')"
)

# Fix 2: Empty password default
content = content.replace(
    "const [password, setPassword] = useState('admin123')",
    "const [password, setPassword] = useState('')"
)

# Fix 3: Remove demo credentials text
content = content.replace(
    "          <p>Demo: <code>admin@tripay.ai</code> / <code>admin123</code></p>",
    ""
)

with open('App.jsx', 'w') as f:
    f.write(content)

print('Frontend Done!')
