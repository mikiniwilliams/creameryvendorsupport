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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for VendorCare Connect</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>VendorCare Connect</Text>
        <Heading style={h1}>Welcome aboard!</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>VendorCare Connect</strong>
          </Link>
          — The Creamery's vendor support platform.
        </Text>
        <Text style={text}>
          Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) by clicking the button below:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify Email
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
