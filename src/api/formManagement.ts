import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirebaseError } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

// Types for our Firebase collections
export interface FormSchema {
  id?: string;
  title: string;
  description?: string;
  category: string;
  schema: Record<string, any>;
  uiSchema?: Record<string, any>;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
  version: number;
  tags?: string[];
  pageAssignments?: string[]; // Array of page IDs where this form is assigned
}

export interface FormSubmission {
  id?: string;
  formId: string;
  formTitle: string;
  formData: Record<string, any>;
  submittedBy: string;
  submittedAt: Timestamp;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
  reviewer?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  metadata?: Record<string, any>;
}

export interface FormCategory {
  id?: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PageAssignment {
  id?: string;
  pageId: string;
  pageName: string;
  formIds: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Form Management API Functions
export class FormManagementAPI {
  
  // ===== FORM SCHEMAS =====
  
  static async createFormSchema(formData: Omit<FormSchema, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'version'>): Promise<string> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User must be authenticated to create forms');
      }

      const formSchema: Omit<FormSchema, 'id'> = {
        ...formData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        createdBy: user.uid,
        updatedBy: user.uid,
        version: 1,
        isActive: formData.isActive ?? true,
        pageAssignments: formData.pageAssignments ?? []
      };

      const docRef = await addDoc(collection(db, 'form_schemas'), formSchema);
      return docRef.id;
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Create form schema');
      throw new Error(handledError.message);
    }
  }

  static async updateFormSchema(formId: string, updates: Partial<Omit<FormSchema, 'id' | 'createdAt' | 'createdBy' | 'version'>>): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User must be authenticated to update forms');
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      };

      await updateDoc(doc(db, 'form_schemas', formId), updateData);
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Update form schema');
      throw new Error(handledError.message);
    }
  }

  static async deleteFormSchema(formId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'form_schemas', formId));
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Delete form schema');
      throw new Error(handledError.message);
    }
  }

  static async getFormSchema(formId: string): Promise<FormSchema | null> {
    try {
      const docSnap = await getDoc(doc(db, 'form_schemas', formId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FormSchema;
      }
      return null;
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Get form schema');
      throw new Error(handledError.message);
    }
  }

  static async getAllFormSchemas(): Promise<FormSchema[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'form_schemas'), orderBy('createdAt', 'desc'))
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormSchema[];
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Get all form schemas');
      throw new Error(handledError.message);
    }
  }

  static async getFormSchemasByCategory(category: string): Promise<FormSchema[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'form_schemas'),
          where('category', '==', category),
          where('isActive', '==', true)
        )
      );
      
      // Sort in memory to avoid composite index requirement
      const forms = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormSchema[];
      
      return forms.sort((a, b) => a.title.localeCompare(b.title));
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Get form schemas by category');
      throw new Error(handledError.message);
    }
  }

  static async getFormSchemasByPage(pageId: string): Promise<FormSchema[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'form_schemas'),
          where('pageAssignments', 'array-contains', pageId),
          where('isActive', '==', true)
        )
      );
      
      // Sort in memory to avoid composite index requirement
      const forms = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormSchema[];
      
      return forms.sort((a, b) => a.title.localeCompare(b.title));
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Get form schemas by page');
      throw new Error(handledError.message);
    }
  }

  // ===== FORM SUBMISSIONS =====

  static async createFormSubmission(submissionData: Omit<FormSubmission, 'id' | 'submittedAt'>): Promise<string> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User must be authenticated to submit forms');
      }

      const submission: Omit<FormSubmission, 'id'> = {
        ...submissionData,
        submittedBy: user.uid,
        submittedAt: serverTimestamp() as Timestamp,
        status: submissionData.status || 'submitted'
      };

      const docRef = await addDoc(collection(db, 'form_submissions'), submission);
      return docRef.id;
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Create form submission');
      throw new Error(handledError.message);
    }
  }

  static async updateFormSubmission(submissionId: string, updates: Partial<Omit<FormSubmission, 'id' | 'formId' | 'submittedBy' | 'submittedAt'>>): Promise<void> {
    try {
      await updateDoc(doc(db, 'form_submissions', submissionId), updates);
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Update form submission');
      throw new Error(handledError.message);
    }
  }

  static async getFormSubmission(submissionId: string): Promise<FormSubmission | null> {
    try {
      const docSnap = await getDoc(doc(db, 'form_submissions', submissionId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FormSubmission;
      }
      return null;
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Get form submission');
      throw new Error(handledError.message);
    }
  }

  static async getFormSubmissionsByForm(formId: string): Promise<FormSubmission[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'form_submissions'),
          where('formId', '==', formId),
          orderBy('submittedAt', 'desc')
        )
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormSubmission[];
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Get form submissions by form');
      throw new Error(handledError.message);
    }
  }

  static async getUserFormSubmissions(userId?: string): Promise<FormSubmission[]> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const targetUserId = userId || user?.uid;
      
      if (!targetUserId) {
        throw new Error('User must be authenticated to get submissions');
      }

      const querySnapshot = await getDocs(
        query(
          collection(db, 'form_submissions'),
          where('submittedBy', '==', targetUserId),
          orderBy('submittedAt', 'desc')
        )
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormSubmission[];
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Get user form submissions');
      throw new Error(handledError.message);
    }
  }

  // ===== FORM CATEGORIES =====

  static async createFormCategory(categoryData: Omit<FormCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User must be authenticated to create categories');
      }

      const category: Omit<FormCategory, 'id'> = {
        ...categoryData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      const docRef = await addDoc(collection(db, 'form_categories'), category);
      return docRef.id;
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Create form category');
      throw new Error(handledError.message);
    }
  }

  static async getAllFormCategories(): Promise<FormCategory[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'form_categories'),
          where('isActive', '==', true)
        )
      );
      
      // Sort in memory to avoid composite index requirement
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormCategory[];
      
      return categories.sort((a, b) => a.order - b.order);
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Get all form categories');
      throw new Error(handledError.message);
    }
  }

  // ===== PAGE ASSIGNMENTS =====

  static async assignFormToPage(formId: string, pageId: string, _pageName: string): Promise<void> {
    try {
      const formRef = doc(db, 'form_schemas', formId);
      const formDoc = await getDoc(formRef);
      
      if (!formDoc.exists()) {
        throw new Error('Form not found');
      }

      const formData = formDoc.data() as FormSchema;
      const currentAssignments = formData.pageAssignments || [];
      
      if (!currentAssignments.includes(pageId)) {
        await updateDoc(formRef, {
          pageAssignments: [...currentAssignments, pageId],
          updatedAt: serverTimestamp(),
          updatedBy: getAuth().currentUser?.uid
        });
      }
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Assign form to page');
      throw new Error(handledError.message);
    }
  }

  static async removeFormFromPage(formId: string, pageId: string): Promise<void> {
    try {
      const formRef = doc(db, 'form_schemas', formId);
      const formDoc = await getDoc(formRef);
      
      if (!formDoc.exists()) {
        throw new Error('Form not found');
      }

      const formData = formDoc.data() as FormSchema;
      const currentAssignments = formData.pageAssignments || [];
      const updatedAssignments = currentAssignments.filter(id => id !== pageId);
      
      await updateDoc(formRef, {
        pageAssignments: updatedAssignments,
        updatedAt: serverTimestamp(),
        updatedBy: getAuth().currentUser?.uid
      });
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Remove form from page');
      throw new Error(handledError.message);
    }
  }

  // ===== BULK OPERATIONS =====

  static async migrateExistingFormsToFirebase(): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User must be authenticated to migrate forms');
      }

      console.log('Starting migration for user:', user.uid);
      
      // Import the existing forms data
      const { formsTree } = await import('@/features/forms/formsData');
      console.log('Loaded formsTree:', formsTree.length, 'categories');
      
      const batch = writeBatch(db);
      let operationCount = 0;

      // Process each category and form
      for (const category of formsTree) {
        if (category.type === 'folder') {
          // Create category if it doesn't exist
          const categoryQuery = query(
            collection(db, 'form_categories'),
            where('name', '==', category.title)
          );
          const categorySnapshot = await getDocs(categoryQuery);
          
          if (categorySnapshot.empty) {
            const categoryRef = doc(collection(db, 'form_categories'));
            batch.set(categoryRef, {
              name: category.title,
              description: `Migrated category: ${category.title}`,
              order: formsTree.indexOf(category),
              isActive: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }

          // Process forms in this category
          for (const form of category.children) {
            if (form.type === 'form') {
              const formRef = doc(collection(db, 'form_schemas'));
              console.log(`Adding form: ${form.title} to category: ${category.title}`);
              batch.set(formRef, {
                title: form.title,
                description: `Migrated form: ${form.title}`,
                category: category.title,
                schema: form.schema,
                uiSchema: form.uiSchema,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: user.uid,
                updatedBy: user.uid,
                version: 1,
                tags: [category.title.toLowerCase().replace(/\s+/g, '-')],
                pageAssignments: []
              });
              operationCount++;
            }
          }
        }
      }

      // Commit the batch
      if (operationCount > 0) {
        console.log(`Committing batch with ${operationCount} operations...`);
        await batch.commit();
        console.log(`Successfully migrated ${operationCount} forms to Firebase`);
      } else {
        console.log('No forms to migrate');
      }
    } catch (error) {
      const handledError = handleFirebaseError(error, 'Migrate existing forms');
      throw new Error(handledError.message);
    }
  }
}

export default FormManagementAPI;
