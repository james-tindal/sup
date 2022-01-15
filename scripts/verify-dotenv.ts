
declare namespace NodeJS {
  interface ProcessEnv {
    OTP_SECRET                : string
    AWS_SNS_ACCESS_KEY_ID     : string
    AWS_SNS_SECRET_ACCESS_KEY : string
    AWS_SNS_REGION            : string
    MESSAGEBIRD_KEY           : string
    NODE_ENV                  : 'development' | 'production' | 'test'
  }
}

process.env.NODE_ENV ??= 'production'

;[ 
  'OTP_SECRET',
  'AWS_SNS_ACCESS_KEY_ID',
  'AWS_SNS_SECRET_ACCESS_KEY',
  'AWS_SNS_REGION',
  'MESSAGEBIRD_KEY'
]
.forEach(constant => {
  if (typeof process.env[constant] !== 'string')
    throw new Error(`${constant} not found in process.env`)
})
