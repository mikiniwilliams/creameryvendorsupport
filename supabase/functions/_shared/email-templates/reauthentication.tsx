/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for VendorCare Connect</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>VendorCare Connect</Text>
        <Heading style={h1}>Confirm your identity</Heading>
        <Text style={text}>Use the code below to verify your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#FFFBEB', fontFamily: "'Source Sans Pro', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const brand = {
  fontSize: '13px',
  fontWeight: '700' as const,
  color: '#D97706',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 24px',
}
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1C1917',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: '#57534E',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const codeStyle = {
  fontFamily: "'Source Code Pro', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#D97706',
  letterSpacing: '0.15em',
  margin: '0 0 32px',
}
const footer = { fontSize: '12px', color: '#A8A29E', margin: '32px 0 0' }
