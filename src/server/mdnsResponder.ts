import dgram from 'dgram';
import os from 'os';
import fs from 'fs';
import path from 'path';

/**
 * Embedded Zero-Configuration mDNS (Multicast DNS) Responder
 * Broadcasts and answers queries for 'madrasorthoclinic.local'
 * so that any device (phones, tablets, PCs) on the same Wi-Fi / LAN
 * can resolve http://madrasorthoclinic.local:4848 without manual DNS setup.
 */

const TARGET_HOST = 'madrasorthoclinic.local';
const MULTICAST_ADDR = '224.0.0.251';
const MDNS_PORT = 5353;

export function getPrimaryLanIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    const candidateList: { ip: string; isWifi: boolean }[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          const isWifi = /wi-?fi|wlan|wireless|802\.11/i.test(name);
          candidateList.push({ ip: net.address, isWifi });
        }
      }
    }
    candidateList.sort((a, b) => (b.isWifi ? 1 : 0) - (a.isWifi ? 1 : 0));
    return candidateList.length > 0 ? candidateList[0].ip : '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

function encodeDnsName(name: string): Buffer {
  const parts = name.split('.');
  const buffers = parts.map(p => {
    const buf = Buffer.alloc(1 + p.length);
    buf.writeUInt8(p.length, 0);
    buf.write(p, 1, 'ascii');
    return buf;
  });
  return Buffer.concat([...buffers, Buffer.from([0])]);
}

function createResponsePacket(txId: number, name: string, ipStr: string): Buffer {
  const nameBuf = encodeDnsName(name);
  const ipParts = ipStr.split('.').map(Number);

  // DNS Header (12 bytes)
  // ID, Flags: 0x8400 (Standard response, Authoritative Answer), QDCOUNT=0, ANCOUNT=1, NSCOUNT=0, ARCOUNT=0
  const header = Buffer.alloc(12);
  header.writeUInt16BE(txId, 0);
  header.writeUInt16BE(0x8400, 2);
  header.writeUInt16BE(0, 4);
  header.writeUInt16BE(1, 6);
  header.writeUInt16BE(0, 8);
  header.writeUInt16BE(0, 10);

  // Answer RR
  // Type: A (1), Class: IN (1) + Cache-Flush Bit (0x8001), TTL: 120s, RDLENGTH: 4
  const recordHeader = Buffer.alloc(10);
  recordHeader.writeUInt16BE(1, 0);       // Type A
  recordHeader.writeUInt16BE(0x8001, 2);  // Class IN + Cache flush
  recordHeader.writeUInt32BE(120, 4);     // TTL 120 seconds
  recordHeader.writeUInt16BE(4, 8);       // Data length 4 bytes

  const ipBuf = Buffer.from(ipParts);

  return Buffer.concat([header, nameBuf, recordHeader, ipBuf]);
}

export function startMdnsResponder(): { stop: () => void } {
  let socket: dgram.Socket | null = null;
  let announceTimer: NodeJS.Timeout | null = null;

  // Try writing to hosts file as local fallback if permissions allow
  try {
    const hostsPath = process.platform === 'win32'
      ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts')
      : '/etc/hosts';
    if (fs.existsSync(hostsPath)) {
      const content = fs.readFileSync(hostsPath, 'utf8');
      if (!content.includes(TARGET_HOST)) {
        fs.appendFileSync(hostsPath, `\r\n127.0.0.1 ${TARGET_HOST}\r\n`);
        console.log(`[mDNS] Successfully registered ${TARGET_HOST} into local hosts file.`);
      }
    }
  } catch (err) {
    // Normal in non-elevated mode; mDNS UDP responder handles resolution
  }

  try {
    socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    socket.on('error', (err) => {
      console.warn('[mDNS] Responder socket warning:', err.message);
    });

    socket.on('message', (msg, rinfo) => {
      try {
        const str = msg.toString('binary').toLowerCase();
        if (str.includes('madrasorthoclinic')) {
          const txId = msg.length >= 2 ? msg.readUInt16BE(0) : 0;
          const ip = getPrimaryLanIp();
          const response = createResponsePacket(txId, TARGET_HOST, ip);

          // Multicast reply
          socket?.send(response, 0, response.length, MDNS_PORT, MULTICAST_ADDR, (err) => {
            if (err) console.warn('[mDNS] Multicast reply error:', err.message);
          });

          // Unicast reply directly to sender (especially for non-5353 queries or legacy queriers)
          if (rinfo.port !== MDNS_PORT) {
            socket?.send(response, 0, response.length, rinfo.port, rinfo.address);
          }
        }
      } catch (e) {
        // Ignore malformed packets
      }
    });

    socket.bind(MDNS_PORT, () => {
      try {
        socket?.addMembership(MULTICAST_ADDR);
        console.log(`[mDNS] Active on 224.0.0.251:5353. Resolving http://${TARGET_HOST}:4848 to ${getPrimaryLanIp()}`);
      } catch (e: any) {
        console.warn('[mDNS] Could not join multicast group:', e.message);
      }

      // Initial gratuitous announcement
      const sendAnnounce = () => {
        try {
          const ip = getPrimaryLanIp();
          const announcePacket = createResponsePacket(0, TARGET_HOST, ip);
          socket?.send(announcePacket, 0, announcePacket.length, MDNS_PORT, MULTICAST_ADDR);
        } catch {}
      };

      sendAnnounce();
      // Periodically announce so new Wi-Fi devices discover the clinic domain
      announceTimer = setInterval(sendAnnounce, 60000);
    });
  } catch (err: any) {
    console.warn('[mDNS] Could not initialize mDNS responder:', err.message);
  }

  return {
    stop: () => {
      if (announceTimer) clearInterval(announceTimer);
      if (socket) {
        try { socket.close(); } catch {}
        socket = null;
      }
    }
  };
}
