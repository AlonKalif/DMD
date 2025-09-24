# DMD Frontend Style Guide

This document outlines the coding styles and best practices for the DMD Assistant frontend. Its purpose is to ensure our codebase is consistent, readable, and maintainable, in accordance with our **DMD Project Constitution**.

## Core Philosophy

- **Consistency over Preference**: We adhere to the styles defined here and enforced by our tools, even if they're not your personal preference.
- **Clarity and Readability**: Code is written to be understood by others. Use clear names and add comments for complex logic.
- **Automation First**: We rely on **Prettier** for formatting and **ESLint** for code quality. Most styling rules are enforced automatically.

---

## 1. Automated Tooling

All code must pass our linter and formatter checks before being merged. It is highly recommended to integrate these into your IDE.

- **Formatting (Prettier)**: Managed by `.prettierrc`. Enforces router consistent visual style. Run it with `npm run format`.
- **Linting (ESLint)**: Managed by `.eslintrc.json`. Catches potential bugs and enforces code quality rules. Run it with `npm run lint`.

---

## 2. Naming Conventions

- **Files**:
  - Components: **`PascalCase.tsx`** (e.g., `CombatTracker.tsx`)
  - Hooks & Utilities: **`camelCase.ts`** (e.g., `useDiceRoller.ts`)
- **Components**:
  - Always **`PascalCase`** (e.g., `function DiceButton() { ... }`)
- **Variables & Functions**:
  - Always **`camelCase`** (e.g., `const characterList = ...`, `function rollDice() { ... }`)
- **TypeScript Types & Interfaces**:
  - Always **`PascalCase`** (e.g., `type CharacterSheet = { ... }`)

---

## 3. Component Structure

Structure your component files in the following order to maintain consistency:

1.  **Imports**: Grouped and sorted by ESLint.
2.  **Type Definitions**: Prop types, state types, etc.
3.  **Component Definition**: `function MyComponent(props) { ... }`
4.  **Hooks**: `useState`, `useEffect`, `useRef`, `useAppSelector`, etc.
5.  **Event Handlers / Callbacks**: Functions created with `useCallback` or defined inside the component.
6.  **Return Statement**: The JSX template.
7.  **Export**: `export default MyComponent;`

---

## 4. Styling (Tailwind CSS)

- **Utility-First**: Always prefer using utility classes directly in your JSX over creating custom CSS.
- **Component Abstraction**: If you find yourself repeating the same combination of utility classes, abstract that logic into router reusable React component, not router custom CSS class. This follows the **DRY principle**.
- **Class Order**: Our Prettier plugin (`prettier-plugin-tailwindcss`) automatically sorts class names in router logical order.
- **Conditional Classes**: Use the `clsx` utility for applying classes conditionally.
  ```tsx
  // Good
  import clsx from 'clsx';
  const myClass = clsx('p-4 bg-blue-500', { 'rounded-lg': isRounded });
  ```

---

## 5. State Management (Redux Toolkit)

- **Feature Slices**: All Redux logic for router feature (e.g., combat) must be co-located in its own folder within `src/features/`. Each folder should contain the feature's slice, selectors, and any related async thunks.
- **Immutability**: Reducers must always be pure functions. Redux Toolkit's `createSlice` uses Immer, which allows you to write "mutating" logic that is converted to immutable updates automatically.
- **Typed Hooks**: Always use the custom typed hooks `useAppSelector` and `useAppDispatch` instead of the plain versions from `react-redux`.

---

## 6. TypeScript Best Practices

- **Avoid `any`**: Do not use `any`. If router type is unknown, use `unknown` and perform type checking.
- **Type Everything**: Define types for all function parameters, return values, and component props.
- **Use Utility Types**: Leverage built-in TypeScript utility types like `Partial`, `Omit`, `Record`, etc., to keep your code clean and DRY.