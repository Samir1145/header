import React from "react";

type FormData = {
  creditor_attention?: string;
  debtor_name?: string;
  incorporation_date?: string;
  authority?: string;
  corporate_id?: string;
  registered_address?: string;
  insolvency_date?: string;
  closure_date?: string;
  professional_name?: string;
  professional_address?: string;
  professional_email?: string;
  professional_reg_no?: string;
  last_submission_date?: string;
  signature_name?: string;
  signature?: string;
  signature_date?: string;
  signature_place?: string;
};

type FormAPreviewProps = {
  formData?: FormData;
};

export default function FormAPreview({ formData = {} }: FormAPreviewProps) {
  const getValue = (value?: string) => value || <em>Not provided</em>;

  return (
    <div style={{ padding: 24, fontFamily: "serif" }}>
      <h3 style={{ textAlign: "center", textTransform: "uppercase" }}>
        FORM A<br />
        Public Announcement
      </h3>
      <p style={{ textAlign: "center" }}>
        (Under Regulation 6 of the Insolvency and Bankruptcy Board of India
        (Insolvency Resolution Process for Corporate Persons) Regulations, 2016)
      </p>
      <h4 style={{ textAlign: "center" }}>
        For the Attention of the Creditors of{" "}
        <strong>{getValue(formData.creditor_attention)}</strong>
      </h4>

      <table
        border={1}
        cellPadding={6}
        style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}
      >
        <thead>
          {/* <tr>
            
            <th colSpan={2} style={{ textAlign: "center" }}>
              Relevant Particulars
            </th>
          </tr> */}
           <tr>
      <th style={{ width: "80%", textAlign: "center" }}>Particulars</th>
      <th style={{ width: "20%", textAlign: "center" }}>Details</th>
    </tr>
        </thead>
        <tbody>
          <tr>
            <td>1. Name of corporate debtor</td>
            <td>{getValue(formData.debtor_name)}</td>
          </tr>
          <tr>
            <td>2. Date of incorporation of corporate debtor</td>
            <td>{getValue(formData.incorporation_date)}</td>
          </tr>
          <tr>
            <td>3. Authority under which corporate debtor is incorporated / registered</td>
            <td>{getValue(formData.authority)}</td>
          </tr>
          <tr>
            <td>4. Corporate Identity No. / Limited Liability Identification No.</td>
            <td>{getValue(formData.corporate_id)}</td>
          </tr>
          <tr>
            <td>5. Address of the registered office and principal office (if any)</td>
            <td>{getValue(formData.registered_address)}</td>
          </tr>
          <tr>
            <td>6. Insolvency commencement date</td>
            <td>{getValue(formData.insolvency_date)}</td>
          </tr>
          <tr>
            <td>7. Estimated date of closure of insolvency resolution process</td>
            <td>{getValue(formData.closure_date)}</td>
          </tr>
          <tr>
            <td>8. Name and registration number of the insolvency professional</td>
            <td>
              {getValue(formData.professional_name)} <br />
              Reg No: {getValue(formData.professional_reg_no)}
            </td>
          </tr>
          <tr>
            <td>9. Address and e-mail of the interim resolution professional</td>
            <td>
              {getValue(formData.professional_address)} <br />
              Email: {getValue(formData.professional_email)}
            </td>
          </tr>
          <tr>
            <td>10. Address for submission of claims</td>
            <td>{getValue(formData.professional_address)}</td>
          </tr>
          <tr>
            <td>11. Last date for submission of claims</td>
            <td>{getValue(formData.last_submission_date)}</td>
          </tr>
          <tr>
            <td>12. Classes of creditors (if any)</td>
            <td><em>To be filled based on classes</em></td>
          </tr>
          <tr>
            <td>13. Names of Insolvency Professionals identified as Authorised Representatives</td>
            <td><em>To be filled based on assignment</em></td>
          </tr>
          <tr>
            <td>14. (a) Relevant Forms and (b) Authorised representative details</td>
            <td>
              (a) Web link: <em>To be provided</em><br />
              (b) Email: <em>To be provided</em>
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginTop: 20 }}>
        Notice is hereby given that the National Company Law Tribunal has
        ordered the commencement of a corporate insolvency resolution process of
        the [name of the corporate debtor] on the date mentioned above.
      </p>

      <p>
        The creditors of {getValue(formData.debtor_name)} are hereby called upon to submit
        their claims with proof on or before{" "}
        <strong>{getValue(formData.last_submission_date)}</strong> to the interim
        resolution professional at the address mentioned above.
      </p>

      <p>Submission of false or misleading proofs of claim shall attract penalties.</p>

      <p style={{ marginTop: 40 }}>
        Name and Signature of Interim Resolution Professional:
      </p>
      <p>
        <strong>{getValue(formData.signature_name)}</strong>
        <br />
        Signature: {getValue(formData.signature)}
        <br />
        Date: {getValue(formData.signature_date)}
        <br />
        Place: {getValue(formData.signature_place)}
      </p>
    </div>
  );
}
