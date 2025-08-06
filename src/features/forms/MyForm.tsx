import React, { useState } from 'react';
import { withTheme, FormProps, IChangeEvent } from '@rjsf/core';
import { Theme as Mui5Theme } from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const Form = withTheme(Mui5Theme);

interface MyFormProps {
  schema: JSONSchema7;
  uiSchema?: any;
  formData: any;
  setFormData: (data: any) => void;
}

export default function MyForm({ schema, uiSchema, formData, setFormData }: MyFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const handleChange = ({ formData }: IChangeEvent<any>) => {
    setFormData(formData);
  };

  const handleSubmitOnline = async () => {
  setSubmitting(true);
  setSubmitMsg('');

  try {
    const auth = getAuth();
    const user = auth.currentUser;

    const metadata = {
      formName: 'FastTrackClaimFormA', // set your form name
      submittedBy: user?.uid || 'anonymous', // or user?.email
      submittedAt: Timestamp.now(),
      rawFormData: JSON.stringify(formData), // stringified full form data
    };

    await addDoc(collection(db, 'form_submissions'), metadata);

    setSubmitMsg('✅ Data submitted to Firebase Firestore!');
  } catch (err) {
    console.error('Firestore submission error:', err);
    setSubmitMsg('❌ Submission failed!');
  }

  setSubmitting(false);
};

  // const handleSubmitOnline = async () => {
  //   setSubmitting(true);
  //   setSubmitMsg('');
  //   try {
  //     const response = await fetch(
  //       'https://script.google.com/a/macros/chatibc.com/s/AKfycbyzl8tff2TAgDFbD8_qnrAdZeY6QORnElMkmJvczzYt3x3oXehPQOmja9UQUFV4MUrwbw/exec',
  //       {
  //         method: 'POST',
  //         body: JSON.stringify(formData),
  //         headers: { 'Content-Type': 'application/json' },
  //       }
  //     );
  //     if (response.ok) {
  //       setSubmitMsg('✅ Data sent to Google Sheet and email sent successfully!');
  //     } else {
  //       setSubmitMsg('❌ Submission failed!');
  //     }
  //   } catch (err) {
  //     setSubmitMsg('❌ Submission failed!');
  //   }
  //   setSubmitting(false);
  // };

  // Hide default submit button
  const customUiSchema = {
    ...uiSchema,
    'ui:submitButtonOptions': { norender: true },
  };

  return (
    <div>
      <Form
        schema={schema}
        uiSchema={customUiSchema}
        validator={validator}
        formData={formData}
        onChange={handleChange}
        showErrorList="bottom"
      />
      <button
        type="button"
        onClick={handleSubmitOnline}
        disabled={submitting}
        style={{
          marginTop: 16,
          background: '#1976d2',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: 4,
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        {submitting ? 'Sending...' : 'Submit to Firestore'}
      </button>
      {submitMsg && (
        <div style={{ marginTop: 12, color: submitMsg.startsWith('✅') ? 'green' : 'red' }}>
          {submitMsg}
        </div>
      )}
    </div>
  );
}
