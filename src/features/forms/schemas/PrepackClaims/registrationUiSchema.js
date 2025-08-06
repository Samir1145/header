const registrationUiSchema = {
  "firstName": {
    "ui:autofocus": true,
    "ui:emptyValue": "",
    "ui:placeholder": "Enter your first name",
    "ui:autocomplete": "given-name",
    "ui:enableMarkdownInDescription": true,
    "ui:description": "Make text **bold** or *italic*. You can use Markdown here."
  },
  "lastName": {
    "ui:autocomplete": "family-name",
    "ui:enableMarkdownInDescription": true,
    "ui:description": "This is your family name. *Required field*."
  },
  "email": {
    "ui:widget": "email",
    "ui:placeholder": "your@email.com",
    "ui:help": "We'll never share your email."
  }
};

export default registrationUiSchema;
