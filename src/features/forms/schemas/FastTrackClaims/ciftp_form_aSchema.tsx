const ciftp_form_aSchema = {
  "title": "FORM A - Public Announcement",
  "description": "Insolvency Resolution Process Form",
  "type": "object",
  "properties": {
    "creditor_attention": {
      "type": "string",
      "title": "For the attention of creditors of"
    },
    "debtor_name": {
      "type": "string",
      "title": "Name of Corporate Debtor"
    },
    "incorporation_date": {
      "type": "string",
      "format": "date",
      "title": "Date of Incorporation"
    },
    "authority": {
      "type": "string",
      "title": "Incorporation Authority"
    },
    "corporate_id": {
      "type": "string",
      "title": "Corporate Identity Number"
    },
    "registered_address": {
      "type": "string",
      "title": "Registered Office Address"
    },
    "insolvency_date": {
      "type": "string",
      "format": "date",
      "title": "Insolvency Commencement Date"
    },
    "closure_date": {
      "type": "string",
      "format": "date",
      "title": "Estimated Closure Date"
    },
    "professional_name": {
      "type": "string",
      "title": "IRP Name"
    },
    "professional_address": {
      "type": "string",
      "title": "IRP Address"
    },
    "professional_email": {
      "type": "string",
      "format": "email",
      "title": "IRP Email"
    },
    "professional_reg_no": {
      "type": "string",
      "title": "IRP Registration Number"
    },
    "last_submission_date": {
      "type": "string",
      "format": "date",
      "title": "Last Date for Claim Submission"
    },
    "signature_name": {
      "type": "string",
      "title": "IRP Signature Name"
    },
    "signature": {
      "type": "string",
      "title": "IRP Signature"
    },
    "signature_date": {
      "type": "string",
      "format": "date",
      "title": "Signature Date"
    },
    "signature_place": {
      "type": "string",
      "title": "Signature Place"
    }
  },
  "required": [
    "creditor_attention",
    "debtor_name",
    "incorporation_date",
    "authority",
    "corporate_id",
    "registered_address",
    "insolvency_date",
    "closure_date",
    "professional_name",
    "professional_address",
    "professional_email",
    "professional_reg_no",
    "last_submission_date",
    "signature_name",
    "signature",
    "signature_date",
    "signature_place"
  ]
};

export default ciftp_form_aSchema;
