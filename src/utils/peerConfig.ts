import type { PeerOptions } from 'peerjs'

/**
 * Shared PeerJS configuration used by both host (sessionStore) and client (ClientView).
 *
 * TURN servers are required when direct P2P fails (same-machine mDNS obfuscation,
 * symmetric NAT, firewalls). The openrelay servers are a free public TURN service
 * suitable for development. For production, replace with your own Coturn server
 * or a paid service (e.g. metered.ca, Twilio).
 */
export const PEER_OPTIONS: PeerOptions = {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: [
            'turn:leitmotif.metered.live:80',
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turns:openrelay.metered.ca:443',
        ],
        username: 'leitmotif',
        credential: 'M4HmD2UGMUhr1Dgk09N52o5SWGn-jiAgUTQ3e02PVIVacew2',
      },
    ],
  },
}
