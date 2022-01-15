import Push from 'node-pushnotifications'
const push_it = new Push({
  apn: {
    token: {
      key: './certs/apns-dev-cert.pem',
      keyId: '',
      teamId: '',
    }
  },
  gcm: {
    id: null
  }
})

export const send = <T>(recipient_phone_number: string, payload: T) => {
  // Get destination device ID.
  const device_id = 'Figure it out'
  push_it.send(device_id, payload)
}