# ShipFast — Javascript

Hey maker 👋 it's Marc from [ShipFast](https://shipfa.st/docs). Let's get your startup off the ground, FAST ⚡️

<sub>**Watch/Star the repo to be notified when updates are pushed**</sub>

## Get Started

1. Follow the [Get Started Tutorial](https://shipfa.st/docs) to clone the repo and run your local server 💻

<sub>**Looking for the /pages router version?** Use this [documentation](https://shipfa.st/docs-old) instead</sub>

2. Follow the [Ship In 5 Minutes Tutorial](https://shipfa.st/docs/tutorials/ship-in-5-minutes) to learn the foundation and ship your app quickly ⚡️

## Links

-   [📚 Documentation](https://shipfa.st/docs)
-   [📣 Updates](https://shipfast.beehiiv.com/)
-   [🧑‍💻 Discord](https://shipfa.st/dashboard)
-   [🥇 Leaderboard](https://shipfa.st/leaderboard)

## Support

Reach out at marc@shipfa.st

\_

Let's ship it, FAST ⚡️

## Partner lead forwarding (My Green Robot)

When a homeowner submits the contact/quote form and checks **Backup Coverage Assistance**, the server forwards that lead to My Green Robot after it is saved. Leads without that consent are not forwarded. A forward failure does not change the form's success message.

Set both variables in the environment that runs the app. They are server-only. Do not prefix them with `NEXT_PUBLIC_`, and do not commit the secret.

| Variable | Purpose |
| --- | --- |
| `MGR_PARTNER_LEADS_URL` | Partner leads endpoint. Canonical value: `https://mygreenrobot.com/api/partner-leads` |
| `MGR_PARTNER_LEADS_SECRET` | Bearer token sent as `Authorization: Bearer <secret>` |

If either variable is missing, forwarding is skipped and a warning is logged once per server process. The contact lead is still saved.

**Where to set them:** this site deploys on Netlify (`netlify.toml`). Add both under **Site configuration → Environment variables**, then redeploy. For local runs, put them in `.env.local` (see `.env.example`). Do not put the secret in client code or in `NEXT_PUBLIC_*` variables.

P.S.

-   Want to showcase your startups? Get your [Indie Page](https://indiepa.ge?ref=shipfast_readme) and share your entrepreneur's journey. Join 3,132 founders ⭐️
-   Don't get banned from Stripe for 1 dispute. Use [ByeDispute](https://byedispute.com/?ref=shipfast_readme) to prevent them from happenening 🛡️
-   Make your launch go viral and get your first customers with [LaunchViral](https://launchvir.al/?ref=shipfast_readme) 🚀
-   Stop paying 0.4% per Stripe invoices [Zenvoice](https://zenvoice.io/?ref=shipfast_readme) 🤕
