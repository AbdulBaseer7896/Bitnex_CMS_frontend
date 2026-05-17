// ─────────────────────────────────────────────────────────────────────────────
// Bitnex HR Document Templates
//
// Body generators that match the wording, tone and structure of the real
// official Bitnex Technologies templates (offer/probation letter, termination
// letter, experience letter, bank salary certificate, penalty notice, etc.).
//
// Each generator receives a merged context object and returns a string ready
// for the LetterPreview component to render onto the official letterhead.
//
// HR/Admin can still freely edit the body in the form before generation;
// these strings are only the *default* content.
// ─────────────────────────────────────────────────────────────────────────────

export const DOC_TYPES = [
  { key: 'offer_letter',       label: 'Offer / Probation Letter',      icon: '📄' },
  { key: 'appointment_letter', label: 'Appointment Letter',            icon: '📝' },
  { key: 'experience_letter',  label: 'Experience Letter',             icon: '🏅' },
  { key: 'reference_letter',   label: 'Reference Letter',              icon: '🤝' },
  { key: 'salary_certificate', label: 'Bank / Salary Certificate',     icon: '💰' },
  { key: 'promotion_letter',   label: 'Promotion Letter',              icon: '⬆️' },
  { key: 'warning_letter',     label: 'Warning Letter',                icon: '⚠️' },
  { key: 'internship_cert',    label: 'Internship Certificate',        icon: '🎓' },
  { key: 'resignation_accept', label: 'Resignation Acceptance Letter', icon: '✉️' },
  { key: 'noc_letter',         label: 'NOC Letter',                    icon: '🛡️' },
  { key: 'termination_letter', label: 'Termination Letter',            icon: '⛔' },
  { key: 'penalty_notice',     label: 'Penalty Notice',                icon: '🚫' },
]

export const DOC_LABEL = Object.fromEntries(DOC_TYPES.map(d => [d.key, d.label]))

// Official document title that appears as the centered heading on the page.
// Some types have specific titles that differ from the menu label.
export const DOC_TITLE = {
  offer_letter:       'Probation Letter',
  appointment_letter: 'Appointment Letter',
  experience_letter:  'EXPERIENCE LETTER',
  reference_letter:   'Reference Letter',
  salary_certificate: 'Salary Certificate',
  promotion_letter:   'Promotion Letter',
  warning_letter:     'Warning Letter',
  internship_cert:    'Internship Certificate',
  resignation_accept: 'Resignation Acceptance',
  noc_letter:         'No Objection Certificate',
  termination_letter: 'Termination of Employment',
  penalty_notice:     'EMPLOYEE PENALTY NOTICE',
}

const fmtDate = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtMoney = (n) => {
  const v = Number(n || 0)
  return 'PKR ' + v.toLocaleString('en-PK', { maximumFractionDigits: 0 })
}

// Years/months between two dates — used for experience letter tenure.
export function calcDuration(start, end) {
  if (!start) return { years: 0, months: 0, text: '0 months' }
  const s = new Date(start), e = end ? new Date(end) : new Date()
  let y = e.getFullYear() - s.getFullYear()
  let m = e.getMonth() - s.getMonth()
  if (e.getDate() < s.getDate()) m -= 1
  if (m < 0) { y -= 1; m += 12 }
  if (y < 0) { y = 0; m = 0 }
  const parts = []
  if (y) parts.push(`${y} year${y > 1 ? 's' : ''}`)
  if (m) parts.push(`${m} month${m > 1 ? 's' : ''}`)
  return { years: y, months: m, text: parts.join(' and ') || 'less than a month' }
}

// ── Body generators ──────────────────────────────────────────────────────────
// All strings below follow the Bitnex sample documents' phrasing closely so
// generated letters look authentic.
export function buildBody(type, ctx) {
  const {
    full_name, designation, department, employee_id, cnic,
    joining_date, issue_date, gross_salary, basic_salary,
    duration_text, new_designation, new_salary, effective_date,
    resignation_date, last_working_date, internship_start, internship_end,
    warning_reason, reference_purpose, addressed_to, custom_body,
    working_hours, training_days, salary_range,
    bank_name, bank_branch, cnic_no,
    penalty_amount, penalty_month, penalty_reason,
  } = ctx

  if (custom_body && custom_body.trim()) return custom_body

  const firstName = (full_name || '').split(' ')[0] || full_name || ''

  switch (type) {

    case 'offer_letter':
      // Mirrors the Emaan Fatima sample exactly.
      return `Dear ${full_name || '—'},

Congratulations!

We are pleased to inform you that you're shortlisted for training for the position of ${designation || '—'} at Bitnex Technologies. Your joining date for training is set for ${fmtDate(joining_date)}. Upon successful completion of the training your salary will be between ${salary_range || 'PKR 40,000 to 50,000'} according to your performance in training days.

The training period is ${training_days || '5 to 7 days'} (unpaid), during which your performance and learning ability will be evaluated. If you meet the required standards, you will be officially hired after successful completion. However, if we observe a lack of improvement or difficulty in meeting expectations, the training may be discontinued and not hired.

Your working hours are from ${working_hours || '5:00 PM to 2:00 AM'}. We expect you will be punctual and consistent during working hours. Kindly note that during the probation period, we encourage you to maintain regular attendance.

Must bring the following documents with you:
1) Passport size photo
2) CNIC copy
3) Updated CV
4) Completed Degrees photo copies

We are excited to have you on board and look forward to your success at Bitnex Technologies. Please don't hesitate to reach out if you have any questions or need support during your onboarding.`

    case 'appointment_letter':
      return `Dear ${full_name || '—'},

With reference to your successful completion of the training/probation period, we are pleased to confirm your appointment at Bitnex Technologies as ${designation || '—'} in the ${department || '—'} department, effective ${fmtDate(joining_date)}.

Your Employee ID is ${employee_id || '—'}. Your gross monthly compensation is ${fmtMoney(gross_salary)}.

You are required to abide by the rules, regulations and policies of the company as may be in force from time to time. We wish you a long and rewarding career with us.`

    case 'experience_letter':
      // Mirrors the Abdul Baseer sample.
      return `This is to certify that Mr./Ms. ${full_name || '—'}${cnic ? ` (CNIC: ${cnic})` : ''} was employed with Bitnex Technologies (SMC-PVT) LTD as ${designation || '—'} in the ${department || '—'} department from ${fmtDate(joining_date)} to ${fmtDate(last_working_date || issue_date)}, serving for a total period of ${duration_text || '—'}.

During his/her tenure, ${firstName} demonstrated strong technical expertise, professionalism, and dedication to delivering quality work. ${firstName} consistently maintained a high standard of work ethics and contributed meaningfully to the team's objectives.

We appreciate his/her valuable contributions to the organization and wish him/her continued success in his/her future endeavors.

For and on behalf of
Bitnex Technologies (SMC-PVT) LTD`

    case 'reference_letter':
      return `To Whom It May Concern,

I am pleased to provide this reference for ${full_name || '—'}, who has been associated with Bitnex Technologies as ${designation || '—'} since ${fmtDate(joining_date)}.

${reference_purpose ? reference_purpose + '\n\n' : ''}Throughout the engagement, ${firstName} has displayed strong professional skills, excellent work ethic, and the ability to perform effectively under pressure. ${firstName} is a reliable, dedicated and trustworthy individual.

I am happy to recommend ${firstName} without reservation and would be glad to provide further information if required.`

    case 'salary_certificate':
      // Mirrors the Hussnain bank letter sample.
      return `To Branch Manager,
${bank_name || '—'}${bank_branch ? ', ' + bank_branch : ''}

Dear Sir/Madam,

This is to confirm that ${full_name || '—'}${cnic_no ? `, CNIC No. ${cnic_no}` : ''}, is a permanent employee of Bitnex Technologies and has been working with us as ${designation || '—'} in the ${department || '—'} department since ${fmtDate(joining_date)}.

${firstName} has been appointed to this position after meeting all our company's recruitment criteria and continues to perform his/her duties to our complete satisfaction. The current gross monthly salary of the employee is ${fmtMoney(gross_salary)}.

This certificate is being issued at the employee's request for ${addressed_to || 'bank account / loan processing purposes'}.

Kindly process this request at the earliest. For any further information or verification, please contact us at:

Email : info@bitnextechnologies.com
Contact Number: +92 339 5010115`

    case 'promotion_letter':
      return `Dear ${full_name || '—'},

We are pleased to inform you that, in recognition of your consistent performance, dedication and contribution to Bitnex Technologies, you have been promoted to the position of ${new_designation || '—'} effective ${fmtDate(effective_date || issue_date)}.

Your revised gross monthly salary will be ${fmtMoney(new_salary || gross_salary)}. All other terms and conditions of your employment shall remain unchanged.

Congratulations on this well-deserved achievement. We look forward to your continued contribution in your new role.`

    case 'warning_letter':
      return `Dear ${full_name || '—'},

This letter serves as a formal written warning regarding the following matter:

${warning_reason || '—'}

Such conduct is not in line with the standards expected of employees at Bitnex Technologies. You are hereby advised to take immediate corrective action. Failure to improve may result in further disciplinary action, including but not limited to suspension or termination of employment.

Please acknowledge receipt of this letter by signing and returning the duplicate copy.`

    case 'internship_cert':
      return `To Whom It May Concern,

This is to certify that ${full_name || '—'} has successfully completed an internship program at Bitnex Technologies in the ${department || '—'} department from ${fmtDate(internship_start || joining_date)} to ${fmtDate(internship_end || issue_date)}.

During the internship, ${firstName} was involved in ${designation ? 'work related to ' + designation : 'various assigned projects'}, and demonstrated commendable enthusiasm, learning ability and professional conduct.

We wish ${firstName} all the best for future endeavors.`

    case 'resignation_accept':
      return `Dear ${full_name || '—'},

We acknowledge receipt of your resignation letter dated ${fmtDate(resignation_date || issue_date)}, in which you have informed us of your decision to resign from the position of ${designation || '—'}.

Your resignation has been accepted and your last working day with Bitnex Technologies will be ${fmtDate(last_working_date)}. Kindly ensure a smooth handover of your responsibilities and complete the exit formalities before your last working day.

We thank you for your contributions during your tenure and wish you the very best in your future endeavors.`

    case 'noc_letter':
      return `To Whom It May Concern,

This is to certify that Bitnex Technologies has No Objection to ${full_name || '—'} (Employee ID: ${employee_id || '—'}, ${designation || '—'}) for ${addressed_to || 'the purpose stated by the employee'}.

${firstName} has been associated with our organization since ${fmtDate(joining_date)} and is currently working in the ${department || '—'} department.

This certificate is issued upon the employee's request and shall not be used for any unlawful purpose.`

    case 'termination_letter':
      // Mirrors the Vaneeza Wajid sample tone — formal, firm, with clear reasons.
      return `This is to formally inform you that your employment with Bitnex Technologies is terminated with immediate effect.

This decision has been made due to ${warning_reason || 'serious and repeated violations of company policies, professional conduct, and workplace ethics'}.

You were given sufficient opportunities to improve; however, no satisfactory progress was observed. Such conduct is unacceptable and cannot be tolerated.

Your employment is therefore terminated effective ${fmtDate(effective_date || issue_date)}, in accordance with company policies.

You are required to:
• Return all company property immediately
• Complete all clearance formalities with the HR/Administration department

Failure to comply with exit procedures may result in further administrative or legal action.

We expect professionalism during the offboarding process.

Sincerely,
HR Department
Bitnex Technologies`

    case 'penalty_notice':
      // Mirrors the Nayab Tahira penalty notice sample.
      return `Name:   ${full_name || '—'}                                  Designation:  ${designation || '—'}

Month: ${penalty_month || 'May 2026'}

Penalty Amount: ${fmtMoney(penalty_amount || 0)}

Reason:
${penalty_reason || '—'}

Note:
Employees will get 2 warnings for being late. On the 3rd time, a PKR 500 fine per day will be applied. All penalties are applied as per company policy and will be deducted from basic salary. Repeated violation of company policy may lead to further disciplinary action.

Employee Acknowledgement:
I, ${full_name || '______________________________'}, acknowledge the above penalties and agree to comply with company policies going forward.

Employee Signature: ______________________________`

    default:
      return ''
  }
}

// ── Which extra fields each doc type needs in the generator form ─────────────
export const DOC_FIELDS = {
  offer_letter:       ['joining_date', 'designation', 'department', 'salary_range', 'training_days', 'working_hours'],
  appointment_letter: ['joining_date', 'designation', 'department', 'gross_salary'],
  experience_letter:  ['joining_date', 'last_working_date', 'duration_text', 'cnic'],
  reference_letter:   ['reference_purpose'],
  salary_certificate: ['gross_salary', 'addressed_to', 'bank_name', 'bank_branch', 'cnic_no'],
  promotion_letter:   ['new_designation', 'new_salary', 'effective_date'],
  warning_letter:     ['warning_reason'],
  internship_cert:    ['internship_start', 'internship_end'],
  resignation_accept: ['resignation_date', 'last_working_date'],
  noc_letter:         ['addressed_to'],
  termination_letter: ['effective_date', 'warning_reason'],
  penalty_notice:     ['penalty_month', 'penalty_amount', 'penalty_reason'],
}
