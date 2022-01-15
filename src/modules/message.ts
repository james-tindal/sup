import * as push from '#/services/push'
import { z } from 'zod'

// export const send = (current_user_phone: string, recipient_phone: string, ciphertext: string) => {
//   push.send(recipient_phone, {
//     title: 'New message',
//     body: `${current_user_phone} sent you a message.`,
//     data: {
//       type: 'message',
//       payload: {
//         ciphertext,
//         sender: current_user_phone,
//       },
//     },
//   })
// }

// Who decides the timestamp?
// The server sets the timestamp on receipt.
// Sender's timestamp may be different.
// Receiver's timestamp will match the server's
// 

export const MAX_MESSAGE_LENGTH = 100000

const id = z.string().length(32)
const sender = z.string().length(13)
const validators = {
  Push: z.union([
    z.object({
      type: z.literal('ciphertext'),
      ciphertext: z.string().min(1).max(MAX_MESSAGE_LENGTH),
      timestamp: z.string().length(32),
      id, sender,
    }),
    z.object({
      type: z.literal('ciphertext.deleted'),
      id,
    }),
    z.object({
      type: z.literal('profile-picture'),
      profile_picture: z.string().length(365),
      id, sender,
    })
  ]),
  PushReply: z.union([
    z.object({ type: z.literal('ciphertext.recieved'), id }),
    z.object({ type: z.literal('ciphertext.read'), id }),
    z.object({ type: z.literal('ciphertext.deleted.recieved'), id }),
    z.object({ type: z.literal('profile-picture.recieved'), id }),
  ])
}


export type Push = {
  type: 'ciphertext',
  sender: string,
  ciphertext: string,
  timestamp: string,
  id: string
} | {
  type: 'ciphertext.deleted',
  id: string
} | {
  type: 'profile-picture',
  profile_picture: string,  // base64
  sender: string,
  id: string
}

export type PushReply = {
  type: 'ciphtertext.recieved',
  id: string
} | {
  type: 'ciphertext.read',
  id: string
} | {
  type: 'ciphertext.deleted.recieved',
  id: string
} | {
  type: 'profile-picture.recieved',
  id: string
}

export type Plaintext = {
  type: 'message',
  message: string
} | {
  type: 'profile-picture',
  base64: string
}

export const send = (sender_phone_number: string, recipient_phone_number: string, ciphertext: string) => {
  // Send ciphertext to DB.
  // Send push notification to recipient.
  push.send<Push>(recipient_phone_number, {
    type: 'ciphertext',
    sender: sender_phone_number,
    ciphertext,
    timestamp: new Date().toISOString(),
    id: `Doesn't have an id till the server sets it.`,
  })
}

// You first have to establish a secure communication channel.
// That's the responsibility of the client. Channel state is in the client.
// The server must provide routes for establishing a secure channel.