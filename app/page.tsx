"use client"

import { useState, useEffect, useCallback } from "react"

// @ts-ignore - Import من JavaScript files
import { contactAPI } from "../shared-api-config/api/endpoints"

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

      const mappedContacts: Contact[] = (response.contacts || response.data || response || []).map(
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

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(" ")
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
  }

  // Temperature badge styles
  const getTempStyles = (temp: string) => {
    switch (temp) {
      case "hot":
        return {
          bg: "bg-red-50",
          text: "text-red-600",
          label: "ساخن",
          icon: "🔥",
          ring: "ring-2 ring-red-400 animate-pulse",
        }
      case "warm":
        return {
          bg: "bg-amber-50",
          text: "text-amber-600",
          label: "دافئ",
          icon: "⚠️",
          ring: "",
        }
      case "cold":
        return {
          bg: "bg-blue-50",
          text: "text-blue-600",
          label: "بارد",
          icon: "🧊",
          ring: "",
        }
      case "frozen":
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          label: "متجمد",
          icon: "❄️",
          ring: "",
        }
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          label: "غير محدد",
          icon: "",
          ring: "",
        }
    }
  }

  // Stage badge styles
  const getStageStyles = (stage: string) => {
    switch (stage) {
      case "contact":
        return { bg: "bg-gray-50", text: "text-gray-600", label: "Contact" }
      case "subscriber":
        return { bg: "bg-blue-50", text: "text-blue-600", label: "Subscriber" }
      case "lead":
        return { bg: "bg-yellow-50", text: "text-yellow-700", label: "Lead" }
      case "mql":
        return { bg: "bg-orange-50", text: "text-orange-600", label: "MQL" }
      case "sql":
        return { bg: "bg-red-100", text: "text-red-700", label: "SQL" }
      case "customer":
        return { bg: "bg-green-50", text: "text-green-600", label: "Customer" }
      case "frozen":
        return { bg: "bg-sky-50", text: "text-sky-600", label: "Frozen" }
      default:
        return { bg: "bg-gray-50", text: "text-gray-600", label: stage }
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
      <div dir="rtl" className="min-h-screen bg-gray-50 p-6">
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
    <div dir="rtl" className="min-h-screen bg-gray-50 p-6">
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
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-500 mt-1">إدارة جهات الاتصال</p>
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
            <button className="px-4 py-2 border border-purple-500 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 flex items-center gap-2">
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
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Contacts */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total.toLocaleString()}</div>
            <div className="text-sm text-gray-600 mb-2">إجمالي الجهات</div>
            <div className="text-xs text-gray-500">Total Contacts</div>
          </div>

          {/* Card 2: Hot Leads */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.hot}</div>
            <div className="text-sm text-gray-600 mb-2">عملاء ساخنون</div>
            <div className="text-xs text-gray-500">Hot Leads</div>
          </div>

          {/* Card 3: GHL Transfers */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.ghlTransfers}</div>
            <div className="text-sm text-gray-600 mb-2">تحويلات</div>
            <div className="text-xs text-gray-500">GHL Transfers</div>
          </div>

          {/* Card 4: Frozen */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.frozen}</div>
            <div className="text-sm text-gray-600 mb-2">متجمدة</div>
            <div className="text-xs text-gray-500">Frozen</div>
            {stats.frozen > 0 && <div className="mt-4 text-red-600 text-sm font-medium">Need attention</div>}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedContacts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="text-sm font-semibold text-blue-900">
              تم تحديد {selectedContacts.length} من أصل {totalCount} جهة اتصال
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} className="px-3 py-1.5 border border-purple-500 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50">
                Export
              </button>
              <button className="px-3 py-1.5 border border-purple-500 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50">
                Add Tag
              </button>
              <button className="px-3 py-1.5 border border-purple-500 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50">
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
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                              <div className="text-sm font-semibold text-gray-900">{contact.name}</div>
                              <div className="text-xs text-gray-500">{contact.email}</div>
                              {contact.phone && <div className="text-xs text-gray-500">{contact.phone}</div>}
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
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${tempStyles.bg} ${tempStyles.text} ${tempStyles.ring}`}
                          >
                            {tempStyles.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${stageStyles.bg} ${stageStyles.text}`}
                          >
                            {stageStyles.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {contact.group ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-purple-500 text-purple-600">
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
            <div className="text-sm text-gray-600">
              عرض {contacts.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-{Math.min(currentPage * rowsPerPage, totalCount)} من أصل {totalCount} جهة اتصال
            </div>
            <div className="flex items-center gap-2">
              {[25, 50, 100].map((size) => (
                <button
                  key={size}
                  onClick={() => setRowsPerPage(size)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    rowsPerPage === size
                      ? "border-2 border-purple-600 text-purple-600 font-semibold"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
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
              <button className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-semibold">
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
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
