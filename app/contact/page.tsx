"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function getAvatarColor(name: string) {
  const colors = ["#7C3AED","#2563EB","#059669","#D97706","#DC2626","#0891B2"]
  return colors[(name?.charCodeAt(0) || 0) % colors.length]
}

const STAGES = [
  { id: "contact", label: "Contact", color: "#6B7280", bg: "#F3F4F6",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { id: "engager", label: "Engager", color: "#8B5CF6", bg: "#EDE9FE",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8a6 6 0 0 0 12 0v-3a2 2 0 0 0-4 0"/></svg> },
  { id: "subscriber", label: "Subscriber", color: "#3B82F6", bg: "#DBEAFE",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { id: "messager", label: "Messager", color: "#10B981", bg: "#D1FAE5",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { id: "lead", label: "Lead", color: "#FBBF24", bg: "#FEF3C7",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
  { id: "mql", label: "MQL", color: "#F59E0B", bg: "#FEF3C7",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { id: "sql", label: "SQL", color: "#EF4444", bg: "#FEE2E2",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { id: "customer", label: "Customer", color: "#10B981", bg: "#D1FAE5",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
  { id: "upseller", label: "Upseller", color: "#8B5CF6", bg: "#EDE9FE",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg> },
  { id: "downseller", label: "Downseller", color: "#B45309", bg: "#FEF3C7",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg> },
]

const THERMAL = {
  frozen: {
    label: "متجمد", color: "#6B7280", bg: "#F3F4F6",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 7l-5 5-5-5"/><path d="M17 17l-5-5-5 5"/><path d="M2 12h20"/><path d="M7 4.5l5 3 5-3"/><path d="M7 19.5l5-3 5 3"/></svg>
  },
  cold: {
    label: "بارد", color: "#3B82F6", bg: "#DBEAFE",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><path d="M12 22V2M12 2C12 2 8 6 8 10a4 4 0 0 0 8 0c0-4-4-8-4-8z"/><path d="M5 12H2M22 12h-3"/><path d="M5.5 5.5L4 4M20 20l-1.5-1.5M18.5 5.5L20 4M4 20l1.5-1.5"/></svg>
  },
  warm: {
    label: "دافئ", color: "#F59E0B", bg: "#FEF3C7",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
  },
  hot: {
    label: "ساخن", color: "#EF4444", bg: "#FEE2E2",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M12 2c0 0-4 4-4 9a4 4 0 0 0 8 0c0-5-4-9-4-9z"/><path d="M12 11c0 0-2 2-2 4a2 2 0 0 0 4 0c0-2-2-4-2-4z" fill="#EF4444"/></svg>
  },
}


const activities = [
  { id:"1", text:"حفظ البوست", platform:"Instagram", time:"منذ 10 دقائق", detail:null, bg:"#D1FAE5",
    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
  { id:"2", text:"تعليق على البوست", platform:"Instagram", time:"منذ 45 دقيقة", detail:"رائع جداً!", bg:"#DBEAFE",
    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { id:"3", text:"مشاركة البوست", platform:"Facebook", time:"منذ 2 ساعة", detail:null, bg:"#EDE9FE",
    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
  { id:"4", text:"فتح الإيميل", platform:"Email", time:"منذ 3 ساعات", detail:"عرض خاص", bg:"#FEF3C7",
    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  { id:"5", text:"متابعة", platform:"Instagram", time:"منذ 5 ساعات", detail:null, bg:"#FCE7F3",
    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> },
]

const ACTION_BTNS = [
  { label:"إرسال بريد", border:"#7C3AED", icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  { label:"نقل لـ GHL", border:"#7C3AED", icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> },
  { label:"جدولة اتصال", border:"#7C3AED", icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
  { label:"التحليلات", border:"#7C3AED", icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { label:"تعديل", border:"#7C3AED", icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  { label:"حذف", border:"#EF4444", icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> },
]

function getScoreLabel(score: number) {
  if (score >= 80) return { label: "ممتاز", color: "#10B981" }
  if (score >= 60) return { label: "جيد جداً", color: "#3B82F6" }
  if (score >= 40) return { label: "جيد", color: "#F59E0B" }
  return { label: "ضعيف", color: "#EF4444" }
}

function ContactDetailsInner() {
  const searchParams = useSearchParams()
  const contactId = searchParams.get('id')

  const [contact, setContact] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [notes, setNotes] = useState([
    { id:"1", author:"المدير الإداري", time:"منذ يوم", content:"مهتم جداً بالمنتج، طلب عرض سعر مخصص" }
  ])
  const [isAdding, setIsAdding] = useState(false)
  const [newNote, setNewNote] = useState("")

  useEffect(() => {
    if (!contactId) return
    console.log('Contact ID from URL:', contactId)
    const urlParams = new URLSearchParams(window.location.search)
    const rawToken = urlParams.get('token')
    const urlToken = rawToken ? decodeURIComponent(rawToken) : null
    const token = urlToken || localStorage.getItem('authToken')
    if (!token) { setLoading(false); return }
    fetch(`https://triggerio-backend.onrender.com/api/contacts/${contactId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        console.log('API Response:', JSON.stringify(data))
        if (data.success) setContact(data.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [contactId])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
  if (!contact) return <div className="min-h-screen flex items-center justify-center text-gray-500">جهة الاتصال غير موجودة</div>

  const thermal = THERMAL[contact.temperature as keyof typeof THERMAL] || THERMAL.cold
  const currentStageIdx = STAGES.findIndex(s => s.id === contact.stage)
  const scoreInfo = getScoreLabel(contact.engagementScore || 0)
  const displayed = showAll ? activities : activities.slice(0, 3)

  const addNote = () => {
    if (newNote.trim()) {
      setNotes([{ id: Date.now().toString(), author:"أنت", time:"الآن", content:newNote }, ...notes])
      setNewNote(""); setIsAdding(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-[#f3f4f6] to-[#e5e7eb] p-6">
      <div className="max-w-[1400px] mx-auto">

        {/* Back */}
        <button onClick={() => {
            if (window.parent !== window) {
              window.parent.postMessage({ type: 'NAVIGATE', url: 'https://contacts-management-plum.vercel.app' }, '*')
            } else {
              window.history.back()
            }
          }}
          className="inline-flex items-center gap-2 text-[#7C3AED] hover:text-[#6D28D9] mb-6 text-[14px] font-[600]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          العودة إلى جهات الاتصال
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* MAIN */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                    style={{ backgroundColor: getAvatarColor(contact.name) }}>
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-[24px] font-[700] text-[#374151] mb-1">{contact.name}</h1>
                    <p className="text-[14px] text-[#7C3AED] mb-1">{contact.instagramUsername || contact.username || ''}</p>
                    <p className="text-[14px] text-[#6B7280] mb-1">{contact.email}</p>
                    <p className="text-[14px] text-[#9CA3AF]">{contact.source}</p>
                  </div>
                </div>
                {/* Thermal Badge with SVG */}
                <div className="text-left">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-[700]"
                    style={{ backgroundColor: thermal.bg, color: thermal.color }}>
                    {thermal.icon}
                    {thermal.label}
                  </span>
                  <div className="mt-2 text-[12px] text-[#6B7280]">آخر تفاعل: {contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString('ar-SA') : '—'}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {ACTION_BTNS.map((btn, i) => (
                  <button key={i}
                    className="px-4 py-2.5 border-2 rounded-lg font-[600] text-[14px] transition-all flex items-center gap-2"
                    style={{ borderColor: btn.border, color: btn.border }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.backgroundColor = btn.border; el.style.color = "white" }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.backgroundColor = "transparent"; el.style.color = btn.border }}>
                    {btn.icon}{btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sales Funnel */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-[18px] font-[700] text-[#374151] mb-6">مرحلة مسار المبيعات</h2>
              <div className="flex items-center flex-wrap gap-2">
                {STAGES.map((stage, idx) => {
                  const isActive = stage.id === contact.stage
                  const isPast = idx < currentStageIdx
                  return (
                    <div key={stage.id} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-[600] whitespace-nowrap transition-all"
                        style={{
                          backgroundColor: isActive ? stage.color : isPast ? `${stage.color}25` : "#F3F4F6",
                          color: isActive ? "white" : isPast ? stage.color : "#9CA3AF",
                        }}>
                        {stage.icon}{stage.label}
                      </div>
                      {idx < STAGES.length - 1 && <div className="w-3 h-0.5 bg-[#E5E7EB]" />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Engagement Score */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-[18px] font-[700] text-[#374151] mb-6">مستوى التفاعل</h2>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[16px] font-[600]" style={{ color: scoreInfo.color }}>{scoreInfo.label}</span>
                <span className="text-[28px] font-[700] text-[#7C3AED]">{contact.engagementScore || 0}/100</span>
              </div>
              <div className="w-full h-4 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width:`${contact.engagementScore || 0}%`, background:"linear-gradient(to left, #6D28D9, #7C3AED)" }} />
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-[18px] font-[700] text-[#374151] mb-6">آخر التفاعلات</h2>
              <div className="space-y-4">
                {displayed.map(a => (
                  <div key={a.id} className="border border-[#E5E7EB] rounded-lg p-4 hover:border-[#7C3AED] transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: a.bg }}>
                          {a.icon}
                        </div>
                        <div>
                          <p className="text-[14px] font-[600] text-[#374151] mb-1">{a.text}</p>
                          <p className="text-[12px] text-[#9CA3AF]">{a.platform}{a.detail && ` • ${a.detail}`}</p>
                        </div>
                      </div>
                      <span className="text-[12px] text-[#9CA3AF] whitespace-nowrap">{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              {!showAll && activities.length > 3 && (
                <button onClick={() => setShowAll(true)}
                  className="w-full mt-4 py-2 text-[#7C3AED] hover:text-[#6D28D9] text-[14px] font-[600]">
                  عرض المزيد...
                </button>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-[18px] font-[700] text-[#374151] mb-6">الملاحظات</h2>
              <div className="space-y-4 mb-4">
                {notes.map(note => (
                  <div key={note.id} className="border border-[#E5E7EB] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-[#9CA3AF]">{note.author} • {note.time}</span>
                      <div className="flex gap-2">
                        <button className="text-[#7C3AED] hover:text-[#6D28D9]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setNotes(notes.filter(n => n.id !== note.id))} className="text-[#EF4444] hover:text-[#DC2626]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-[14px] text-[#374151]">{note.content}</p>
                  </div>
                ))}
              </div>
              {isAdding ? (
                <div className="space-y-3">
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                    placeholder="اكتب ملاحظتك هنا..." rows={3}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg text-[14px] focus:outline-none focus:border-[#7C3AED] resize-none" />
                  <div className="flex gap-2">
                    <button onClick={addNote} className="flex-1 px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-[14px] font-[600] hover:bg-[#6D28D9]">حفظ</button>
                    <button onClick={() => { setIsAdding(false); setNewNote("") }} className="flex-1 px-4 py-2 border border-[#E5E7EB] text-[#6B7280] rounded-lg text-[14px] font-[600]">إلغاء</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setIsAdding(true)}
                  className="w-full px-4 py-2.5 border-2 border-dashed border-[#7C3AED] text-[#7C3AED] rounded-lg font-[600] text-[14px] hover:bg-[#F3F4F6] flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  إضافة ملاحظة
                </button>
              )}
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-[18px] font-[700] text-[#374151] mb-6">معلومات الاتصال</h2>
              <div className="space-y-4 mb-6">
                {[
                  { label:"الاسم الكامل", value:contact.name },
                  { label:"البريد الإلكتروني", value:contact.email },
                  { label:"الهاتف", value:contact.phone },
                  { label:"المنصة", value:`${contact.source || '—'} (${contact.instagramUsername || contact.username || '—'})` },
                  { label:"المصدر", value:`${contact.source || '—'}` },
                  { label:"المجموعة", value:contact.group || '—' },
                  { label:"تاريخ الإضافة", value:contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('ar-SA') : '—' },
                  { label:"آخر تحديث", value:contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString('ar-SA') : '—' },
                ].map((item, i) => (
                  <div key={i}>
                    <label className="text-[12px] text-[#9CA3AF] block mb-1">{item.label}</label>
                    <p className="text-[14px] text-[#374151] font-[600]">{item.value}</p>
                  </div>
                ))}
              </div>
              {/* Tags */}
              <div>
                <label className="text-[12px] text-[#9CA3AF] block mb-3">التاجات</label>
                <div className="flex flex-wrap gap-2">
                  {(contact.tags || []).map((tag: string) => (
                    <span key={tag} className="px-3 py-1.5 bg-[#F3F4F6] text-[#374151] rounded-lg text-[12px] font-[600]">{tag}</span>
                  ))}
                  <button className="px-3 py-1.5 border-2 border-dashed border-[#7C3AED] text-[#7C3AED] rounded-lg text-[12px] font-[600] flex items-center gap-1 hover:bg-[#F3F4F6]">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    إضافة تاج
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContactDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>}>
      <ContactDetailsInner />
    </Suspense>
  )
}
