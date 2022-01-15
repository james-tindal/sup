import { knex, raw } from '#/utilities/knex'

// * Authentiction * ------------------------------------------------------------

/*
1.
  IF    user not found
  THEN  MUTATE create user
  RETURN has_valid_otp

2.
  IF   NOT has_valid_otp
  THEN MUTATE otp_valid_from = now()
  RETURN otp_valid_from
*/
export const request_new_otp = (phone_number: string): Promise<string | null> => raw`
  UPSERT INTO usr (phone_number)
  VALUES ('${phone_number}')
  RETURNING
    (SELECT has_valid_otp FROM view_auth WHERE phone_number = '${phone_number}')
  ;
  UPDATE usr
  SET otp_valid_from = -- IF has_valid_otp THEN otp_valid_from ELSE now()
    if(
      (SELECT has_valid_otp FROM view_auth WHERE phone_number = '${phone_number}'),
      otp_valid_from,
      now()
    )
  WHERE phone_number = '${phone_number}'
  RETURNING otp_valid_from
`
.then(x => x.map(y => y.rows[0]))
.then(([a, b]) => Object.assign({}, a, b))
.then(d => d.has_valid_otp ? null : d.otp_valid_from)

/*
1.
  RETURN has_valid_otp, queried_this_second
2.
  MUTATE otp_last_attempt = now()
*/
export const get_timestamp_if_valid = async (phone_number: string): Promise<string | null> => raw`
  SELECT if(
      (SELECT has_valid_otp AND NOT queried_this_second FROM view_auth WHERE phone_number = '${phone_number}'),
      (SELECT otp_valid_from FROM usr WHERE phone_number = '${phone_number}'),
      NULL)
  AS otp_valid_from
  ;
  UPDATE usr SET otp_last_attempt = now() WHERE phone_number = '${phone_number}'
`
.then(x => x[0].rows[0].otp_valid_from)

// throws if user doesn't exist
type uuid = string
export const invalidate_otp__create_session = (phone_number: string): Promise<uuid> => raw`
  UPDATE usr SET otp_valid_from = NULL WHERE phone_number = '${phone_number}'
  ;
  INSERT INTO session (user_id)
  SELECT phone_number FROM usr WHERE phone_number = '${phone_number}'
  RETURNING id AS session_id
`
.then(x => x[1].rows[0].session_id)


// * Messaging * ----------------------------------------------------------------

// export const send_message = (body: string, recipient: uuid): Promise<void> => raw`
//   INSERT INTO message (body, datetime)
//   VALUES ('${body}', now())
//   WHERE recipient = '${recipient}'
// `

// 1. Get sender phone_number from session_id
// 2. Check recipient exists
export const get_sender_recipient =
( session_id: uuid, recipient_phone_number: string  ): Promise<
{ sender_phone_number: string | null, recipient_exists: boolean }> => raw`
  SELECT phone_number FROM session WHERE id = '${session_id}'
  AS sender_phone_number
  ;
  SELECT (SELECT true FROM usr WHERE phone_number = '${recipient_phone_number}') is true
  AS recipient_exists
`
.then(x => Object.assign({}, x[0].rows[0], x[1].rows[0] ))

