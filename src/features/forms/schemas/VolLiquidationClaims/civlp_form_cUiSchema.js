const civlpFormCUiSchema = {
  "date": {
    "ui:widget": "alt-date",
    "ui:autofocus": true,
    "ui:placeholder": "Select the date of submission"
  },
  "liquidator_name": {
    "ui:placeholder": "Enter the name of the liquidator",
    "ui:description": "Name as set out in the public announcement"
  },
  "liquidator_address": {
    "ui:widget": "textarea",
    "ui:placeholder": "Enter the address of the liquidator"
  },
  "creditor_name_address": {
    "ui:widget": "textarea",
    "ui:placeholder": "Enter the name and address of the financial creditor"
  },
  "corporate_person": {
    "ui:placeholder": "Enter the corporate person's name"
  },
  "financial_creditor_name": {
    "ui:placeholder": "Enter the financial creditor's name"
  },
  "identification_number": {
    "ui:placeholder": "PAN, Passport, AADHAAR, or Election ID"
  },
  "correspondence_address_email": {
    "ui:widget": "textarea",
    "ui:placeholder": "Enter address and email for correspondence"
  },
  "total_amount": {
    "ui:placeholder": "Enter total claim amount (with interest)"
  },
  "nature_of_claim": {
    "ui:placeholder": "Term loan, secured, unsecured, etc."
  },
  "court_order_details": {
    "ui:widget": "textarea",
    "ui:placeholder": "Details of any court or tribunal order (if any)"
  },
  "debt_details": {
    "ui:widget": "textarea",
    "ui:placeholder": "How and when was the debt incurred?"
  },
  "mutual_details": {
    "ui:widget": "textarea",
    "ui:placeholder": "Details of mutual credit/debts/dealings (if any)"
  },
  "security_details": {
    "ui:widget": "textarea",
    "ui:placeholder": "Describe any security held"
  },
  "security_value": {
    "ui:placeholder": "Value of the security (if any)"
  },
  "security_date": {
    "ui:widget": "alt-date",
    "ui:placeholder": "Date when security was given"
  },
  "assignment_details": {
    "ui:widget": "textarea",
    "ui:placeholder": "Details of assignment/transfer of debt (if any)"
  },
  "bank_account_details": {
    "ui:widget": "textarea",
    "ui:placeholder": "Bank account details for receiving proceeds"
  },
  "supporting_documents": {
    "ui:widget": "textarea",
    "ui:placeholder": "List and attach supporting documents"
  },
  "signatory_name": {
    "ui:placeholder": "Name in BLOCK LETTERS"
  },
  "signatory_position": {
    "ui:placeholder": "Position with or in relation to creditor"
  },
  "signatory_address": {
    "ui:widget": "textarea",
    "ui:placeholder": "Address of person signing"
  },
  "deponent_name": {
    "ui:placeholder": "Enter name of deponent"
  },
  "deponent_address": {
    "ui:widget": "textarea",
    "ui:placeholder": "Enter address of deponent"
  },
  "liquidation_date": {
    "ui:widget": "alt-date",
    "ui:placeholder": "Liquidation commencement date"
  },
  "affidavit_amount": {
    "ui:placeholder": "Amount claimed (Rs.)"
  },
  "consideration": {
    "ui:placeholder": "State consideration for the claim"
  },
  "affidavit_documents": {
    "ui:widget": "textarea",
    "ui:placeholder": "Documents relied on as evidence"
  },
  "affidavit_mutual": {
    "ui:widget": "textarea",
    "ui:placeholder": "Mutual dealings for set-off (if any)"
  },
  "affirmed_at": {
    "ui:placeholder": "Place where affidavit is affirmed"
  },
  "affirmed_on": {
    "ui:widget": "alt-date",
    "ui:placeholder": "Date of affirmation"
  },
  "deponent_signature": {
    "ui:placeholder": "Signature of deponent"
  },
  "verification_place": {
    "ui:placeholder": "Verification place"
  },
  "verification_date": {
    "ui:widget": "alt-date",
    "ui:placeholder": "Verification date"
  },
  "verification_signature": {
    "ui:placeholder": "Deponent's signature"
  }
};

export default civlpFormCUiSchema;
