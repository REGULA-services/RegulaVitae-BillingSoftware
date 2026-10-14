import { contextBridge, ipcRenderer } from 'electron';

// Expose secure electron APIs to the React renderer
contextBridge.exposeInMainWorld('electron', {
  printReceipt: (receiptData: any, printerName: string) => {
    return ipcRenderer.invoke('print-receipt', receiptData, printerName);
  },
  getPrinters: () => {
    return ipcRenderer.invoke('get-printers');
  },
  printNetwork: (host: string, port: number, receiptData: any) => {
    return ipcRenderer.invoke('print-network', { host, port, receiptData });
  }
});
