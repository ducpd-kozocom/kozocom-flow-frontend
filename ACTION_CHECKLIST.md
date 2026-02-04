# Code Review Checklist - Action Items

This checklist provides a practical, step-by-step guide for addressing all issues found in the code review.

## 🔴 P0: Critical Security Issues (DO FIRST)

### [ ] Issue #1: Fix XSS Vulnerability in Chat
**File**: `src/modules/chat/ChatPage.tsx`  
**Estimated Time**: 1-2 hours  
**Owner**: _____________

#### Steps:
1. [ ] Install sanitization library
   ```bash
   cd /home/runner/work/kozocom-flow-frontend/kozocom-flow-frontend
   bun add dompurify
   bun add -d @types/dompurify
   ```

2. [ ] Update ChatPage.tsx (line 93-97)
   ```tsx
   // Current (INSECURE):
   dangerouslySetInnerHTML={{ 
     __html: message.content
       .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
       .replace(/\n/g, '<br/>')
   }}
   
   // Fix Option 1 - DOMPurify (recommended):
   import DOMPurify from 'dompurify';
   
   dangerouslySetInnerHTML={{ 
     __html: DOMPurify.sanitize(
       message.content
         .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
         .replace(/\n/g, '<br/>'),
       { ALLOWED_TAGS: ['strong', 'br', 'p', 'em'] }
     )
   }}
   
   // Fix Option 2 - React Markdown (better):
   bun add react-markdown
   
   import ReactMarkdown from 'react-markdown';
   <ReactMarkdown>{message.content}</ReactMarkdown>
   ```

3. [ ] Test with malicious input
   - Try: `<script>alert('XSS')</script>`
   - Try: `<img src=x onerror=alert('XSS')>`
   - Try: `<a href="javascript:alert('XSS')">Click</a>`
   - All should be sanitized

4. [ ] Deploy security fix to production ASAP

---

## 🟡 P1: High Priority Issues (Week 1)

### [ ] Issue #2: Add Error Boundaries
**Files**: Create `src/components/ErrorBoundary.tsx`  
**Estimated Time**: 2-3 hours  
**Owner**: _____________

#### Steps:
1. [ ] Create ErrorBoundary component
   ```tsx
   // src/components/ErrorBoundary.tsx
   import { Component, ErrorInfo, ReactNode } from 'react';
   
   interface Props {
     children: ReactNode;
     fallback?: ReactNode;
   }
   
   interface State {
     hasError: boolean;
     error: Error | null;
   }
   
   export class ErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false, error: null };
     }
   
     static getDerivedStateFromError(error: Error): State {
       return { hasError: true, error };
     }
   
     componentDidCatch(error: Error, errorInfo: ErrorInfo) {
       console.error('Error caught by boundary:', error, errorInfo);
       // TODO: Log to error tracking service (Sentry, etc.)
     }
   
     render() {
       if (this.state.hasError) {
         return this.props.fallback || (
           <div style={{ padding: '20px', textAlign: 'center' }}>
             <h2>Oops! Something went wrong</h2>
             <p>Please refresh the page or contact support if the problem persists.</p>
           </div>
         );
       }
   
       return this.props.children;
     }
   }
   ```

2. [ ] Wrap App in App.tsx
   ```tsx
   import { ErrorBoundary } from './components/ErrorBoundary';
   
   export function App() {
     return (
       <ErrorBoundary>
         <BrowserRouter>
           {/* existing content */}
         </BrowserRouter>
       </ErrorBoundary>
     );
   }
   ```

3. [ ] Add page-level boundaries in Layout.tsx
4. [ ] Test by throwing errors in components

### [ ] Issue #3: Fix HTTP API URL
**File**: `src/lib/api.ts`  
**Estimated Time**: 1 hour  
**Owner**: _____________

#### Steps:
1. [ ] Update getApiBaseUrl function
   ```tsx
   const getApiBaseUrl = () => {
     const isProd = process.env.NODE_ENV === 'production';
     
     try {
       if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
         const url = import.meta.env.VITE_API_BASE_URL;
         // Enforce HTTPS in production
         if (isProd && !url.startsWith('https://')) {
           throw new Error('API URL must use HTTPS in production');
         }
         return url;
       }
     } catch (error) {
       if (isProd) throw error;
     }
     
     // Development fallback
     return isProd ? 'https://api.kozoflow.com/api' : 'http://localhost:8000/api';
   };
   ```

2. [ ] Create .env.example
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   NODE_ENV=development
   ```

3. [ ] Update README.md with environment setup
4. [ ] Test both dev and prod builds

### [ ] Issue #4: Add File Upload Validation
**File**: `src/modules/candidates/CandidatesPage.tsx`  
**Estimated Time**: 2 hours  
**Owner**: _____________

#### Steps:
1. [ ] Add file validation constants
   ```tsx
   const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
   const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
   ```

2. [ ] Update file input handler (line 205-217)
   ```tsx
   onChange={(e) => {
     const file = e.target.files?.[0];
     if (!file) return;
     
     // Validate file type
     if (!ALLOWED_FILE_TYPES.includes(file.type)) {
       alert('Invalid file type. Please upload PDF or DOC files only.');
       e.target.value = '';
       return;
     }
     
     // Validate file size
     if (file.size > MAX_FILE_SIZE) {
       alert('File too large. Maximum size is 5MB.');
       e.target.value = '';
       return;
     }
     
     console.log('File selected:', file.name);
     // TODO: Implement actual upload
     alert('CV upload feature coming soon!');
     setShowUploadModal(false);
   }}
   ```

3. [ ] Add server-side validation (backend task)
4. [ ] Test with various file types and sizes

### [ ] Issue #5: Improve Error Handling
**Files**: Multiple  
**Estimated Time**: 3-4 hours  
**Owner**: _____________

#### Steps:
1. [ ] Install toast notification library
   ```bash
   bun add sonner
   ```

2. [ ] Add Toaster to App.tsx
   ```tsx
   import { Toaster } from 'sonner';
   
   export function App() {
     return (
       <>
         <BrowserRouter>
           {/* content */}
         </BrowserRouter>
         <Toaster position="top-right" />
       </>
     );
   }
   ```

3. [ ] Update error handling in DashboardPage.tsx
   ```tsx
   import { toast } from 'sonner';
   
   catch (error) {
     console.error('Failed to fetch dashboard data:', error);
     toast.error('Failed to load dashboard data. Please try again.');
   }
   ```

4. [ ] Update CandidatesPage.tsx error handling
5. [ ] Update ReviewsPage.tsx error handling
6. [ ] Update ChatPage.tsx error handling

---

## 🔵 P2: Medium Priority Issues (Week 2-4)

### [ ] Issue #6: Accessibility Improvements
**Files**: Multiple  
**Estimated Time**: 4-6 hours  
**Owner**: _____________

#### Steps:
1. [ ] Add ARIA labels to Layout.tsx search input
2. [ ] Add ARIA labels to dashboard quick actions
3. [ ] Add ARIA labels to file upload zone
4. [ ] Test with screen reader (NVDA/JAWS)
5. [ ] Test keyboard navigation
6. [ ] Run accessibility audit (Lighthouse/axe)

### [ ] Issue #7: Safe JSON.parse
**File**: `src/modules/reviews/ReviewsPage.tsx`  
**Estimated Time**: 30 minutes  
**Owner**: _____________

#### Steps:
1. [ ] Update line 241-243
   ```tsx
   const parseErrorTypes = (errorTypes: any) => {
     if (typeof errorTypes === 'object') return errorTypes;
     if (typeof errorTypes !== 'string') {
       return { syntax: 0, logic: 0, security: 0 };
     }
     try {
       return JSON.parse(errorTypes);
     } catch {
       console.warn('Failed to parse error_types:', errorTypes);
       return { syntax: 0, logic: 0, security: 0 };
     }
   };
   
   const errorTypes = parseErrorTypes(review.error_types);
   ```

### [ ] Issue #8: Extract Magic Numbers
**Files**: Multiple  
**Estimated Time**: 2 hours  
**Owner**: _____________

#### Steps:
1. [ ] Create `src/constants/ui.ts`
   ```tsx
   export const UI_CONSTANTS = {
     MAX_VISIBLE_SKILLS: 5,
     MAX_RECENT_REVIEWS: 10,
     MAX_RECENT_ACTIVITIES: 10,
   } as const;
   ```

2. [ ] Update CandidatesPage.tsx line 65
3. [ ] Update ReviewsPage.tsx line 26
4. [ ] Extract color arrays to constants

### [ ] Issue #9: Performance Optimizations
**Files**: Multiple  
**Estimated Time**: 4-8 hours  
**Owner**: _____________

#### Steps:
1. [ ] Review memo() usage - remove where unnecessary
2. [ ] Add lazy loading for routes
   ```tsx
   import { lazy, Suspense } from 'react';
   
   const DashboardPage = lazy(() => import('./modules/dashboard'));
   const CandidatesPage = lazy(() => import('./modules/candidates'));
   // etc.
   
   // Wrap routes in Suspense
   ```

3. [ ] Optimize re-renders with proper dependencies
4. [ ] Add React DevTools profiling
5. [ ] Measure and document improvements

---

## 🟢 P3-P4: Low Priority / Nice to Have (Month 2-3)

### [ ] Issue #10: Add Testing Infrastructure
**Estimated Time**: 2-3 days  
**Owner**: _____________

#### Steps:
1. [ ] Install testing libraries
   ```bash
   bun add -d vitest @testing-library/react @testing-library/jest-dom
   bun add -d @testing-library/user-event happy-dom
   ```

2. [ ] Create `vitest.config.ts`
3. [ ] Write tests for API client
4. [ ] Write component tests
5. [ ] Set up CI/CD test runner
6. [ ] Aim for 70%+ coverage

### [ ] Issue #11: Documentation
**Estimated Time**: 1-2 days  
**Owner**: _____________

#### Steps:
1. [ ] Expand README.md
2. [ ] Add JSDoc comments to API functions
3. [ ] Create CONTRIBUTING.md
4. [ ] Document API response formats
5. [ ] Add architecture diagram

### [ ] Issue #12: Code Style
**Estimated Time**: 2-3 hours  
**Owner**: _____________

#### Steps:
1. [ ] Add ESLint configuration
2. [ ] Add Prettier configuration
3. [ ] Set up import sorting
4. [ ] Run and fix linting issues
5. [ ] Add pre-commit hooks

---

## Review & Verification

### After Each Fix:
- [ ] Code works locally
- [ ] No new TypeScript errors
- [ ] No console errors
- [ ] No broken functionality
- [ ] Changes committed with clear message

### Before Deployment:
- [ ] All P0 and P1 issues resolved
- [ ] Security scan passed
- [ ] Manual testing completed
- [ ] Stakeholder review approved
- [ ] Documentation updated

---

## Progress Tracking

**Started**: _______________  
**Target Completion**: _______________

| Priority | Total Issues | Completed | Remaining | % Complete |
|----------|-------------|-----------|-----------|------------|
| P0       | 1           | 0         | 1         | 0%         |
| P1       | 4           | 0         | 4         | 0%         |
| P2       | 4           | 0         | 4         | 0%         |
| P3-P4    | 3           | 0         | 3         | 0%         |
| **TOTAL**| **12**      | **0**     | **12**    | **0%**     |

---

**Notes:**
- Update this checklist as you complete each item
- Link related GitHub issues/PRs in the Owner field
- Add any blockers or dependencies as comments
- Schedule regular check-ins to review progress
