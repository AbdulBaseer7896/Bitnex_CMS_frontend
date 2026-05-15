// ─────────────────────────────────────────────────────────────────────────────
// MODULE REGISTRY (frontend)
//
// Maps each backend module slug → UI metadata (sidebar label, icon, route,
// section grouping). The backend's MODULE_REGISTRY remains the source of truth
// for which modules exist; this file just tells the UI how to *render* them.
//
// To add a new module: add it to backend bitnex_cms/Models/Feature_models.py
// AND append a row here using the same slug. Order here = sidebar order.
// ─────────────────────────────────────────────────────────────────────────────

import {
  HiOutlineHome, HiOutlineUsers, HiOutlineClipboardList,
  HiOutlineCurrencyDollar, HiOutlineDocumentReport,
  HiOutlineCollection, HiOutlineClock, HiOutlineCog,
  HiOutlineDatabase, HiOutlineCreditCard, HiOutlinePhone,
  HiOutlineCash, HiOutlineChartPie, HiOutlineExclamationCircle,
  HiOutlineDocumentText, HiOutlineReceiptRefund,
} from 'react-icons/hi'
import { RiTeamLine } from 'react-icons/ri'

// One row per module. `route` = the path this module exposes in the sidebar
// (if any). Modules without a `route` are still permission-checked but won't
// appear as a sidebar entry on their own (e.g. `settings`, accessed via the
// user-footer dropdown).
export const MODULES = [
  // ── Core ──────────────────────────────────────────────────────────────────
  { slug:'dashboard',            label:'Dashboard',           group:'Core',          route:'/dashboard',         icon:HiOutlineHome },

  // ── Admin ─────────────────────────────────────────────────────────────────
  { slug:'users_manage',         label:'Users',               group:'Admin',         route:'/admin/users',       icon:HiOutlineUsers },
  { slug:'audit_logs',           label:'Audit Logs',          group:'Admin',         route:'/admin/activity',    icon:HiOutlineCollection },

  // ── HR ────────────────────────────────────────────────────────────────────
  { slug:'employees',            label:'Employees',           group:'HR',            route:'/hr/employees',      icon:RiTeamLine },
  { slug:'leaves_manage',        label:'Leaves',              group:'HR',            route:'/hr/leaves',         icon:HiOutlineClipboardList },
  { slug:'leaves_own',           label:'My Leaves',           group:'HR',            route:'/employee/leaves',   icon:HiOutlineClipboardList, hideIf:['leaves_manage'] },
  { slug:'attendance',           label:'Attendance',          group:'HR',            route:'/attendance',        icon:HiOutlineClock },
  { slug:'documents',            label:'Documents',           group:'HR',            route:'/documents',         icon:HiOutlineDocumentText },

  // ── Salary / Payroll ──────────────────────────────────────────────────────
  { slug:'salary_manage',        label:'Manage Salary',       group:'Salary',        route:'/salary/manage',     icon:HiOutlineCurrencyDollar },
  { slug:'salary_own',           label:'My Payslips',         group:'Salary',        route:'/employee/payslips', icon:HiOutlineCurrencyDollar, hideIf:['salary_manage'] },

  // ── Reimbursements ────────────────────────────────────────────────────────
  // Three different views of the same /reimbursements page — only one
  // entry will render in the sidebar, picked by priority (review > hr > own).
  { slug:'reimbursements_review',label:'Reimbursements',      group:'Reimbursements',route:'/reimbursements',    icon:HiOutlineReceiptRefund },
  { slug:'reimbursements_hr',    label:'Additional Payments', group:'Reimbursements',route:'/reimbursements',    icon:HiOutlineReceiptRefund, hideIf:['reimbursements_review'] },
  { slug:'reimbursements_own',   label:'My Reimbursements',   group:'Reimbursements',route:'/reimbursements',    icon:HiOutlineReceiptRefund, hideIf:['reimbursements_review','reimbursements_hr'] },

  // ── Accounts ──────────────────────────────────────────────────────────────
  { slug:'expenses',             label:'Expenses',            group:'Accounts',      route:'/accounts/expenses', icon:HiOutlineDocumentReport },
  { slug:'reports',              label:'Reports',             group:'Accounts',      route:'/accounts/reports',  icon:HiOutlineChartPie },

  // ── Store ─────────────────────────────────────────────────────────────────
  { slug:'store_customers',      label:'Customers',           group:'Store',         route:'/store/customers',   icon:HiOutlineUsers },
  { slug:'store_dat',            label:'DAT One',             group:'Store',         route:'/store/dat',         icon:HiOutlineDatabase },
  { slug:'store_payments',       label:'Payments',            group:'Store',         route:'/store/payments',    icon:HiOutlineCreditCard },
  { slug:'store_dialers',        label:'Dialers',             group:'Store',         route:'/store/dialers',     icon:HiOutlinePhone },
  { slug:'store_expenses',       label:'Store Expenses',      group:'Store',         route:'/store/expenses',    icon:HiOutlineCash },
  { slug:'store_conflicts',      label:'Sync Conflicts',      group:'Store',         route:'/store/conflicts',   icon:HiOutlineExclamationCircle },
  { slug:'store_report',         label:'Monthly Report',      group:'Store',         route:'/store/report',      icon:HiOutlineChartPie },

  // Settings has no sidebar row — accessed through the user-footer menu.
  { slug:'settings',             label:'Settings',            group:'Core',          route:null,                 icon:HiOutlineCog },
]

// Map slug → entry, for O(1) lookups in guards/route protection.
export const MODULE_BY_SLUG = Object.fromEntries(MODULES.map(m => [m.slug, m]))

// Ordered list of sidebar sections — controls which dividers render and
// what order.
export const SECTION_ORDER = ['Core', 'Admin', 'HR', 'Salary', 'Reimbursements', 'Accounts', 'Store']

/**
 * Build the sidebar navigation for a given user, based on the modules they
 * effectively have access to. `userModules` should be `user.modules` from the
 * `/api/users/me/` response — an array of slugs.
 *
 * Returns a flat array of either nav items `{to, icon, label}` or section
 * dividers `{divider: 'HR'}`.
 */
export function buildNavForUser(userModules = []) {
  const have = new Set(userModules)
  const out = []
  for (const section of SECTION_ORDER) {
    const items = MODULES.filter(m =>
      m.group === section &&
      m.route &&
      have.has(m.slug) &&
      // hideIf: skip this module if any of the listed higher-priority slugs
      // is also present (avoids duplicate rows pointing to the same route).
      !(m.hideIf || []).some(slug => have.has(slug))
    )
    if (!items.length) continue
    // Only print a divider when this isn't the very first section.
    if (out.length > 0) out.push({ divider: section })
    for (const it of items) {
      out.push({ to: it.route, icon: it.icon, label: it.label, slug: it.slug })
    }
  }
  return out
}
