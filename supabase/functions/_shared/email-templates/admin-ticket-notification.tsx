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
  Section,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'

interface AdminTicketNotificationProps {
  customerName: string
  customerEmail: string
  vendorName: string
  issueType: string
  description: string
  ticketRef: string
  submittedAt: string
}

export const AdminTicketNotification = ({
  customerName,
  customerEmail,
  vendorName,
  issueType,
  description,
  ticketRef,
  submittedAt,
}: AdminTicketNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New support request from {customerName} — {issueType}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>VendorCare Connect</Text>
        <Heading style={h1}>New Public Support Request</Heading>
        <Text style={text}>
          A customer has submitted a support request through the public form.
        </Text>

        <Section style={detailsBox}>
          <Row>
            <Column style={labelCol}>Reference</Column>
            <Column style={valueCol}>#{ticketRef}</Column>
          </Row>
          <Row>
            <Column style={labelCol}>Customer</Column>
            <Column style={valueCol}>{customerName} ({customerEmail})</Column>
          </Row>
          <Row>
            <Column style={labelCol}>Vendor</Column>
            <Column style={valueCol}>{vendorName}</Column>
          </Row>
          <Row>
            <Column style={labelCol}>Issue Type</Column>
            <Column style={valueCol}>{issueType}</Column>
          </Row>
          <Row>
            <Column style={labelCol}>Submitted</Column>
            <Column style={valueCol}>{submittedAt}</Column>
          </Row>
        </Section>

        <Text style={descLabel}>Description:</Text>
        <Text style={descText}>{description}</Text>

        <Text style={footer}>
          Log in to VendorCare Connect to review and respond to this request.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default AdminTicketNotification

const main = { backgroundColor: '#FFFBEB', fontFamily: "'Source Sans Pro', Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '520px', margin: '0 auto' }
const brand = {
  fontSize: '13px',
  fontWeight: '700' as const,
  color: '#D97706',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 24px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1C1917',
  margin: '0 0 12px',
}
const text = {
  fontSize: '15px',
  color: '#57534E',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const detailsBox = {
  backgroundColor: '#FEF3C7',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 20px',
}
const labelCol = {
  fontSize: '13px',
  fontWeight: '600' as const,
  color: '#92400E',
  padding: '4px 12px 4px 0',
  verticalAlign: 'top' as const,
  width: '100px',
}
const valueCol = {
  fontSize: '14px',
  color: '#1C1917',
  padding: '4px 0',
  verticalAlign: 'top' as const,
}
const descLabel = {
  fontSize: '13px',
  fontWeight: '600' as const,
  color: '#92400E',
  margin: '0 0 6px',
}
const descText = {
  fontSize: '14px',
  color: '#1C1917',
  lineHeight: '1.6',
  margin: '0 0 24px',
  backgroundColor: '#FFFFFF',
  borderRadius: '8px',
  padding: '12px 16px',
  border: '1px solid #FDE68A',
}
const footer = { fontSize: '12px', color: '#A8A29E', margin: '24px 0 0' }
