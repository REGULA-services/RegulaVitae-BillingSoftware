import dgram from 'dgram';
import os from 'os';
import fs from 'fs';
import path from 'path';

/**
 * Embedded RFC 6762 Zero-Configuration mDNS (Multicast DNS) & DNS-SD Responder
 * Broadcasts and answers queries for 'madrasorthoclinic.local' across ALL active
 * LAN/Wi-Fi IPv4 interfaces (ignoring APIPA 169.254.x.x & virtual adapters),
 * so phones, tablets, and PCs on clinic Wi-Fi resolve http://madrasorthoclinic.local:4848
 * seamlessly without manual hosts or router DNS configuration.
 */

const TARGET_HOST = 'madrasorthoclinic.local';
const SERVICE_TYPE = '_http._tcp.local';
const SERVICE_ENUM = '_services._dns-sd._udp.local';
const SERVICE_INSTANCE = `Madras Ortho Clinic Pharmacy.${SERVICE_TYPE}`;
const MULTICAST_ADDR = '224.0.0.251';
const MDNS_PORT = 5353;
const HTTP_PORT = Number(process.env.PORT || 4848);

export interface LanInterfaceInfo {
  name: string;
  ip: string;
  isWifi: boolean;
  isPhysical: boolean;
}

export function getLanIpv4Interfaces(): LanInterfaceInfo[] {
  try {
    const interfaces = os.networkInterfaces();
    const list: LanInterfaceInfo[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.') && net.address !== '0.0.0.0') {
          const isWifi = /wi-?fi|wlan|wireless|802\.11/i.test(name);
          const isVirtual = /vethernet|hyper-v|vmware|virtualbox|vbox|wsl|docker|nord|openvpn|wireguard|zerotier|tailscale|teredo|loopback/i.test(name);
          list.push({
            name,
            ip: net.address,
            isWifi,
            isPhysical: !isVirtual
          });
        }
      }
    }
    // Prefer real Wi-Fi first, then physical Ethernet, then virtual adapters
    list.sort((a, b) => {
      const scoreA = (a.isWifi ? 10 : 0) + (a.isPhysical ? 5 : 0);
      const scoreB = (b.isWifi ? 10 : 0) + (b.isPhysical ? 5 : 0);
      return scoreB - scoreA;
    });
    return list;
  } catch {
    return [];
  }
}

export function getPrimaryLanIp(): string {
  const list = getLanIpv4Interfaces();
  return list.length > 0 ? list[0].ip : '127.0.0.1';
}

function encodeDnsName(name: string): Buffer {
  const clean = name.replace(/\.+$/, '');
  const parts = clean.split('.').filter(Boolean);
  const buffers = parts.map((p) => {
    const byteLen = Buffer.byteLength(p, 'utf8');
    const buf = Buffer.alloc(1 + byteLen);
    buf.writeUInt8(byteLen, 0);
    buf.write(p, 1, 'utf8');
    return buf;
  });
  return Buffer.concat([...buffers, Buffer.from([0])]);
}

function decodeDnsName(packet: Buffer, startOffset: number): { name: string; nextOffset: number } | null {
  try {
    const labels: string[] = [];
    let offset = startOffset;
    let jumped = false;
    let endOffset = startOffset;
    let guard = 0;

    while (offset < packet.length && guard++ < 64) {
      const len = packet.readUInt8(offset);
      if (len === 0) {
        if (!jumped) endOffset = offset + 1;
        return { name: labels.join('.').toLowerCase(), nextOffset: endOffset };
      }
      if ((len & 0xc0) === 0xc0) {
        if (offset + 1 >= packet.length) return null;
        const ptr = ((len & 0x3f) << 8) | packet.readUInt8(offset + 1);
        if (!jumped) endOffset = offset + 2;
        jumped = true;
        offset = ptr;
      } else {
        offset += 1;
        if (offset + len > packet.length) return null;
        labels.push(packet.toString('utf8', offset, offset + len));
        offset += len;
        if (!jumped) endOffset = offset;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function buildResourceRecord(name: string, type: number, rclass: number, ttl: number, rdata: Buffer): Buffer {
  const nameBuf = encodeDnsName(name);
  const hdr = Buffer.alloc(10);
  hdr.writeUInt16BE(type, 0);
  hdr.writeUInt16BE(rclass, 2);
  hdr.writeUInt32BE(ttl, 4);
  hdr.writeUInt16BE(rdata.length, 8);
  return Buffer.concat([nameBuf, hdr, rdata]);
}

function buildARecord(name: string, ipStr: string, ttl = 120): Buffer {
  const ipParts = ipStr.split('.').map((n) => Number(n) & 0xff);
  if (ipParts.length !== 4) return Buffer.alloc(0);
  return buildResourceRecord(name, 1, 0x8001, ttl, Buffer.from(ipParts)); // Type A, Class IN + Cache-Flush
}

function buildPtrRecord(name: string, target: string, ttl = 120): Buffer {
  return buildResourceRecord(name, 12, 0x0001, ttl, encodeDnsName(target)); // Type PTR, Class IN
}

function buildSrvRecord(instanceName: string, hostName: string, port: number, ttl = 120): Buffer {
  const pre = Buffer.alloc(6);
  pre.writeUInt16BE(0, 0);    // Priority
  pre.writeUInt16BE(0, 2);    // Weight
  pre.writeUInt16BE(port, 4); // Port
  return buildResourceRecord(instanceName, 33, 0x8001, ttl, Buffer.concat([pre, encodeDnsName(hostName)]));
}

function buildTxtRecord(instanceName: string, entries: string[], ttl = 120): Buffer {
  const parts = entries.map((e) => {
    const b = Buffer.from(e, 'utf8');
    return Buffer.concat([Buffer.from([b.length]), b]);
  });
  return buildResourceRecord(instanceName, 16, 0x8001, ttl, Buffer.concat(parts));
}

function buildDnsPacket(txId: number, answers: Buffer[], additionals: Buffer[] = []): Buffer {
  const header = Buffer.alloc(12);
  header.writeUInt16BE(txId & 0xffff, 0);
  header.writeUInt16BE(0x8400, 2); // Standard Response, Authoritative Answer
  header.writeUInt16BE(0, 4);      // QDCOUNT = 0 (RFC 6762 Section 6)
  header.writeUInt16BE(answers.length, 6);
  header.writeUInt16BE(0, 8);
  header.writeUInt16BE(additionals.length, 10);
  return Buffer.concat([header, ...answers, ...additionals]);
}

function parseQuestions(msg: Buffer): Array<{ qname: string; qtype: number; qclass: number; qu: boolean }> {
  const questions: Array<{ qname: string; qtype: number; qclass: number; qu: boolean }> = [];
  if (msg.length < 12) return questions;

  const flags = msg.readUInt16BE(2);
  // Ignore packets that are already responses (QR bit 0x8000 set) to prevent self-echo storms
  if ((flags & 0x8000) !== 0) return questions;

  const qdCount = msg.readUInt16BE(4);
  let offset = 12;

  for (let i = 0; i < qdCount && offset < msg.length; i++) {
    const decoded = decodeDnsName(msg, offset);
    if (!decoded || decoded.nextOffset + 4 > msg.length) break;
    const qtype = msg.readUInt16BE(decoded.nextOffset);
    const rawClass = msg.readUInt16BE(decoded.nextOffset + 2);
    questions.push({
      qname: decoded.name,
      qtype,
      qclass: rawClass & 0x7fff,
      qu: (rawClass & 0x8000) !== 0
    });
    offset = decoded.nextOffset + 4;
  }
  return questions;
}

export function startMdnsResponder(): { stop: () => void } {
  let socket: dgram.Socket | null = null;
  let announceTimer: NodeJS.Timeout | null = null;
  const joinedIfaces = new Set<string>();

  // Local hosts fallback on the Windows host PC itself
  try {
    const hostsPath = process.platform === 'win32'
      ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'drivers', 'etc', 'hosts')
      : '/etc/hosts';
    if (fs.existsSync(hostsPath)) {
      const content = fs.readFileSync(hostsPath, 'utf8');
      if (!content.includes(TARGET_HOST)) {
        fs.appendFileSync(hostsPath, `\r\n127.0.0.1 ${TARGET_HOST}\r\n`);
        console.log(`[mDNS] Registered ${TARGET_HOST} in local hosts file.`);
      }
    }
  } catch {
    // Non-admin launches rely cleanly on UDP 5353 mDNS + installer hosts rule
  }

  const syncMulticastMemberships = () => {
    if (!socket) return;
    const ifaces = getLanIpv4Interfaces();
    for (const iface of ifaces) {
      if (!joinedIfaces.has(iface.ip)) {
        try {
          socket.addMembership(MULTICAST_ADDR, iface.ip);
          joinedIfaces.add(iface.ip);
          console.log(`[mDNS] Joined 224.0.0.251 on ${iface.name} (${iface.ip})`);
        } catch (e: any) {
          console.warn(`[mDNS] Membership note for ${iface.ip}:`, e.message);
        }
      }
    }
    if (ifaces.length === 0) {
      try { socket.addMembership(MULTICAST_ADDR); } catch {}
    }
  };

  const sendOnInterfaces = (packet: Buffer) => {
    if (!socket) return;
    const ifaces = getLanIpv4Interfaces().filter((i) => i.isPhysical || i.isWifi);
    const targets = ifaces.length > 0 ? ifaces : getLanIpv4Interfaces();
    if (targets.length === 0) {
      try { socket.send(packet, 0, packet.length, MDNS_PORT, MULTICAST_ADDR); } catch {}
      return;
    }
    for (const iface of targets) {
      try {
        socket.setMulticastInterface(iface.ip);
        socket.send(packet, 0, packet.length, MDNS_PORT, MULTICAST_ADDR, (err) => {
          if (err) console.warn(`[mDNS] Multicast send warning (${iface.ip}):`, err.message);
        });
      } catch {}
    }
  };

  const sendAnnounce = () => {
    try {
      syncMulticastMemberships();
      const ip = getPrimaryLanIp();
      if (!ip || ip === '127.0.0.1') return;

      const aRec = buildARecord(TARGET_HOST, ip, 120);
      const ptrSvc = buildPtrRecord(SERVICE_ENUM, SERVICE_TYPE, 120);
      const ptrHttp = buildPtrRecord(SERVICE_TYPE, SERVICE_INSTANCE, 120);
      const srv = buildSrvRecord(SERVICE_INSTANCE, TARGET_HOST, HTTP_PORT, 120);
      const txt = buildTxtRecord(SERVICE_INSTANCE, ['path=/?view=mobile', 'app=MadrasOrthoClinic'], 120);

      // Gratuitous mDNS announcement (txId MUST be 0 per RFC 6762)
      const packet = buildDnsPacket(0, [aRec, ptrHttp, ptrSvc], [srv, txt, aRec]);
      sendOnInterfaces(packet);
    } catch {}
  };

  try {
    socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    socket.on('error', (err) => {
      console.warn('[mDNS] Responder socket warning:', err.message);
    });

    socket.on('message', (msg, rinfo) => {
      try {
        const questions = parseQuestions(msg);
        if (questions.length === 0) return;

        const txId = msg.length >= 2 ? msg.readUInt16BE(0) : 0;
        const ip = getPrimaryLanIp();
        if (!ip || ip === '127.0.0.1') return;

        // Pick interface matching sender subnet if available so multi-NIC PCs reply with the exact reachable IP
        const ifaces = getLanIpv4Interfaces();
        const rParts = rinfo.address.split('.');
        const matchingIface = ifaces.find((iface) => {
          const iParts = iface.ip.split('.');
          return iParts[0] === rParts[0] && iParts[1] === rParts[1] && iParts[2] === rParts[2];
        });
        const replyIp = matchingIface ? matchingIface.ip : ip;

        let wantsHostA = false;
        let wantsHostAAAAOnly = false;
        let wantsPtr = false;
        let wantsSrvTxt = false;
        let sendUnicast = rinfo.port !== MDNS_PORT;

        for (const q of questions) {
          if (q.qu) sendUnicast = true;
          if (q.qname === TARGET_HOST) {
            if (q.qtype === 1 || q.qtype === 255) { // A or ANY
              wantsHostA = true;
            } else if (q.qtype === 28) { // AAAA (Android/iOS dual-stack query)
              wantsHostAAAAOnly = true;
            }
          } else if (q.qname === SERVICE_TYPE || q.qname === SERVICE_ENUM) {
            wantsPtr = true;
          } else if (q.qname === SERVICE_INSTANCE.toLowerCase()) {
            wantsSrvTxt = true;
          }
        }

        if (!wantsHostA && !wantsHostAAAAOnly && !wantsPtr && !wantsSrvTxt) return;

        const answers: Buffer[] = [];
        const additionals: Buffer[] = [];

        if (wantsHostA) {
          answers.push(buildARecord(TARGET_HOST, replyIp, 120));
        }
        if (wantsPtr) {
          answers.push(buildPtrRecord(SERVICE_TYPE, SERVICE_INSTANCE, 120));
          answers.push(buildPtrRecord(SERVICE_ENUM, SERVICE_TYPE, 120));
          additionals.push(buildSrvRecord(SERVICE_INSTANCE, TARGET_HOST, HTTP_PORT, 120));
          additionals.push(buildTxtRecord(SERVICE_INSTANCE, ['path=/?view=mobile', 'app=MadrasOrthoClinic'], 120));
          additionals.push(buildARecord(TARGET_HOST, replyIp, 120));
        }
        if (wantsSrvTxt) {
          answers.push(buildSrvRecord(SERVICE_INSTANCE, TARGET_HOST, HTTP_PORT, 120));
          answers.push(buildTxtRecord(SERVICE_INSTANCE, ['path=/?view=mobile', 'app=MadrasOrthoClinic'], 120));
          additionals.push(buildARecord(TARGET_HOST, replyIp, 120));
        }

        // Note: if phone queried ONLY AAAA (QTYPE 28), sending NOERROR ANCOUNT=0 unblocks dual-stack clients cleanly;
        // plus we also accept direct A query immediately.
        const mcastPacket = buildDnsPacket(0, answers, additionals);
        sendOnInterfaces(mcastPacket);

        // Always send direct unicast answer back to the querying phone/device as well
        // (crucial for Android 12+ QU-bit queries and Wi-Fi routers that filter L2 multicast replies!)
        if (sendUnicast || rinfo.address !== replyIp) {
          const ucastTxId = rinfo.port === MDNS_PORT ? 0 : txId;
          const ucastPacket = buildDnsPacket(ucastTxId, answers, additionals);
          socket?.send(ucastPacket, 0, ucastPacket.length, rinfo.port, rinfo.address, () => {});
        }
      } catch {
        // Ignore malformed packets
      }
    });

    socket.bind(MDNS_PORT, '0.0.0.0', () => {
      try {
        socket?.setMulticastTTL(255);
        socket?.setMulticastLoopback(false);
      } catch {}
      syncMulticastMemberships();
      console.log(`[mDNS] Active on UDP 5353. Resolving http://${TARGET_HOST}:${HTTP_PORT} -> ${getPrimaryLanIp()}`);

      // Rapid initial bursts + periodic beacons for newly joined phones/tablets
      sendAnnounce();
      setTimeout(sendAnnounce, 1000);
      setTimeout(sendAnnounce, 3000);
      announceTimer = setInterval(sendAnnounce, 20000);
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
