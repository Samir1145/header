const feedbackSchema = {
  "title": "Feedback Form",
  "description": "We value your feedback. Please fill out the form below.",
  "type": "object",
  "required": ["name", "email", "feedback"],
  "properties": {
    "name": {
      "type": "string",
      "title": "Your Name"
    },
    "email": {
      "type": "string",
      "title": "Email",
      "format": "email"
    },
    "rating": {
      "type": "integer",
      "title": "Rating (1-5)",
      "minimum": 1,
      "maximum": 5,
      "default": 5
    },
    "feedback": {
      "type": "string",
      "title": "Your Feedback"
    },
    "subscribe": {
      "type": "boolean",
      "title": "Subscribe to updates?"
    }
  }
};

export default feedbackSchema;
