import { HmacSHA256 } from 'crypto-js'
import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64, decodeUTF8 } from 'tweetnacl-util'
import hmac from 'tweetnacl-auth'
import * as sms from '#/services/sms'
import * as db from '#/services/db'


const make_otp = (phone_number: string, otp_valid_from: string) =>
  HmacSHA256(phone_number + otp_valid_from, process.env.OTP_SECRET).words
  .slice(0, 6)
  .map(x => Number(String(x).slice(-1)))
  .join('')

const secretbox = (message: string): string =>
  encodeBase64(nacl.secretbox(decodeBase64(message), nacl.randomBytes(24), decodeBase64(process.env.OTP_SECRET)))

export
const SESSION_HASH_BASE64_LENGTH = 48
export
const SESSION_ID_LENGTH = 32
const SECRET_BASE64_LENGTH = 44

const remove_hyphens = (s: string): string => s.replace(/-/g, '')
const hex_to_binary = hex_string => Uint8Array.from(Buffer.from(hex_string, 'hex'))

const hash_session_id = (session_id: string): string =>
  encodeBase64(hmac(hex_to_binary(session_id), decodeBase64(process.env.OTP_SECRET)))
  

export const verify_session_hash = (session_string: string): boolean => {
  const session_id = session_string.substring(0, SESSION_ID_LENGTH)
  const hash       = session_string.substring(SESSION_ID_LENGTH)
  const verify_hash = hash_session_id(session_id)
  return hash === verify_hash
}


export async function send_sms_otp(phone_number: string, otp_valid_from: string): Promise<void> {
  const otp = make_otp(phone_number, otp_valid_from)
  await sms.send_sms(phone_number, `Here is your one-time password to sign in to Sup: ${otp}`)
}

// Why hash the session id?
// Link to stackoverflow explanation
export async function create_session(phone_number: string): Promise<string> {
  const session_id = remove_hyphens(await db.invalidate_otp__create_session(phone_number))
  return `${session_id}${hash_session_id(session_id)}`
}

export async function verify_otp(phone_number: string, otp_attempt: string): Promise<boolean> {
  const otp_valid_from = await db.get_timestamp_if_valid(phone_number)
  if (!otp_valid_from) return false
  
  const otp = make_otp(phone_number, otp_valid_from)
  return otp === otp_attempt
}


export const request_new_otp = db.request_new_otp
export const get_sender_recipient = db.get_sender_recipient

