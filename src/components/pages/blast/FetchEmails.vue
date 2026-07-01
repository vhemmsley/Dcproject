<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
    <div class="container mx-auto px-4 pt-10 pb-10">
      <!-- Header -->
      <div class="max-w-6xl mx-auto mb-8">
        <div class="flex items-center gap-3 mb-2">
          <router-link
            to="/send-blaster"
            class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Send Blaster
          </router-link>
        </div>
        <h1
          class="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
        >
          Campaign Email Explorer
        </h1>
        <p class="text-slate-400 mt-2">
          View, search, and export all individual emails for any campaign.
        </p>
      </div>

      <div class="max-w-6xl mx-auto">
        <!-- Campaign ID Input -->
        <div class="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mb-6">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Campaign ID <span class="text-red-400">*</span>
          </label>
          <div class="flex gap-3">
            <input
              v-model="campaignIdInput"
              type="text"
              placeholder="e.g. cmp_humaniiity.com_1782817710287_men6p9"
              class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              @keyup.enter="loadCampaignEmails"
            />
            <button
              @click="loadCampaignEmails"
              :disabled="loading || !campaignIdInput.trim()"
              class="px-6 py-3 rounded-xl font-semibold transition-all"
              :class="
                loading || !campaignIdInput.trim()
                  ? 'bg-slate-700 cursor-not-allowed text-slate-500'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              "
            >
              <span v-if="!loading" class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Load Emails
              </span>
              <span v-else class="flex items-center gap-2">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            </button>
          </div>

          <!-- Quick Load from Recent Campaigns -->
          <div v-if="recentCampaigns.length > 0" class="mt-4">
            <p class="text-xs text-slate-500 mb-2">Or select from recent campaigns:</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="campaign in recentCampaigns.slice(0, 8)"
                :key="campaign.id"
                @click="campaignIdInput = campaign.campaignId || campaign.id; loadCampaignEmails();"
                 
            
                class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-colors truncate max-w-xs"
                :title="campaign.subject"
              >
                {{ campaign.subject || campaign.campaignId || campaign.id }}
              </button>
            </div>
          </div>
        </div>

        <!-- Campaign Info Banner -->
        <div
          v-if="campaignInfo"
          class="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mb-6"
        >
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold">{{ campaignInfo.subject || 'Untitled Campaign' }}</h2>
              <p class="text-sm text-slate-400 mt-1">
                <span class="text-blue-400">{{ campaignInfo.domain }}</span>
                <span class="mx-2">•</span>
                <span>{{ campaignInfo.fromName }}</span>
                <span class="mx-2">•</span>
                <span>{{ formatDate(campaignInfo.createdAt) }}</span>
              </p>
            </div>
            <span
              class="px-3 py-1 rounded-full text-sm font-semibold"
              :class="getCampaignStatusClass(campaignInfo.status)"
            >
              {{ campaignInfo.status || 'unknown' }}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
              <p class="text-xs text-slate-500 uppercase">Total</p>
              <p class="text-xl font-bold">{{ totalCount }}</p>
            </div>
            <div class="bg-slate-950 border border-green-500/20 rounded-xl p-3 text-center">
              <p class="text-xs text-green-400 uppercase">Sent</p>
              <p class="text-xl font-bold text-green-400">{{ statusCounts.sent }}</p>
            </div>
            <div class="bg-slate-950 border border-red-500/20 rounded-xl p-3 text-center">
              <p class="text-xs text-red-400 uppercase">Failed</p>
              <p class="text-xl font-bold text-red-400">{{ statusCounts.failed }}</p>
            </div>
            <div class="bg-slate-950 border border-yellow-500/20 rounded-xl p-3 text-center">
              <p class="text-xs text-yellow-400 uppercase">Pending</p>
              <p class="text-xl font-bold text-yellow-400">
                {{ statusCounts.pending + statusCounts.distributed + statusCounts.pending_retry }}
              </p>
            </div>
            <div class="bg-slate-950 border border-blue-500/20 rounded-xl p-3 text-center">
              <p class="text-xs text-blue-400 uppercase">Success Rate</p>
              <p class="text-xl font-bold text-blue-400">{{ successRate }}%</p>
            </div>
          </div>
        </div>

        <!-- Filters & Export -->
        <div
          v-if="allEmails.length > 0"
          class="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 mb-6"
        >
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex-1 min-w-[200px]">
              <div class="relative">
                <svg
                  class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search by email address..."
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <select
              v-model="statusFilter"
              class="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="sent">✅ Sent</option>
              <option value="failed">❌ Failed</option>
              <option value="pending">⏳ Pending</option>
              <option value="distributed">📦 Distributed</option>
              <option value="pending_retry">🔄 Retry Queue</option>
            </select>

            <button
              @click="exportToCSV"
              class="px-4 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export CSV
            </button>
            <button
              @click="exportToJSON"
              class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export JSON
            </button>
            <button
              @click="copyEmailsToClipboard"
              class="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Emails
            </button>
          </div>

          <div class="flex items-center justify-between mt-3 text-xs text-slate-500">
            <span>Showing {{ filteredEmails.length }} of {{ allEmails.length }} emails</span>
            <span v-if="hasMore" class="text-blue-400"
              >More emails available — click Load More</span
            >
          </div>
        </div>

        <!-- Emails Table -->
        <div
          v-if="filteredEmails.length > 0"
          class="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-950 border-b border-slate-800">
                  <th class="text-left px-4 py-3 text-slate-400 font-semibold">#</th>
                  <th class="text-left px-4 py-3 text-slate-400 font-semibold">Email Address</th>
                  <th class="text-left px-4 py-3 text-slate-400 font-semibold">Status</th>
                  <th class="text-left px-4 py-3 text-slate-400 font-semibold">Attempts</th>
                  <th class="text-left px-4 py-3 text-slate-400 font-semibold">Error</th>
                  <th class="text-left px-4 py-3 text-slate-400 font-semibold">Sent At</th>
                  <th class="text-left px-4 py-3 text-slate-400 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(email, index) in filteredEmails"
                  :key="email.id"
                  class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td class="px-4 py-3 text-slate-500">{{ index + 1 }}</td>
                  <td class="px-4 py-3 font-mono text-slate-200">{{ email.email }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-semibold"
                      :class="getStatusBadgeClass(email.status)"
                    >
                      {{ email.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-400">{{ email.attempts }}</td>
                  <td class="px-4 py-3">
                    <span
                      v-if="email.error"
                      class="text-red-400 text-xs truncate max-w-[200px] block"
                      :title="email.error"
                      >{{ email.error }}</span
                    >
                    <span v-else class="text-slate-600">—</span>
                  </td>
                  <td class="px-4 py-3 text-slate-400 text-xs">
                    {{ email.sentAt ? formatDate(email.sentAt) : '—' }}
                  </td>
                  <td class="px-4 py-3 text-slate-400 text-xs">
                    {{ formatDate(email.createdAt) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Load More -->
          <div v-if="hasMore" class="p-4 text-center border-t border-slate-800">
            <button
              @click="loadMoreEmails"
              :disabled="loadingMore"
              class="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold transition-all"
              :class="loadingMore ? 'cursor-not-allowed opacity-50' : ''"
            >
              <span v-if="!loadingMore">Load More Emails</span>
              <span v-else class="flex items-center gap-2">
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="searched && !loading" class="text-center py-16">
          <svg
            class="w-16 h-16 mx-auto mb-4 text-slate-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p class="text-slate-500 text-lg">No emails found</p>
          <p class="text-slate-600 text-sm mt-1">Enter a campaign ID above to get started</p>
        </div>

        <!-- Copy Toast -->
        <div
          v-if="showCopyToast"
          class="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Copied to clipboard!
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getCampaignEmails, getCampaigns, getCampaignStatus } from '@/firebase/firebase'

export default {
  name: 'CampaignEmailExplorer',

  data() {
    return {
      campaignIdInput: '',
      currentCampaignId: '',
      campaignInfo: null,
      allEmails: [],
      loading: false,
      loadingMore: false,
      searched: false,
      hasMore: false,
      lastDocId: null,
      searchQuery: '',
      statusFilter: 'all',
      showCopyToast: false,
      recentCampaigns: [],
    }
  },

  computed: {
    filteredEmails() {
      let emails = this.allEmails
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase()
        emails = emails.filter((e) => e.email.toLowerCase().includes(query))
      }
      if (this.statusFilter !== 'all') {
        emails = emails.filter((e) => e.status === this.statusFilter)
      }
      return emails
    },

    totalCount() {
      return this.allEmails.length
    },

    statusCounts() {
      const counts = { sent: 0, failed: 0, pending: 0, distributed: 0, pending_retry: 0 }
      this.allEmails.forEach((e) => {
        if (counts[e.status] !== undefined) counts[e.status]++
      })
      return counts
    },

    successRate() {
      const total = this.allEmails.length
      if (total === 0) return 0
      const sent = this.statusCounts.sent
      const failed = this.statusCounts.failed
      const completed = sent + failed
      if (completed === 0) return 0
      return Math.round((sent / completed) * 100)
    },
  },

  mounted() {
    this.loadRecentCampaigns()
    const urlParams = new URLSearchParams(window.location.search)
    const campaignId = urlParams.get('campaignId')
    if (campaignId) {
      this.campaignIdInput = campaignId
      this.loadCampaignEmails()
    }
  },

  methods: {
    async loadCampaignEmails() {
      const campaignId = this.campaignIdInput.trim()
      if (!campaignId) return

      this.loading = true
      this.searched = true
      this.allEmails = []
      this.lastDocId = null
      this.hasMore = false
      this.currentCampaignId = campaignId

      try {
        // Load campaign info
        try {
          const statusResult = await getCampaignStatus({ campaignId })
          const statusData = statusResult.data || statusResult
          if (statusData.campaign) this.campaignInfo = statusData.campaign
        } catch (e) {
          console.warn('Could not load campaign info:', e.message)
        }

        await this.fetchEmailPage(campaignId)
      } catch (err) {
        console.error('Error loading campaign emails:', err)
        alert('Failed to load emails: ' + (err.message || 'Unknown error'))
      } finally {
        this.loading = false
      }
    },

    async fetchEmailPage(campaignId) {
      const result = await getCampaignEmails({
        campaignId,
        pageSize: 500,
        lastDocId: this.lastDocId,
      })
      const data = result.data || result

      if (data.emails?.length > 0) this.allEmails.push(...data.emails)
      this.hasMore = data.hasMore || false
      this.lastDocId = data.lastDocId || null
    },

    async loadMoreEmails() {
      if (!this.hasMore || this.loadingMore) return
      this.loadingMore = true
      try {
        await this.fetchEmailPage(this.currentCampaignId)
      } catch (err) {
        console.error('Error loading more emails:', err)
      } finally {
        this.loadingMore = false
      }
    },

    async loadRecentCampaigns() {
      try {
        const result = await getCampaigns()
        const data = result.data || result
        this.recentCampaigns = data.campaigns || []
      } catch (err) {
        console.error('Failed to load recent campaigns:', err)
      }
    },

    getStatusBadgeClass(status) {
      switch (status) {
        case 'sent':
          return 'bg-green-500/20 text-green-400 border border-green-500/30'
        case 'failed':
          return 'bg-red-500/20 text-red-400 border border-red-500/30'
        case 'pending':
          return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        case 'distributed':
          return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
        case 'pending_retry':
          return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
        default:
          return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
      }
    },

    getCampaignStatusClass(status) {
      switch (status) {
        case 'completed':
          return 'bg-green-500/20 text-green-400'
        case 'queued':
          return 'bg-yellow-500/20 text-yellow-400'
        case 'failed':
          return 'bg-red-500/20 text-red-400'
        default:
          return 'bg-blue-500/20 text-blue-400'
      }
    },

    formatDate(timestamp) {
      if (!timestamp) return '—'
      try {
        let date
        if (timestamp.toDate && typeof timestamp.toDate === 'function') date = timestamp.toDate()
        else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000)
        else if (typeof timestamp === 'string') date = new Date(timestamp)
        else date = new Date(timestamp)
        if (isNaN(date.getTime())) return '—'
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch (e) {
        return '—'
      }
    },

    exportToCSV() {
      const emails = this.filteredEmails.length > 0 ? this.filteredEmails : this.allEmails
      if (emails.length === 0) return
      const headers = [
        'Email',
        'Status',
        'Attempts',
        'Retry Count',
        'Error',
        'Sent At',
        'Created At',
        'Worker Queue',
      ]
      const rows = emails.map((e) => [
        e.email,
        e.status,
        e.attempts,
        e.retryCount,
        e.error || '',
        e.sentAt ? this.formatDate(e.sentAt) : '',
        e.createdAt ? this.formatDate(e.createdAt) : '',
        e.workerQueue || '',
      ])
      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(',')),
      ].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `campaign-${this.currentCampaignId}-emails.csv`
      link.click()
    },

    exportToJSON() {
      const emails = this.filteredEmails.length > 0 ? this.filteredEmails : this.allEmails
      if (emails.length === 0) return
      const exportData = {
        campaign: this.campaignInfo,
        exportedAt: new Date().toISOString(),
        total: emails.length,
        emails: emails,
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `campaign-${this.currentCampaignId}-emails.json`
      link.click()
    },

    copyEmailsToClipboard() {
      const emails = this.filteredEmails.length > 0 ? this.filteredEmails : this.allEmails
      const emailList = emails.map((e) => e.email).join('\n')
      navigator.clipboard.writeText(emailList).then(() => {
        this.showCopyToast = true
        setTimeout(() => {
          this.showCopyToast = false
        }, 2000)
      })
    },
  },
}
</script>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.8);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 1);
}
</style>
