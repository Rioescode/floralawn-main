'use client';

import { useEffect, useRef, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CheckCircleIcon, PhoneIcon } from '@heroicons/react/24/outline';

const POSITIONS = [
  'Lawn care and mowing',
  'Landscaping',
  'Yard cleanup',
  'Snow removal',
  'General crew',
  'Not sure yet',
];

const EXPERIENCE = [
  'None yet',
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  'More than 5 years',
];

const AVAILABILITY = [
  'Weekdays',
  'Weekends',
  'Most days',
  'Seasonal',
  'Not sure yet',
];

const WORK = [
  {
    title: 'Lawn care',
    detail: 'Mowing, edging, fertilization, weed control, aeration, and overseeding.',
  },
  {
    title: 'Landscaping',
    detail: 'Mulch, garden beds, hedge trimming, planting, and garden maintenance.',
  },
  {
    title: 'Cleanups',
    detail: 'Spring cleanup, fall cleanup, and leaf removal.',
  },
  {
    title: 'Snow removal',
    detail: 'Driveways and walks after a storm.',
  },
];

const EMPTY = {
  fullName: '',
  phone: '',
  email: '',
  city: '',
  position: '',
  experience: '',
  driversLicense: '',
  availability: '',
  startDate: '',
  languages: [],
  message: '',
  companyWebsite: '',
};

const FAILURE =
  'We could not send your application. Please call (401) 389-0913 and we will take it over the phone.';

function ErrorText({ message }) {
  const parts = message.split('(401) 389-0913');
  if (parts.length === 1) return message;
  return (
    <>
      {parts[0]}
      <a href="tel:4013890913" className="font-semibold underline">
        (401) 389-0913
      </a>
      {parts.slice(1).join('(401) 389-0913')}
    </>
  );
}

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20';

function Field({ id, label, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
        <span className="mt-0.5 block text-xs font-medium text-slate-500">{hint}</span>
      </label>
      {children}
      {error ? <p className="mt-1 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export default function CareersPage() {
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    if (!submittedName) return;
    cardRef.current?.scrollIntoView({ block: 'center' });
  }, [submittedName]);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const toggleLanguage = (language) => {
    setForm((current) => {
      const hasIt = current.languages.includes(language);
      return {
        ...current,
        languages: hasIt
          ? current.languages.filter((item) => item !== language)
          : [...current.languages, language],
      };
    });
  };

  const validate = () => {
    const next = {};
    if (form.fullName.trim().length < 2) {
      next.fullName = 'Please enter your full name.';
    }
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (!phone && !email) {
      next.contact = 'Add a phone number or an email so we can reach you.';
    }
    if (phone && phone.replace(/\D/g, '').length < 10) {
      next.phone = 'That phone number does not look right. Include the area code.';
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'That email address does not look right.';
    }
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setFieldErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/job-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setFormError(data.error || FAILURE);
        return;
      }
      setSubmittedName(form.fullName.trim());
      setForm(EMPTY);
    } catch {
      setFormError(FAILURE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-green-400">
              Careers · Rhode Island
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Work with Flora in Rhode Island
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-200">
              Flora Lawn &amp; Landscaping is a Pawtucket crew. The work is outdoors:
              lawn care, landscaping, seasonal cleanups, and snow.
            </p>
            <p className="mt-3 text-sm text-slate-400">
              Trabaja con Flora en Rhode Island. Esta forma está en inglés.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-10">
          <h2 className="text-2xl font-black tracking-tight">The work</h2>
          <p className="mt-2 text-slate-600">
            These are the jobs already on the site. You do not need years of experience.
            Say what you have done, even if that is nothing yet.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {WORK.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-16">
          <div ref={cardRef} className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            {submittedName ? (
              <div className="py-6 text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
                <h2 className="mt-4 text-3xl font-black tracking-tight">We got your application</h2>
                <p className="mx-auto mt-3 max-w-md text-slate-600">
                  Thanks, {submittedName}. Flora has your details and will be in touch.
                </p>
                <p className="mt-2 text-sm text-slate-500">Gracias. Recibimos tu solicitud.</p>
                <button
                  type="button"
                  onClick={() => setSubmittedName('')}
                  className="mt-6 text-sm font-semibold text-green-700 underline"
                >
                  Submit another application
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black tracking-tight">Apply</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Name, plus a phone number or an email. The rest helps us call the right person.
                </p>
                <p className="text-xs text-slate-500">Nombre, y un teléfono o un correo.</p>

                {formError ? (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <ErrorText message={formError} />
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                  <input
                    type="text"
                    name="companyWebsite"
                    value={form.companyWebsite}
                    onChange={(event) => setField('companyWebsite', event.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  />

                  <Field id="fullName" label="Full name" hint="Nombre completo" error={fieldErrors.fullName}>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={(event) => setField('fullName', event.target.value)}
                      className={inputClass}
                    />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="phone" label="Phone" hint="Teléfono" error={fieldErrors.phone || fieldErrors.contact}>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="(401) 555-0123"
                        value={form.phone}
                        onChange={(event) => setField('phone', event.target.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field id="email" label="Email" hint="Correo" error={fieldErrors.email}>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(event) => setField('email', event.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field id="city" label="Town or city" hint="Ciudad">
                    <input
                      id="city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      placeholder="Pawtucket"
                      value={form.city}
                      onChange={(event) => setField('city', event.target.value)}
                      className={inputClass}
                    />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="position" label="Position" hint="Puesto">
                      <select
                        id="position"
                        name="position"
                        value={form.position}
                        onChange={(event) => setField('position', event.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select a position</option>
                        {POSITIONS.map((position) => (
                          <option key={position} value={position}>
                            {position}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id="experience" label="Years of experience" hint="Años de experiencia">
                      <select
                        id="experience"
                        name="experience"
                        value={form.experience}
                        onChange={(event) => setField('experience', event.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select</option>
                        {EXPERIENCE.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <fieldset>
                    <legend className="text-sm font-semibold text-slate-800">
                      Driver&apos;s license
                      <span className="mt-0.5 block text-xs font-medium text-slate-500">Licencia de conducir</span>
                    </legend>
                    <div className="mt-2 flex gap-3">
                      {['Yes', 'No'].map((answer) => (
                        <label
                          key={answer}
                          className={`flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold ${
                            form.driversLicense === answer.toLowerCase()
                              ? 'border-green-700 bg-green-50 text-green-800'
                              : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="driversLicense"
                            value={answer.toLowerCase()}
                            checked={form.driversLicense === answer.toLowerCase()}
                            onChange={(event) => setField('driversLicense', event.target.value)}
                            className="sr-only"
                          />
                          {answer}
                          <span className="sr-only">{answer === 'Yes' ? ' Sí' : ' No'}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="availability" label="Availability" hint="Disponibilidad">
                      <select
                        id="availability"
                        name="availability"
                        value={form.availability}
                        onChange={(event) => setField('availability', event.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select</option>
                        {AVAILABILITY.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id="startDate" label="Start date" hint="Fecha para empezar">
                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={form.startDate}
                        onChange={(event) => setField('startDate', event.target.value)}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <fieldset>
                    <legend className="text-sm font-semibold text-slate-800">
                      Languages
                      <span className="mt-0.5 block text-xs font-medium text-slate-500">Idiomas</span>
                    </legend>
                    <div className="mt-2 flex gap-3">
                      {['English', 'Spanish'].map((language) => {
                        const checked = form.languages.includes(language);
                        return (
                          <label
                            key={language}
                            className={`flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold ${
                              checked
                                ? 'border-green-700 bg-green-50 text-green-800'
                                : 'border-slate-200 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              name="languages"
                              value={language}
                              checked={checked}
                              onChange={() => toggleLanguage(language)}
                              className="sr-only"
                            />
                            {language}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <Field id="message" label="Message" hint="Mensaje">
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={form.message}
                      onChange={(event) => setField('message', event.target.value)}
                      placeholder="Anything you want us to know."
                      className={inputClass}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-12 w-full rounded-xl bg-green-700 px-4 py-3 text-base font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Sending…' : 'Submit application'}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
            <PhoneIcon className="h-4 w-4" />
            Questions? Call{' '}
            <a href="tel:4012053853" className="font-semibold text-green-800">
              (401) 205-3853
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
