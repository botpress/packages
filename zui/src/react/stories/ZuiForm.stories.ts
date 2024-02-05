import type { Meta, StoryObj } from '@storybook/react'
import { ZuiForm, defaultComponentLibrary } from '../index'
import { Zui, zui as zuiImport } from '../../zui'
import { defaultExtensions } from '../defaults'

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

const exampleSchema = zui.object({
  firstName: zui.string().displayAs('textbox', {
    name: 'firstName',
    type: 'text',
    required: true,
    placeholder: 'First Name',
  }),
  lastName: zui.string().displayAs('textbox', {
    name: 'lastName',
    type: 'text',
    required: true,
    placeholder: 'Last Name',
  }),
  birthday: zui.string().displayAs('datetimeinput', {
    name: 'birthday',
    type: 'date',
    required: true,
  }),
  email: zui.string().displayAs('textbox', {
    name: 'email',
    type: 'email',
    required: true,
    placeholder: 'Email',
  }),
  password: zui.string().displayAs('textbox', {
    name: 'password',
    type: 'password',
    required: true,
    placeholder: 'Password',
  }),
  passwordConfirm: zui.string().displayAs('textbox', {
    name: 'passwordConfirm',
    type: 'password',
    required: true,
    placeholder: 'Confirm Password',
  }),
  planType: zui.string().displayAs('select', {
    name: 'planType',
    required: true,
    default: 'premium',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'premium', label: 'Premium' },
      { value: 'enterprise', label: 'Enterprise' }
    ],
  }).nonempty(),
  location: zui.object({
    street: zui.string().displayAs('textbox', {
      name: 'street',
      type: 'text',
      required: true,
      placeholder: 'Street',
    }),
    city: zui.string().displayAs('textbox', {
      name: 'city',
      type: 'text',
      required: true,
      placeholder: 'City',
    }),
    state: zui.string().displayAs('textbox', {
      name: 'state',
      type: 'text',
      required: true,
      placeholder: 'State',
    }),
    zip: zui.string().displayAs('textbox', {
      name: 'zip',
      type: 'text',
      required: true,
      placeholder: 'Zip',
    }),
    gps: zui.object({
      lat: zui.number().displayAs('numberinput', {
        name: 'lat',
        type: 'number',
        placeholder: 'Latitude',
        required: true,
        default: 0,
        min: -90,
      }),
      lon: zui.number().displayAs('numberinput', {
        name: 'lon',
        type: 'number',
        placeholder: 'Longitude',
        required: true,
        default: 0,
        min: -180,
      }),
    })
  })
})

export const ExampleSchema: Story = {
  args: {
    components: defaultComponentLibrary,
    schema: exampleSchema.toJsonSchema(),
  },
}

export default meta
