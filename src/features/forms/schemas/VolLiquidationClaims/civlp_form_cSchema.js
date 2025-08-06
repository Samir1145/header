const civlpFormCSchema = {
  "title": "Proof of Claim by Financial Creditors",
  "description": "Form for submission of proof of claim in voluntary liquidation under the Insolvency and Bankruptcy Code, 2016.",
  "type": "object",
  "required": [
    "date",
    "liquidator_name",
    "liquidator_address",
    "creditor_name_address",
    "corporate_person",
    "financial_creditor_name",
    "identification_number",
    "correspondence_address_email",
    "total_amount",
    "nature_of_claim",
    "bank_account_details",
    "supporting_documents",
    "signatory_name",
    "signatory_position",
    "signatory_address",
    "deponent_name",
    "deponent_address",
    "liquidation_date",
    "affidavit_amount",
    "consideration",
    "affidavit_documents",
    "affirmed_at",
    "affirmed_on",
    "deponent_signature",
    "verification_place",
    "verification_date",
    "verification_signature"
  ],
  "properties": {
    "date": {
      "type": "string",
      "format": "date",
      "title": "Date"
    },
    "liquidator_name": {
      "type": "string",
      "title": "Name of the Liquidator"
    },
    "liquidator_address": {
      "type": "string",
      "title": "Address of Liquidator"
    },
    "creditor_name_address": {
      "type": "string",
      "title": "Name and Address of Financial Creditor"
    },
    "corporate_person": {
      "type": "string",
      "title": "Name of Corporate Person"
    },
    "financial_creditor_name": {
      "type": "string",
      "title": "Name of Financial Creditor"
    },
    "identification_number": {
      "type": "string",
      "title": "Identification Number/Proof"
    },
    "correspondence_address_email": {
      "type": "string",
      "title": "Address and Email for Correspondence"
    },
    "total_amount": {
      "type": "string",
      "title": "Total Amount of Claim (with Interest)"
    },
    "nature_of_claim": {
      "type": "string",
      "title": "Nature of Claim"
    },
    "court_order_details": {
      "type": "string",
      "title": "Details of Court/Tribunal Order",
      "default": ""
    },
    "debt_details": {
      "type": "string",
      "title": "Details of How and When Debt Incurred",
      "default": ""
    },
    "mutual_details": {
      "type": "string",
      "title": "Details of Mutual Credit/Debts/Dealings",
      "default": ""
    },
    "security_details": {
      "type": "string",
      "title": "Details of Security Held",
      "default": ""
    },
    "security_value": {
      "type": "string",
      "title": "Value of Security",
      "default": ""
    },
    "security_date": {
      "type": "string",
      "format": "date",
      "title": "Date Security Given",
      "default": ""
    },
    "assignment_details": {
      "type": "string",
      "title": "Details of Assignment/Transfer of Debt",
      "default": ""
    },
    "bank_account_details": {
      "type": "string",
      "title": "Bank Account Details"
    },
    "supporting_documents": {
      "type": "string",
      "title": "List of Documents in Support"
    },
    "signatory_name": {
      "type": "string",
      "title": "Name (BLOCK LETTERS)"
    },
    "signatory_position": {
      "type": "string",
      "title": "Position"
    },
    "signatory_address": {
      "type": "string",
      "title": "Address"
    },
    "deponent_name": {
      "type": "string",
      "title": "Name of Deponent"
    },
    "deponent_address": {
      "type": "string",
      "title": "Address of Deponent"
    },
    "liquidation_date": {
      "type": "string",
      "format": "date",
      "title": "Liquidation Commencement Date"
    },
    "affidavit_amount": {
      "type": "string",
      "title": "Amount Claimed (Rs.)"
    },
    "consideration": {
      "type": "string",
      "title": "Consideration"
    },
    "affidavit_documents": {
      "type": "string",
      "title": "Documents Relied On"
    },
    "affidavit_mutual": {
      "type": "string",
      "title": "Mutual Dealings for Set-off",
      "default": ""
    },
    "affirmed_at": {
      "type": "string",
      "title": "Affirmed at"
    },
    "affirmed_on": {
      "type": "string",
      "format": "date",
      "title": "Affirmed on (Date)"
    },
    "deponent_signature": {
      "type": "string",
      "title": "Deponent's Signature"
    },
    "verification_place": {
      "type": "string",
      "title": "Verification Place"
    },
    "verification_date": {
      "type": "string",
      "format": "date",
      "title": "Verification Date"
    },
    "verification_signature": {
      "type": "string",
      "title": "Verification Signature"
    }
  }
};

export default civlpFormCSchema;
