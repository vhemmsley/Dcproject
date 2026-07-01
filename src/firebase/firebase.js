import { initializeApp } from 'firebase/app'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getAuth, signInAnonymously } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyD9BN6wLW5dUUZA79b1svjc9YmGzyvlUAE',
  authDomain: 'dcprojectt56.firebaseapp.com',
  projectId: 'dcprojectt56',
  storageBucket: 'dcprojectt56.firebasestorage.app',
  messagingSenderId: '603717496716',
  appId: '1:603717496716:web:34ca31b8ce2956581ff0a9',
  measurementId: 'G-YB07TWRVXK',
}

const app = initializeApp(firebaseConfig)
const functions = getFunctions(app, 'us-central1')
const auth = getAuth(app) // <-- Define auth FIRST

// Sign in anonymously so callable functions work
signInAnonymously(auth).catch((err) => {
  console.error('Anonymous auth failed:', err)
})

export const sendBlaster = httpsCallable(functions, 'sendBlaster')
export const getCampaignStatus = httpsCallable(functions, 'getCampaignStatus')
export const getCampaigns = httpsCallable(functions, 'getCampaigns')

export const getMonthlyStats = httpsCallable(functions, 'getMonthlyStats')
export const getCampaignEmails = httpsCallable(functions, 'getCampaignEmails')
export const exportCampaignEmails = httpsCallable(functions, 'exportCampaignEmails')
