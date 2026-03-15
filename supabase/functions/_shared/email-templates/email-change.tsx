/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for VendorCare Connect</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>VendorCare Connect</Text>
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change your email address from{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Click the button below to confirm this change:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email Change
        </Button>
        <Text style={footer}>
          If you didn't request this change, please secure your account
          immediately.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
const link = { color: '#D97706', textDecoration: 'underline' }
const button = {
  backgroundColor: '#D97706',
  color: '#FFFBEB',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '16px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#A8A29E', margin: '32px 0 0' }
