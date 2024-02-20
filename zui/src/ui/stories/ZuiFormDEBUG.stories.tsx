import type { Meta, StoryObj } from '@storybook/react'
import { defaultExtensions, resolverOverrides } from '../defaultextension'
import { ZuiFormDEBUG } from '../debugger'
import { exampleSchema } from './exampleschema'
import { componentMap } from './ZuiForm.stories'

const meta = {
  title: 'Form/DEBUG',
  component: ZuiFormDEBUG<typeof defaultExtensions>,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ZuiFormDEBUG<typeof defaultExtensions>>

type Story = StoryObj<typeof meta>

export const ExampleSchema: Story = {
  args: {
    schema: exampleSchema.toJsonSchema({
      target: 'openApi3',
    }),
    overrides: resolverOverrides,
    components: componentMap,
    fullscreen: false,
  },
}

export default meta
