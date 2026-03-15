/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for VendorCare Connect</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>VendorCare Connect</Text>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Click the button below to log in to VendorCare Connect. This link
          will expire shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Log In
        </Button>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
