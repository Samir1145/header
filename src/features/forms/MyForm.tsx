import { useState } from 'react';
import { withTheme, IChangeEvent } from '@rjsf/core';
import { Theme as Mui5Theme } from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { JSONSchema7 } from 'json-schema';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Button from '@/components/ui/Button';
import useTheme from '@/hooks/useTheme';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const Form = withTheme(Mui5Theme);

interface MyFormProps {
  schema: JSONSchema7;
  uiSchema?: any;
  formData: any;
  setFormData: (data: any) => void;
}

export default function MyForm({ schema, uiSchema, formData, setFormData }: MyFormProps) {
  const { theme } = useTheme(); // 'dark' or 'light'
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const muiTheme = createTheme({
    palette: {
      mode: theme === 'dark' ? 'dark' : 'light',
    },
  });

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
        formName: 'FastTrackClaimFormA',
        submittedBy: user?.uid || 'anonymous',
        submittedAt: Timestamp.now(),
        rawFormData: JSON.stringify(formData),
      };

      await addDoc(collection(db, 'form_submissions'), metadata);
      setSubmitMsg('✅ Data submitted to Firebase Firestore!');
    } catch (err) {
      console.error('Firestore submission error:', err);
      setSubmitMsg('❌ Submission failed!');
    }

    setSubmitting(false);
  };

  const customUiSchema = {
    ...uiSchema,
    'ui:submitButtonOptions': { norender: true },
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div >
        <Form
          schema={schema}
          uiSchema={customUiSchema}
          validator={validator}
          formData={formData}
          onChange={handleChange}
          showErrorList="bottom"
        />
        <Button
          type="button"
          onClick={handleSubmitOnline}
          disabled={submitting}
          variant="default"
        >
          {submitting ? 'Sending...' : 'Submit to Firestore'}
        </Button>
        {submitMsg && (
          <div style={{ marginTop: 12, color: submitMsg.startsWith('✅') ? 'green' : 'red' }}>
            {submitMsg}
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
