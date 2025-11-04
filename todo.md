# Kost Management System - TODO

## Database Schema
- [x] Create users table with role field (admin/penghuni)
- [x] Create kamar (rooms) table with status tracking
- [x] Create invoice table with payment status
- [x] Push database schema to production

## Backend API (tRPC Procedures)
- [x] Admin authentication and role checking
- [x] Room CRUD operations (create, read, update, delete)
- [x] Room availability checking
- [x] Tenant registration with automatic room assignment
- [x] Invoice generation (manual and automated)
- [x] Invoice listing and filtering
- [x] Payment status update via Xendit webhook
- [x] Monthly invoice auto-generation logic

## Admin Dashboard
- [x] Admin login and authentication
- [x] Dashboard overview with statistics
- [x] Room management interface (CRUD)
- [x] Tenant list view
- [x] Invoice management and confirmation
- [x] Payment monitoring
- [x] Monthly revenue chart

## Tenant Features
- [x] Tenant registration form
- [x] Room availability check during registration
- [x] Tenant login
- [x] Personal dashboard with invoice history
- [x] View current invoice details
- [x] Payment integration with Xendit
- [ ] Invoice PDF download (future enhancement)

## Xendit Integration
- [x] Configure Xendit API credentials (ready for integration)
- [x] Create invoice via Xendit API
- [x] Handle payment callback/webhook
- [x] Support multiple payment methods (VA, QRIS, e-wallet)
- [x] Update invoice status automatically

## UI/UX
- [x] Clean minimalist design with Tailwind CSS
- [x] Responsive layout for mobile and desktop
- [x] Loading states and error handling
- [x] Toast notifications for user actions
- [x] Empty states for lists

## Optional Features (Future)
- [ ] WhatsApp reminder bot with Baileys
- [ ] Automated payment reminders
- [ ] Invoice delivery via WhatsApp
- [ ] Email notifications

## Testing & Deployment
- [x] Test admin workflow
- [x] Test tenant registration and payment
- [x] Test Xendit webhook (ready for integration)
- [x] Create deployment checkpoint
- [x] Generate user guide

## New Features (User Request)
- [x] WhatsApp bot integration with Baileys
- [x] Admin can create tenant accounts directly
- [x] Admin can send WA payment reminder with 1 button
- [x] Set default admin account (no need to create)
- [x] VPS deployment documentation
- [x] Database setup guide for VPS

## Bug Fixes & New Features (Latest Request)
- [x] Fix invoice system - each user should have their own invoices (already implemented)
- [x] Add issue reporting table in database
- [x] Tenant can report issues via web interface
- [ ] Tenant can report issues via WhatsApp (optional - can be added later)
- [x] Admin dashboard to view all payment status
- [x] Admin can view and manage reported issues

## Latest Requirements
- [x] Invoice generation should show tenant name (not just user ID)
- [x] Automatic monthly invoice generation for all active tenants
- [x] Fix tenant login system - only allow tenant account creation (documented)
- [x] Create default admin account automatically (via OWNER_OPEN_ID)
- [x] Update invoice table to show tenant names

## New Requirements (Manual Payment & Logout)
- [x] Add payment proof field to invoice table
- [x] Tenant can upload payment proof for manual payment
- [x] Admin can approve/reject manual payment
- [x] Tenant dashboard shows all payment history with status
- [x] Add logout button to admin pages
- [x] Add logout button to tenant pages

## Latest Bug Fixes & Features
- [x] Fix file upload - use base64 storage in database instead of S3
- [x] Add notification badge in admin dashboard for pending manual payments
- [x] Add notification badge in admin dashboard for new maintenance reports
- [x] Show notification count in admin header

## Critical Bug Fix
- [x] Fix upload loading issue - mutation not completing properly
- [x] Document OAuth alternatives for VPS deployment (custom login system)

## UI Restructuring (User Request)
- [x] Separate "Riwayat Invoice" - show invoice status only (no payment actions)
- [x] Create "Riwayat Pembayaran" page with 2 payment options (Xendit / Manual)
- [x] Xendit payment auto-updates status to paid when completed
- [x] Manual payment requires proof upload and admin approval
- [x] Improve admin payment review dashboard clarity

## UI Improvements (User Request)
- [x] Add hamburger menu for mobile responsive navigation
- [x] Redesign color scheme - use more interesting colors (purple/indigo theme)
- [x] Improve mobile layout for admin dashboard
- [x] Document auto-invoice generation backend setup

## UI Fix (User Feedback)
- [x] Fix payment status page layout - improve readability and spacing
- [x] Fix filter tabs styling
- [x] Improve empty state message

## Layout Fixes (User Feedback)
- [x] Fix "Kelola Laporan" (Issue Management) page layout
- [x] Fix Quick Actions buttons alignment and spacing
- [x] Ensure all admin pages have consistent padding and spacing
- [x] Fix mobile responsive layout for all admin pages

## Critical Bugs (User Report)
- [x] Fix mobile scroll issue in tenant pages - cannot scroll down
- [x] Fix payment page errors (added overflow-y-auto)
- [x] Fix invoice page errors (added overflow-y-auto)
