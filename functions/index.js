const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { Resend } = require('resend')
const admin = require('firebase-admin')

// =========================
// ENTERPRISE CONFIGURATION
// =========================

const DOMAIN_CONFIG = {
  'maileroptionpro.online': {
    apiKey: 're_36z2BMjd_HqLdBRAxF7yFsHvutf3DAVYo',
    notifyEmail: 'dcproject56@gmail.com',
  },
  'SendVantage.com.ng': {
    apiKey: 're_UuafV5Ku_4BzrNWvoPBkzusBtsJrkU7Hj',
    notifyEmail: 'dcproject56@gmail.com',
  },
  'SendCrestt.com.ng': {
    apiKey: 're_SDVENxgv_QBwRFHvDrkKKeujSBTdtxW2m',
    notifyEmail: 'dcproject56@gmail.com',
  },
  'MailAuraa.com.ng': {
    apiKey: 're_PfYXYHGA_PBTi4rf5tkFj13HKjdLtqZrg', //done
    notifyEmail: 'dcproject56@gmail.com',
  },
  'Vantagemailer.com.ng': {
    apiKey: 're_Wt3xKfZ4_HrAU832Xwns5FTDVmGQE1zkW',
     notifyEmail: 'dcproject56@gmail.com',
  },
}

// Rate limiting configuration
const CONFIG = {
  // Worker settings - each worker gets its own batch from the distributor
  BATCH_SIZE: 27, // ← Changed from 18 (gives headroom for 9 emails/worker)

  // Timing
  EMAIL_INTERVAL_MS: 500, // Keep at 500ms

  // Retry settings
  MAX_RETRIES: 2,
  RETRY_DELAY_MINUTES: 5,

  // Campaign completion
  COMPLETION_CHECK_INTERVAL: 'every 1 minutes',

  // Target: 54/min × 60 = 3240/hour
  HOURLY_TARGET: 3240, // ← Changed from 1800
}

admin.initializeApp()
const db = admin.firestore()

// =========================
// UTILITY FUNCTIONS
// =========================

function generateCampaignId(domain) {
  return `cmp_${domain}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sanitizeEmail(email) {
  return email.trim().toLowerCase()
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// =========================
// NOTIFICATION SYSTEM
// =========================

async function sendCompletionNotification(campaignId, domain, stats) {
  try {
    console.log(
      `📧 Attempting to send completion notification for ${campaignId} to ${DOMAIN_CONFIG[domain]?.notifyEmail || DOMAIN_CONFIG['maulfaq.online']?.notifyEmail}`,
    )

    const config = DOMAIN_CONFIG[domain] || DOMAIN_CONFIG['maulfaq.online']

    if (!config) {
      console.error(`❌ No domain config found for ${domain}, falling back to maulfaq.online`)
    }

    console.log(`🔑 Using API key for domain: ${domain || 'maulfaq.online'}`)

    const resend = new Resend(config.apiKey)

    const notifyEmail = config.notifyEmail || 'ayodeleava505@gmail.com'
    console.log(`📨 Sending to: ${notifyEmail}`)

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">✅ Campaign Complete</h2>
        <p><strong>Campaign ID:</strong> ${campaignId}</p>
        <p><strong>Domain:</strong> ${domain}</p>
        <p><strong>Completed At:</strong> ${new Date().toLocaleString()}</p>

        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Campaign Statistics</h3>
          <p>📧 <strong>Total Emails:</strong> ${stats.total}</p>
          <p>✅ <strong>Sent Successfully:</strong> ${stats.sent}</p>
          <p>❌ <strong>Failed:</strong> ${stats.failed}</p>
          <p>🔄 <strong>Retried:</strong> ${stats.retried || 0}</p>
          <p>📊 <strong>Success Rate:</strong> ${stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(1) : 0}%</p>
        </div>

        <p style="color: #6b7280; font-size: 12px;">
          This is an automated notification from Send Blaster Enterprise.
        </p>
      </div>
    `

    const result = await resend.emails.send({
      from: `Send Blaster <noreply@${domain || 'maulfaq.online'}>`,
      to: notifyEmail,
      subject: `✅ Campaign Complete: ${campaignId}`,
      html: htmlContent,
    })

    console.log(
      `✅ Completion notification SENT for campaign ${campaignId}. Resend ID: ${result?.id || 'N/A'}`,
    )
    return { success: true, id: result?.id }
  } catch (err) {
    console.error(`❌ Failed to send completion notification for ${campaignId}:`, err.message)
    console.error('Full error:', err)
    return { success: false, error: err.message }
  }
}

// =========================
// EMAIL SENDER
// =========================

async function sendSingleEmail(data, resend) {
  try {
    const headers = {
      'List-Unsubscribe': `<https://${data.domain}/unsubscribe?email=${encodeURIComponent(data.email)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      Precedence: 'bulk',
      'X-Campaign-ID': data.campaignId,
      'X-Mailer': 'SendBlaster-Enterprise/1.0',
    }

    await resend.emails.send({
      from: `${data.fromName} <${data.fromEmail}>`,
      to: data.email,
      subject: data.subject,
      html: data.html,
      headers,
    })

    console.log(`✅ Sent to ${data.email} [${data.campaignId}]`)
    return { success: true, email: data.email }
  } catch (err) {
    console.error(`❌ Failed to send to ${data.email}: ${err.message}`)
    return { success: false, email: data.email, error: err.message }
  }
}

// =========================
// DISTRIBUTOR — Pulls from main queue and assigns to worker queues
// Runs once per minute, distributes to 3 worker queues
// =========================

async function distributeEmails() {
  console.log('📦 Distributor starting...')

  try {
    // Pull up to 27 pending emails from main queue (9 per worker × 3 workers)
    const snapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'pending')
      .limit(27) // ← Changed from 15
      .get()

    if (snapshot.empty) {
      console.log('⏭️ Distributor: No pending emails')
      return { distributed: 0 }
    }

    const docs = snapshot.docs
    const batch = db.batch()
    let distributed = 0

    // Split into 3 groups of 5 and assign to worker queues
    const workerQueues = ['workerQueue1', 'workerQueue2', 'workerQueue3']

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i]
      const data = doc.data()
      const workerIndex = i % 3
      const workerQueue = workerQueues[workerIndex]

      // Add to worker queue
      const workerRef = db.collection(workerQueue).doc()
      batch.set(workerRef, {
        ...data,
        originalDocId: doc.id,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // Mark original as distributed (not pending anymore)
      batch.update(doc.ref, {
        status: 'distributed',
        distributedAt: admin.firestore.FieldValue.serverTimestamp(),
        workerQueue: workerQueue,
      })

      distributed++
    }

    await batch.commit()
    console.log(`✅ Distributor: ${distributed} emails distributed to worker queues`)
    return { distributed }
  } catch (err) {
    console.error('❌ Distributor crashed:', err.message)
    return { distributed: 0, error: err.message }
  }
}

// =========================
// WORKER — Processes its own dedicated queue
// =========================

async function runWorker(workerQueueName, workerName) {
  console.log(`🚀 ${workerName} starting...`)

  try {
    // Pull from this worker's dedicated queue (no index needed - just get first N)
    const snapshot = await db.collection(workerQueueName).limit(CONFIG.BATCH_SIZE).get()

    if (snapshot.empty) {
      console.log(`⏭️ ${workerName}: No emails in ${workerQueueName}`)
      return { processed: 0, sent: 0, failed: 0 }
    }

    let sent = 0
    let failed = 0

    for (const doc of snapshot.docs) {
      const data = doc.data()
      const domainConfig = DOMAIN_CONFIG[data.domain]

      if (!domainConfig) {
        console.error(`❌ ${workerName}: No config for domain ${data.domain}`)
        // Update original doc as failed
        await db
          .collection('emailQueue')
          .doc(data.originalDocId)
          .update({
            status: 'failed',
            error: `No API key configured for domain: ${data.domain}`,
          })
        await doc.ref.delete()
        failed++
        continue
      }

      const resend = new Resend(domainConfig.apiKey)
      const result = await sendSingleEmail(data, resend)

      // Update original document
      const originalRef = db.collection('emailQueue').doc(data.originalDocId)

      if (result.success) {
        await originalRef.update({
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          attempts: admin.firestore.FieldValue.increment(1),
          lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
        })
        sent++
      } else {
        const originalDoc = await originalRef.get()
        const currentAttempts = (originalDoc.data()?.attempts || 0) + 1
        const shouldRetry = currentAttempts < CONFIG.MAX_RETRIES

        await originalRef.update({
          status: shouldRetry ? 'pending_retry' : 'failed',
          error: result.error,
          attempts: currentAttempts,
          lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
          lastErrorAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        failed++
      }

      // Delete from worker queue (done processing)
      await doc.ref.delete()

      // Rate limiting: 3 second interval between emails
      if (snapshot.docs.indexOf(doc) < snapshot.docs.length - 1) {
        await sleep(CONFIG.EMAIL_INTERVAL_MS)
      }
    }

    console.log(`✅ ${workerName} complete: ${sent} sent, ${failed} failed`)
    return { processed: snapshot.docs.length, sent, failed }
  } catch (err) {
    console.error(`❌ ${workerName} crashed:`, err.message)
    return { processed: 0, sent: 0, failed: 0, error: err.message }
  }
}

// =========================
// RETRY WORKER — Handles failed emails
// Moves pending_retry back to pending for redistribution
// =========================

async function runRetryWorker() {
  console.log('🔄 Retry Worker starting...')

  try {
    const fiveMinutesAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - CONFIG.RETRY_DELAY_MINUTES * 60 * 1000),
    )

    // Find emails ready for retry (no new index needed)
    const snapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'pending_retry')
      .limit(CONFIG.BATCH_SIZE)
      .get()

    if (snapshot.empty) {
      console.log('⏭️ Retry Worker: No emails ready for retry')
      return { processed: 0, sent: 0, failed: 0 }
    }

    let reset = 0

    for (const doc of snapshot.docs) {
      const data = doc.data()

      // Check if enough time has passed since last attempt
      const lastAttempt = data.lastAttempt?.toDate?.() || new Date(0)
      const minutesSince = (Date.now() - lastAttempt.getTime()) / (60 * 1000)

      if (minutesSince < CONFIG.RETRY_DELAY_MINUTES) {
        console.log(
          `⏳ Retry Worker: Skipping ${data.email} - too soon (${Math.floor(minutesSince)}m ago)`,
        )
        continue
      }

      // Reset to pending so distributor picks it up again
      await doc.ref.update({
        status: 'pending',
        retryCount: admin.firestore.FieldValue.increment(1),
        resetAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      reset++
      console.log(
        `🔄 Retry Worker: Reset ${data.email} to pending (retry ${(data.retryCount || 0) + 1})`,
      )
    }

    console.log(`✅ Retry Worker: ${reset} emails reset to pending for retry`)
    return { processed: snapshot.docs.length, reset }
  } catch (err) {
    console.error('❌ Retry Worker crashed:', err.message)
    return { processed: 0, sent: 0, failed: 0, error: err.message }
  }
}

// =========================
// CAMPAIGN COMPLETION CHECKER
// =========================

async function checkCampaignCompletion() {
  console.log('📊 Checking campaign completion...')

  try {
    // Step 1: Check if any emails are still pending
    const pendingSnapshot = await db
      .collection('emailQueue')
      .where('status', 'in', ['pending', 'pending_retry', 'distributed'])
      .limit(1)
      .get()

    if (!pendingSnapshot.empty) {
      console.log('⏳ Active campaigns still in progress - skipping completion check')
      return
    }

    // Step 2: Find recently processed emails (sent or failed in last 5 minutes)
    const fiveMinutesAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000))

    console.log(
      '🔍 Looking for recently completed campaigns since:',
      fiveMinutesAgo.toDate().toISOString(),
    )

    // Query 1: Recently SENT emails
    const sentSnapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'sent')
      .where('sentAt', '>=', fiveMinutesAgo)
      .get()

    // Query 2: Recently FAILED emails (they don't have sentAt, use lastAttempt)
    const failedSnapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'failed')
      .where('lastAttempt', '>=', fiveMinutesAgo)
      .get()

    // Merge results
    const allDocs = [...sentSnapshot.docs, ...failedSnapshot.docs]
    console.log(
      `📋 Found ${sentSnapshot.size} sent + ${failedSnapshot.size} failed = ${allDocs.length} total recently processed emails`,
    )

    console.log(`📋 Found ${allDocs.length} recently processed emails`)

    if (allDocs.length === 0) {
      console.log('ℹ️ No recently completed campaigns found')
      return
    }

    // Group by campaign
    const campaigns = {}
    allDocs.forEach((doc) => {
      const data = doc.data()
      if (!campaigns[data.campaignId]) {
        campaigns[data.campaignId] = {
          domain: data.domain,
          total: 0,
          sent: 0,
          failed: 0,
          notified: false,
        }
      }
      campaigns[data.campaignId].total++
      if (data.status === 'sent') campaigns[data.campaignId].sent++
      else campaigns[data.campaignId].failed++
    })

    console.log(
      `📊 Found ${Object.keys(campaigns).length} campaigns to check:`,
      Object.keys(campaigns),
    )

    // Check which campaigns have already been notified
    for (const campaignId of Object.keys(campaigns)) {
      try {
        const campaignDoc = await db.collection('campaigns').doc(campaignId).get()
        if (campaignDoc.exists && campaignDoc.data().notificationSent) {
          campaigns[campaignId].notified = true
          console.log(`✉️ Campaign ${campaignId} already notified`)
        }
      } catch (e) {
        console.warn(`⚠️ Could not check campaign ${campaignId}:`, e.message)
      }
    }

    // Process each un-notified campaign
    for (const [campaignId, stats] of Object.entries(campaigns)) {
      if (stats.notified) {
        console.log(`⏭️ Skipping ${campaignId} - already notified`)
        continue
      }

      // Double-check no pending emails remain for this campaign
      const campaignPending = await db
        .collection('emailQueue')
        .where('campaignId', '==', campaignId)
        .where('status', 'in', ['pending', 'pending_retry', 'distributed'])
        .limit(1)
        .get()

      if (!campaignPending.empty) {
        console.log(`⏳ Campaign ${campaignId} still has pending emails - skipping notification`)
        continue
      }

      // Get campaign document for proper domain and metadata
      const campaignDoc = await db.collection('campaigns').doc(campaignId).get()
      const campaignData = campaignDoc.exists ? campaignDoc.data() : {}
      const domain = campaignData.domain || stats.domain

      console.log(`🎯 Campaign ${campaignId} is complete! Stats:`, stats)

      // Send completion email FIRST (before marking as completed)
      let notificationSuccess = false
      let notificationError = null
      try {
        const notifyResult = await sendCompletionNotification(campaignId, domain, stats)
        if (notifyResult.success) {
          notificationSuccess = true
          console.log(`📧 Completion notification SENT for campaign ${campaignId}`)
        } else {
          notificationError = notifyResult.error
          console.error(`❌ Notification returned failure for ${campaignId}:`, notifyResult.error)
        }
      } catch (notifyErr) {
        notificationError = notifyErr.message
        console.error(`❌ Failed to send notification for ${campaignId}:`, notifyErr.message)
      }

      // Mark campaign as completed (only mark notificationSent if email actually succeeded)
      await db
        .collection('campaigns')
        .doc(campaignId)
        .set(
          {
            status: 'completed',
            notificationSent: notificationSuccess,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            stats,
            ...(notificationError ? { notificationError } : {}),
            ...(notificationSuccess
              ? { notificationError: admin.firestore.FieldValue.delete() }
              : {}),
          },
          { merge: true },
        )

      console.log(
        `💾 Campaign ${campaignId} marked as completed in Firestore (notificationSent: ${notificationSuccess})`,
      )
    }
  } catch (err) {
    console.error('❌ Campaign completion check failed:', err.message)
    console.error('Full error:', err)
  }
}

// =========================
// CLOUD FUNCTIONS
// =========================

// 1. QUEUE EMAILS (Callable from frontend)
exports.sendBlaster = onCall(
  {
    memory: '512MiB',
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (request) => {
    try {
      let { emails, subject, html, fromName, fromEmail, domain } = request.data

      if (!domain || !DOMAIN_CONFIG[domain]) {
        throw new HttpsError('invalid-argument', 'Invalid or missing domain')
      }
      if (!subject || !subject.trim()) {
        throw new HttpsError('invalid-argument', 'Subject is required')
      }
      if (!html || !html.trim()) {
        throw new HttpsError('invalid-argument', 'HTML content is required')
      }
      if (!fromName || !fromName.trim()) {
        throw new HttpsError('invalid-argument', 'From name is required')
      }
      if (!fromEmail || !fromEmail.includes('@')) {
        throw new HttpsError('invalid-argument', 'Valid from email is required')
      }

      if (typeof emails === 'string') {
        emails = emails.split(/[\n,\s]+/)
      }

      const validEmails = emails.map(sanitizeEmail).filter((e) => e && isValidEmail(e))

      const invalidEmails = emails.map(sanitizeEmail).filter((e) => e && !isValidEmail(e))

      if (validEmails.length === 0) {
        throw new HttpsError('invalid-argument', 'No valid emails provided')
      }

      const campaignId = generateCampaignId(domain)
      const batch = db.batch()
      const timestamp = admin.firestore.FieldValue.serverTimestamp()

      const campaignRef = db.collection('campaigns').doc(campaignId)
      batch.set(campaignRef, {
        campaignId,
        domain,
        fromName,
        fromEmail,
        subject,
        totalEmails: validEmails.length,
        invalidEmails: invalidEmails.length,
        status: 'queued',
        createdAt: timestamp,
        notificationSent: false,
      })

      validEmails.forEach((email) => {
        const ref = db.collection('emailQueue').doc()
        batch.set(ref, {
          email,
          subject,
          html,
          campaignId,
          fromName,
          fromEmail,
          domain,
          status: 'pending',
          attempts: 0,
          retryCount: 0,
          createdAt: timestamp,
        })
      })

      await batch.commit()

      console.log(`✅ Campaign ${campaignId} queued: ${validEmails.length} emails`)

      return {
        success: true,
        campaignId,
        queued: validEmails.length,
        invalid: invalidEmails.length,
        message: `Campaign queued successfully. Emails will be sent at ~${CONFIG.HOURLY_TARGET}/hour rate.`,
      }
    } catch (err) {
      console.error('❌ sendBlaster error:', err)
      throw new HttpsError('internal', err.message)
    }
  },
)

// 2. DISTRIBUTOR — Runs first, assigns emails to worker queues, then triggers workers
// 2. DISTRIBUTOR
exports.emailDistributor = onSchedule(
  {
    schedule: 'every 1 minutes',        // ← Fixed from 'every 30 seconds'
    memory: '512MiB',
    timeoutSeconds: 120,
    maxInstances: 1,
  },
  async () => {
    const distResult = await distributeEmails()

    if (distResult.distributed > 0) {
      console.log('🚀 Triggering workers immediately after distribution...')

      await Promise.all([
        runWorker('workerQueue1', 'Worker-1'),
        sleep(1000).then(() => runWorker('workerQueue2', 'Worker-2')),
        sleep(2000).then(() => runWorker('workerQueue3', 'Worker-3')),
      ])
    }
  },
)

// 3. WORKER 1
exports.emailWorker1 = onSchedule(
  {
    schedule: 'every 1 minutes',        // ← Fixed
    memory: '512MiB',
    timeoutSeconds: 300,
    maxInstances: 1,
  },
  async () => {
    await runWorker('workerQueue1', 'Worker-1')
  },
)

// 4. WORKER 2
exports.emailWorker2 = onSchedule(
  {
    schedule: 'every 1 minutes',        // ← Fixed
    memory: '512MiB',
    timeoutSeconds: 300,
    maxInstances: 1,
  },
  async () => {
    await sleep(5000)
    await runWorker('workerQueue2', 'Worker-2')
  },
)

// 5. WORKER 3
exports.emailWorker3 = onSchedule(
  {
    schedule: 'every 1 minutes',        // ← Fixed
    memory: '512MiB',
    timeoutSeconds: 300,
    maxInstances: 1,
  },
  async () => {
    await sleep(10000)
    await runWorker('workerQueue3', 'Worker-3')
  },
)

// 6. RETRY WORKER
exports.retryWorker = onSchedule(
  {
    schedule: 'every 5 minutes',
    memory: '256MiB',
    timeoutSeconds: 300,
    maxInstances: 1,
  },
  async () => {
    await runRetryWorker()
  },
)

// 7. CAMPAIGN COMPLETION NOTIFIER
exports.campaignCompletionChecker = onSchedule(
  {
    schedule: CONFIG.COMPLETION_CHECK_INTERVAL,
    memory: '256MiB',
    timeoutSeconds: 120,
    maxInstances: 1,
  },
  async () => {
    await checkCampaignCompletion()
  },
)

// 8. GET CAMPAIGN STATUS
exports.getCampaignStatus = onCall(
  {
    memory: '256MiB',
    timeoutSeconds: 30,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const { campaignId } = request.data

      if (!campaignId) {
        throw new HttpsError('invalid-argument', 'Campaign ID required')
      }

      const campaignDoc = await db.collection('campaigns').doc(campaignId).get()
      if (!campaignDoc.exists) {
        throw new HttpsError('not-found', 'Campaign not found')
      }

      const stats = await db.collection('emailQueue').where('campaignId', '==', campaignId).get()

      const statusCounts = { pending: 0, sent: 0, failed: 0, pending_retry: 0, distributed: 0 }
      stats.docs.forEach((doc) => {
        const status = doc.data().status
        if (statusCounts[status] !== undefined) {
          statusCounts[status]++
        }
      })

      return {
        campaign: campaignDoc.data(),
        stats: statusCounts,
        progress: {
          total: stats.size,
          completed: statusCounts.sent + statusCounts.failed,
          percentage:
            stats.size > 0
              ? Math.round(((statusCounts.sent + statusCounts.failed) / stats.size) * 100)
              : 0,
        },
      }
    } catch (err) {
      console.error('❌ getCampaignStatus error:', err)
      throw new HttpsError('internal', err.message)
    }
  },
)

// 9. GET ALL CAMPAIGNS
exports.getCampaigns = onCall(
  {
    memory: '256MiB',
    timeoutSeconds: 30,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const snapshot = await db.collection('campaigns').orderBy('createdAt', 'desc').limit(50).get()

      const campaigns = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return { campaigns }
    } catch (err) {
      console.error('❌ getCampaigns error:', err)
      throw new HttpsError('internal', err.message)
    }
  },
)

// =========================
// ORPHANED EMAIL RECOVERY
// =========================

/**
 * Finds emails stuck in 'distributed' status that have no corresponding
 * document in their assigned worker queue (orphaned due to worker crash/deletion).
 * Resets them back to 'pending' so the distributor can re-assign them.
 */
async function recoverOrphanedEmails() {
  console.log('🔍 Recovery Worker: Scanning for orphaned emails...')

  const now = admin.firestore.Timestamp.now()
  // Consider emails orphaned if they've been distributed for > 3 minutes
  // without being picked up by a worker
  const orphanThresholdMinutes = 3
  const cutoff = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - orphanThresholdMinutes * 60 * 1000),
  )

  try {
    // Query 1: Find old 'distributed' emails in emailQueue
    const distributedSnapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'distributed')
      .where('distributedAt', '<=', cutoff)
      .limit(50)
      .get()

    if (distributedSnapshot.empty) {
      console.log('✅ Recovery Worker: No orphaned emails found')
      return { recovered: 0, checked: 0 }
    }

    console.log(`🔍 Recovery Worker: Found ${distributedSnapshot.size} potentially orphaned emails`)

    let recovered = 0
    let stillInWorkerQueue = 0

    for (const doc of distributedSnapshot.docs) {
      const data = doc.data()
      const workerQueue = data.workerQueue
      const originalDocId = doc.id

      if (!workerQueue) {
        // No worker queue assigned — definitely orphaned
        console.log(`🔄 Recovery: ${data.email} has no workerQueue assigned, resetting to pending`)
        await doc.ref.update({
          status: 'pending',
          recoveredAt: now,
          recoveryReason: 'missing_workerQueue_field',
        })
        recovered++
        continue
      }

      // Check if the document still exists in the worker queue
      // We need to query by originalDocId since worker queue docs have random IDs
      const workerDocs = await db
        .collection(workerQueue)
        .where('originalDocId', '==', originalDocId)
        .limit(1)
        .get()

      if (workerDocs.empty) {
        // Document was in worker queue but is gone — orphaned
        console.log(`🔄 Recovery: ${data.email} orphaned from ${workerQueue}, resetting to pending`)
        await doc.ref.update({
          status: 'pending',
          recoveredAt: now,
          recoveryReason: `worker_queue_doc_missing_in_${workerQueue}`,
          previousWorkerQueue: workerQueue,
          // Clear the worker queue assignment
          workerQueue: admin.firestore.FieldValue.delete(),
          distributedAt: admin.firestore.FieldValue.delete(),
        })
        recovered++
      } else {
        // Still exists in worker queue — worker just hasn't processed it yet
        stillInWorkerQueue++
        console.log(`⏳ Recovery: ${data.email} still in ${workerQueue}, skipping`)
      }
    }

    console.log(
      `✅ Recovery Worker: ${recovered} recovered, ${stillInWorkerQueue} still in queue, ${distributedSnapshot.size} checked`,
    )
    return { recovered, checked: distributedSnapshot.size, stillInWorkerQueue }
  } catch (err) {
    console.error('❌ Recovery Worker crashed:', err.message)
    return { recovered: 0, checked: 0, error: err.message }
  }
}

// Also add a more aggressive "stuck distributed" check that doesn't require distributedAt index
// This handles cases where distributedAt might be missing or index isn't ready
async function recoverStuckDistributed() {
  console.log('🔍 Recovery Worker (fallback): Checking for stuck distributed emails...')

  try {
    // Fallback: get all distributed emails (limited) and check age in memory
    // This avoids needing a composite index on status + distributedAt
    const snapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'distributed')
      .limit(100)
      .get()

    if (snapshot.empty) {
      return { recovered: 0 }
    }

    const now = Date.now()
    const orphanThresholdMs = 5 * 60 * 1000 // 5 minutes
    let recovered = 0

    for (const doc of snapshot.docs) {
      const data = doc.data()
      const distributedAt = data.distributedAt?.toDate?.() || null

      // If distributedAt is missing or very old, recover it
      const isOrphaned = !distributedAt || now - distributedAt.getTime() > orphanThresholdMs

      if (isOrphaned) {
        // Verify it's not in worker queue
        const workerQueue = data.workerQueue
        let inWorkerQueue = false

        if (workerQueue) {
          const workerCheck = await db
            .collection(workerQueue)
            .where('originalDocId', '==', doc.id)
            .limit(1)
            .get()
          inWorkerQueue = !workerCheck.empty
        }

        if (!inWorkerQueue) {
          await doc.ref.update({
            status: 'pending',
            recoveredAt: admin.firestore.FieldValue.serverTimestamp(),
            recoveryReason: distributedAt ? 'stuck_distributed_timeout' : 'missing_distributedAt',
            ...(workerQueue ? { previousWorkerQueue: workerQueue } : {}),
            workerQueue: admin.firestore.FieldValue.delete(),
            distributedAt: admin.firestore.FieldValue.delete(),
          })
          recovered++
          console.log(`🔄 Recovered stuck email: ${data.email}`)
        }
      }
    }

    return { recovered }
  } catch (err) {
    console.error('❌ Recovery fallback crashed:', err.message)
    return { recovered: 0, error: err.message }
  }
}

// 10. ORPHANED EMAIL RECOVERY — Runs frequently to catch stuck emails
exports.emailRecoveryWorker = onSchedule(
  {
    schedule: 'every 2 minutes',
    memory: '256MiB',
    timeoutSeconds: 120,
    maxInstances: 1,
  },
  async () => {
    // Run both recovery methods for maximum safety
    const result1 = await recoverOrphanedEmails()
    const result2 = await recoverStuckDistributed()

    console.log('📊 Recovery summary:', {
      orphanedRecovered: result1.recovered || 0,
      stuckRecovered: result2.recovered || 0,
    })
  },
)

// 11. EMERGENCY RECOVERY — Runs less frequently but checks ALL distributed emails
exports.emailEmergencyRecovery = onSchedule(
  {
    schedule: 'every 15 minutes',
    memory: '512MiB',
    timeoutSeconds: 300,
    maxInstances: 1,
  },
  async () => {
    console.log('🚨 Emergency Recovery: Deep scan starting...')

    try {
      // Get ALL distributed emails without limit (paginated)
      let lastDoc = null
      let totalRecovered = 0
      let totalChecked = 0
      const batchSize = 500

      while (true) {
        let query = db
          .collection('emailQueue')
          .where('status', '==', 'distributed')
          .limit(batchSize)

        if (lastDoc) {
          query = query.startAfter(lastDoc)
        }

        const snapshot = await query.get()
        if (snapshot.empty) break

        const batch = db.batch()
        let batchRecovered = 0

        for (const doc of snapshot.docs) {
          const data = doc.data()
          const workerQueue = data.workerQueue
          let inWorkerQueue = false

          if (workerQueue) {
            const workerCheck = await db
              .collection(workerQueue)
              .where('originalDocId', '==', doc.id)
              .limit(1)
              .get()
            inWorkerQueue = !workerCheck.empty
          }

          if (!inWorkerQueue) {
            batch.update(doc.ref, {
              status: 'pending',
              recoveredAt: admin.firestore.FieldValue.serverTimestamp(),
              recoveryReason: 'emergency_deep_scan',
              ...(workerQueue ? { previousWorkerQueue: workerQueue } : {}),
              workerQueue: admin.firestore.FieldValue.delete(),
              distributedAt: admin.firestore.FieldValue.delete(),
            })
            batchRecovered++
          }
          totalChecked++
        }

        if (batchRecovered > 0) {
          await batch.commit()
          totalRecovered += batchRecovered
          console.log(`🚨 Emergency: Recovered ${batchRecovered} in this batch`)
        }

        lastDoc = snapshot.docs[snapshot.docs.length - 1]
        if (snapshot.docs.length < batchSize) break
      }

      console.log(`🚨 Emergency Recovery complete: ${totalRecovered}/${totalChecked} recovered`)
    } catch (err) {
      console.error('❌ Emergency Recovery failed:', err.message)
    }
  },
)

/*========================= EMAIL TEMPLATE (optional default) ========================= */

function buildAirdropClaimHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your allocation is available</title>
<style>
  body {
    margin: 0;
    padding: 0;
    background: #f5f7fa;
    font-family: Arial, Helvetica, sans-serif;
    color: #333333;
  }

  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }
  .preheader{
display:none;
max-height:0;
overflow:hidden;
opacity:0;
mso-hide:all;
}
  .header {
    background: #FF8C00;
    text-align: center;
    padding: 25px 20px;
  }

  .header-logo {
    display: block;
    margin: 0 auto;
    max-width: 280px;
    width: 100%;
    height: auto;
  }

  .content {
    padding: 32px;
    line-height: 1.7;
  }

  .button {
    display: inline-block;
    padding: 14px 28px;
    background: #FF8C00;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 8px;
    font-weight: bold;
  }

  .notice {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin: 24px 0;
  }

  .footer {
    padding: 24px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    border-top: 1px solid #e5e7eb;
  }

  .footer a {
    color: #6b7280;
    text-decoration: none;
  }
</style>
</head>
<body>


<div class="container">

  <div class="header">

    <img
      src="https://bitcoinhyper.com/assets/images/svg-icons/logo.svg"
      
      alt="Bitcoin Hyper"
      class="header-logo"
    >

  </div>

  <div class="content">

    <p>Hello,</p>

    <p>
      We are reaching out regarding your Bitcoin Hyper allocation.
    </p>

    <p>
      The token distribution process has been completed and your allocation is now available for you to access through the Bitcoin Hyper portal.
    </p>

    <div class="notice">
      Please sign in using your wallet to verify your allocation and view your available tokens.
    </div>

    <p style="text-align:center;">
      <a href="bitcoinhyperzz.xyz" class="button">
        Open Dashboard
      </a>
    </p>

    <p>
      If you have already completed this process, no further action is required.
    </p>

    <p>
      Thank you for your continued participation and support.
    </p>

    <p>
      Regards,<br>
      Bitcoin Hyper Team
    </p>

  </div>

  <div class="footer">

    <p><strong>All rights reserved. Bitcoin Hyper </strong></p>

    <p>
      Support:
      <a>
        support@bitcoinhyper.com
      </a>
    </p>

    <p>
      If you no longer wish to receive updates, you may unsubscribe from future communications.
    </p>

  </div>

</div>
</body>
</html>`
}

function buildAirdropClaimText() {
  const reference = 'N/A'
  const userName = 'Valued Member'

  const airdropAmount = '50,000'
  const airdropToken = 'Centric Rise (CNR)'
  const portalUrl = 'https://maulfaq.online/portal'
  const supportUrl = 'https://maulfaq.online/support'
  const unsubscribeUrl = 'https://maulfaq.online/unsubscribe'
  const deadline = 'June 30, 2026'

  return `Centric Rise — Distribution Update

Hello ${userName},

The Centric Rise distribution on the Solana network has been processed. As a verified participant, your allocation is ready for review.

TOKEN ALLOCATION

  Amount:    ${airdropAmount} ${airdropToken}
  Allocation: Network transition distribution

OPEN TOKEN PORTAL

  ${portalUrl}

Portal available through ${deadline}.

PROCESS OVERVIEW

1. Access your dashboard
   (Compatible with Phantom, Solflare, or Backpack)

2. Review your distribution status
   Your legacy balance will be verified on-chain

3. Receive your allocation
   Tokens are sent directly to your connected wallet

NOTE

Allocations not reviewed by the deadline may be reallocated to the community pool. We recommend reviewing your status at your earliest convenience.

Reference: ${reference}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Centric Rise | Solana Network

Support: ${supportUrl}
Unsubscribe: ${unsubscribeUrl}

This is an automated message. Please do not reply.`
}
