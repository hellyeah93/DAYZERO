import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  sendNotification: (title: string, body: string) => {
    ipcRenderer.send('send-notification', { title, body });
  },
});
