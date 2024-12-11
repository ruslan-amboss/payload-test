import type { CollectionConfig } from 'payload'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      type: 'array',
      name: 'testPayload',
      admin: {
        components: {
          Field: './collections/Posts/ArrayFieldCustom.tsx#ArrayFieldCustom', // make sure the path is correct
        },
      },
      fields: [
        {
          name: 'itemName',
          type: 'text',
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
