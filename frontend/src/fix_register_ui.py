with open('App.jsx', 'r') as f:
    content = f.read()

# Fix 1: LoginScreen accept onRegister prop
content = content.replace(
    'function LoginScreen({ onLogin }) {',
    'function LoginScreen({ onLogin, onRegister }) {'
)

# Fix 2: Add register states inside LoginScreen
old_states = """  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast, Toast } = useToast()"""

new_states = """  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const { showToast, Toast } = useToast()"""

content = content.replace(old_states, new_states)

# Fix 3: Handle submit for both login and register
old_submit = """  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      showToast(err.response?.data?.error || 'Login failed', '❌')
    } finally {
      setLoading(false)
    }
  }"""

new_submit = """  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isRegister) {
        await onRegister({ email, password, name })
        showToast('Account created! Please log in.', '✅')
        setIsRegister(false)
        setName('')
      } else {
        await onLogin(email, password)
      }
    } catch (err) {
      showToast(err.response?.data?.error || (isRegister ? 'Registration failed' : 'Login failed'), '❌')
    } finally {
      setLoading(false)
    }
  }"""

content = content.replace(old_submit, new_submit)

# Fix 4: Replace login form with login/register toggle form
old_form = """        <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required />
        <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#050812' }} /> : 'Sign In'}
        </button>
        <div className="login-demo">

          <p style={{ marginTop: 4 }}>Roles: Admin | Analyst | Client</p>
        </div>"""

new_form = """        {isRegister && (
          <input className="login-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required={isRegister} />
        )}
        <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required />
        <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#050812' }} /> : (isRegister ? 'Create Account' : 'Sign In')}
        </button>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <p style={{ color: 'var(--text-sec)', fontSize: 13, marginBottom: 8 }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsRegister(!isRegister)} style={{ width: '100%' }}>
            {isRegister ? 'Back to Login' : 'Create Account'}
          </button>
        </div>"""

content = content.replace(old_form, new_form)

# Fix 5: App() pass handleRegister to LoginScreen
old_app_call = "if (!user) return <LoginScreen onLogin={handleLogin} />"
new_app_call = "if (!user) return <LoginScreen onLogin={handleLogin} onRegister={register} />"

content = content.replace(old_app_call, new_app_call)

with open('App.jsx', 'w') as f:
    f.write(content)

print('Done!')
