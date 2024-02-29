import type { QueryParamTypes } from '@payloadcms/ui'
import type { AdminViewComponent } from 'payload/config'
import type {
  DocumentPreferences,
  Document as DocumentType,
  Field,
  SanitizedConfig,
} from 'payload/types'
import type { DocumentPermissions } from 'payload/types'

import {
  EditDepthProvider,
  FormQueryParamsProvider,
  HydrateClientUser,
  RenderCustomComponent,
  SetDocumentInfo,
  buildStateFromSchema,
  formatFields,
} from '@payloadcms/ui'
import { notFound } from 'next/navigation'
import queryString from 'qs'
import React, { Fragment } from 'react'

import type { ServerSideEditViewProps } from '../Edit/types'

import { initPage } from '../../utilities/initPage'
import { getMetaBySegment } from './getMetaBySegment.tsx'
import { getViewsFromConfig } from './getViewsFromConfig'

export const generateMetadata = async (args: {
  config: Promise<SanitizedConfig>
  params: {
    collection?: string
    global?: string
    segments: string[]
  }
}) => getMetaBySegment(args)

export const Document = async ({
  config: configPromise,
  params,
  searchParams,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  params: {
    collection?: string
    global?: string
    segments: string[]
  }
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const collectionSlug = params.collection
  const globalSlug = params.global
  const isCreating = params.segments?.length === 1 && params.segments?.[0] === 'create'
  const id = (collectionSlug && !isCreating && params.segments[0]) || undefined

  const isEditing = Boolean(globalSlug || (collectionSlug && !!id))

  const route = `/${collectionSlug || globalSlug + (params.segments?.length ? `/${params.segments.join('/')}` : '')}`

  const { collectionConfig, globalConfig, locale, permissions, req } = await initPage({
    collectionSlug,
    config: configPromise,
    globalSlug,
    redirectUnauthenticatedUser: true,
    route,
    searchParams,
  })

  if (!collectionConfig && !globalConfig) {
    return notFound()
  }

  const {
    i18n,
    payload,
    payload: { config },
    user,
  } = req

  const {
    routes: { api },
    serverURL,
  } = config

  let CustomView: SanitizedConfig['admin']['components']['views'][0]
  let DefaultView: AdminViewComponent
  let data: DocumentType
  let docPermissions: DocumentPermissions
  let preferencesKey: string
  let fields: Field[]
  let hasSavePermission: boolean
  let apiURL: string
  let action: string

  if (collectionConfig) {
    docPermissions = permissions?.collections?.[collectionSlug]
    fields = collectionConfig.fields
    action = `${serverURL}${api}/${collectionSlug}${isEditing ? `/${id}` : ''}`

    hasSavePermission =
      (isEditing && permissions?.collections?.[collectionSlug]?.update?.permission) ||
      (!isEditing && permissions?.collections?.[collectionSlug]?.create?.permission)

    apiURL = `${serverURL}${api}/${collectionSlug}/${id}?locale=${locale.code}${
      collectionConfig.versions?.drafts ? '&draft=true' : ''
    }`

    const collectionViews = await getViewsFromConfig({
      collectionConfig,
      config,
      docPermissions,
      routeSegments: params.segments,
      user,
    })

    CustomView = collectionViews?.CustomView
    DefaultView = collectionViews?.DefaultView

    if (!CustomView && !DefaultView) {
      return notFound()
    }

    try {
      data = await payload.findByID({
        id,
        collection: collectionSlug,
        depth: 0,
        locale: locale.code,
        user,
      })
    } catch (error) {}

    if (id) {
      preferencesKey = `collection-${collectionSlug}-${id}`
    }
  }

  if (globalConfig) {
    docPermissions = permissions?.globals?.[globalSlug]
    fields = globalConfig.fields
    hasSavePermission = isEditing && docPermissions?.update?.permission
    action = `${serverURL}${api}/${globalSlug}`

    apiURL = `${serverURL}${api}/${globalSlug}?locale=${locale.code}${
      globalConfig.versions?.drafts ? '&draft=true' : ''
    }`

    const globalViews = await getViewsFromConfig({
      config,
      docPermissions,
      globalConfig,
      routeSegments: params.segments,
      user,
    })

    CustomView = globalViews?.CustomView
    DefaultView = globalViews?.DefaultView

    if (!CustomView && !DefaultView) {
      return notFound()
    }

    data = await payload.findGlobal({
      slug: globalSlug,
      depth: 0,
      locale: locale.code,
      user,
    })

    preferencesKey = `global-${globalSlug}`
  }

  const { docs: [{ value: docPreferences } = { value: null }] = [] } = (await payload.find({
    collection: 'payload-preferences',
    depth: 0,
    limit: 1,
    where: {
      key: {
        equals: preferencesKey,
      },
    },
  })) as any as { docs: { value: DocumentPreferences }[] }

  const initialState = await buildStateFromSchema({
    id,
    data: data || {},
    fieldSchema: formatFields(fields, isEditing),
    operation: isEditing ? 'update' : 'create',
    preferences: docPreferences,
    req,
  })

  const formQueryParams: QueryParamTypes = {
    depth: 0,
    'fallback-locale': 'null',
    locale: locale.code,
    uploadEdits: undefined,
  }

  const componentProps: ServerSideEditViewProps = {
    id,
    action: `${action}?${queryString.stringify(formQueryParams)}`,
    apiURL,
    canAccessAdmin: permissions?.canAccessAdmin,
    collectionConfig,
    collectionSlug,
    config,
    data,
    docPermissions,
    docPreferences,
    globalConfig,
    globalSlug,
    hasSavePermission,
    i18n,
    initialState,
    isEditing,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    updatedAt: data?.updatedAt?.toString(),
    user,
  }

  return (
    <Fragment>
      <HydrateClientUser permissions={permissions} user={user} />
      <SetDocumentInfo
        action={action}
        apiURL={apiURL}
        collectionSlug={collectionConfig?.slug}
        disableActions={false}
        docPermissions={docPermissions}
        docPreferences={docPreferences}
        globalSlug={globalConfig?.slug}
        hasSavePermission={hasSavePermission}
        id={id}
        initialData={data}
        initialState={initialState}
      />
      <EditDepthProvider depth={1} key={`${collectionSlug || globalSlug}-${locale.code}`}>
        <FormQueryParamsProvider formQueryParams={formQueryParams}>
          <RenderCustomComponent
            CustomComponent={typeof CustomView === 'function' ? CustomView : undefined}
            DefaultComponent={DefaultView}
            componentProps={componentProps}
          />
        </FormQueryParamsProvider>
      </EditDepthProvider>
    </Fragment>
  )
}
