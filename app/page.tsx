"use client"

import { useState, useEffect, useCallback } from "react"

// @ts-ignore - Import من JavaScript files
import { contactAPI } from "../shared-api-config/api/endpoints"
// @ts-ignore - Design System
import { COLORS, THERMAL_COLORS, STAGE_COLORS, getThermalColor } from "../lib/designSystem"

interface Contact {
  id: number
  name: string
  email: string
  phone: string
  avatar: string | null
  source: string
  temperature: string
  stage: string
  group: string | null
  lastContact: string
  tags: string[]
  createdAt: string
}

interface ContactStats {
  total: number
  hot: number
  ghlTransfers: number
  frozen: number
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<ContactStats>({ total: 0, hot: 0, ghlTransfers: 0, frozen: 0 })
  const [selectedContacts, setSelectedContacts] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    source: "all",
    temperature: "all",
    stage: "all",
    group: "all",
    tags: "all",
    dateRange: "all",
    sortBy: "newest",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [addingContact, setAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", source: "manual" })

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit: rowsPerPage,
      }

      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (filters.source !== "all") params.source = filters.source
      if (filters.temperature !== "all") params.temperature = filters.temperature
      if (filters.stage !== "all") params.stage = filters.stage
      if (filters.group !== "all") params.group = filters.group
      if (filters.sortBy !== "newest") params.sortBy = filters.sortBy

      console.log("📇 Fetching contacts...", params)
      const response = await contactAPI.getAll(params)
      console.log("✅ Contacts received:", response)

      const contactsList = Array.isArray(response.data) ? response.data : (response.data?.contacts || response.contacts || [])
      const mappedContacts: Contact[] = contactsList.map(
        (c: any, index: number) => ({
          id: c._id || c.id || index + 1,
          name: c.name || (c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.email || "غير معروف"),
          email: c.email || "",
          phone: c.phone || "",
          avatar: c.avatar || null,
          source: c.source || "Email",
          temperature: c.temperature || c.temp || "cold",
          stage: c.stage || "contact",
          group: c.group || null,
          lastContact: c.lastContact || c.updatedAt || c.createdAt || "",
          tags: c.tags || [],
          createdAt: c.createdAt || "",
        })
      )

      setContacts(mappedContacts)
      setTotalCount(response.total || response.totalCount || mappedContacts.length)
    } catch (err: any) {
      console.error("❌ Failed to fetch contacts:", err)
      setError(err.message || "فشل تحميل جهات الاتصال")
    } finally {
      setLoading(false)
    }
  }, [currentPage, rowsPerPage, searchQuery, filters])

  const fetchStats = useCallback(async () => {
    try {
      console.log("📊 Fetching contact stats...")
      const response = await contactAPI.getStats()
      console.log("✅ Stats received:", response)
      setStats({
        total: response.total || response.totalContacts || 0,
        hot: response.hot || response.hotLeads || 0,
        ghlTransfers: response.ghlTransfers || 0,
        frozen: response.frozen || response.frozenContacts || 0,
      })
    } catch (err: any) {
      console.error("❌ Failed to fetch stats:", err)
    }
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')
    if (urlToken) {
      localStorage.setItem('triggerio_token', urlToken)
      window.history.replaceState({}, '', window.location.pathname)
    }
    fetchContacts()
    fetchStats()
  }, [fetchContacts, fetchStats])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters, rowsPerPage])

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(contacts.map((c) => c.id))
    }
    setSelectAll(!selectAll)
  }

  // Handle individual checkbox
  const handleSelectContact = (id: number) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter((cId) => cId !== id))
    } else {
      setSelectedContacts([...selectedContacts, id])
    }
  }

  // Handle delete
  const handleDeleteContact = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف جهة الاتصال هذه؟")) return

    try {
      console.log("🗑️ Deleting contact:", id)
      await contactAPI.delete(id)
      console.log("✅ Contact deleted")
      setActiveDropdown(null)
      fetchContacts()
      fetchStats()
    } catch (err: any) {
      console.error("❌ Failed to delete:", err)
      alert(err.message || "فشل حذف جهة الاتصال")
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${selectedContacts.length} جهة اتصال؟`)) return

    try {
      console.log("🗑️ Bulk deleting:", selectedContacts)
      await contactAPI.bulkDelete(selectedContacts)
      console.log("✅ Contacts deleted")
      setSelectedContacts([])
      setSelectAll(false)
      fetchContacts()
      fetchStats()
    } catch (err: any) {
      console.error("❌ Bulk delete failed:", err)
      alert(err.message || "فشل حذف جهات الاتصال")
    }
  }

  // Handle export
  const handleExport = async () => {
    try {
      console.log("📥 Exporting contacts...")
      await contactAPI.export({
        source: filters.source !== "all" ? filters.source : undefined,
        temperature: filters.temperature !== "all" ? filters.temperature : undefined,
      })
      console.log("✅ Export complete")
    } catch (err: any) {
      console.error("❌ Export failed:", err)
      alert(err.message || "فشل تصدير جهات الاتصال")
    }
  }

  // Handle add contact
  const handleAddContact = async () => {
    if (!newContact.name.trim()) return alert("الاسم مطلوب")

    setAddingContact(true)
    try {
      await contactAPI.create({
        name: newContact.name.trim(),
        email: newContact.email.trim() || undefined,
        phone: newContact.phone.trim() || undefined,
        source: newContact.source,
      })
      setIsAddContactOpen(false)
      setNewContact({ name: "", email: "", phone: "", source: "Manual" })
      fetchContacts()
      fetchStats()
    } catch (err: any) {
      console.error("Failed to add contact:", err)
      alert(err.message || "فشل في إضافة جهة الاتصال")
    } finally {
      setAddingContact(false)
    }
  }

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(" ")
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
  }

  // Temperature badge styles - using Design System THERMAL_COLORS
  const getTempStyles = (temp: string) => {
    const thermal = getThermalColor(temp)
    const meta: Record<string, { label: string; icon: string; ring: string }> = {
      hot: { label: "ساخن", icon: "🔥", ring: "ring-2 ring-red-400 animate-pulse" },
      warm: { label: "دافئ", icon: "⚠️", ring: "" },
      cold: { label: "بارد", icon: "🧊", ring: "" },
      frozen: { label: "متجمد", icon: "❄️", ring: "" },
    }
    const info = meta[temp] || { label: "غير محدد", icon: "", ring: "" }
    return {
      style: { backgroundColor: thermal.bg, color: thermal.text },
      ...info,
    }
  }

  // Stage badge styles - using Design System STAGE_COLORS
  const getStageStyles = (stage: string) => {
    const key = stage?.toLowerCase() as keyof typeof STAGE_COLORS
    const stageColor = STAGE_COLORS[key] || STAGE_COLORS.contact
    return {
      style: { backgroundColor: stageColor.bg, color: stageColor.text },
      label: stageColor.name,
    }
  }

  // Source badge styles
  const getSourceStyles = (source: string) => {
    switch (source) {
      case "Instagram":
        return { bg: "bg-blue-500", label: "Instagram" }
      case "Facebook":
        return { bg: "bg-blue-600", label: "Facebook" }
      case "Email":
        return { bg: "bg-purple-500", label: "Email" }
      case "Import":
        return { bg: "bg-gray-500", label: "Import" }
      case "Manual":
        return { bg: "bg-gray-600", label: "Manual" }
      default:
        return { bg: "bg-gray-500", label: source }
    }
  }

  const totalPages = Math.ceil(totalCount / rowsPerPage)

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen p-6" style={{ backgroundColor: COLORS.bgPrimary }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Skeleton loading */}
          <div className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen p-6" style={{ backgroundColor: COLORS.bgPrimary }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => { fetchContacts(); fetchStats(); }}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>Contacts</h1>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>إدارة جهات الاتصال</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-80" style={{ border: `1px solid ${COLORS.primary}`, color: COLORS.primary }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Import CSV
            </button>
            <button onClick={() => setIsAddContactOpen(true)} className="px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2 bg-violet-600 hover:bg-gradient-to-r hover:from-purple-400 hover:via-pink-400 hover:to-orange-300 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Frozen */}
          <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: COLORS.bgWhite, border: `1px solid ${COLORS.borderGray}` }}>
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m-6.36-3.64l12.72-12.72M3 12h18M5.64 5.64l12.72 12.72" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: COLORS.textPrimary }}>{stats.frozen}</div>
            <div className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>مجمدة</div>
            <div className="text-xs" style={{ color: COLORS.textSecondary }}>Frozen</div>
            {stats.frozen > 0 && <div className="mt-4 text-red-600 text-sm font-medium">Need attention</div>}
          </div>

          {/* Card 2: GHL Transfers */}
          <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: COLORS.bgWhite, border: `1px solid ${COLORS.borderGray}` }}>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: COLORS.textPrimary }}>{stats.ghlTransfers}</div>
            <div className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>تحويلات</div>
            <div className="text-xs" style={{ color: COLORS.textSecondary }}>GHL Transfers</div>
          </div>

          {/* Card 3: Hot Leads */}
          <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: COLORS.bgWhite, border: `1px solid ${COLORS.borderGray}` }}>
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 6.51 6.51 0 009 11.5a3 3 0 105.599-1.5c.474-.896.703-1.653.703-2.786 0-.558-.09-1.092-.243-1.594A4.762 4.762 0 0115.362 5.214z" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: COLORS.textPrimary }}>{stats.hot}</div>
            <div className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>عملاء ساخنون</div>
            <div className="text-xs" style={{ color: COLORS.textSecondary }}>Hot Leads</div>
          </div>

          {/* Card 4: Total Contacts */}
          <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: COLORS.bgWhite, border: `1px solid ${COLORS.borderGray}` }}>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: COLORS.textPrimary }}>{stats.total.toLocaleString()}</div>
            <div className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>إجمالي الجهات</div>
            <div className="text-xs" style={{ color: COLORS.textSecondary }}>Total Contacts</div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedContacts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-blue-900">
              تم تحديد {selectedContacts.length} من أصل {totalCount} جهة اتصال
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80" style={{ border: `1px solid ${COLORS.primary}`, color: COLORS.primary }}>
                Export
              </button>
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80" style={{ border: `1px solid ${COLORS.primary}`, color: COLORS.primary }}>
                Add Tag
              </button>
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80" style={{ border: `1px solid ${COLORS.primary}`, color: COLORS.primary }}>
                Change Temp
              </button>
              <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                Transfer to GHL
              </button>
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Send Email
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setSelectedContacts([])
                  setSelectAll(false)
                }}
                className="px-3 py-1.5 text-gray-600 text-sm font-medium hover:text-gray-900"
              >
                × Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="rounded-xl p-6 shadow-sm space-y-4" style={{ backgroundColor: COLORS.bgWhite, border: `1px solid ${COLORS.borderGray}` }}>
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث بالاسم، البريد، الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-right focus:border-purple-600 focus:outline-none"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-gray-600">حسب:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-purple-500 hover:text-purple-600 flex items-center gap-2">
                <span>Source</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-purple-500 hover:text-purple-600 flex items-center gap-2">
                <span>Temperature</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-purple-500 hover:text-purple-600 flex items-center gap-2">
                <span>Stage</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-purple-500 hover:text-purple-600 flex items-center gap-2">
                <span>Group</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-purple-500 hover:text-purple-600 flex items-center gap-2">
                <span>Tags</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-purple-500 hover:text-purple-600 flex items-center gap-2">
                <span>Date</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-purple-500 hover:text-purple-600 flex items-center gap-2">
                <span>Sort</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setFilters({ source: "all", temperature: "all", stage: "all", group: "all", tags: "all", dateRange: "all", sortBy: "newest" })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All ×
              </button>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: COLORS.bgWhite, border: `1px solid ${COLORS.borderGray}` }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="w-12 px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Contact Info</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Source</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Temperature</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Stage</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Group</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Last Contact</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Tags</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.length > 0 ? (
                  contacts.map((contact) => {
                    const tempStyles = getTempStyles(contact.temperature)
                    const stageStyles = getStageStyles(contact.stage)
                    const sourceStyles = getSourceStyles(contact.source)
                    const isSelected = selectedContacts.includes(contact.id)

                    return (
                      <tr
                        key={contact.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          isSelected ? "bg-blue-50 border-r-4 border-blue-600" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectContact(contact.id)}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                              {getInitials(contact.name)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{contact.name}</div>
                              <div className="text-xs" style={{ color: COLORS.textSecondary }}>{contact.email}</div>
                              {contact.phone && <div className="text-xs" style={{ color: COLORS.textSecondary }}>{contact.phone}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${sourceStyles.bg}`}
                          >
                            {sourceStyles.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${tempStyles.ring}`}
                            style={tempStyles.style}
                          >
                            {tempStyles.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                            style={stageStyles.style}
                          >
                            {stageStyles.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {contact.group ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ border: `1px solid ${COLORS.primary}`, color: COLORS.primary }}>
                              {contact.group}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500">{contact.lastContact}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            {contact.tags.length > 0 ? (
                              <>
                                {contact.tags.slice(0, 3).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {contact.tags.length > 3 && (
                                  <span className="text-xs text-gray-400">+{contact.tags.length - 3} more</span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === contact.id ? null : contact.id)}
                            className="p-1 hover:bg-gray-100 rounded-lg"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          {activeDropdown === contact.id && (
                            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                              <button className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                عرض التفاصيل
                              </button>
                              <button className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                تعديل
                              </button>
                              <button className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                إرسال بريد
                              </button>
                              <button className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                نقل لـ GHL
                              </button>
                              <div className="border-t border-gray-100 my-1" />
                              <button
                                onClick={() => handleDeleteContact(contact.id)}
                                className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                حذف
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="text-gray-400 text-lg mb-2">لا توجد جهات اتصال</div>
                      <p className="text-gray-400 text-sm">ابدأ بإضافة أول جهة اتصال</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm" style={{ color: COLORS.textSecondary }}>
              عرض {contacts.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-{Math.min(currentPage * rowsPerPage, totalCount)} من أصل {totalCount} جهة اتصال
            </div>
            <div className="flex items-center gap-2">
              {[25, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => setRowsPerPage(size)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    rowsPerPage === size
                      ? "border-2 font-semibold"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                  style={rowsPerPage === size ? { borderColor: COLORS.primary, color: COLORS.primary } : undefined}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button className="px-3 py-1.5 text-white rounded-lg text-sm font-semibold" style={{ backgroundColor: COLORS.primary }}>
                {currentPage}
              </button>
              {totalPages > 1 && currentPage < totalPages && (
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {currentPage + 1}
                </button>
              )}
              {totalPages > 2 && currentPage + 1 < totalPages && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                </>
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:opacity-80 disabled:text-gray-400 disabled:cursor-not-allowed"
                style={{ color: currentPage >= totalPages ? undefined : COLORS.primary }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Contact Dialog */}
      {isAddContactOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsAddContactOpen(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.textPrimary }}>إضافة جهة اتصال</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                <input
                  type="text"
                  placeholder="الاسم الكامل"
                  value={newContact.name}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-left focus:outline-none focus:ring-2 focus:ring-purple-500"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  placeholder="+966..."
                  value={newContact.phone}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-left focus:outline-none focus:ring-2 focus:ring-purple-500"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المصدر</label>
                <select
                  value={newContact.source}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, source: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-right focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Manual">Manual</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Email">Email</option>
                  <option value="Import">Import</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 justify-start">
              <button
                onClick={() => setIsAddContactOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddContact}
                disabled={addingContact}
                className="px-6 py-2 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                style={{ backgroundColor: COLORS.primary }}
              >
                {addingContact ? "جاري الإضافة..." : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
