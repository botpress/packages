import type { Meta, StoryObj } from '@storybook/react'
import { ZuiForm } from '..'
import { defaultExtensionComponents } from '../defaultextension'
import { defaultExtensions } from '../defaultextension'
import { Zui, zui as zuiImport } from '../../zui'
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers'

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

const zui = zuiImport as Zui<typeof defaultExtensions>

const exampleSchema = zui
  .object({
    firstName: zui.string().displayAs('textbox', {
      label: 'First Name',
    }),
    lastName: zui.string().displayAs('textbox', {}),
    birthday: zui.string().displayAs('datetimeinput', {
      type: 'date',
    }),
    email: zui.string().displayAs('textbox', {}).title('Email Address'),
    password: zui.string().displayAs('textbox', {}),
    passwordConfirm: zui.string().displayAs('textbox', {}),
  })
  .displayAs('group', {
    label: 'User Information',
  })

export const ExampleSchema: Story = {
  args: {
    schema: exampleSchema.toJsonSchema(),
    components: defaultExtensionComponents,
    renderers: vanillaRenderers,
    cells: vanillaCells,
  },
}

export default meta
