// ─────────────────────────────────────────────────────────────────────────────
// Document Templates – default content generators for each letter type.
// Each generator receives the merged form data and returns rich, editable text.
// Kept simple & professional. HR/Admin can edit the body before generating.
// ─────────────────────────────────────────────────────────────────────────────

export const DOC_TYPES = [
  { key: 'offer_letter',       label: 'Offer Letter',                  icon: '📄' },
  { key: 'appointment_letter', label: 'Appointment Letter',            icon: '📝' },
  { key: 'experience_letter',  label: 'Experience Letter',             icon: '🏅' },
  { key: 'reference_letter',   label: 'Reference Letter',              icon: '🤝' },
  { key: 'salary_certificate', label: 'Salary Certificate',            icon: '💰' },
  { key: 'promotion_letter',   label: 'Promotion Letter',              icon: '⬆️' },
  { key: 'warning_letter',     label: 'Warning Letter',                icon: '⚠️' },
  { key: 'internship_cert',    label: 'Internship Certificate',        icon: '🎓' },
  { key: 'resignation_accept', label: 'Resignation Acceptance Letter', icon: '✉️' },
  { key: 'noc_letter',         label: 'NOC Letter',                    icon: '🛡️' },
  { key: 'termination_letter', label: 'Termination Letter',            icon: '⛔' },
]

export const DOC_LABEL = Object.fromEntries(DOC_TYPES.map(d => [d.key, d.label]))

const fmtDate = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

const fmtMoney = (n) => {
  const v = Number(n || 0)
  return 'PKR ' + v.toLocaleString('en-PK', { maximumFractionDigits: 0 })
}

// duration in years / months between two dates (joining → end)
export function calcDuration(start, end) {
  if (!start) return { years: 0, months: 0, text: '0 months' }
  const s = new Date(start), e = end ? new Date(end) : new Date()
  let y = e.getFullYear() - s.getFullYear()
  let m = e.getMonth() - s.getMonth()
  if (e.getDate() < s.getDate()) m -= 1
  if (m < 0) { y -= 1; m += 12 }
  if (y < 0) { y = 0; m = 0 }
  const parts = []
  if (y) parts.push(`${y} year${y>1?'s':''}`)
  if (m) parts.push(`${m} month${m>1?'s':''}`)
  return { years: y, months: m, text: parts.join(' and ') || 'less than a month' }
}

// ── Body generators ──────────────────────────────────────────────────────────
export function buildBody(type, ctx) {
  const {
    full_name, designation, department, employee_id,
    joining_date, issue_date, gross_salary, basic_salary,
    duration_text, new_designation, new_salary, effective_date,
    resignation_date, last_working_date, internship_start, internship_end,
    warning_reason, reference_purpose, addressed_to, custom_body,
  } = ctx

  if (custom_body && custom_body.trim()) return custom_body

  switch (type) {
    case 'offer_letter':
      return `Dear ${full_name},

We are pleased to extend an offer of employment to you at Bitnex Technologies for the position of ${designation || '—'} in the ${department || '—'} department.

Your employment will commence on ${fmtDate(joining_date)}. The terms of your engagement, including compensation, benefits and working hours, will be governed by the company policies and the employment contract to be signed prior to your start date.

We look forward to having you on our team and are confident that you will make a valuable contribution to the organization.

Please confirm your acceptance by signing and returning a copy of this letter.`

    case 'appointment_letter':
      return `Dear ${full_name},

With reference to your acceptance of our offer, we are pleased to confirm your appointment at Bitnex Technologies as ${designation || '—'} in the ${department || '—'} department, effective ${fmtDate(joining_date)}.

Your Employee ID is ${employee_id || '—'}. Your gross monthly compensation is ${fmtMoney(gross_salary)}.

You are required to abide by the rules, regulations and policies of the company as may be in force from time to time. We wish you a long and rewarding career with us.`

    case 'experience_letter':
      return `To Whom It May Concern,

This is to certify that ${full_name} (Employee ID: ${employee_id || '—'}) was employed with Bitnex Technologies as ${designation || '—'} in the ${department || '—'} department from ${fmtDate(joining_date)} to ${fmtDate(last_working_date || issue_date)}, serving for a total period of ${duration_text || '—'}.

During the tenure with us, ${full_name} demonstrated professional conduct, strong commitment and consistently delivered quality work. We found ${full_name} to be sincere, hardworking and a valuable member of the team.

We wish ${full_name} continued success in all future endeavors.`

    case 'reference_letter':
      return `To Whom It May Concern,

I am pleased to provide this reference for ${full_name}, who has been associated with Bitnex Technologies as ${designation || '—'} since ${fmtDate(joining_date)}.

${reference_purpose ? reference_purpose + '\n\n' : ''}Throughout the engagement, ${full_name} has displayed strong professional skills, excellent work ethic, and the ability to perform effectively under pressure. ${full_name} is a reliable, dedicated and trustworthy individual.

I am happy to recommend ${full_name} without reservation and would be glad to provide further information if required.`

    case 'salary_certificate':
      return `To Whom It May Concern,

This is to certify that ${full_name} (Employee ID: ${employee_id || '—'}) is a permanent employee of Bitnex Technologies and has been working with us as ${designation || '—'} in the ${department || '—'} department since ${fmtDate(joining_date)}.

The current gross monthly salary of the employee is ${fmtMoney(gross_salary)}.

This certificate has been issued upon the employee's request for ${addressed_to || 'official purposes'}. No liability shall accrue to the company on account of issuance of this certificate.`

    case 'promotion_letter':
      return `Dear ${full_name},

We are pleased to inform you that, in recognition of your consistent performance, dedication and contribution to Bitnex Technologies, you have been promoted to the position of ${new_designation || '—'} effective ${fmtDate(effective_date || issue_date)}.

Your revised gross monthly salary will be ${fmtMoney(new_salary || gross_salary)}. All other terms and conditions of your employment shall remain unchanged.

Congratulations on this well-deserved achievement. We look forward to your continued contribution in your new role.`

    case 'warning_letter':
      return `Dear ${full_name},

This letter serves as a formal written warning regarding the following matter:

${warning_reason || '—'}

Such conduct is not in line with the standards expected of employees at Bitnex Technologies. You are hereby advised to take immediate corrective action. Failure to improve may result in further disciplinary action, including but not limited to suspension or termination of employment.

Please acknowledge receipt of this letter by signing and returning the duplicate copy.`

    case 'internship_cert':
      return `To Whom It May Concern,

This is to certify that ${full_name} has successfully completed an internship program at Bitnex Technologies in the ${department || '—'} department from ${fmtDate(internship_start || joining_date)} to ${fmtDate(internship_end || issue_date)}.

During the internship, ${full_name} was involved in ${designation ? 'work related to ' + designation : 'various assigned projects'}, and demonstrated commendable enthusiasm, learning ability and professional conduct.

We wish ${full_name} all the best for future endeavors.`

    case 'resignation_accept':
      return `Dear ${full_name},

We acknowledge receipt of your resignation letter dated ${fmtDate(resignation_date || issue_date)}, in which you have informed us of your decision to resign from the position of ${designation || '—'}.

Your resignation has been accepted and your last working day with Bitnex Technologies will be ${fmtDate(last_working_date)}. Kindly ensure a smooth handover of your responsibilities and complete the exit formalities before your last working day.

We thank you for your contributions during your tenure and wish you the very best in your future endeavors.`

    case 'noc_letter':
      return `To Whom It May Concern,

This is to certify that Bitnex Technologies has No Objection to ${full_name} (Employee ID: ${employee_id || '—'}, ${designation || '—'}) for ${addressed_to || 'the purpose stated by the employee'}.

${full_name} has been associated with our organization since ${fmtDate(joining_date)} and is currently working in the ${department || '—'} department.

This certificate is issued upon the employee's request and shall not be used for any unlawful purpose.`

    case 'termination_letter':
      return `Dear ${full_name},

This letter is to formally inform you that your employment with Bitnex Technologies as ${designation || '—'} stands terminated effective ${fmtDate(effective_date || issue_date)} due to the following reason(s):

${warning_reason || '—'}

You are required to complete the exit formalities, return all company property in your possession and clear any outstanding dues, if any, before leaving the premises.

We thank you for your services and wish you the best for the future.`

    default:
      return ''
  }
}

// Helper: which extra fields each doc type needs
export const DOC_FIELDS = {
  offer_letter:       ['joining_date', 'designation', 'department', 'gross_salary'],
  appointment_letter: ['joining_date', 'designation', 'department', 'gross_salary'],
  experience_letter:  ['joining_date', 'last_working_date', 'duration_text'],
  reference_letter:   ['reference_purpose'],
  salary_certificate: ['gross_salary', 'addressed_to'],
  promotion_letter:   ['new_designation', 'new_salary', 'effective_date'],
  warning_letter:     ['warning_reason'],
  internship_cert:    ['internship_start', 'internship_end'],
  resignation_accept: ['resignation_date', 'last_working_date'],
  noc_letter:         ['addressed_to'],
  termination_letter: ['effective_date', 'warning_reason'],
}
