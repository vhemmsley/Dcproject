<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
    <div class="container mx-auto px-4 py-10">
      <!-- Header -->
      <div class="max-w-5xl mx-auto text-center mb-10">
        <h1
          class="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
        >
          Send Blaster
        </h1>
        <p class="text-slate-400 text-lg">
          Enterprise-grade email delivery with 3 parallel workers, automatic retries, and real-time
          analytics.
        </p>
        <div class="flex justify-center gap-4 mt-4 text-sm">
          <span
            class="px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30"
          >
            ⚡ 3 Parallel Workers
          </span>
          <span
            class="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
          >
            🔄 Auto-Retry (3x)
          </span>
          <span
            class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30"
          >
            📊 Real-time Stats
          </span>
        </div>
      </div>

      <div class="max-w-5xl mx-auto grid lg:grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="lg:col-span-2">
          <div
            class="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl"
          >
            <!-- Campaign Name -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Campaign Name <span class="text-slate-500">(Optional)</span>
              </label>
              <input
                v-model="campaignName"
                type="text"
                placeholder="e.g. March Newsletter"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <!-- Domain Select -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Select Domain <span class="text-red-400">*</span>
              </label>
              <select
                v-model="selectedDomain"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option disabled value="">Choose domain</option>
                <option v-for="d in domains" :key="d.domain" :value="d.domain">
                  {{ d.domain }}
                </option>
              </select>
            </div>

            <!-- From Name -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-slate-300 mb-2">
                From Name <span class="text-red-400">*</span>
              </label>
              <div
                class="flex bg-slate-950 border border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all"
              >
                <input
                  v-model="fromName"
                  type="text"
                  placeholder="e.g. Team"
                  class="flex-1 bg-transparent px-4 py-3 outline-none"
                />
                <span
                  class="flex items-center px-4 text-slate-500 text-sm border-l border-slate-700"
                >
                  @{{ selectedDomain || 'domain.com' }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Full sender: {{ formattedFromName }} &lt;{{ computedFromEmail }}&gt;
              </p>
            </div>

            <!-- Subject -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Email Subject <span class="text-red-400">*</span>
              </label>
              <input
                v-model="subject"
                type="text"
                placeholder="Enter email subject..."
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <!-- HTML Content -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Email HTML Content <span class="text-red-400">*</span>
              </label>
              <textarea
                v-model="html"
                rows="10"
                placeholder="Paste your email HTML here..."
                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 outline-none resize-none focus:ring-2 focus:ring-blue-500 font-mono text-sm transition-all"
              />
            </div>

            <!-- Emails -->
            <div class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <label class="text-sm font-medium text-slate-300">
                  Email Addresses <span class="text-red-400">*</span>
                </label>
                <span class="text-sm text-blue-400 font-semibold">
                  {{ validEmails.length }} Valid Emails
                </span>
              </div>
              <textarea
                v-model="emailInput"
                rows="12"
                placeholder="Paste emails here...

john@gmail.com
sarah@yahoo.com
mike@hotmail.com

or

john@gmail.com, sarah@yahoo.com, mike@hotmail.com"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 outline-none resize-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <!-- Validation Summary -->
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
              <div class="flex items-center justify-between mb-3">
                <span class="font-semibold flex items-center gap-2">
                  <svg
                    class="w-5 h-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Validation Summary
                </span>
                <span class="text-sm px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
                  {{ validEmails.length }} Valid
                </span>
              </div>

              <div v-if="invalidEmails.length" class="mb-3">
                <h3 class="text-red-400 text-sm mb-2 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Invalid Emails ({{ invalidEmails.length }})
                </h3>
                <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  <span
                    v-for="email in invalidEmails"
                    :key="email"
                    class="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs border border-red-500/30"
                  >
                    {{ email }}
                  </span>
                </div>
              </div>

              <div v-else class="text-green-400 text-sm flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                No invalid emails detected.
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-3 gap-4 mb-8">
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                <p class="text-slate-400 text-xs uppercase tracking-wider">Total</p>
                <h2 class="text-2xl font-bold mt-1">{{ totalEmails }}</h2>
              </div>
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                <p class="text-green-400 text-xs uppercase tracking-wider">Valid</p>
                <h2 class="text-2xl font-bold text-green-400 mt-1">{{ validEmails.length }}</h2>
              </div>
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                <p class="text-red-400 text-xs uppercase tracking-wider">Invalid</p>
                <h2 class="text-2xl font-bold text-red-400 mt-1">{{ invalidEmails.length }}</h2>
              </div>
            </div>

            <!-- Send Button -->
            <button
              @click="submitEmails"
              :disabled="isSubmitDisabled"
              class="w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 relative overflow-hidden group"
              :class="submitButtonClass"
            >
              <span v-if="!loading" class="relative z-10 flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Send {{ validEmails.length }} Emails
              </span>
              <span v-else class="relative z-10 flex items-center justify-center gap-2">
                <svg
                  class="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Queuing Campaign...
              </span>
              <div
                v-if="!loading"
                class="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              ></div>
            </button>

            <!-- Success/Error Messages -->
            <div v-if="message" class="mt-4 p-4 rounded-xl" :class="messageClass">
              <div class="flex items-start gap-3">
                <svg
                  v-if="messageType === 'success'"
                  class="w-5 h-5 text-green-400 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5 text-red-400 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p class="font-semibold">{{ messageTitle }}</p>
                  <p class="text-sm opacity-90 mt-1">{{ message }}</p>
                  <p
                    v-if="currentCampaignId"
                    class="text-xs mt-2 font-mono bg-black/20 px-2 py-1 rounded"
                  >
                    Campaign ID: {{ currentCampaignId }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar: Campaign Monitor -->
        <div class="lg:col-span-1">
          <div
            class="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl sticky top-6"
          >
            <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
              <svg
                class="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Live Monitor
            </h2>

            <!-- Current Campaign -->
            <div v-if="currentCampaign" class="mb-6">
              <div class="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-xs text-slate-400 uppercase tracking-wider"
                    >Current Campaign</span
                  >
                  <span class="text-xs px-2 py-0.5 rounded-full" :class="campaignStatusClass">
                    {{ displayCampaignStatus }}
                  </span>
                </div>
                <p class="font-semibold text-sm truncate">{{ currentCampaign.subject }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ currentCampaign.domain }}</p>

                <!-- Progress Bar -->
                <div class="mt-3">
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-slate-400">Progress</span>
                    <span class="text-blue-400 font-semibold"
                      >{{ campaignProgress.percentage }}%</span
                    >
                  </div>
                  <div class="w-full bg-slate-800 rounded-full h-2">
                    <div
                      class="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                      :style="{ width: campaignProgress.percentage + '%' }"
                    ></div>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ campaignProgress.completed }} / {{ campaignProgress.total }} emails
                  </p>
                </div>

                <!-- Status Breakdown -->
                <div class="grid grid-cols-2 gap-2 mt-3">
                  <div
                    class="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center"
                  >
                    <p class="text-xs text-green-400">Sent</p>
                    <p class="text-lg font-bold text-green-400">{{ campaignStats.sent || 0 }}</p>
                  </div>
                  <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                    <p class="text-xs text-red-400">Failed</p>
                    <p class="text-lg font-bold text-red-400">{{ campaignStats.failed || 0 }}</p>
                  </div>
                  <div
                    class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center"
                  >
                    <p class="text-xs text-yellow-400">Pending</p>
                    <p class="text-lg font-bold text-yellow-400">
                      {{ campaignStats.pending || 0 }}
                    </p>
                  </div>
                  <div
                    class="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 text-center"
                  >
                    <p class="text-xs text-purple-400">Distributed</p>
                    <p class="text-lg font-bold text-purple-400">
                      {{ campaignStats.distributed || 0 }}
                    </p>
                  </div>
                  <div
                    class="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center col-span-2"
                  >
                    <p class="text-xs text-orange-400">Retry Queue</p>
                    <p class="text-lg font-bold text-orange-400">
                      {{ campaignStats.pending_retry || 0 }}
                    </p>
                  </div>
                </div>

                <!-- ETA -->
                <div class="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p class="text-xs text-blue-400 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Estimated: ~{{ estimatedCompletionTime }}
                  </p>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-slate-500">
              <svg
                class="w-12 h-12 mx-auto mb-3 opacity-50"
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
              <p class="text-sm">No active campaign</p>
              <p class="text-xs mt-1">Send emails to see live stats</p>
            </div>

            <!-- Recent Campaigns -->
            <div v-if="recentCampaigns.length > 0">
              <h3 class="text-sm font-semibold text-slate-400 mb-3">Recent Campaigns</h3>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                <div
                  v-for="campaign in recentCampaigns"
                  :key="campaign.id"
                  class="bg-slate-950 border border-slate-800 rounded-lg p-3 cursor-pointer hover:border-slate-600 transition-colors"
                  @click="loadCampaign(campaign.id)"
                >
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate">{{ campaign.subject }}</p>
                      <p class="text-xs text-slate-500">
                        {{ campaign.domain }} • {{ formatDate(campaign.createdAt) }}
                      </p>
                    </div>
                    <span
                      class="text-xs px-2 py-0.5 rounded-full ml-2 shrink-0"
                      :class="getCampaignStatusClass(getCampaignDisplayStatus(campaign))"
                    >
                      {{ getCampaignDisplayStatus(campaign) }}
                    </span>
                  </div>
                  <div class="flex gap-3 mt-2 text-xs">
                    <span class="text-green-400">{{ campaign.totalEmails }} total</span>
                    <span v-if="campaign.notificationSent" class="text-blue-400">✓ Notified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { sendBlaster, getCampaignStatus, getCampaigns } from '@/firebase/firebase'

export default {
  name: 'SendBlasterEnterprise',

  data() {
    return {
      campaignName: '',
      emailInput: '',
      subject: '',
      fromName: '',
      html: '',
      selectedDomain: '',
      loading: false,

      message: '',
      messageType: '',
      messageTitle: '',

      currentCampaignId: null,
      currentCampaign: null,
      campaignStats: {},
      campaignProgress: { total: 0, completed: 0, percentage: 0 },
      recentCampaigns: [],

      pollInterval: null,

      domains: [
        { domain: 'maulfaq.online', apiKey: 're_ECbt48yn_HvogtYFGCbgWcu4n8yN3RvMg' },
        { domain: 'eventfarm.ng', apiKey: 're_UuafV5Ku_4BzrNWvoPBkzusBtsJrkU7Hj' },
        { domain: 'sendoraio.online', apiKey: 're_SDVENxgv_QBwRFHvDrkKKeujSBTdtxW2m' },
        { domain: 'coredispatch.online', apiKey: 're_PfYXYHGA_PBTi4rf5tkFj13HKjdLtqZrg' },
        { domain: 'mailnexio.online', apiKey: 're_Wt3xKfZ4_HrAU832Xwns5FTDVmGQE1zkW' },
        // new domains
        { domain: 'btchyperlive.online', apiKey: 're_dHUprrHp_NHEeP69qL5hr5LZMUsm4FRFZ' },
        { domain: 'vledem-yfaq.online', apiKey: 're_6h69FDEn_8qfRa9BuRzB56N4N4ovpj9GN' },
        { domain: 'mailzillapro.online', apiKey: 're_M5WaWK4X_K5oCrkXhYuJVndKBPvXBMghy' },
        { domain: 'hostmailerpro.online', apiKey: 're_6fQ79DPd_5k3XHyMX3DAw89nFecs35TmE' },
        //  { domain: 'sendmailsx.online', apiKey: 're_FvchtvoQ_K5gGSCQTqchS5TjYCuJJxN9W' },
        { domain: 'perfectmailer.online', apiKey: 're_TEhZoVrf_C3r2rMwnHhzRofFu8GL1riQ8' },
        { domain: 'sendermailio.online', apiKey: 're_FxDaRfAH_6r8u8rpqCLHGgXT6n8MwmJAQ' },
      ],

      emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    }
  },

  computed: {
    selectedDomainObj() {
      return this.domains.find((d) => d.domain === this.selectedDomain)
    },

    computedFromEmail() {
      if (!this.fromName || !this.selectedDomain) return ''
      const clean = this.fromName.trim().toLowerCase().replace(/\s+/g, '')
      return `${clean}@${this.selectedDomain}`
    },

    formattedFromName() {
      if (!this.fromName) return ''
      return this.toSentenceCase(this.fromName)
    },

    allEmails() {
      return this.emailInput
        .split(/[\n,\s]+/)
        .map((email) => email.trim())
        .filter((email) => email)
    },

    validEmails() {
      return this.allEmails.filter((email) => this.emailRegex.test(email))
    },

    invalidEmails() {
      return this.allEmails.filter((email) => !this.emailRegex.test(email))
    },

    totalEmails() {
      return this.allEmails.length
    },

    isSubmitDisabled() {
      return (
        this.loading ||
        !this.validEmails.length ||
        !this.selectedDomain ||
        !this.fromName.trim() ||
        !this.subject.trim() ||
        !this.html.trim()
      )
    },

    submitButtonClass() {
      if (this.loading) return 'bg-slate-700 cursor-not-allowed text-slate-400'
      if (this.isSubmitDisabled) return 'bg-slate-700 cursor-not-allowed text-slate-500'
      return 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25'
    },

    messageClass() {
      return this.messageType === 'success'
        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
        : 'bg-red-500/10 border border-red-500/30 text-red-400'
    },

    campaignStatusClass() {
      const status = this.displayCampaignStatus
      if (status === 'completed') return 'bg-green-500/20 text-green-400'
      if (status === 'sent') return 'bg-green-500/20 text-green-400'
      if (status === 'failed') return 'bg-red-500/20 text-red-400'
      if (status === 'queued') return 'bg-yellow-500/20 text-yellow-400'
      return 'bg-blue-500/20 text-blue-400'
    },

    displayCampaignStatus() {
      if (!this.currentCampaign) return ''

      // Check if campaign is completed based on progress
      const total = this.campaignProgress?.total || 0
      const completed = this.campaignProgress?.completed || 0

      if (total > 0 && completed >= total) {
        return 'completed'
      }

      return this.currentCampaign.status || 'queued'
    },

    estimatedCompletionTime() {
      const pending = this.campaignStats.pending || 0
      const retry = this.campaignStats.pending_retry || 0
      const distributed = this.campaignStats.distributed || 0
      const totalRemaining = pending + retry + distributed

      const minutes = Math.ceil(totalRemaining / 54) //

      if (minutes < 1) return 'Complete!'
      if (minutes === 1) return '1 min'
      if (minutes < 60) return `${minutes} mins`
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    },
  },

  mounted() {
    this.loadRecentCampaigns()
  },

  beforeUnmount() {
    this.stopPolling()
  },

  methods: {
    toSentenceCase(str) {
      if (!str) return ''
      return str
        .toLowerCase()
        .split(' ')
        .filter((word) => word)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },

    async submitEmails() {
      this.loading = true
      this.message = ''

      try {
        const payload = {
          emails: this.validEmails,
          subject: this.toSentenceCase(this.subject),
          html: this.html,
          fromName: this.formattedFromName,
          fromEmail: this.computedFromEmail,
          domain: this.selectedDomain,
        }

        console.log('📤 Sending campaign...', payload)

        const result = await sendBlaster(payload)

        console.log('✅ Campaign queued:', result)

        // Firebase callable functions wrap response in result.data
        const data = result.data || result
        this.currentCampaignId = data.campaignId
        this.messageType = 'success'
        this.messageTitle = 'Campaign Queued Successfully!'
        this.message = `${data.queued} emails queued. Sending at ~1620 emails /hour rate. You will receive a completion email at deliveryme69@gmail.com`

        // Start polling immediately with the new campaign ID
        this.startPolling(this.currentCampaignId)
        await this.loadRecentCampaigns()
      } catch (error) {
        console.error('❌ Error:', error)
        this.messageType = 'error'
        this.messageTitle = 'Failed to Queue Campaign'
        this.message = error.message || 'An unexpected error occurred. Please try again.'
      } finally {
        this.loading = false
      }
    },

    startPolling(campaignId) {
      if (!campaignId) {
        console.warn('startPolling called without campaignId, skipping')
        return
      }
      this.currentCampaignId = campaignId
      this.stopPolling()
      this.pollCampaignStatus(campaignId)
      this.pollInterval = setInterval(() => {
        // Always use the latest currentCampaignId from instance
        if (this.currentCampaignId) {
          this.pollCampaignStatus(this.currentCampaignId)
        }
      }, 10000)
    },

    stopPolling() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval)
        this.pollInterval = null
      }
    },

    async pollCampaignStatus(campaignId) {
      if (!campaignId) {
        console.warn('pollCampaignStatus called without campaignId, skipping')
        return
      }
      try {
        console.log('Polling campaign:', campaignId)
        const result = await getCampaignStatus({ campaignId })
        console.log('Poll result:', result)

        // Firebase callable functions wrap response in result.data
        const data = result.data || result

        if (!data || !data.campaign) {
          console.warn('No campaign data in poll result')
          return
        }

        this.currentCampaign = data.campaign
        this.campaignStats = data.stats || {}
        this.campaignProgress = data.progress || { total: 0, completed: 0, percentage: 0 }

        if (result.progress && result.progress.percentage >= 100) {
          this.stopPolling()
          if (this.currentCampaign.notificationSent) {
            this.messageType = 'success'
            this.messageTitle = 'Campaign Complete!'
            this.message = `All emails processed. Check deliveryme69@gmail.com for the completion report.`
          }
        }
      } catch (err) {
        console.error('Poll error:', err)
      }
    },

    async loadRecentCampaigns() {
      try {
        const result = await getCampaigns()
        const data = result.data || result
        this.recentCampaigns = data.campaigns || []
      } catch (err) {
        console.error('Failed to load campaigns:', err)
      }
    },

    async loadCampaign(campaignId) {
      if (!campaignId) {
        console.warn('loadCampaign called without campaignId, skipping')
        return
      }
      this.currentCampaignId = campaignId
      await this.pollCampaignStatus(this.currentCampaignId)
      this.startPolling(this.currentCampaignId)
    },

    formatDate(timestamp) {
      if (!timestamp) return 'Unknown'
      try {
        let date
        // Firestore Timestamp object
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          date = timestamp.toDate()
        }
        // Firestore Timestamp with seconds/nanoseconds
        else if (timestamp.seconds) {
          date = new Date(timestamp.seconds * 1000)
        }
        // ISO string or number
        else {
          date = new Date(timestamp)
        }

        if (isNaN(date.getTime())) return 'Unknown'

        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch (e) {
        return 'Unknown'
      }
    },

    getCampaignStatusClass(status) {
      if (status === 'completed') return 'bg-green-500/20 text-green-400'
      if (status === 'sent') return 'bg-green-500/20 text-green-400'
      if (status === 'failed') return 'bg-red-500/20 text-red-400'
      if (status === 'queued') return 'bg-yellow-500/20 text-yellow-400'
      return 'bg-blue-500/20 text-blue-400'
    },

    getCampaignDisplayStatus(campaign) {
      if (!campaign) return 'queued'

      // Check if campaign is completed (backend sets these when done)
      if (campaign.status === 'completed') {
        return 'completed'
      }
      if (campaign.notificationSent === true) {
        return 'completed'
      }
      if (campaign.completedAt) {
        return 'completed'
      }

      return campaign.status || 'queued'
    },
  },
}
</script>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
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
