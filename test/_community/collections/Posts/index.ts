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
      name: 'answers',
      label: 'Answers',
      type: 'array',
      defaultValue: [{}, {}],
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'answerResult',
              label: 'Answer result',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
}
