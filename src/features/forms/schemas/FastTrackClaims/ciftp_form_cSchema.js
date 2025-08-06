const registrationSchema = {
  "title": "Registration Form",
  "type": "object",
  "required": ["firstName", "lastName"],
  "properties": {
    "firstName": { "type": "string", "title": "First name" },
    "lastName": { "type": "string", "title": "Last name" },
    "email": { "type": "string", "title": "Email" }
  }
};
export default registrationSchema;
