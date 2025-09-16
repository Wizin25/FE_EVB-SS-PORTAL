// Form.jsx
import { useState } from 'react'

export default function FormPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    alert(`Submitted: ${name} - ${email}`)
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Form</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'grid', gap: 12, maxWidth: 420 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Họ tên</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập họ tên" style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Nhập email" type="email" style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #cbd5e1' }} />
        </label>
        <button type="submit" style={{ padding: '10px 14px', background: '#0f172a', color: 'white', borderRadius: 6, fontWeight: 600 }}>Gửi</button>
      </form>
    </div>
  )
}


