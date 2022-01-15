import Messagebird from 'messagebird'
const messagebird = Messagebird(process.env.MESSAGEBIRD_KEY)

export function send_sms(phone_number, message) {
  const params = {
    'originator': 'Sup',
    'recipients': [ phone_number ],
    'body': message
  }
  messagebird.messages.create(params, (err, response) => console.log(err ? err : response))
}