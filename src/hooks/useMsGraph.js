// MS Graph integration — gracefully degrades if not authenticated
// Stores access token in memory only (never localStorage)

import { useState, useEffect, useRef } from 'react'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const SCOPES = 'Calendars.Read User.Read OnlineMeetings.Read'

// In-memory token — never persisted
const _session = { token: null, expiry: 0 }

export default function useMsGraph() {
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [connected, setConnected] = useState(false)
  const [displayName, setDisplayName] = useState(null)

  // On mount, check if we have a session token (e.g. from redirect)
  useEffect(() => {
    // Check for token in URL hash (implicit flow return)
    const hash = window.location.hash
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1))
      const token = params.get('access_token')
      const expiresIn = parseInt(params.get('expires_in') || '3600', 10)
      if (token) {
        _session.token = token
        _session.expiry = Date.now() + expiresIn * 1000
        setConnected(true)
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname)
        fetchEvents(token)
        fetchProfile(token)
      }
    } else if (_session.token && Date.now() < _session.expiry - 60_000) {
      setConnected(true)
      fetchEvents(_session.token)
    }
  }, [])

  async function fetchEvents(token) {
    setLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const res = await fetch(
        `${GRAPH_BASE}/me/calendarView?startDateTime=${today.toISOString()}&endDateTime=${tomorrow.toISOString()}&$select=id,subject,start,end,attendees,onlineMeeting&$orderby=start/dateTime`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const data = await res.json()
        setEvents(data.value || [])
      }
    } catch {
      // Graceful degradation — calendar just won't show
    } finally {
      setLoading(false)
    }
  }

  async function fetchProfile(token) {
    try {
      const res = await fetch(`${GRAPH_BASE}/me?$select=displayName`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDisplayName(data.displayName)
      }
    } catch { /* ignore */ }
  }

  function signIn() {
    // This requires the Azure AD clientId to be configured in settings
    // We read it from localStorage settings to avoid prop drilling
    try {
      const settings = JSON.parse(localStorage.getItem('fb_settings') || '{}')
      const clientId = settings?.msGraph?.clientId || settings?.databricks?.clientId
      const tenantId = settings?.databricks?.tenantId

      if (!clientId || !tenantId) {
        alert('To connect your calendar, add your Azure AD Client ID and Tenant ID in Settings.')
        return
      }

      const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname)
      const scope = encodeURIComponent(SCOPES)
      const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}&response_mode=fragment`
      window.location.href = url
    } catch {
      alert('Unable to initiate sign-in. Check your Settings.')
    }
  }

  function signOut() {
    _session.token = null
    _session.expiry = 0
    setConnected(false)
    setEvents([])
    setDisplayName(null)
  }

  return { events, loading, connected, displayName, signIn, signOut }
}
