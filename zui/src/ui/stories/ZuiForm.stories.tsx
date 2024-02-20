import type { Meta, StoryObj } from '@storybook/react'
import { ZuiForm } from '..'
import { defaultExtensions, resolverOverrides } from '../defaultextension'
import { componentMap, exampleSchema } from './example'

const meta = {
  title: 'Form/Example',
  component: ZuiForm<typeof defaultExtensions>,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ZuiForm<typeof defaultExtensions>>

type Story = StoryObj<typeof meta>

export const ExampleSchema: Story = {
  args: {
    schema: exampleSchema.toJsonSchema({
      target: 'openApi3',
    }),
    overrides: resolverOverrides,
    components: componentMap,
  },
}

export default meta
