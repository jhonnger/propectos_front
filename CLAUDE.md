# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `npm start` or `ng serve` - Start development server at http://localhost:4200
- `ng build` - Build the application for production (output in `dist/`)
- `ng build --watch --configuration development` - Build in watch mode for development
- `ng test` - Run unit tests with Karma

**Code Generation:**
- `ng generate component component-name` - Generate new component
- `ng generate --help` - See all available schematics

## Architecture

This is an Angular 19 application for managing prospects (prospectos) with role-based access control.

### Core Structure

**Routing Architecture:**
- Main routes in `src/app/app.routes.ts` with lazy-loaded feature modules
- `/admin` routes for administrative functions (upload Excel, assign prospects)
- `/user` routes for regular user functions (dashboard, prospect management)
- Authentication guard (`authGuard`) protects routes

**Feature Modules:**
- **Admin Module** (`src/app/admin/`): Excel upload, prospect assignment
- **User Module** (`src/app/user/`): Dashboard with prospect search and management
- **Auth Module** (`src/app/auth/`): Login component and authentication service
- **Shared Module** (`src/app/shared/`): Common components like navbar

### Services & Data Flow

**Authentication:**
- `AuthService` handles JWT token-based authentication
- Tokens stored in localStorage with key 'authToken'
- Backend API at `http://localhost:8081/api/auth/login`

**API Integration:**
- `AdminService`: Excel file upload (Base64 format) to `/api/prospectos/importar`
- `ProspectoService`: Prospect search with pagination at `/api/prospectos/busqueda`
- All API requests include Bearer token authorization

**Data Models:**
- `BusquedaRequest`: Pagination parameters (pagina, tamanioPagina)
- `Pagination`: Response pagination metadata (page, totalElements, totalPages)

### Key Components

- **Login**: Authentication form with username/password
- **Dashboard**: Main prospect search interface with pagination
- **Upload Excel**: Admin tool for importing prospects from Excel files
- **Assign Prospects**: Admin tool for prospect assignment
- **Update Prospect Dialog**: Modal for editing prospect information

### Styling & UI

- Angular Material with azure-blue theme
- Component-specific CSS files alongside TypeScript files
- Global styles in `src/styles.css`

### Backend Integration

- REST API backend on port 8081
- JWT authentication required for all prospect-related endpoints
- Excel import supports Base64 file upload with filename
- Search API supports pagination parameters