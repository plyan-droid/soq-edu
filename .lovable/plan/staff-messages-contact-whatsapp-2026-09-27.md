# Staff Messages: Contact + WhatsApp

The current **Support inbox** receives messages submitted through the Contact form. WhatsApp links open a separate chat and do not bring those conversations into the staff workspace. Build one staff-facing Messages area that shows both sources clearly, while preserving the existing Contact form workflow.

## Experience
- Show Contact enquiries and WhatsApp conversations together with a source label, sender, time, latest message and unread/open state; let staff filter by source or status.
- Keep Contact form enquiries as tickets with their existing status controls and email reply link. Show WhatsApp as chronological conversations with a reply composer and delivery status, not as Contact form tickets. Make any send failure visible and recoverable.
- Limit message content and reply actions to authorised staff; show a clear connection/setup state instead of implying WhatsApp is live before it is.

## Connection and rollout
- Connect an SOQ **WhatsApp Business** account to this project using the connection card. None is currently available to this project. WhatsApp Business requires a phone number and Meta setup/approval; support replies are free within the customer-service window, while marketing messages are paid and business-initiated messages outside 24 hours need approved templates (review can take up to 48 hours). Setup can take a few minutes and requires email and phone verification; the account is linked through Lovable Labs, a Meta-verified Tech Provider.
- Deploy the signed incoming-message receiver before selecting this project under **Connectors → WhatsApp Business → Incoming messages**. The connection delivers callbacks to only one project; selecting this one redirects them away from any previous destination. Keep existing `wa.me` links intact and confirm they point to the connected business number before claiming website chats arrive here.
- Test a message to/from the connected number and verify a signed callback is stored and displayed. An accepted send is not proof of delivery. The business phone app can initiate first contact while templates await approval. Disconnecting Lovable will not delete the Meta number or chat history.

## Technical implementation
- Add private, staff-readable WhatsApp conversation/message and durable webhook-inbox tables with explicit grants and RLS. Verify webhook signatures with `@lovable.dev/webhooks-js` at `POST /api/public/whatsapp/webhook`; durably store each delivery before idempotent processing, deduplicate by delivery/message ID as appropriate, and recover unfinished work. Preserve unknown events and errors.
- Store incoming messages, status callbacks, provider IDs, timestamps and failures; reconcile callbacks that arrive before the outbound record and never regress delivery status. Handle media IDs and bounded server-side downloads when media arrives. Keep reply jobs retry-safe, including ambiguous send outcomes.
- Send staff replies through the connected WhatsApp Business service from authenticated, role-checked server functions. Enforce free-form replies only inside the 24-hour customer window; outside it, use an approved template or disable the reply with a clear explanation. Keep credentials server-side.
- Preserve existing Contact form `support_tickets` and its access rules; combine both sources in the staff UI without exposing private messages to public visitors or other roles.
- Verify the combined inbox, access restrictions, WhatsApp receive/reply/status flow and mobile layout. Until the receiver is live, destination is selected and a real signed callback persists, label WhatsApp delivery tracking as unverified. Historical chat import, if desired, is only possible for numbers also used in the WhatsApp Business app within 24 hours of connecting, and must be explicitly requested after the receiver is live.
