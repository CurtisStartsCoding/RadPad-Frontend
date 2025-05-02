# RadOrderPad Technical Documentation

## Project Architecture

The RadOrderPad UI mockup is built using a modern React application structure with TypeScript for type safety. The project follows a component-based architecture with clear separation of concerns.

### Key Technical Decisions

1. **Component Library**: shadcn/ui for consistent UI components
2. **Styling**: Tailwind CSS for utility-first styling
3. **Icons**: Lucide React for consistent iconography
4. **Charts**: Recharts for data visualization
5. **State Management**: React hooks and context for local state
6. **Data Handling**: Mock data for demonstration purposes

## Component Structure

The application follows a modular component approach:

1. **UI Components**: Reusable UI elements from shadcn/ui (buttons, cards, inputs, etc.)
2. **Page Components**: Full page views for specific features
3. **Domain Components**: Components specific to the domain logic (order forms, patient cards, etc.)
4. **Layout Components**: Components for consistent page layout

## Key Files and Their Purposes

### Core Application Files

- `client/src/App.tsx`: Main application component that defines routes and navigation structure
- `client/src/main.tsx`: Application entry point
- `client/src/index.css`: Global styles and Tailwind CSS imports

### Utility Files

- `client/src/lib/mock-data.ts`: Mock data for demonstration
- `client/src/lib/roles.ts`: Role-based access control logic
- `client/src/lib/utils.ts`: Utility functions

### Component Types

#### UI Components (from shadcn/ui)

These components are used throughout the application to maintain consistent styling and behavior:

- `Button`: Primary, secondary, outline variants
- `Card`: Container with header, content, and footer sections
- `Input`: Text input fields with validation
- `Select`: Dropdown selection fields
- `Tabs`: Tabbed interface components
- `Table`: Data table components
- `Dialog`: Modal dialog components
- `Alert`: Alert and notification components

#### Order-Specific Components

- `DictationForm.tsx`: Component for order dictation
- `ValidationView.tsx`: Displays validation results and suggested codes
- `PatientInfoCard.tsx`: Displays patient information in a card layout

## Technical Implementations

### Role-Based Access Control

The application implements role-based access control through the `hasAccess` function in `lib/roles.ts`:

```typescript
export enum UserRole {
  Physician = "physician",
  AdminStaff = "admin_staff",
  AdminReferring = "admin_referring",
  Scheduler = "scheduler",
  AdminRadiology = "admin_radiology",
  Radiologist = "radiologist",
  TrialPhysician = "trial_physician",
  SuperAdmin = "super_admin"
}

export const hasAccess = (role: UserRole, page: string): boolean => {
  // Logic to determine if a role has access to a specific page
}
```

### Multi-Step Forms

Several parts of the application implement multi-step forms, particularly in the order creation process:

1. **Patient Selection/Information**
2. **Dictation Input**
3. **Validation Review**
4. **Order Confirmation**

Each step is managed through state in the parent component, with conditional rendering of the appropriate step component.

### Data Visualization

The Dashboard uses Recharts to visualize data:

```typescript
<BarChart
  width={500}
  height={300}
  data={activityData}
  margin={{
    top: 5,
    right: 30,
    left: 0,
    bottom: 5,
  }}
>
  <CartesianGrid strokeDasharray="3 3" vertical={false} />
  <XAxis dataKey="name" />
  <YAxis allowDecimals={false} />
  <Tooltip />
  <Legend verticalAlign="top" height={36} />
  <Bar name="Orders" dataKey="orders" fill="#2563EB" radius={[4, 4, 0, 0]} />
  <Bar name="Validations" dataKey="validations" fill="#10B981" radius={[4, 4, 0, 0]} />
</BarChart>
```

### Form Validation

Forms throughout the application implement appropriate validation:

```typescript
// Example password match validation
{newPassword && confirmPassword && newPassword !== confirmPassword && (
  <p className="text-xs text-red-500 flex items-center mt-1">
    <AlertCircle className="h-3.5 w-3.5 mr-1" />
    Passwords don't match
  </p>
)}
```

### Mock Data Structures

The application uses mock data to simulate real data that would come from an API:

```typescript
// Example of mock order data structure
export interface Order {
  id: number;
  patient: Patient;
  modality: string;
  createdAt: string;
  status: 'pending_admin' | 'pending_radiology' | 'scheduled' | 'completed' | 'cancelled';
  radiologyGroup: string;
}
```

## Responsive Design

The application implements responsive design using Tailwind CSS breakpoints:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* Content that adapts to screen size */}
</div>
```

Key breakpoints:
- `sm`: Small screens (640px+)
- `md`: Medium screens (768px+)
- `lg`: Large screens (1024px+)
- `xl`: Extra large screens (1280px+)

## UI/UX Patterns

### Status Indicators

The application uses consistent status indicators through badges with color coding:

```jsx
getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending_admin':
      return <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">Processing</Badge>;
    case 'pending_radiology':
      return <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">Awaiting Schedule</Badge>;
    case 'scheduled':
      return <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">Scheduled</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">Cancelled</Badge>;
    default:
      return null;
  }
};
```

### Form Layout Patterns

Forms follow consistent patterns with labels, help text, and validation:

```jsx
<div className="space-y-2">
  <Label htmlFor="field-id">Field Label</Label>
  <Input 
    id="field-id" 
    value={value}
    onChange={(e) => setValue(e.target.value)}
    required
  />
  <p className="text-xs text-slate-500">
    Helper text to guide the user
  </p>
</div>
```

### Card Pattern

Information is consistently presented in card layouts:

```jsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
  <CardFooter>
    {/* Card footer with actions */}
  </CardFooter>
</Card>
```

## Performance Considerations

Although this is a UI mockup without actual backend integration, the following performance considerations are demonstrated:

1. **Component Reuse**: Reusing components to minimize duplication
2. **Conditional Rendering**: Only rendering components when needed
3. **Responsive Patterns**: Ensuring good performance across device sizes
4. **Pagination Placeholder**: UI elements for pagination to indicate how large datasets would be handled

## Extension Points

The mockup is designed with clear extension points for future development:

1. **API Integration**: Components are structured to easily accept data from real APIs
2. **Authentication**: Authentication flows are in place for real implementation
3. **Real-time Updates**: UI patterns that could accommodate real-time data
4. **Advanced Search**: Search UI that could be connected to backend search functionality

## Accessibility Considerations

The UI implements several accessibility best practices:

1. **Semantic HTML**: Using appropriate HTML elements
2. **Form Labels**: All form fields have proper labels
3. **Color Contrast**: Sufficient contrast for text and interactive elements
4. **Focus States**: Visible focus states for keyboard navigation
5. **Error Messages**: Clear error messaging for form validation

## Known Limitations

As this is a UI mockup only:

1. No actual data persistence or API calls
2. No real authentication or security implementation
3. Mock data is used for demonstration purposes
4. Some complex interactions are simulated rather than fully implemented

## Future Technical Opportunities

1. **State Management**: Implementing Redux or other state management for complex state
2. **API Integration**: Connecting to real backend services
3. **Form Libraries**: Using Formik or React Hook Form for more complex forms
4. **Animations**: Adding motion and transitions for better UX
5. **Accessibility Testing**: Comprehensive accessibility auditing and improvements