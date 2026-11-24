const { contextBridge, ipcRenderer } = require('electron');

const call = (ch) => (arg) => ipcRenderer.invoke(ch, arg);

contextBridge.exposeInMainWorld('xt', {
  info: call('app:info'),
  open: call('app:open'),
  listUsers: call('users:list'),
  register: call('users:register'),
  login: call('users:login'),
  recover: call('users:recover'),
  logout: call('users:logout'),
  save: call('users:save'),
  update: call('users:update'),
  remove: call('users:delete'),
  exportData: call('users:export'),
  importData: call('users:import'),
});
