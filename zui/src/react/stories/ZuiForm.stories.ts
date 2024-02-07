import type { Meta, StoryObj } from '@storybook/react'
import { ZuiForm, defaultZuiExtension } from '..'
import { defaultExtensions } from '../../uiextensions'
import { Zui, zui as zuiImport } from '../../zui'

const meta = {
  title: 'Form/Example',
  component: ZuiForm<typeof defaultExtensions>,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
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
      scope: '#/properties/firstName',
    }),
    lastName: zui.string().displayAs('textbox', {
      scope: '#/properties/lastName',
    }),
    birthday: zui.string().displayAs('datetimeinput', {
      type: 'date',
      scope: '#/properties/birthday',
    }),
    email: zui.string().displayAs('textbox', {
      scope: '#/properties/email',
    }),
    password: zui.string().displayAs('textbox', {
      scope: '#/properties/password',
    }),
    passwordConfirm: zui.string().displayAs('textbox', {
      scope: '#/properties/passwordConfirm',
    }),
  })
  .displayAs('horizontalLayout', undefined)

export const ExampleSchema: Story = {
  args: {
    schema: exampleSchema.toJsonSchema(),
    components: defaultZuiExtension,
  },
}

export default meta
