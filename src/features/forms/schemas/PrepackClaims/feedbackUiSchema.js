const feedbackUiSchema = {
  "name": {
    "ui:autofocus": true,
    "ui:placeholder": "Enter your full name"
  },
  "email": {
    "ui:widget": "email",
    "ui:placeholder": "your@email.com",
    "ui:help": "We'll only use your email to respond to your feedback."
  },
  "rating": {
    "ui:widget": "updown",
    "ui:help": "Rate us from 1 (worst) to 5 (best)"
  },
  "feedback": {
    "ui:widget": "textarea",
    "ui:placeholder": "Type your feedback here..."
  },
  "subscribe": {
    "ui:widget": "checkbox"
  }
};

export default feedbackUiSchema;
