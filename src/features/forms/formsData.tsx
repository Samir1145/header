// Fast Track Process
import ciftpFormASchema from './schemas/FastTrackClaims/ciftp_form_aSchema';
import ciftpFormAUiSchema from './schemas/FastTrackClaims/ciftp_form_aUiSchema';
// import ciftpFormBSchema from './schemas/FastTrackClaims/ciftp_form_bSchema';
// import ciftpFormBUiSchema from './schemas/FastTrackClaims/ciftp_form_bUiSchema';
// import ciftpFormCSchema from './schemas/FastTrackClaims/ciftp_form_cSchema';
// import ciftpFormCUiSchema from './schemas/FastTrackClaims/ciftp_form_cUiSchema';
// import ciftpFormDSchema from './schemas/FastTrackClaims/ciftp_form_dSchema';
// import ciftpFormDUiSchema from './schemas/FastTrackClaims/ciftp_form_dUiSchema';
// import ciftpFormESchema from './schemas/FastTrackClaims/ciftp_form_eSchema';
// import ciftpFormEUiSchema from './schemas/FastTrackClaims/ciftp_form_eUiSchema';
// import ciftpFormFSchema from './schemas/FastTrackClaims/ciftp_form_fSchema';
// import ciftpFormFUiSchema from './schemas/FastTrackClaims/ciftp_form_fUiSchema';

// // Guarantor Process
// import feedbackSchemaGuarantor from './schemas/GuarantorClaims/feedbackSchema';
// import feedbackUiSchemaGuarantor from './schemas/GuarantorClaims/feedbackUiSchema';
// import registrationSchemaGuarantor from './schemas/GuarantorClaims/registrationSchema';
// import registrationUiSchemaGuarantor from './schemas/GuarantorClaims/registrationUiSchema';

// // Liquidation Process
// import cilpFormCSchema from './schemas/LiquidationClaims/cilp_form_cSchema';
// import cilpFormCUiSchema from './schemas/LiquidationClaims/cilp_form_cUiSchema';
// import cilpFormDSchema from './schemas/LiquidationClaims/cilp_form_dSchema';
// import cilpFormDUiSchema from './schemas/LiquidationClaims/cilp_form_dUiSchema';
// import cilpFormESchema from './schemas/LiquidationClaims/cilp_form_eSchema';
// import cilpFormEUiSchema from './schemas/LiquidationClaims/cilp_form_eUiSchema';
// import cilpFormFSchema from './schemas/LiquidationClaims/cilp_form_fSchema';
// import cilpFormFUiSchema from './schemas/LiquidationClaims/cilp_form_fUiSchema';
// import cilpFormGSchema from './schemas/LiquidationClaims/cilp_form_gSchema';
// import cilpFormGUiSchema from './schemas/LiquidationClaims/cilp_form_gUiSchema';

// // Prepack Process
// import feedbackSchemaPrepack from './schemas/PrepackClaims/feedbackSchema';
// import feedbackUiSchemaPrepack from './schemas/PrepackClaims/feedbackUiSchema';
// import registrationSchemaPrepack from './schemas/PrepackClaims/registrationSchema';
// import registrationUiSchemaPrepack from './schemas/PrepackClaims/registrationUiSchema';

// // Resolution Process
// import cirpFormBSchema from './schemas/ResolutionClaims/cirp_form_bSchema';
// import cirpFormBUiSchema from './schemas/ResolutionClaims/cirp_form_bUiSchema';
// import cirpFormCaSchema from './schemas/ResolutionClaims/cirp_form_caSchema';
// import cirpFormCaUiSchema from './schemas/ResolutionClaims/cirp_form_caUiSchema';
// import cirpFormCSchema from './schemas/ResolutionClaims/cirp_form_cSchema';
// import cirpFormCUiSchema from './schemas/ResolutionClaims/cirp_form_cUiSchema';
// import cirpFormDSchema from './schemas/ResolutionClaims/cirp_form_dSchema';
// import cirpFormDUiSchema from './schemas/ResolutionClaims/cirp_form_dUiSchema';
// import cirpFormESchema from './schemas/ResolutionClaims/cirp_form_eSchema';
// import cirpFormEUiSchema from './schemas/ResolutionClaims/cirp_form_eUiSchema';
// import cirpFormFSchema from './schemas/ResolutionClaims/cirp_form_fSchema';
// import cirpFormFUiSchema from './schemas/ResolutionClaims/cirp_form_fUiSchema';

// // Vol Liquidation Process
// import civlpFormCSchema from './schemas/VolLiquidationClaims/civlp_form_cSchema';
// import civlpFormCUiSchema from './schemas/VolLiquidationClaims/civlp_form_cUiSchema';
// import civlpFormDSchema from './schemas/VolLiquidationClaims/civlp_form_dSchema';
// import civlpFormDUiSchema from './schemas/VolLiquidationClaims/civlp_form_dUiSchema';
// import civlpFormESchema from './schemas/VolLiquidationClaims/civlp_form_eSchema';
// import civlpFormEUiSchema from './schemas/VolLiquidationClaims/civlp_form_eUiSchema';
// import civlpFormFSchema from './schemas/VolLiquidationClaims/civlp_form_fSchema';
// import civlpFormFUiSchema from './schemas/VolLiquidationClaims/civlp_form_fUiSchema';

export const formsTree = [
      {
        type: 'folder',
        title: 'Fast Track Claims',
        children: [
          {
            type: 'form',
            id: 'ciftp_form_a',
            title: 'CIFTP Form A',
            schema: ciftpFormASchema,
            uiSchema: ciftpFormAUiSchema,
          },
      //     {
      //       type: 'form',
      //       id: 'ciftp_form_b',
      //       title: 'CIFTP Form B',
      //       schema: ciftpFormBSchema,
      //       uiSchema: ciftpFormBUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'ciftp_form_c',
      //       title: 'CIFTP Form C',
      //       schema: ciftpFormCSchema,
      //       uiSchema: ciftpFormCUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'ciftp_form_d',
      //       title: 'CIFTP Form D',
      //       schema: ciftpFormDSchema,
      //       uiSchema: ciftpFormDUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'ciftp_form_e',
      //       title: 'CIFTP Form E',
      //       schema: ciftpFormESchema,
      //       uiSchema: ciftpFormEUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'ciftp_form_f',
      //       title: 'CIFTP Form F',
      //       schema: ciftpFormFSchema,
      //       uiSchema: ciftpFormFUiSchema,
      //     },
      //   ],
      // },
      // {
      //   type: 'folder',
      //   title: 'Guarantor Claims',
      //   children: [
      //     {
      //       type: 'form',
      //       id: 'feedback_guarantor',
      //       title: 'Feedback',
      //       schema: feedbackSchemaGuarantor,
      //       uiSchema: feedbackUiSchemaGuarantor,
      //     },
      //     {
      //       type: 'form',
      //       id: 'registration_guarantor',
      //       title: 'Registration',
      //       schema: registrationSchemaGuarantor,
      //       uiSchema: registrationUiSchemaGuarantor,
      //     },
      //   ],
      // },
      // {
      //   type: 'folder',
      //   title: 'Liquidation Claims',
      //   children: [
      //     {
      //       type: 'form',
      //       id: 'cilp_form_c',
      //       title: 'CILP Form C',
      //       schema: cilpFormCSchema,
      //       uiSchema: cilpFormCUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'cilp_form_d',
      //       title: 'CILP Form D',
      //       schema: cilpFormDSchema,
      //       uiSchema: cilpFormDUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'cilp_form_e',
      //       title: 'CILP Form E',
      //       schema: cilpFormESchema,
      //       uiSchema: cilpFormEUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'cilp_form_f',
      //       title: 'CILP Form F',
      //       schema: cilpFormFSchema,
      //       uiSchema: cilpFormFUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'cilp_form_g',
      //       title: 'CILP Form G',
      //       schema: cilpFormGSchema,
      //       uiSchema: cilpFormGUiSchema,
      //     },
      //   ],
      // },
      // {
      //   type: 'folder',
      //   title: 'Prepack Claims',
      //   children: [
      //     {
      //       type: 'form',
      //       id: 'feedback_prepack',
      //       title: 'Feedback',
      //       schema: feedbackSchemaPrepack,
      //       uiSchema: feedbackUiSchemaPrepack,
      //     },
      //     {
      //       type: 'form',
      //       id: 'registration_prepack',
      //       title: 'Registration',
      //       schema: registrationSchemaPrepack,
      //       uiSchema: registrationUiSchemaPrepack,
      //     },
      //   ],
      // },
      // {
      //   type: 'folder',
      //   title: 'Resolution Claims',
      //   children: [
      //     {
      //       type: 'form',
      //       id: 'cirp_form_b',
      //       title: 'CIRP Form B',
      //       schema: cirpFormBSchema,
      //       uiSchema: cirpFormBUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'cirp_form_ca',
      //       title: 'CIRP Form CA',
      //       schema: cirpFormCaSchema,
      //       uiSchema: cirpFormCaUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'cirp_form_c',
      //       title: 'CIRP Form C',
      //       schema: cirpFormCSchema,
      //       uiSchema: cirpFormCUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'cirp_form_d',
      //       title: 'CIRP Form D',
      //       schema: cirpFormDSchema,
      //       uiSchema: cirpFormDUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'cirp_form_e',
      //       title: 'CIRP Form E',
      //       schema: cirpFormESchema,
      //       uiSchema: cirpFormEUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'cirp_form_f',
      //       title: 'CIRP Form F',
      //       schema: cirpFormFSchema,
      //       uiSchema: cirpFormFUiSchema,
      //     },
      //   ],
      // },
      // {
      //   type: 'folder',
      //   title: 'Vol Liquidation Claims',
      //   children: [
      //     {
      //       type: 'form',
      //       id: 'civlp_form_c',
      //       title: 'CIVLP Form C',
      //       schema: civlpFormCSchema,
      //       uiSchema: civlpFormCUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'civlp_form_d',
      //       title: 'CIVLP Form D',
      //       schema: civlpFormDSchema,
      //       uiSchema: civlpFormDUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'civlp_form_e',
      //       title: 'CIVLP Form E',
      //       schema: civlpFormESchema,
      //       uiSchema: civlpFormEUiSchema,
      //     },
      //     {
      //       type: 'form',
      //       id: 'civlp_form_f',
      //       title: 'CIVLP Form F',
      //       schema: civlpFormFSchema,
      //       uiSchema: civlpFormFUiSchema,
      //     },
        ],
      },
];
