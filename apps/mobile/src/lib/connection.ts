

export interface Connection {
  vaultName: string,
  syncDirectory: string,
  address: string,
  lastSync: Date,
}



export async function getAllConnections(): Promise<Connection[]> {
  return Promise.resolve([
    {
      vaultName: 'default',
      syncDirectory: '/Documents',
      address: 'localhost:1235',
      lastSync: new Date('2025-05-01T10:30:00'),
    },
    {
      vaultName: 'notes',
      syncDirectory: '/Home/Notes',
      address: 'myvault.example.com',
      lastSync: new Date('2025-05-02T08:15:00'),
    },
    {
      vaultName: 'work',
      syncDirectory: '/Work',
      address: '192.168.1.10:8080',
      lastSync: new Date('2025-04-30T16:45:00'),
    },
  ])

}
