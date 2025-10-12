# Custom Form & Folder Naming Feature

This feature allows you to dynamically add custom names for forms and folders in your form builder application.

## Features

### 🎯 **Dynamic Custom Naming**
- Add custom display names for any form or folder
- Names are automatically saved to localStorage
- Persistent across browser sessions

### ✏️ **Inline Editing**
- Edit custom names directly in the interface
- Save or cancel changes with intuitive buttons
- Visual indicators for custom names (asterisk *)

### 📁 **Smart Organization**
- Separate management for forms and folders
- Dropdown selection of available items
- Prevention of duplicate custom names

### 🔄 **Real-time Updates**
- Changes reflect immediately in the form tree
- Custom names appear in form headers
- Original names preserved as tooltips

## How to Use

### 1. **Access the Custom Naming Interface**
- Navigate to the Form Builder page
- Click the "Customize" tab in the left sidebar

### 2. **Add Custom Names**
- Select the type (Form or Folder)
- Choose the item from the dropdown
- Enter your custom name
- Click "Add"

### 3. **Edit Existing Names**
- Click the edit icon (✏️) next to any custom name
- Modify the name in the input field
- Save changes or cancel

### 4. **Remove Custom Names**
- Click the X icon next to any custom name
- The item will revert to its original name

### 5. **Reset All**
- Use the "Reset All" button to clear all custom names
- Confirmation dialog prevents accidental resets

## Technical Implementation

### Components
- `CustomNamingInterface.tsx` - Main interface component
- `useCustomNames.tsx` - Custom hook for state management
- Updated `FormsTree.tsx` - Displays custom names
- Updated `FormBuilderPage.tsx` - Integrates the feature

### Data Storage
- Custom names stored in localStorage as JSON
- Automatic persistence and retrieval
- Error handling for corrupted data

### Visual Indicators
- Asterisk (*) indicates custom names
- Tooltips show original names
- Consistent styling across components

## Benefits

1. **User Experience**: More intuitive and personalized form management
2. **Flexibility**: Easy to rename items without code changes
3. **Persistence**: Settings survive browser restarts
4. **Non-destructive**: Original names always preserved
5. **Scalable**: Works with any number of forms and folders

## Future Enhancements

- Bulk import/export of custom names
- Search and filter functionality
- Custom name templates
- Integration with user accounts for multi-user environments
