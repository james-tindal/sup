const { readFileSync: readFile, appendFileSync: appendFile, writeFileSync: writeFile } = require('fs')

// Generate secret
const secret = require('crypto').randomBytes(32).toString('base64')

// Create .env if not exist
const file = readFile('.env', { flag: 'a+', encoding: 'utf-8' })

const regex = /^OTP_SECRET=(.*)$/m
const new_line = `OTP_SECRET=${secret}`

// IF .env has OTP_SECRET, replace, else append.
if (file.match(regex))
  writeFile('.env', file.replace(regex, new_line))
else
  appendFile('.env', '\n' + new_line)

