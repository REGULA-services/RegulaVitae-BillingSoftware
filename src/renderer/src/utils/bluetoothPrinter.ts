import { encodeReceiptToEscPos } from './escpos';

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  connected: boolean;
}

// Active cached Bluetooth GATT connection
let activeDevice: any = null;
let activeCharacteristic: any = null;

export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function getActiveBluetoothDevice(): BluetoothDeviceInfo | null {
  if (activeDevice && activeDevice.gatt && activeDevice.gatt.connected) {
    return {
      id: activeDevice.id,
      name: activeDevice.name || 'Bluetooth Printer',
      connected: true
    };
  }
  return null;
}

/**
 * Scan for nearby Bluetooth thermal printers and connect
 */
export async function connectBluetoothPrinter(): Promise<BluetoothDeviceInfo> {
  if (!isBluetoothSupported()) {
    throw new Error("Web Bluetooth API is not supported in this environment. Please ensure Bluetooth is enabled.");
  }

  const navBluetooth = (navigator as any).bluetooth;

  try {
    const device = await navBluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '0000ae00-0000-1000-8000-00805f9b34fb'
      ]
    });

    if (!device) {
      throw new Error("No device selected.");
    }

    console.log(`[Bluetooth] Selected device: ${device.name} (${device.id})`);
    const server = await device.gatt.connect();

    // Discover writable characteristic
    let writeChar: any = null;

    // Try known services
    const services = await server.getPrimaryServices();
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeChar = char;
            break;
          }
        }
      } catch (e) {
        // Continue searching
      }
      if (writeChar) break;
    }

    if (!writeChar) {
      throw new Error("Connected to device, but found no writable printer GATT characteristic.");
    }

    activeDevice = device;
    activeCharacteristic = writeChar;

    device.addEventListener('gattserverdisconnected', () => {
      console.warn(`[Bluetooth] Printer disconnected: ${device.name}`);
      activeDevice = null;
      activeCharacteristic = null;
    });

    return {
      id: device.id,
      name: device.name || 'Bluetooth Printer',
      connected: true
    };
  } catch (err: any) {
    console.error("[Bluetooth Connection Error]", err);
    throw err;
  }
}

/**
 * Disconnect current active Bluetooth printer
 */
export async function disconnectBluetoothPrinter(): Promise<void> {
  if (activeDevice && activeDevice.gatt && activeDevice.gatt.connected) {
    activeDevice.gatt.disconnect();
  }
  activeDevice = null;
  activeCharacteristic = null;
}

/**
 * Send raw ESC/POS bytes over Bluetooth in safe packet chunks
 */
export async function sendEscPosToBluetooth(bytes: Uint8Array): Promise<void> {
  if (!activeCharacteristic || !activeDevice || !activeDevice.gatt.connected) {
    throw new Error("Bluetooth printer is not connected. Please connect from POS Settings.");
  }

  // Chunk size 100 bytes to avoid BLE buffer saturation
  const CHUNK_SIZE = 100;
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, Math.min(offset + CHUNK_SIZE, bytes.length));
    if (activeCharacteristic.properties.writeWithoutResponse) {
      await activeCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await activeCharacteristic.writeValue(chunk);
    }
    // Small delay between chunks
    await new Promise(r => setTimeout(r, 20));
  }
}

/**
 * Format and print receipt via active Bluetooth printer
 */
export async function printViaBluetooth(receiptData: any): Promise<{ success: boolean }> {
  const escPosBytes = encodeReceiptToEscPos(receiptData);
  await sendEscPosToBluetooth(escPosBytes);
  return { success: true };
}
