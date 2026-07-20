const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { Resend } = require('resend')
const admin = require('firebase-admin')

// =========================
// ENTERPRISE CONFIGURATION
// =========================

const DOMAIN_CONFIG = {
  'ssajgov.com': {
    apiKey: 're_ayZPVj3z_D55o5LtDpkG4abqe4eATKAkh',
    notifyEmail: 'chandranbajrngi702@gmail.com',
  },
  'adoddr.com': {
    apiKey: 're_13zsYy2p_GcQRtCCG5QYRX6fUgb1zVJdi',
    notifyEmail: 'chandranbajrngi702@gmail.com',
  },
  'humahity.com': {
    apiKey: 're_Hr3kHk7i_d4qurEsrFWZrZxMhovs4PkYn',
    notifyEmail: 'chandranbajrngi702@gmail.com',
  },
  'humahlty.com': {
    apiKey: 're_CKzY1AhJ_PbfvC31SVi6pSJTgsgKvqw3o',
    notifyEmail: 'chandranbajrngi702@gmail.com',
  },
  'humanjty.com': {
    apiKey: 're_ctwLUMYV_546E3w8xPbeAPj9uJo4grGuy',
    notifyEmail: 'chandranbajrngi702@gmail.com',
  },
  'humanijy.com': {
    apiKey: 're_8RCBo7Fw_DL1xrerjbZyDj4hk8z14tUFn',
    notifyEmail: 'chandranbajrngi702@gmail.com',
  },
  'humanllty.com': {
    apiKey: 're_bEpwq1ss_L3vj5F7fkR2gFBmbg9VWVDGC',
    notifyEmail: 'chandranbajrngi702@gmail.com',
  },
  'humanltty.com': {
    apiKey: 're_Bstqqkkm_EGgu3MLgVA42tiCgWs4MR1HT',
    notifyEmail: 'chandranbajrngi702@gmail.com',
  },
  'humantlty.com': {
    apiKey: 're_e9spEjr1_LPHL7K8Zi7FrbB5ze63JcmmU',
    notifyEmail: 'chandranbajrngi702@gmail.com',
  },
  'humantty.com': {
    apiKey: 're_JGbmCHGh_F5nfBvTcypgrLWvGxUPdrAgW',
    notifyEmail: 'chandranbajrngi702@gmail.com',
  },
}

const CONFIG = {
  BATCH_SIZE: 27,
  EMAIL_INTERVAL_MS: 500,
  MAX_RETRIES: 2,
  RETRY_DELAY_MINUTES: 5,
  HOURLY_TARGET: 3240,
  ORPHAN_THRESHOLD_MINUTES: 10,
  STUCK_DISTRIBUTED_THRESHOLD_MS: 10 * 60 * 1000,
  LOCK_TIMEOUT_MINUTES: 15,
}

admin.initializeApp()
const db = admin.firestore()

// =========================
// CLOUD TASKS HELPER (using Firebase v2 task queues)
// =========================

const { getFunctions } = require('firebase-admin/functions')

async function enqueueTask(queueName, payload = {}, options = {}) {
  try {
    const queue = getFunctions().taskQueue(queueName)

    const enqueueOptions = {}
    if (options.scheduleDelaySeconds && options.scheduleDelaySeconds > 0) {
      enqueueOptions.scheduleDelaySeconds = options.scheduleDelaySeconds
    }

    await queue.enqueue(payload, enqueueOptions)
    console.log(`📋 Enqueued task to ${queueName}`)
    return { success: true }
  } catch (err) {
    console.error(`❌ Failed to enqueue task to ${queueName}:`, err.message)
    return { success: false, error: err.message }
  }
}

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
    console.log(`📧 Sending completion notification for ${campaignId}`)

    const config = DOMAIN_CONFIG[domain]
    if (!config) {
      console.error(`❌ No domain config for ${domain}`)
      return { success: false, error: 'No domain config' }
    }

    const resend = new Resend(config.apiKey)
    const notifyEmail = config.notifyEmail

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
      </div>
    `

    const result = await resend.emails.send({
      from: `Send Blaster <noreply@${domain}>`,
      to: notifyEmail,
      subject: `✅ Campaign Complete: ${campaignId}`,
      html: htmlContent,
    })

    console.log(`✅ Notification sent for ${campaignId}`)
    return { success: true, id: result?.id }
  } catch (err) {
    console.error(`❌ Notification failed for ${campaignId}:`, err.message)
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

    const result = await resend.emails.send({
      from: `${data.fromName} <${data.fromEmail}>`,
      to: data.email,
      subject: data.subject,
      html: data.html,
      headers,
    })

    console.log(`✅ Sent to ${data.email} [${data.campaignId}]`)
    return { success: true, email: data.email, resendId: result?.id }
  } catch (err) {
    console.error(`❌ Failed to send to ${data.email}:`, err.message)
    return { success: false, email: data.email, error: err.message }
  }
}

// =========================
// DISTRIBUTOR
// =========================

async function distributeEmails() {
  console.log('📦 Distributor starting...')

  try {
    const snapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'pending')
      .limit(CONFIG.BATCH_SIZE)
      .get()

    if (snapshot.empty) {
      console.log('⏭️ No pending emails')
      return { distributed: 0, hasMore: false }
    }

    const docs = snapshot.docs
    const batch = db.batch()
    let distributed = 0

    const workerQueues = ['workerQueue1', 'workerQueue2', 'workerQueue3']

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i]
      const data = doc.data()
      const workerIndex = i % 3
      const workerQueue = workerQueues[workerIndex]

      const workerRef = db.collection(workerQueue).doc()
      batch.set(workerRef, {
        ...data,
        originalDocId: doc.id,
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      batch.update(doc.ref, {
        status: 'distributed',
        distributedAt: admin.firestore.FieldValue.serverTimestamp(),
        workerQueue: workerQueue,
        recoveredAt: admin.firestore.FieldValue.delete(),
        recoveryReason: admin.firestore.FieldValue.delete(),
        previousWorkerQueue: admin.firestore.FieldValue.delete(),
        lockedAt: admin.firestore.FieldValue.delete(),
        lockedBy: admin.firestore.FieldValue.delete(),
      })

      distributed++
    }

    await batch.commit()
    console.log(`✅ Distributed ${distributed} emails`)

    const remainingSnapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'pending')
      .limit(1)
      .get()

    return { distributed, hasMore: !remainingSnapshot.empty }
  } catch (err) {
    console.error('❌ Distributor crashed:', err.message)
    return { distributed: 0, hasMore: false, error: err.message }
  }
}

// =========================
// WORKER
// =========================

async function runWorker(workerQueueName, workerName) {
  console.log(`🚀 ${workerName} starting...`)

  try {
    const snapshot = await db.collection(workerQueueName).limit(CONFIG.BATCH_SIZE).get()

    if (snapshot.empty) {
      console.log(`⏭️ ${workerName}: No emails in ${workerQueueName}`)
      return { processed: 0, sent: 0, failed: 0, hasFailures: false }
    }

    let sent = 0
    let failed = 0
    let skipped = 0
    let hasFailures = false

    for (const doc of snapshot.docs) {
      const data = doc.data()
      const originalDocId = data.originalDocId

      if (!originalDocId) {
        console.error(`❌ ${workerName}: Missing originalDocId, deleting orphan`)
        await doc.ref.delete()
        continue
      }

      const originalRef = db.collection('emailQueue').doc(originalDocId)
      const originalDoc = await originalRef.get()

      if (!originalDoc.exists) {
        console.log(`⚠️ Original doc ${originalDocId} gone, cleaning up`)
        await doc.ref.delete()
        continue
      }

      const originalData = originalDoc.data()

      if (originalData.status === 'sent') {
        console.log(`⚠️ ${data.email} already sent, cleaning up`)
        await doc.ref.delete()
        skipped++
        continue
      }

      if (originalData.status !== 'distributed') {
        console.log(`⚠️ ${data.email} status=${originalData.status}, skipping`)
        await doc.ref.delete()
        skipped++
        continue
      }

      if (originalData.lockedAt) {
        const lockedAt = originalData.lockedAt.toDate
          ? originalData.lockedAt.toDate()
          : new Date(originalData.lockedAt)
        const minutesSinceLock = (Date.now() - lockedAt.getTime()) / (60 * 1000)
        if (
          minutesSinceLock < CONFIG.LOCK_TIMEOUT_MINUTES &&
          originalData.lockedBy !== workerName
        ) {
          console.log(`⏳ ${data.email} locked by ${originalData.lockedBy}, skipping`)
          continue
        }
      }

      await originalRef.update({
        lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        lockedBy: workerName,
      })

      const domainConfig = DOMAIN_CONFIG[data.domain]

      if (!domainConfig) {
        console.error(`❌ No config for domain ${data.domain}`)
        await db.runTransaction(async (t) => {
          t.update(originalRef, {
            status: 'failed',
            error: `No API key for domain: ${data.domain}`,
            lockedAt: admin.firestore.FieldValue.delete(),
            lockedBy: admin.firestore.FieldValue.delete(),
          })
          t.delete(doc.ref)
        })
        failed++
        hasFailures = true
        continue
      }

      const resend = new Resend(domainConfig.apiKey)
      const result = await sendSingleEmail(data, resend)

      try {
        await db.runTransaction(async (t) => {
          const freshDoc = await t.get(originalRef)
          if (!freshDoc.exists) {
            t.delete(doc.ref)
            return
          }

          const freshData = freshDoc.data()

          if (freshData.lockedBy !== workerName) {
            console.warn(`⚠️ Lock stolen on ${data.email}, aborting`)
            return
          }

          if (result.success) {
            t.update(originalRef, {
              status: 'sent',
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              sentEmailId: result.resendId || null,
              attempts: admin.firestore.FieldValue.increment(1),
              lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
              lockedAt: admin.firestore.FieldValue.delete(),
              lockedBy: admin.firestore.FieldValue.delete(),
              error: admin.firestore.FieldValue.delete(),
            })
            sent++
          } else {
            const currentAttempts = (freshData.attempts || 0) + 1
            const shouldRetry = currentAttempts < CONFIG.MAX_RETRIES

            t.update(originalRef, {
              status: shouldRetry ? 'pending_retry' : 'failed',
              error: result.error,
              attempts: currentAttempts,
              lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
              lastErrorAt: admin.firestore.FieldValue.serverTimestamp(),
              lockedAt: admin.firestore.FieldValue.delete(),
              lockedBy: admin.firestore.FieldValue.delete(),
            })
            failed++
            hasFailures = true
          }

          t.delete(doc.ref)
        })
      } catch (txErr) {
        console.error(`❌ Transaction failed for ${data.email}:`, txErr.message)
        try {
          await originalRef.update({
            lockedAt: admin.firestore.FieldValue.delete(),
            lockedBy: admin.firestore.FieldValue.delete(),
          })
        } catch (unlockErr) {
          console.error(`❌ Failed to unlock ${data.email}:`, unlockErr.message)
        }
      }

      if (snapshot.docs.indexOf(doc) < snapshot.docs.length - 1) {
        await sleep(CONFIG.EMAIL_INTERVAL_MS)
      }
    }

    console.log(`✅ ${workerName}: ${sent} sent, ${failed} failed, ${skipped} skipped`)

    const moreSnapshot = await db.collection(workerQueueName).limit(1).get()

    return {
      processed: snapshot.docs.length,
      sent,
      failed,
      skipped,
      hasFailures,
      hasMore: !moreSnapshot.empty,
    }
  } catch (err) {
    console.error(`❌ ${workerName} crashed:`, err.message)
    return { processed: 0, sent: 0, failed: 0, hasFailures: true, error: err.message }
  }
}

// =========================
// RETRY WORKER
// =========================

async function runRetryWorker() {
  console.log('🔄 Retry Worker starting...')

  try {
    const snapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'pending_retry')
      .limit(CONFIG.BATCH_SIZE)
      .get()

    if (snapshot.empty) {
      console.log('⏭️ No emails for retry')
      return { reset: 0, hasMore: false }
    }

    let reset = 0

    for (const doc of snapshot.docs) {
      const data = doc.data()
      const lastAttempt = data.lastAttempt?.toDate?.() || new Date(0)
      const minutesSince = (Date.now() - lastAttempt.getTime()) / (60 * 1000)

      if (minutesSince < CONFIG.RETRY_DELAY_MINUTES) {
        console.log(`⏳ Too soon for ${data.email} (${Math.floor(minutesSince)}m ago)`)
        continue
      }

      if (data.lockedAt) {
        const lockedAt = data.lockedAt.toDate ? data.lockedAt.toDate() : new Date(data.lockedAt)
        const minutesSinceLock = (Date.now() - lockedAt.getTime()) / (60 * 1000)
        if (minutesSinceLock < CONFIG.LOCK_TIMEOUT_MINUTES) {
          console.log(`⏳ ${data.email} currently locked, skipping`)
          continue
        }
      }

      await doc.ref.update({
        status: 'pending',
        retryCount: admin.firestore.FieldValue.increment(1),
        resetAt: admin.firestore.FieldValue.serverTimestamp(),
        lockedAt: admin.firestore.FieldValue.delete(),
        lockedBy: admin.firestore.FieldValue.delete(),
        workerQueue: admin.firestore.FieldValue.delete(),
        distributedAt: admin.firestore.FieldValue.delete(),
      })

      reset++
      console.log(`🔄 Reset ${data.email} to pending`)
    }

    const moreSnapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'pending_retry')
      .limit(1)
      .get()

    return { reset, hasMore: !moreSnapshot.empty }
  } catch (err) {
    console.error('❌ Retry Worker crashed:', err.message)
    return { reset: 0, hasMore: false, error: err.message }
  }
}

// =========================
// CAMPAIGN COMPLETION CHECKER
// =========================

async function checkCampaignCompletion() {
  console.log('📊 Checking campaign completion...')

  try {
    const pendingSnapshot = await db
      .collection('emailQueue')
      .where('status', 'in', ['pending', 'pending_retry', 'distributed'])
      .limit(1)
      .get()

    if (!pendingSnapshot.empty) {
      console.log('⏳ Active campaigns still in progress')
      return { completed: 0, hasMore: true }
    }

    const fiveMinutesAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000))

    const [sentSnapshot, failedSnapshot] = await Promise.all([
      db
        .collection('emailQueue')
        .where('status', '==', 'sent')
        .where('sentAt', '>=', fiveMinutesAgo)
        .get(),
      db
        .collection('emailQueue')
        .where('status', '==', 'failed')
        .where('lastAttempt', '>=', fiveMinutesAgo)
        .get(),
    ])

    const allDocs = [...sentSnapshot.docs, ...failedSnapshot.docs]

    if (allDocs.length === 0) {
      console.log('ℹ️ No recently completed campaigns')
      return { completed: 0, hasMore: false }
    }

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

    for (const campaignId of Object.keys(campaigns)) {
      try {
        const campaignDoc = await db.collection('campaigns').doc(campaignId).get()
        if (campaignDoc.exists && campaignDoc.data().notificationSent) {
          campaigns[campaignId].notified = true
        }
      } catch (e) {
        console.warn(`⚠️ Could not check campaign ${campaignId}:`, e.message)
      }
    }

    let completed = 0

    for (const [campaignId, stats] of Object.entries(campaigns)) {
      if (stats.notified) {
        console.log(`⏭️ ${campaignId} already notified`)
        continue
      }

      const campaignPending = await db
        .collection('emailQueue')
        .where('campaignId', '==', campaignId)
        .where('status', 'in', ['pending', 'pending_retry', 'distributed'])
        .limit(1)
        .get()

      if (!campaignPending.empty) {
        console.log(`⏳ ${campaignId} still has pending emails`)
        continue
      }

      const campaignDoc = await db.collection('campaigns').doc(campaignId).get()
      const campaignData = campaignDoc.exists ? campaignDoc.data() : {}
      const domain = campaignData.domain || stats.domain

      console.log(`🎯 ${campaignId} is complete!`)

      let notificationSuccess = false
      let notificationError = null

      try {
        const notifyResult = await sendCompletionNotification(campaignId, domain, stats)
        if (notifyResult.success) {
          notificationSuccess = true
        } else {
          notificationError = notifyResult.error
        }
      } catch (notifyErr) {
        notificationError = notifyErr.message
      }

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

      completed++
      console.log(`💾 ${campaignId} marked completed`)
    }

    return { completed, hasMore: false }
  } catch (err) {
    console.error('❌ Completion check failed:', err.message)
    return { completed: 0, hasMore: false, error: err.message }
  }
}

// =========================
// RECOVERY
// =========================

async function recoverOrphanedEmails() {
  console.log('🔍 Recovery: Scanning for orphaned emails...')

  const now = admin.firestore.Timestamp.now()
  const cutoff = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - CONFIG.ORPHAN_THRESHOLD_MINUTES * 60 * 1000),
  )

  try {
    const distributedSnapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'distributed')
      .where('distributedAt', '<=', cutoff)
      .limit(50)
      .get()

    if (distributedSnapshot.empty) {
      console.log('✅ No orphaned emails found')
      return { recovered: 0, hasMore: false }
    }

    let recovered = 0
    let stillInWorkerQueue = 0
    let recentlyLocked = 0

    for (const doc of distributedSnapshot.docs) {
      const data = doc.data()

      if (data.lockedAt) {
        const lockedAt = data.lockedAt.toDate ? data.lockedAt.toDate() : new Date(data.lockedAt)
        const minutesSinceLock = (Date.now() - lockedAt.getTime()) / (60 * 1000)
        if (minutesSinceLock < CONFIG.LOCK_TIMEOUT_MINUTES) {
          recentlyLocked++
          continue
        }
      }

      const workerQueue = data.workerQueue
      const originalDocId = doc.id

      if (!workerQueue) {
        await doc.ref.update({
          status: 'pending',
          recoveredAt: now,
          recoveryReason: 'missing_workerQueue_field',
          lockedAt: admin.firestore.FieldValue.delete(),
          lockedBy: admin.firestore.FieldValue.delete(),
        })
        recovered++
        continue
      }

      const workerDocs = await db
        .collection(workerQueue)
        .where('originalDocId', '==', originalDocId)
        .limit(1)
        .get()

      if (workerDocs.empty) {
        await doc.ref.update({
          status: 'pending',
          recoveredAt: now,
          recoveryReason: `worker_queue_doc_missing_in_${workerQueue}`,
          previousWorkerQueue: workerQueue,
          workerQueue: admin.firestore.FieldValue.delete(),
          distributedAt: admin.firestore.FieldValue.delete(),
          lockedAt: admin.firestore.FieldValue.delete(),
          lockedBy: admin.firestore.FieldValue.delete(),
        })
        recovered++
      } else {
        stillInWorkerQueue++
      }
    }

    const moreSnapshot = await db
      .collection('emailQueue')
      .where('status', '==', 'distributed')
      .where('distributedAt', '<=', cutoff)
      .limit(1)
      .get()

    return {
      recovered,
      checked: distributedSnapshot.size,
      stillInWorkerQueue,
      recentlyLocked,
      hasMore: !moreSnapshot.empty,
    }
  } catch (err) {
    console.error('❌ Recovery crashed:', err.message)
    return { recovered: 0, hasMore: false, error: err.message }
  }
}

// =========================
// TASK QUEUE FUNCTIONS (Firebase v2 onTaskDispatched)
// These auto-create their own queues and handle auth internally
// =========================

// Task queue config
const taskQueueConfig = {
  memory: '512MiB',
  timeoutSeconds: 120,
  maxInstances: 1,
  retryConfig: {
    maxAttempts: 3,
    minBackoffSeconds: 10,
  },
  rateLimits: {
    maxConcurrentDispatches: 1,
  },
}

// 2. DISTRIBUTOR TASK
exports.emailDistributor = onTaskDispatched(
  {
    ...taskQueueConfig,
    memory: '512MiB',
    timeoutSeconds: 120,
  },
  async (req) => {
    console.log('📥 Distributor task invoked')
    const distResult = await distributeEmails()

    if (distResult.distributed > 0) {
      await Promise.all([
        enqueueTask(
          'emailWorker',
          { workerQueue: 'workerQueue1', workerName: 'Worker-1' },
          { scheduleDelaySeconds: 2 },
        ),
        enqueueTask(
          'emailWorker',
          { workerQueue: 'workerQueue2', workerName: 'Worker-2' },
          { scheduleDelaySeconds: 3 },
        ),
        enqueueTask(
          'emailWorker',
          { workerQueue: 'workerQueue3', workerName: 'Worker-3' },
          { scheduleDelaySeconds: 4 },
        ),
      ])
    }

    if (distResult.hasMore) {
      await enqueueTask('emailDistributor', {}, { scheduleDelaySeconds: 5 })
    }

    console.log('✅ Distributor task complete:', distResult)
  },
)

// 3. WORKER TASK
exports.emailWorker = onTaskDispatched(
  {
    ...taskQueueConfig,
    memory: '512MiB',
    timeoutSeconds: 300,
    maxInstances: 3,
  },
  async (req) => {
    console.log('📥 Worker task invoked')
    const { workerQueue, workerName } = req.data
    const result = await runWorker(workerQueue, workerName)

    if (result.hasMore) {
      await enqueueTask('emailWorker', { workerQueue, workerName }, { scheduleDelaySeconds: 2 })
    }

    if (result.hasFailures) {
      await enqueueTask('emailRetry', {}, { scheduleDelaySeconds: 60 })
    }

    await enqueueTask('emailCompletion', {}, { scheduleDelaySeconds: 10 })

    console.log('✅ Worker task complete:', result)
  },
)

// 4. RETRY TASK
exports.emailRetry = onTaskDispatched(
  {
    ...taskQueueConfig,
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (req) => {
    console.log('📥 Retry task invoked')
    const result = await runRetryWorker()

    if (result.hasMore) {
      await enqueueTask('emailRetry', {}, { scheduleDelaySeconds: 300 })
    }

    if (result.reset > 0) {
      await enqueueTask('emailDistributor', {}, { scheduleDelaySeconds: 5 })
    }

    console.log('✅ Retry task complete:', result)
  },
)

// 5. COMPLETION TASK
exports.emailCompletion = onTaskDispatched(
  {
    memory: '256MiB',
    timeoutSeconds: 120,
    maxInstances: 1,
    retryConfig: { maxAttempts: 3, minBackoffSeconds: 10 },
    rateLimits: { maxConcurrentDispatches: 1 },
  },
  async (req) => {
    console.log('📥 Completion task invoked')
    const result = await checkCampaignCompletion()

    if (result.hasMore) {
      await enqueueTask('emailCompletion', {}, { scheduleDelaySeconds: 30 })
    }

    console.log('✅ Completion task complete:', result)
  },
)

// 6. RECOVERY TASK
exports.emailRecovery = onTaskDispatched(
  {
    memory: '256MiB',
    timeoutSeconds: 120,
    maxInstances: 1,
    retryConfig: { maxAttempts: 3, minBackoffSeconds: 10 },
    rateLimits: { maxConcurrentDispatches: 1 },
  },
  async (req) => {
    console.log('📥 Recovery task invoked')
    const result = await recoverOrphanedEmails()

    if (result.hasMore) {
      await enqueueTask('emailRecovery', {}, { scheduleDelaySeconds: 120 })
    }

    if (result.recovered > 0) {
      await enqueueTask('emailDistributor', {}, { scheduleDelaySeconds: 5 })
    }

    console.log('✅ Recovery task complete:', result)
  },
)

// =========================
// CALLABLE FUNCTIONS
// =========================

// 1. SEND BLASTER
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

      const now = new Date()
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const monthlyRef = db.collection('monthlyStats').doc(currentMonthKey)
      await monthlyRef.set(
        {
          sent: admin.firestore.FieldValue.increment(validEmails.length),
          month: currentMonthKey,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      )

      // 🚀 TRIGGER DISTRIBUTOR via Firebase Task Queue
      const enqueueResult = await enqueueTask(
        'emailDistributor',
        { campaignId },
        { scheduleDelaySeconds: 3 },
      )
      if (!enqueueResult.success) {
        console.error('❌ Failed to enqueue distributor:', enqueueResult.error)
      }

      console.log(`✅ Campaign ${campaignId} queued: ${validEmails.length} emails`)

      return {
        success: true,
        campaignId,
        queued: validEmails.length,
        invalid: invalidEmails.length,
        message: `Campaign queued. Sending at ~${CONFIG.HOURLY_TARGET}/hour.`,
      }
    } catch (err) {
      console.error('❌ sendBlaster error:', err)
      throw new HttpsError('internal', err.message)
    }
  },
)

// 7. GET CAMPAIGN STATUS
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

// 8. GET ALL CAMPAIGNS
exports.getCampaigns = onCall(
  {
    memory: '256MiB',
    timeoutSeconds: 30,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const snapshot = await db.collection('campaigns').orderBy('createdAt', 'desc').limit(50).get()
      const campaigns = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      return { campaigns }
    } catch (err) {
      console.error('❌ getCampaigns error:', err)
      throw new HttpsError('internal', err.message)
    }
  },
)

// 9. GET MONTHLY STATS
exports.getMonthlyStats = onCall(
  {
    memory: '256MiB',
    timeoutSeconds: 30,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const now = new Date()
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const monthlyDoc = await db.collection('monthlyStats').doc(currentMonthKey).get()

      let sent = 0
      if (monthlyDoc.exists) {
        sent = monthlyDoc.data().sent || 0
      }

      const limit = 50000
      const remaining = Math.max(0, limit - sent)
      const percentage = Math.min(100, Math.round((sent / limit) * 100))

      return { currentMonth: currentMonthKey, sent, limit, remaining, percentage }
    } catch (err) {
      console.error('❌ getMonthlyStats error:', err)
      throw new HttpsError('internal', err.message)
    }
  },
)

// 10. GET CAMPAIGN EMAILS
exports.getCampaignEmails = onCall(
  {
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (request) => {
    try {
      const { campaignId, pageSize = 500, lastDocId } = request.data
      if (!campaignId) {
        throw new HttpsError('invalid-argument', 'Campaign ID is required')
      }

      let query = db
        .collection('emailQueue')
        .where('campaignId', '==', campaignId)
        .orderBy('createdAt', 'desc')
        .limit(Math.min(pageSize, 1000))

      if (lastDocId) {
        const lastDoc = await db.collection('emailQueue').doc(lastDocId).get()
        if (lastDoc.exists) query = query.startAfter(lastDoc)
      }

      const snapshot = await query.get()

      if (snapshot.empty) {
        return { emails: [], totalFetched: 0, hasMore: false, lastDocId: null }
      }

      const emails = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          email: data.email,
          status: data.status,
          attempts: data.attempts || 0,
          retryCount: data.retryCount || 0,
          error: data.error || null,
          createdAt: data.createdAt?.toDate?.() || null,
          sentAt: data.sentAt?.toDate?.() || null,
          lastAttempt: data.lastAttempt?.toDate?.() || null,
          distributedAt: data.distributedAt?.toDate?.() || null,
          workerQueue: data.workerQueue || null,
        }
      })

      const lastDoc = snapshot.docs[snapshot.docs.length - 1]
      const nextQuery = db
        .collection('emailQueue')
        .where('campaignId', '==', campaignId)
        .orderBy('createdAt', 'desc')
        .startAfter(lastDoc)
        .limit(1)
      const nextSnapshot = await nextQuery.get()

      return {
        emails,
        totalFetched: emails.length,
        hasMore: !nextSnapshot.empty,
        lastDocId: lastDoc.id,
      }
    } catch (err) {
      console.error('❌ getCampaignEmails error:', err)
      throw new HttpsError('internal', err.message)
    }
  },
)

// 11. EXPORT CAMPAIGN EMAILS
exports.exportCampaignEmails = onCall(
  {
    memory: '512MiB',
    timeoutSeconds: 300,
    maxInstances: 3,
  },
  async (request) => {
    try {
      const { campaignId } = request.data
      if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID required')

      const allEmails = []
      let lastDocId = null
      let hasMore = true
      const batchSize = 1000

      while (hasMore && allEmails.length < 50000) {
        let query = db
          .collection('emailQueue')
          .where('campaignId', '==', campaignId)
          .orderBy('createdAt', 'desc')
          .limit(batchSize)

        if (lastDocId) {
          const lastDoc = await db.collection('emailQueue').doc(lastDocId).get()
          if (lastDoc.exists) query = query.startAfter(lastDoc)
        }

        const snapshot = await query.get()
        if (snapshot.empty) {
          hasMore = false
          break
        }

        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          allEmails.push({
            email: data.email,
            status: data.status,
            attempts: data.attempts || 0,
            retryCount: data.retryCount || 0,
            error: data.error || '',
            createdAt: data.createdAt?.toDate?.().toISOString() || '',
            sentAt: data.sentAt?.toDate?.().toISOString() || '',
            lastAttempt: data.lastAttempt?.toDate?.().toISOString() || '',
            distributedAt: data.distributedAt?.toDate?.().toISOString() || '',
            workerQueue: data.workerQueue || '',
          })
        })

        lastDocId = snapshot.docs[snapshot.docs.length - 1].id

        const checkQuery = db
          .collection('emailQueue')
          .where('campaignId', '==', campaignId)
          .orderBy('createdAt', 'desc')
          .startAfter(snapshot.docs[snapshot.docs.length - 1])
          .limit(1)
        const checkSnapshot = await checkQuery.get()
        hasMore = !checkSnapshot.empty
      }

      const campaignDoc = await db.collection('campaigns').doc(campaignId).get()
      const campaignInfo = campaignDoc.exists ? campaignDoc.data() : {}

      return {
        campaign: {
          campaignId,
          domain: campaignInfo.domain || '',
          fromName: campaignInfo.fromName || '',
          subject: campaignInfo.subject || '',
          totalEmails: campaignInfo.totalEmails || allEmails.length,
          status: campaignInfo.status || '',
          createdAt: campaignInfo.createdAt?.toDate?.().toISOString() || '',
        },
        emails: allEmails,
        total: allEmails.length,
      }
    } catch (err) {
      console.error('❌ exportCampaignEmails error:', err)
      throw new HttpsError('internal', err.message)
    }
  },
)

// 12. MANUAL RECOVERY TRIGGER
exports.triggerRecovery = onCall(
  {
    memory: '256MiB',
    timeoutSeconds: 30,
    maxInstances: 1,
  },
  async (request) => {
    try {
      const result = await enqueueTask('emailRecovery', {}, { scheduleDelaySeconds: 5 })
      if (!result.success) {
        throw new HttpsError('internal', `Failed to enqueue recovery: ${result.error}`)
      }
      return { success: true, message: 'Recovery job queued' }
    } catch (err) {
      console.error('❌ triggerRecovery error:', err)
      throw new HttpsError('internal', err.message)
    }
  },
)
