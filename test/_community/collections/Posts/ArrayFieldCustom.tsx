'use client'

import type { ArrayFieldClientProps } from 'payload'

import React from 'react'
// eslint-disable-next-line payload/no-relative-monorepo-imports
import { ArrayField } from '../../../../packages/ui/src/fields/Array/index.js' // Update the path to the ArrayField component

export const ArrayFieldCustom = (props: ArrayFieldClientProps) => {
  return (
    <>
      <ArrayField {...props} />
    </>
  )
}
