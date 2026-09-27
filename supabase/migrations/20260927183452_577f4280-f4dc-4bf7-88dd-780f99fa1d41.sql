CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone text NOT NULL UNIQUE CHECK (customer_phone ~ '^[1-9][0-9]{6,14}$'),
  customer_name text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin staff view WhatsApp conversations" ON public.whatsapp_conversations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  provider_message_id text UNIQUE,
  direction text NOT NULL CHECK (direction IN ('incoming','outgoing')),
  body text NOT NULL DEFAULT '',
  media_id text,
  media_type text,
  delivery_status text CHECK (delivery_status IN ('pending','accepted','sent','delivered','read','failed')),
  delivery_error jsonb,
  provider_timestamp timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin staff view WhatsApp messages" ON public.whatsapp_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX whatsapp_messages_conversation_created_idx ON public.whatsapp_messages (conversation_id, created_at);
CREATE FUNCTION public.touch_whatsapp_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER whatsapp_conversations_updated_at BEFORE UPDATE ON public.whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION public.touch_whatsapp_updated_at();
CREATE TRIGGER whatsapp_messages_updated_at BEFORE UPDATE ON public.whatsapp_messages FOR EACH ROW EXECUTE FUNCTION public.touch_whatsapp_updated_at();