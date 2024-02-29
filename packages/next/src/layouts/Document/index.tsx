import type { SanitizedConfig } from 'payload/types'

import { DocumentHeader } from '@payloadcms/ui'
import '@payloadcms/ui/scss/app.scss'
import React, { Fragment } from 'react'

import { initPage } from '../../utilities/initPage'

export const metadata = {
  description: 'Generated by Next.js',
  title: 'Next.js',
}

export const DocumentLayout = async ({
  children,
  collectionSlug,
  config: configPromise,
  globalSlug,
}: {
  children: React.ReactNode
  collectionSlug?: string
  config: Promise<SanitizedConfig>
  globalSlug?: string
}) => {
  const { collectionConfig, globalConfig, req } = await initPage({
    collectionSlug,
    config: configPromise,
    globalSlug,
  })

  return (
    <Fragment>
      <DocumentHeader
        collectionConfig={collectionConfig}
        config={req.payload.config}
        globalConfig={globalConfig}
        i18n={req.i18n}
      />
      {children}
    </Fragment>
  )
}
