'use client'

import dynamic from 'next/dynamic'

const EmowallAIChat = dynamic(
  () => import('@/components/EmowallButterfly').then(m => m.EmowallAIChat || m.default),
  { ssr: false }
)

export default function EmowallAIChatWrapper() {
  return <EmowallAIChat />
}
